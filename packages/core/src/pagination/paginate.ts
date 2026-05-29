import { buildBandPlan, executeBandPlan } from '../band-planner';
import type { LogicalBandItem, RenderContext } from '../band-planner';
import { createLayoutEventState, layoutBand } from '../layout-engine/layout-band';
import type { LayoutEventRuntime, LayoutEventState } from '../layout-engine/layout-band';
import type { RenderBandBox, RenderComponentBox, RenderDocument, RenderPage, RenderTable, RenderTableCell } from '../render-document/types';
import type { Band, Page, PageBorder, PageWatermark, ReportTemplate, SubreportComponent, TableComponent } from '../template-model/types';
import { normalizeTemplate } from '../template-model';
import { evalExpression } from '../expression-engine/evaluator';
import { applyPageNumberPass } from './page-number-pass';
import {
  cloneReportTemplate,
  createEventContext,
  createEventLogCollector,
  createEventRuntimeState,
  runEventScript,
} from '../event-engine';
import type { BandEventName, EventExecutionState, EventMode, PageEventName, ReportEventName } from '../event-engine';

export interface RenderReportOptions {
  subreports?: Record<string, ReportTemplate>;
  maxSubreportDepth?: number;
  parameters?: Record<string, unknown>;
  mode?: EventMode;
}

interface InternalRenderReportOptions extends RenderReportOptions {
  subreportDepth?: number;
  eventRuntime?: LayoutEventRuntime;
  suppressEvents?: boolean;
}

const DEFAULT_MAX_SUBREPORT_DEPTH = 3;

function createRenderEventRuntime(
  template: ReportTemplate,
  data: Record<string, Record<string, unknown>[]>,
  options: InternalRenderReportOptions,
): LayoutEventRuntime {
  const mode = options.mode ?? options.eventRuntime?.mode ?? 'preview';

  if (options.eventRuntime) {
    return {
      ...options.eventRuntime,
      mode,
      report: template,
      data,
      parameters: options.parameters ?? options.eventRuntime.parameters,
    };
  }

  return {
    mode,
    report: template,
    data,
    parameters: options.parameters,
    variables: {},
    state: {},
    log: createEventLogCollector({ ownerType: 'report', ownerId: template.id, eventName: '' }),
    runtime: createEventRuntimeState(),
  };
}

function runReportEvent(
  template: ReportTemplate,
  eventName: ReportEventName,
  eventRuntime: LayoutEventRuntime,
): EventExecutionState {
  const execution: EventExecutionState = { canceled: false, hidden: false, hasValue: false };
  const target = { ownerType: 'report' as const, ownerId: template.id, eventName };
  const ctx = createEventContext({
    mode: eventRuntime.mode,
    report: template,
    data: eventRuntime.data,
    parameters: eventRuntime.parameters,
    variables: eventRuntime.variables,
    state: eventRuntime.state,
    log: eventRuntime.log,
    target,
    runtime: eventRuntime.runtime,
    execution,
  });

  runEventScript({
    event: template.events?.[eventName],
    ctx,
    target,
    eventLogs: eventRuntime.log,
    runtimeState: eventRuntime.runtime,
  });

  return execution;
}

