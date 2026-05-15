import { buildBandPlan, executeBandPlan } from '../band-planner';
import type { LogicalBandItem, RenderContext } from '../band-planner';
import { layoutBand } from '../layout-engine/layout-band';
import type { RenderBandBox, RenderComponentBox, RenderDocument, RenderPage } from '../render-document/types';
import type { Band, Page, ReportTemplate, SubreportComponent } from '../template-model/types';
import { normalizeTemplate } from '../template-model';
import { evalExpression } from '../expression-engine/evaluator';
import { applyPageNumberPass } from './page-number-pass';

export interface RenderReportOptions {
  subreports?: Record<string, ReportTemplate>;
  maxSubreportDepth?: number;
  parameters?: Record<string, unknown>;
}

interface InternalRenderReportOptions extends RenderReportOptions {
  subreportDepth?: number;
}

const DEFAULT_MAX_SUBREPORT_DEPTH = 3;

export function renderReport(
  template: ReportTemplate,
  data: Record<string, Record<string, unknown>[]> = {},
  options: RenderReportOptions = {},
): RenderDocument {
  return renderReportInternal(template, data, options);
}

function renderReportInternal(
  template: ReportTemplate,
  data: Record<string, Record<string, unknown>[]>,
  options: InternalRenderReportOptions,
): RenderDocument {
  const normalizedTemplate = normalizeTemplate(template);
  const templatePage = normalizedTemplate.pages[0];
  const plan = buildBandPlan(normalizedTemplate);
  const logicalItems = executeBandPlan(plan, data);
  const pages = paginate(templatePage, plan.pageBands, logicalItems, data, normalizedTemplate.styles, options);
  return applyPageNumberPass({ pages });
}