function runPageEvent(
  page: Page,
  eventName: PageEventName,
  eventRuntime: LayoutEventRuntime | undefined,
): EventExecutionState {
  const execution: EventExecutionState = { canceled: false, hidden: false, hasValue: false };
  if (!eventRuntime) {
    return execution;
  }

  const target = { ownerType: 'page' as const, ownerId: page.id, eventName };
  const ctx = createEventContext({
    mode: eventRuntime.mode,
    report: eventRuntime.report,
    page,
    data: eventRuntime.data,
    parameters: eventRuntime.parameters,
    variables: eventRuntime.variables,
    state: eventRuntime.state,
    log: eventRuntime.log,
    target,
    runtime: eventRuntime.runtime,
    execution,
  });

  runEventScript({
    event: page.events?.[eventName],
    ctx,
    target,
    eventLogs: eventRuntime.log,
    runtimeState: eventRuntime.runtime,
  });

  return execution;
}

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
  const normalizedTemplate = normalizeTemplate(cloneReportTemplate(template));
  const eventRuntime = createRenderEventRuntime(normalizedTemplate, data, options);

  if (!options.suppressEvents) {
    const modeEvent: ReportEventName = eventRuntime.mode === 'preview' ? 'beforePreview' : 'beforePrint';
    const modeExecution = runReportEvent(normalizedTemplate, modeEvent, eventRuntime);
    if (modeExecution.canceled) {
      return { pages: [], fonts: normalizedTemplate.fonts, eventLogs: eventRuntime.log.entries };
    }

    for (const eventName of ['beforeRender', 'beforeData'] as const) {
      const execution = runReportEvent(normalizedTemplate, eventName, eventRuntime);
      if (execution.canceled) {
        return { pages: [], fonts: normalizedTemplate.fonts, eventLogs: eventRuntime.log.entries };
      }
    }
  }

  const templatePage = normalizedTemplate.pages[0];
  const plan = buildBandPlan(normalizedTemplate);
  const logicalItems = executeBandPlan(plan, data);
  if (!options.suppressEvents) {
    runReportEvent(normalizedTemplate, 'afterData', eventRuntime);
  }
  const pages = paginate(templatePage, plan.pageBands, logicalItems, data, normalizedTemplate.styles, {
    ...options,
    eventRuntime: options.suppressEvents ? undefined : eventRuntime,
  });
  const document = applyPageNumberPass({ pages, fonts: normalizedTemplate.fonts, eventLogs: eventRuntime.log.entries });
  if (!options.suppressEvents) {
    runReportEvent(normalizedTemplate, 'afterRender', eventRuntime);
  }
  document.eventLogs = eventRuntime.log.entries;
  return document;
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
  const lastPageBandIds = collectLastPageBandIds(templatePage);
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
      backgroundColor: templatePage.backgroundColor,
      watermark: clonePageWatermark(templatePage.watermark),
      pageBorder: clonePageBorder(templatePage.pageBorder),
      items: [],
    };
    runPageEvent(templatePage, 'beforePrint', options.eventRuntime);
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

  const placeBand = (band: Band, context: RenderContext, force = false): RenderBandBox | undefined => {
    ensurePage();
    const eventBand = prepareBandInstance(band, context, options, templatePage);
    if (!eventBand) {
      return undefined;
    }

    const layoutContext = withParameters(context, options.parameters);
    const behavior = getBandBehavior(eventBand);
    if (!shouldPrintBand(behavior, currentPage!.pageNumber, layoutContext, rowsByBand)) {
      return undefined;
    }
    let layoutState = createLayoutState(options);
    const currentPageRows = currentPage ? pageRows.get(currentPage) ?? {} : {};
    let preview = layoutBand(eventBand, { x: printableX, y: cursorY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: currentPageRows, styles, renderSubreport: createSubreportRenderer(rowsByBand, options, false), eventRuntime: withEventPage(options.eventRuntime, templatePage), eventState: layoutState, eventMode: 'measure' });
    if (behavior.printIfEmpty === false && preview.components.length === 0) {
      return undefined;
    }
    const breakIfLessThan = behavior.breakIfLessThan ?? 0;
    if (!force && breakIfLessThan > 0 && pageBottomY - cursorY < breakIfLessThan && currentPage!.items.length > 0) {
      newPage();
      preview = layoutBand(eventBand, { x: printableX, y: cursorY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles, renderSubreport: createSubreportRenderer(rowsByBand, options, false), eventRuntime: withEventPage(options.eventRuntime, templatePage), eventState: layoutState, eventMode: 'measure' });
    }

    if (!force && cursorY + preview.height > pageBottomY && currentPage!.items.length > 0) {
      newPage();
      preview = layoutBand(eventBand, { x: printableX, y: cursorY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles, renderSubreport: createSubreportRenderer(rowsByBand, options, false), eventRuntime: withEventPage(options.eventRuntime, templatePage), eventState: layoutState, eventMode: 'measure' });
    }

    const splitTable = !force ? splitTableBand(eventBand, preview, cursorY, pageBottomY, templatePage.margins.top) : undefined;
    if (splitTable) {
      let placedBox: RenderBandBox | undefined;
      for (const chunk of splitTable.chunks) {
        if (cursorY + chunk.height > pageBottomY && currentPage!.items.length > 0) {
          newPage();
        }
        const box = createTableChunkBandBox(preview, chunk, cursorY);
        currentPage!.items.push(box);
        collectPageRow(pageRows.get(currentPage!)!, eventBand, context);
        cursorY += box.height;
        placedBox = box;
      }
      finishBandInstance(eventBand, context, options, templatePage);
      return placedBox;
    }

    const targetY = behavior.printAtBottom ? pageBottomY - preview.height : cursorY;
    const box = layoutBand(eventBand, { x: printableX, y: targetY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles, renderSubreport: createSubreportRenderer(rowsByBand, options, true), eventRuntime: withEventPage(options.eventRuntime, templatePage), eventState: layoutState, eventMode: 'render' });
    currentPage!.items.push(box);
    collectPageRow(pageRows.get(currentPage!)!, eventBand, context);
    cursorY = behavior.printAtBottom ? pageBottomY : cursorY + box.height;
    finishBandInstance(eventBand, context, options, templatePage);
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
      const box = renderFixedBand(overlay, createEmptyContext(options.parameters), templatePage.margins.top, pageRows.get(page) ?? {}, templatePage, page.pageNumber, printableX, printableWidth, rowsByBand, styles, options);
      if (box) {
        page.items.unshift(box);
      }
    }

    let footerY = templatePage.height - templatePage.margins.bottom - footerHeight;
    for (const footer of pageBands.pageFooter) {
      const box = renderFixedBand(footer, createEmptyContext(options.parameters), footerY, pageRows.get(page) ?? {}, templatePage, page.pageNumber, printableX, printableWidth, rowsByBand, styles, options);
      if (box) {
        page.items.push(box);
        footerY += box.height;
      }
    }
    runPageEvent(templatePage, 'afterPrint', options.eventRuntime);
  }

  removeNonFinalLastPageBands(pages, lastPageBandIds);
  return pages;
}

function createLayoutState(options: InternalRenderReportOptions): LayoutEventState | undefined {
  return options.eventRuntime ? createLayoutEventState() : undefined;
}

function clonePageWatermark(watermark: Page['watermark']): PageWatermark | undefined {
  return watermark ? { ...watermark } : undefined;
}

function clonePageBorder(pageBorder: Page['pageBorder']): PageBorder | undefined {
  return pageBorder
    ? { ...pageBorder, sides: { ...pageBorder.sides } }
    : undefined;
}

function collectLastPageBandIds(page: Page): Set<string> {
  return new Set(page.bands.filter((band) => getBandBehavior(band).printOn === 'lastPage').map((band) => band.id));
}

function removeNonFinalLastPageBands(pages: RenderPage[], lastPageBandIds: Set<string>): void {
  if (lastPageBandIds.size === 0) return;
  const finalPage = pages.at(-1);
  for (const page of pages) {
    if (page === finalPage) continue;
    page.items = page.items.filter((item) => !lastPageBandIds.has(item.bandId));
  }
}

function renderFixedBand(
  band: Band,
  context: RenderContext,
  y: number,
  pageRowsByBand: Record<string, Record<string, unknown>[]>,
  templatePage: Page,
  pageNumber: number,
  x: number,
  width: number,
  rowsByBand: Record<string, Record<string, unknown>[]>,
  styles: ReportTemplate['styles'],
  options: InternalRenderReportOptions,
): RenderBandBox | undefined {
  const eventBand = prepareBandInstance(band, context, options, templatePage);
  if (!eventBand) {
    return undefined;
  }

  const layoutContext = withParameters(context, options.parameters);
  const behavior = getBandBehavior(eventBand);
  if (!shouldPrintBand(behavior, pageNumber, layoutContext, rowsByBand)) {
    return undefined;
  }

  const box = layoutBand(eventBand, {
    x,
    y,
    width,
    context: layoutContext,
    rowsByBand,
    pageRowsByBand,
    styles,
    renderSubreport: createSubreportRenderer(rowsByBand, options, true),
    eventRuntime: withEventPage(options.eventRuntime, templatePage),
  });
  if (behavior.printIfEmpty === false && box.components.length === 0) {
    return undefined;
  }

  finishBandInstance(eventBand, context, options, templatePage);
  return box;
}

interface TableChunk {
  table: RenderTable;
  height: number;
  tableHeight: number;
  tableTopOffset: number;
}