export function paginate(
  templatePage: Page,
  pageBands: ReturnType<typeof buildBandPlan>['pageBands'],
  logicalItems: LogicalBandItem[],
  rowsByBand: Record<string, Record<string, unknown>[]> = {},
  styles: ReportTemplate['styles'] = [],
  options: InternalRenderReportOptions = {},
): RenderPage[] {
  const pages: RenderPage[] = [];
  const printableX = templatePage.margins.left;
  const printableWidth = templatePage.width - templatePage.margins.left - templatePage.margins.right;
  const footerHeight = pageBands.pageFooter.reduce((sum, band) => sum + band.height, 0);
  const pageBottomY = templatePage.height - templatePage.margins.bottom - footerHeight;
  const repeatedGroups: Band[] = [];
  const pageRows = new WeakMap<RenderPage, Record<string, Record<string, unknown>[]>>();
  let activeSectionRepeatBands: Band[] = [];
  let currentPage: RenderPage | undefined;
  let cursorY = 0;

  const newPage = () => {
    currentPage = {
      id: `${templatePage.id}-${pages.length + 1}`,
      pageNumber: pages.length + 1,
      totalPages: 0,
      width: templatePage.width,
      height: templatePage.height,
      items: [],
    };
    pages.push(currentPage);
    pageRows.set(currentPage, {});
    cursorY = templatePage.margins.top;
    for (const header of pageBands.pageHeader) {
      placeBand(header, createEmptyContext(options.parameters), true);
    }
    for (const groupHeader of repeatedGroups) {
      placeBand(groupHeader, createEmptyContext(options.parameters), true);
    }
    for (const sectionBand of activeSectionRepeatBands) {
      placeBand(sectionBand, createEmptyContext(options.parameters), true);
    }
  };

  const ensurePage = () => {
    if (!currentPage) {
      newPage();
    }
  };

  const placeBand = (band: Band, context: RenderContext, force = false): RenderBandBox => {
    ensurePage();
    const layoutContext = withParameters(context, options.parameters);
    const behavior = getBandBehavior(band);
    const currentPageRows = currentPage ? pageRows.get(currentPage) ?? {} : {};
    let preview = layoutBand(band, { x: printableX, y: cursorY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: currentPageRows, styles, renderSubreport: createSubreportRenderer(rowsByBand, options) });
    const breakIfLessThan = behavior.breakIfLessThan ?? 0;
    if (!force && breakIfLessThan > 0 && pageBottomY - cursorY < breakIfLessThan && currentPage!.items.length > 0) {
      newPage();
      preview = layoutBand(band, { x: printableX, y: cursorY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles, renderSubreport: createSubreportRenderer(rowsByBand, options) });
    }

    if (!force && cursorY + preview.height > pageBottomY && currentPage!.items.length > 0) {
      newPage();
      preview = layoutBand(band, { x: printableX, y: cursorY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles, renderSubreport: createSubreportRenderer(rowsByBand, options) });
    }

    const targetY = behavior.printAtBottom ? pageBottomY - preview.height : cursorY;
    const box = layoutBand(band, { x: printableX, y: targetY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles, renderSubreport: createSubreportRenderer(rowsByBand, options) });
    currentPage!.items.push(box);
    collectPageRow(pageRows.get(currentPage!)!, band, context);
    cursorY = behavior.printAtBottom ? pageBottomY : cursorY + box.height;
    return box;
  };

  for (const item of logicalItems) {
    if (item.kind === 'pageBreak') {
      newPage();
      continue;
    }

    if (item.band.type === 'groupHeader' && getBandBehavior(item.band).printOnAllPages) {
      if (!repeatedGroups.some((band) => band.id === item.band.id)) {
        repeatedGroups.push(item.band);
      }
    }

    if (item.band.type === 'groupFooter') {
      const estimated = item.band.height;
      if (cursorY + estimated > pageBottomY && currentPage?.items.length) {
        newPage();
      }
    }

    if (item.repeatOnPageBreakBefore) {
      activeSectionRepeatBands = item.repeatOnPageBreakBefore;
    }

    if (['footer', 'columnFooter', 'reportSummary', 'emptyData'].includes(item.band.type)) {
      activeSectionRepeatBands = [];
    }

    placeBand(item.band, item.context);

    if (item.band.type === 'groupFooter') {
      const groupHeaderId = item.band.group?.groupHeaderId;
      const groupName = item.band.group?.name;
      const index = repeatedGroups.findIndex((band) => (
        groupHeaderId ? band.id === groupHeaderId : band.group?.name === groupName
      ));
      if (index >= 0) {
        repeatedGroups.splice(index, 1);
      }
    }
  }

  if (!currentPage) {
    newPage();
  }

  for (const page of pages) {
    for (const overlay of pageBands.overlay) {
      page.items.unshift(layoutBand(overlay, { x: printableX, y: templatePage.margins.top, width: printableWidth, context: createEmptyContext(options.parameters), rowsByBand, pageRowsByBand: pageRows.get(page) ?? {}, styles, renderSubreport: createSubreportRenderer(rowsByBand, options) }));
    }

    let footerY = templatePage.height - templatePage.margins.bottom - footerHeight;
    for (const footer of pageBands.pageFooter) {
      const box = layoutBand(footer, { x: printableX, y: footerY, width: printableWidth, context: createEmptyContext(options.parameters), rowsByBand, pageRowsByBand: pageRows.get(page) ?? {}, styles, renderSubreport: createSubreportRenderer(rowsByBand, options) });
      page.items.push(box);
      footerY += box.height;
    }
  }

  return pages;
}

function createSubreportRenderer(
  rowsByBand: Record<string, Record<string, unknown>[]>,
  options: InternalRenderReportOptions,
) {
  return (component: SubreportComponent, x: number, y: number, context: RenderContext) => {
    const template = options.subreports?.[component.templateUrl];
    const maxDepth = options.maxSubreportDepth ?? DEFAULT_MAX_SUBREPORT_DEPTH;
    const depth = options.subreportDepth ?? 0;
    const parameters = resolveSubreportParameters(component, context, rowsByBand);

    if (!template) {
      return {
        missing: true,
        children: [createSubreportPlaceholder(component, x, y, `Missing subreport: ${component.templateUrl}`)],
      };
    }

    if (depth >= maxDepth) {
      return {
        missing: true,
        children: [createSubreportPlaceholder(component, x, y, `Max subreport depth exceeded: ${component.templateUrl}`)],
      };
    }

    const subreportRowsByBand = { ...rowsByBand, Parameters: [parameters] };
    const document = renderReportInternal(template, subreportRowsByBand, {
      ...options,
      parameters,
      subreportDepth: depth + 1,
    });
    const children = flattenSubreportPages(document.pages, x, y);
    return {
      missing: false,
      children,
      height: measureChildrenHeight(children, y, component.height),
    };
  };
}

function createSubreportPlaceholder(component: SubreportComponent, x: number, y: number, content: string) {
  return {
    id: `${component.id}-placeholder`,
    type: 'text' as const,
    x,
    y,
    width: component.width,
    height: component.height,
    content,
  };
}