function splitTableBand(band: Band, box: RenderBandBox, cursorY: number, pageBottomY: number, pageTopY: number): { chunks: TableChunk[] } | undefined {
  if (box.components.length !== 1) return undefined;
  const component = box.components[0];
  if (component.type !== 'table' || !('rows' in component) || !('columns' in component)) return undefined;
  const templateTable = band.components.find(item => item.id === component.id && item.type === 'table') as TableComponent | undefined;
  if (templateTable?.canBreak === false) return undefined;

  const table = component as RenderTable;
  const rows = table.rows ?? [];
  const tableTopOffset = Math.max(0, table.y - box.y);
  const headerRows = rows.filter(row => row.some(cell => cell.isHeader));
  const bodyRows = rows.filter(row => !row.some(cell => cell.isHeader) && !row.some(cell => cell.isFooter));
  const footerRows = rows.filter(row => row.some(cell => cell.isFooter));
  if (bodyRows.length === 0) return undefined;
  const availableFirstPage = pageBottomY - cursorY - tableTopOffset;
  const totalTableHeight = rowsHeight(rows);
  if (availableFirstPage >= totalTableHeight) return undefined;

  const chunks: TableChunk[] = [];
  let remainingBodyRows = bodyRows;
  let availableHeight = availableFirstPage;

  while (remainingBodyRows.length > 0) {
    const chunk = takeTableRowsForPage(table, headerRows, remainingBodyRows, [], availableHeight);
    if (chunk.bodyRows.length === 0) {
      chunk.bodyRows = [remainingBodyRows[0]];
    }
    const isLast = chunk.bodyRows.length >= remainingBodyRows.length;
    const chunkRows = normalizeTableChunkRows([...headerRows, ...chunk.bodyRows, ...(isLast ? footerRows : [])]);
    const tableHeight = rowsHeight(chunkRows);
    chunks.push({
      table: {
        ...table,
        y: tableTopOffset,
        height: tableHeight,
        rows: chunkRows,
      },
      height: tableTopOffset + tableHeight,
      tableHeight,
      tableTopOffset,
    });
    remainingBodyRows = remainingBodyRows.slice(chunk.bodyRows.length);
    availableHeight = pageBottomY - pageTopY - tableTopOffset;
  }

  return chunks.length > 1 ? { chunks } : undefined;
}

function takeTableRowsForPage(
  table: RenderTable,
  headerRows: RenderTableCell[][],
  bodyRows: RenderTableCell[][],
  footerRows: RenderTableCell[][],
  availableHeight: number,
): { bodyRows: RenderTableCell[][] } {
  const minimumHeaderHeight = rowsHeight(headerRows);
  const footerHeight = rowsHeight(footerRows);
  const bodyBudget = Math.max(0, availableHeight - minimumHeaderHeight - footerHeight);
  const selected: RenderTableCell[][] = [];
  let used = 0;

  for (const row of bodyRows) {
    const rowHeight = renderTableRowHeight(row);
    if (selected.length > 0 && used + rowHeight > bodyBudget) break;
    if (selected.length === 0 && minimumHeaderHeight + rowHeight > Math.max(0, availableHeight)) break;
    selected.push(row);
    used += rowHeight;
  }

  if (selected.length === 0 && bodyRows.length > 0 && rowsHeight(headerRows) + renderTableRowHeight(bodyRows[0]) <= table.height) {
    selected.push(bodyRows[0]);
  }
  return { bodyRows: selected };
}

function createTableChunkBandBox(source: RenderBandBox, chunk: TableChunk, y: number): RenderBandBox {
  return {
    ...source,
    id: `${source.id}-table-chunk-${y}`,
    y,
    height: chunk.height,
    components: [{
      ...chunk.table,
      y: y + chunk.tableTopOffset,
      height: chunk.tableHeight,
    }],
  };
}

function normalizeTableChunkRows(rows: RenderTableCell[][]): RenderTableCell[][] {
  return rows.map((row, rowIndex) => row.map(cell => ({
    ...cell,
    row: rowIndex,
  })));
}

function rowsHeight(rows: RenderTableCell[][]): number {
  return rows.reduce((sum, row) => sum + renderTableRowHeight(row), 0);
}

function renderTableRowHeight(row: RenderTableCell[]): number {
  return row[0]?.height ?? 0;
}