function offsetRenderComponent<T extends RenderBandBox['components'][number]>(component: T, dx: number, dy: number): T {
  if ('children' in component) {
    return {
      ...component,
      x: component.x + dx,
      y: component.y + dy,
      children: component.children.map(child => offsetRenderComponent(child, dx, dy)),
    };
  }

  return {
    ...component,
    x: component.x + dx,
    y: component.y + dy,
  };
}

function flattenSubreportPages(pages: RenderPage[], x: number, y: number): RenderComponentBox[] {
  let pageOffsetY = 0;
  const children: RenderComponentBox[] = [];
  for (const page of pages) {
    for (const item of page.items) {
      children.push(...item.components.map(child => offsetRenderComponent(child, x, y + pageOffsetY)));
    }
    pageOffsetY += page.height;
  }
  return children;
}

function measureChildrenHeight(children: RenderComponentBox[], y: number, fallback: number): number {
  if (children.length === 0) return fallback;
  return Math.max(fallback, ...children.map(child => child.y + child.height - y));
}

function resolveSubreportParameters(
  component: SubreportComponent,
  context: RenderContext,
  rowsByBand: Record<string, Record<string, unknown>[]>,
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(component.parameters ?? {}).map(([key, expression]) => [
    key,
    resolveTemplateValue(expression, context, rowsByBand),
  ]));
}

function resolveTemplateValue(
  value: string,
  context: RenderContext,
  rowsByBand: Record<string, Record<string, unknown>[]>,
): unknown {
  if (!value.includes('{') && !value.includes('(') && !value.includes('=') && !value.startsWith('"')) {
    return value;
  }

  const placeholderPattern = /\{([^{}]+)\}/g;
  const isSinglePlaceholder = value.trim().match(/^\{([^{}]+)\}$/);
  if (!isSinglePlaceholder && placeholderPattern.test(value)) {
    return value.replace(/\{([^{}]+)\}/g, (match, expressionBody) => {
      try {
        const result = evalExpression(
          `{${expressionBody}}`,
          (source, field) => resolveField(context, source, field),
          context.rowIndex,
          { row: context.row, groupValues: context.groupValues, parameters: context.parameters },
        );
        return result == null ? '' : String(result);
      } catch {
        return match;
      }
    });
  }

  try {
    return evalExpression(
      value,
      (source, field) => resolveField(context, source, field),
      context.rowIndex,
      { row: context.row, groupValues: context.groupValues, parameters: context.parameters, rowsByBand },
    );
  } catch {
    return value;
  }
}

function resolveField(context: RenderContext, source: string, field: string): unknown {
  if (['Parameter', 'Parameters', 'Params'].includes(source)) {
    return context.parameters?.[field];
  }

  if (!source && context.parameters && field in context.parameters) {
    return context.parameters[field];
  }

  const row = context.row ?? {};
  const scoped = source ? row[source] : undefined;
  if (scoped && typeof scoped === 'object' && !Array.isArray(scoped)) {
    return (scoped as Record<string, unknown>)[field];
  }
  return row[field] ?? row[`${source}.${field}`] ?? context.groupValues[field];
}

function collectPageRow(pageRows: Record<string, Record<string, unknown>[]>, band: Band, context: RenderContext): void {
  if (band.type !== 'data' && band.type !== 'hierarchicalData') return;
  if (!context.dataSourceId || !context.row) return;
  if (!pageRows[context.dataSourceId]) {
    pageRows[context.dataSourceId] = [];
  }
  pageRows[context.dataSourceId].push(context.row);
}

function createEmptyContext(parameters?: Record<string, unknown>): RenderContext {
  return {
    rowIndex: 0,
    groupValues: {},
    parameters,
  };
}

function withParameters(context: RenderContext, parameters?: Record<string, unknown>): RenderContext {
  if (!parameters || context.parameters) return context;
  return { ...context, parameters };
}

function getBandBehavior(band: Band): NonNullable<Band['behavior']> {
  return band.behavior ?? {
    enabled: true,
    printOn: 'allPages',
    printIfEmpty: true,
    printOnAllPages: band.type === 'pageHeader' || band.type === 'pageFooter' || band.type === 'groupHeader',
    keepTogether: false,
    canBreak: band.type === 'data' || band.type === 'child',
    printAtBottom: band.type === 'pageFooter',
  };
}