function prepareBandInstance(
  band: Band,
  context: RenderContext,
  options: InternalRenderReportOptions,
  page: Page,
): Band | undefined {
  const eventBand = cloneBand(band);
  if (!options.eventRuntime) {
    return eventBand;
  }

  const execution: EventExecutionState = { canceled: false, hidden: false, hasValue: false };
  if (isDataRowBand(eventBand, context)) {
    runBandEvent(eventBand, context, 'beforeRow', options.eventRuntime, page, execution);
  }
  runBandEvent(eventBand, context, 'beforePrint', options.eventRuntime, page, execution);

  return execution.hidden || execution.canceled ? undefined : eventBand;
}

function finishBandInstance(
  band: Band,
  context: RenderContext,
  options: InternalRenderReportOptions,
  page: Page,
): void {
  if (!options.eventRuntime) {
    return;
  }

  const execution: EventExecutionState = { canceled: false, hidden: false, hasValue: false };
  runBandEvent(band, context, 'afterPrint', options.eventRuntime, page, execution);
  if (isDataRowBand(band, context)) {
    runBandEvent(band, context, 'afterRow', options.eventRuntime, page, execution);
  }
}

function runBandEvent(
  band: Band,
  context: RenderContext,
  eventName: BandEventName,
  eventRuntime: LayoutEventRuntime,
  page: Page,
  execution: EventExecutionState,
): void {
  const event = band.events?.[eventName];
  if (!event) {
    return;
  }

  const target = { ownerType: 'band' as const, ownerId: band.id, eventName };
  const ctx = createEventContext({
    mode: eventRuntime.mode,
    report: eventRuntime.report,
    page,
    band,
    row: context.row,
    rowIndex: context.rowIndex,
    dataSourceId: context.dataSourceId,
    data: eventRuntime.data,
    parameters: context.parameters ?? eventRuntime.parameters,
    variables: eventRuntime.variables,
    state: eventRuntime.state,
    log: eventRuntime.log,
    target,
    runtime: eventRuntime.runtime,
    execution,
  });

  runEventScript({
    event,
    ctx,
    target,
    eventLogs: eventRuntime.log,
    runtimeState: eventRuntime.runtime,
  });
}

function isDataRowBand(band: Band, context: RenderContext): boolean {
  return Boolean(
    context.row
      && context.dataSourceId
      && (band.type === 'data' || band.type === 'hierarchicalData' || band.type === 'child'),
  );
}

function cloneBand(band: Band): Band {
  return JSON.parse(JSON.stringify(band)) as Band;
}

function withEventPage(eventRuntime: LayoutEventRuntime | undefined, page: Page): LayoutEventRuntime | undefined {
  return eventRuntime ? { ...eventRuntime, page } : undefined;
}

function createSubreportRenderer(
  rowsByBand: Record<string, Record<string, unknown>[]>,
  options: InternalRenderReportOptions,
  enableEvents: boolean,
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
      suppressEvents: options.suppressEvents || !enableEvents,
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
    autoGrow: true,
    autoShrink: false,
  };
}

function shouldPrintBand(
  behavior: NonNullable<Band['behavior']>,
  pageNumber: number,
  context: RenderContext,
  rowsByBand: Record<string, Record<string, unknown>[]>,
): boolean {
  if (behavior.enabled === false) return false;
  if (behavior.visibleExpression && !resolveTemplateBoolean(behavior.visibleExpression, context, rowsByBand)) return false;
  switch (behavior.printOn) {
    case 'firstPage':
      return pageNumber === 1;
    case 'exceptFirstPage':
      return pageNumber > 1;
    case 'oddPages':
      return pageNumber % 2 === 1;
    case 'evenPages':
      return pageNumber % 2 === 0;
    case 'lastPage':
      return true;
    case 'allPages':
    default:
      return true;
  }
}

function resolveTemplateBoolean(
  value: string,
  context: RenderContext,
  rowsByBand: Record<string, Record<string, unknown>[]>,
): boolean {
  const resolved = resolveTemplateValue(value, context, rowsByBand);
  if (typeof resolved === 'boolean') return resolved;
  if (typeof resolved === 'number') return resolved !== 0;
  const text = String(resolved ?? '').trim().toLowerCase();
  if (['false', '0', 'no', 'off', ''].includes(text)) return false;
  return true;
}
