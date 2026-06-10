import { buildBandPlan, executeBandPlan } from '../band-planner';
import { expandJsonDataBySources, mergeInferredDataSources } from '../data-dictionary';
import type { LogicalBandItem, RenderContext } from '../band-planner';
import { createLayoutEventState, layoutBand } from '../layout-engine/layout-band';
import type { LayoutEventRuntime, LayoutEventState } from '../layout-engine/layout-band';
import type { RenderBandBox, RenderComponentBox, RenderDocument, RenderPage, RenderTable, RenderTableCell } from '../render-document/types';
import type { Band, Page, PageBorder, PageWatermark, ReportTemplate, SubreportComponent, TableComponent } from '../template-model/types';
import { isRepeatOnEveryPageBandType } from '../template-model/types';
import { normalizeTemplate } from '../template-model';
import { evalExpression } from '../expression-engine/evaluator';
import type { BuiltinFunction } from '../expression-engine/evaluator';
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
  expressionVariables?: Record<string, unknown>;
  expressionFunctions?: Record<string, BuiltinFunction>;
  mode?: EventMode;
}

interface InternalRenderReportOptions extends RenderReportOptions {
  subreportDepth?: number;
  eventRuntime?: LayoutEventRuntime;
  suppressEvents?: boolean;
}

const DEFAULT_MAX_SUBREPORT_DEPTH = 3;

type BandLogicalItem = Extract<LogicalBandItem, { kind: 'band' }>;

interface DataBandColumnLayout {
  count: number;
  gap: number;
  width: number;
  direction: 'downThenAcross' | 'acrossThenDown';
}

interface DataBandColumnFlow {
  dataBandId: string;
  layout: DataBandColumnLayout;
  columnHeaders: BandLogicalItem[];
  columnIndex: number;
  columnCursors: number[];
  rowY: number;
  rowHeight: number;
}

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
  const normalizedTemplate = normalizeTemplate(mergeInferredDataSources(cloneReportTemplate(template), data));
  const expandedData = expandJsonDataBySources(data, normalizedTemplate.dataSources);
  const eventRuntime = createRenderEventRuntime(normalizedTemplate, expandedData, options);

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
  const logicalItems = executeBandPlan(plan, expandedData, {
    expressionVariables: options.expressionVariables,
    expressionFunctions: options.expressionFunctions,
  });
  if (!options.suppressEvents) {
    runReportEvent(normalizedTemplate, 'afterData', eventRuntime);
  }
  const pages = paginate(templatePage, plan.pageBands, logicalItems, expandedData, normalizedTemplate.styles, normalizedTemplate.conditionalFormats, {
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
  conditionalFormats: ReportTemplate['conditionalFormats'] = [],
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
  let columnFlow: DataBandColumnFlow | undefined;
  let pendingColumnHeaders: BandLogicalItem[] = [];

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
      placeBand(header, createEmptyContext(options, rowsByBand), true);
    }
    for (const groupHeader of repeatedGroups) {
      placeBand(groupHeader, createEmptyContext(options, rowsByBand), true);
    }
    for (const sectionBand of activeSectionRepeatBands) {
      if (columnFlow && sectionBand.type === 'columnHeader') {
        continue;
      }
      placeBand(sectionBand, createEmptyContext(options, rowsByBand), true);
    }
  };

  const ensurePage = () => {
    if (!currentPage) {
      newPage();
    }
  };

  const placeBand = (band: Band, context: RenderContext, force = false): RenderBandBox | undefined => {
    ensurePage();
    const runtimeContext = withRuntimeContext(context, options);
    const eventBand = prepareBandInstance(band, runtimeContext, options, templatePage);
    if (!eventBand) {
      return undefined;
    }

    const layoutContext = withParameters(runtimeContext, options.parameters);
    const behavior = getBandBehavior(eventBand);
    if (!shouldPrintBand(behavior, currentPage!.pageNumber, layoutContext, rowsByBand)) {
      return undefined;
    }
    let layoutState = createLayoutState(options);
    const currentPageRows = currentPage ? pageRows.get(currentPage) ?? {} : {};
    let preview = layoutBand(eventBand, { x: printableX, y: cursorY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: currentPageRows, styles, conditionalFormats, renderSubreport: createSubreportRenderer(rowsByBand, options, false), eventRuntime: withEventPage(options.eventRuntime, templatePage), eventState: layoutState, eventMode: 'measure' });
    if (behavior.printIfEmpty === false && preview.components.length === 0) {
      return undefined;
    }
    const breakIfLessThan = behavior.breakIfLessThan ?? 0;
    if (!force && breakIfLessThan > 0 && pageBottomY - cursorY < breakIfLessThan && currentPage!.items.length > 0) {
      newPage();
      preview = layoutBand(eventBand, { x: printableX, y: cursorY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles, conditionalFormats, renderSubreport: createSubreportRenderer(rowsByBand, options, false), eventRuntime: withEventPage(options.eventRuntime, templatePage), eventState: layoutState, eventMode: 'measure' });
    }

    if (!force && cursorY + preview.height > pageBottomY && currentPage!.items.length > 0) {
      newPage();
      preview = layoutBand(eventBand, { x: printableX, y: cursorY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles, conditionalFormats, renderSubreport: createSubreportRenderer(rowsByBand, options, false), eventRuntime: withEventPage(options.eventRuntime, templatePage), eventState: layoutState, eventMode: 'measure' });
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
        collectPageRow(pageRows.get(currentPage!)!, eventBand, runtimeContext);
        cursorY += box.height;
        placedBox = box;
      }
      finishBandInstance(eventBand, runtimeContext, options, templatePage);
      return placedBox;
    }

    const targetY = behavior.printAtBottom ? pageBottomY - preview.height : cursorY;
    const box = layoutBand(eventBand, { x: printableX, y: targetY, width: printableWidth, context: layoutContext, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles, conditionalFormats, renderSubreport: createSubreportRenderer(rowsByBand, options, true), eventRuntime: withEventPage(options.eventRuntime, templatePage), eventState: layoutState, eventMode: 'render' });
    currentPage!.items.push(box);
    collectPageRow(pageRows.get(currentPage!)!, eventBand, runtimeContext);
    cursorY = behavior.printAtBottom ? pageBottomY : cursorY + box.height;
    finishBandInstance(eventBand, runtimeContext, options, templatePage);
    return box;
  };

  const measureBandAt = (band: Band, context: RenderContext, x: number, y: number, width: number): RenderBandBox => {
    const layoutContext = withParameters(withRuntimeContext(context, options), options.parameters);
    return layoutBand(band, {
      x,
      y,
      width,
      context: layoutContext,
      rowsByBand,
      pageRowsByBand: currentPage ? pageRows.get(currentPage) ?? {} : {},
      styles,
      conditionalFormats,
      renderSubreport: createSubreportRenderer(rowsByBand, options, false),
      eventRuntime: undefined,
      eventMode: 'measure',
    });
  };

  const placeBandAt = (band: Band, context: RenderContext, x: number, y: number, width: number): RenderBandBox | undefined => {
    ensurePage();
    const runtimeContext = withRuntimeContext(context, options);
    const eventBand = prepareBandInstance(band, runtimeContext, options, templatePage);
    if (!eventBand) {
      return undefined;
    }

    const layoutContext = withParameters(runtimeContext, options.parameters);
    const behavior = getBandBehavior(eventBand);
    if (!shouldPrintBand(behavior, currentPage!.pageNumber, layoutContext, rowsByBand)) {
      return undefined;
    }

    const layoutState = createLayoutState(options);
    const preview = layoutBand(eventBand, { x, y, width, context: layoutContext, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles, conditionalFormats, renderSubreport: createSubreportRenderer(rowsByBand, options, false), eventRuntime: withEventPage(options.eventRuntime, templatePage), eventState: layoutState, eventMode: 'measure' });
    if (behavior.printIfEmpty === false && preview.components.length === 0) {
      return undefined;
    }

    const box = layoutBand(eventBand, { x, y, width, context: layoutContext, rowsByBand, pageRowsByBand: pageRows.get(currentPage!) ?? {}, styles, conditionalFormats, renderSubreport: createSubreportRenderer(rowsByBand, options, true), eventRuntime: withEventPage(options.eventRuntime, templatePage), eventState: layoutState, eventMode: 'render' });
    currentPage!.items.push(box);
    collectPageRow(pageRows.get(currentPage!)!, eventBand, runtimeContext);
    finishBandInstance(eventBand, runtimeContext, options, templatePage);
    return box;
  };

  const renderColumnHeaders = (flow: DataBandColumnFlow) => {
    if (flow.columnHeaders.length === 0) {
      return;
    }

    let headerY = cursorY;
    for (const item of flow.columnHeaders) {
      let headerHeight = 0;
      for (let columnIndex = 0; columnIndex < flow.layout.count; columnIndex += 1) {
        const x = printableX + columnIndex * (flow.layout.width + flow.layout.gap);
        const box = placeBandAt(item.band, item.context, x, headerY, flow.layout.width);
        headerHeight = Math.max(headerHeight, box?.height ?? item.band.height);
      }
      headerY += headerHeight;
    }

    flow.columnCursors = Array.from({ length: flow.layout.count }, () => headerY);
    flow.rowY = headerY;
    flow.rowHeight = 0;
    cursorY = headerY;
  };

  const resetColumnFlowForPage = (flow: DataBandColumnFlow) => {
    flow.columnIndex = 0;
    flow.columnCursors = Array.from({ length: flow.layout.count }, () => cursorY);
    flow.rowY = cursorY;
    flow.rowHeight = 0;
    renderColumnHeaders(flow);
  };

  const ensureColumnFlow = (layout: DataBandColumnLayout, columnHeaders: BandLogicalItem[], dataBandId: string): DataBandColumnFlow => {
    if (!columnFlow || columnFlow.dataBandId !== dataBandId || !sameColumnLayout(columnFlow.layout, layout)) {
      columnFlow = {
        dataBandId,
        layout,
        columnHeaders,
        columnIndex: 0,
        columnCursors: Array.from({ length: layout.count }, () => cursorY),
        rowY: cursorY,
        rowHeight: 0,
      };
      renderColumnHeaders(columnFlow);
    }
    return columnFlow;
  };

  const finishColumnFlow = () => {
    if (!columnFlow) {
      return;
    }

    cursorY = columnFlow.layout.direction === 'acrossThenDown'
      ? columnFlow.rowY + (columnFlow.columnIndex > 0 ? columnFlow.rowHeight : 0)
      : Math.max(...columnFlow.columnCursors);
    columnFlow = undefined;
  };

  const placeColumnDataBand = (band: Band, context: RenderContext, layout: DataBandColumnLayout, columnHeaders: BandLogicalItem[]): RenderBandBox | undefined => {
    ensurePage();
    const flow = ensureColumnFlow(layout, columnHeaders, band.id);

    if (layout.direction === 'acrossThenDown') {
      const columnX = printableX + flow.columnIndex * (layout.width + layout.gap);
      const preview = measureBandAt(band, context, columnX, flow.rowY, layout.width);
      if (flow.columnIndex === 0 && flow.rowY + preview.height > pageBottomY && currentPage!.items.length > 0) {
        newPage();
        resetColumnFlowForPage(flow);
      }

      const x = printableX + flow.columnIndex * (layout.width + layout.gap);
      const box = placeBandAt(band, context, x, flow.rowY, layout.width);
      const placedHeight = box?.height ?? preview.height;
      flow.rowHeight = Math.max(flow.rowHeight, placedHeight);
      if (flow.columnIndex >= layout.count - 1) {
        flow.rowY += flow.rowHeight;
        flow.rowHeight = 0;
        flow.columnIndex = 0;
      } else {
        flow.columnIndex += 1;
      }
      cursorY = flow.rowY + (flow.columnIndex > 0 ? flow.rowHeight : 0);
      return box;
    }

    let columnY = flow.columnCursors[flow.columnIndex];
    let columnX = printableX + flow.columnIndex * (layout.width + layout.gap);
    let preview = measureBandAt(band, context, columnX, columnY, layout.width);
    if (columnY + preview.height > pageBottomY && currentPage!.items.length > 0) {
      if (flow.columnIndex < layout.count - 1) {
        flow.columnIndex += 1;
      } else {
        newPage();
        resetColumnFlowForPage(flow);
      }
      columnY = flow.columnCursors[flow.columnIndex];
      columnX = printableX + flow.columnIndex * (layout.width + layout.gap);
      preview = measureBandAt(band, context, columnX, columnY, layout.width);
    }

    const box = placeBandAt(band, context, columnX, columnY, layout.width);
    flow.columnCursors[flow.columnIndex] += box?.height ?? preview.height;
    cursorY = Math.max(...flow.columnCursors);
    return box;
  };

  const placeColumnFooterBand = (item: BandLogicalItem): void => {
    if (!columnFlow) {
      placeBand(item.band, item.context);
      return;
    }

    const footerY = columnFlow.layout.direction === 'acrossThenDown'
      ? columnFlow.rowY + (columnFlow.columnIndex > 0 ? columnFlow.rowHeight : 0)
      : Math.max(...columnFlow.columnCursors);
    let footerHeight = 0;
    for (let columnIndex = 0; columnIndex < columnFlow.layout.count; columnIndex += 1) {
      const x = printableX + columnIndex * (columnFlow.layout.width + columnFlow.layout.gap);
      const box = placeBandAt(item.band, item.context, x, footerY, columnFlow.layout.width);
      footerHeight = Math.max(footerHeight, box?.height ?? item.band.height);
    }
    cursorY = footerY + footerHeight;
    columnFlow = undefined;
  };

  const flushPendingColumnHeaders = () => {
    for (const item of pendingColumnHeaders) {
      placeBand(item.band, item.context);
    }
    pendingColumnHeaders = [];
  };

  for (const item of logicalItems) {
    if (item.kind === 'pageBreak') {
      newPage();
      continue;
    }

    if (item.band.type === 'columnHeader') {
      pendingColumnHeaders.push(item);
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

    if (item.band.type === 'columnFooter' && columnFlow) {
      placeColumnFooterBand(item);
      activeSectionRepeatBands = [];
      pendingColumnHeaders = [];
      continue;
    }

    if (['footer', 'columnFooter', 'reportSummary'].includes(item.band.type)) {
      flushPendingColumnHeaders();
      finishColumnFlow();
      activeSectionRepeatBands = [];
    }

    const columnLayout = resolveDataBandColumnLayout(item.band, printableWidth);
    if (columnLayout) {
      placeColumnDataBand(item.band, item.context, columnLayout, pendingColumnHeaders);
      pendingColumnHeaders = [];
    } else {
      flushPendingColumnHeaders();
      finishColumnFlow();
      placeBand(item.band, item.context);
    }

    if (item.band.type === 'groupFooter') {
      const index = repeatedGroups.length - 1;
      if (index >= 0) {
        repeatedGroups.splice(index, 1);
      }
    }
  }

  flushPendingColumnHeaders();
  finishColumnFlow();

  if (!currentPage) {
    newPage();
  }

  for (const page of pages) {
    for (const overlay of pageBands.overlay) {
      const box = renderFixedBand(overlay, createEmptyContext(options, rowsByBand), templatePage.margins.top, pageRows.get(page) ?? {}, templatePage, page.pageNumber, printableX, printableWidth, rowsByBand, styles, conditionalFormats, options);
      if (box) {
        page.items.unshift(box);
      }
    }

    let footerY = templatePage.height - templatePage.margins.bottom - footerHeight;
    for (const footer of pageBands.pageFooter) {
      const box = renderFixedBand(footer, createEmptyContext(options, rowsByBand), footerY, pageRows.get(page) ?? {}, templatePage, page.pageNumber, printableX, printableWidth, rowsByBand, styles, conditionalFormats, options);
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

function resolveDataBandColumnLayout(band: Band, availableWidth: number): DataBandColumnLayout | undefined {
  if (band.type !== 'data') {
    return undefined;
  }

  const columns = band.dataBand?.columns;
  const count = Math.max(1, Math.floor(columns?.count ?? 1));
  if (count <= 1) {
    return undefined;
  }

  const gap = Math.max(0, columns?.gap ?? 0);
  const width = Math.max(1, (availableWidth - gap * (count - 1)) / count);
  return {
    count,
    gap,
    width,
    direction: columns?.direction ?? 'downThenAcross',
  };
}

function sameColumnLayout(a: DataBandColumnLayout, b: DataBandColumnLayout): boolean {
  return a.count === b.count
    && a.gap === b.gap
    && a.width === b.width
    && a.direction === b.direction;
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
  conditionalFormats: ReportTemplate['conditionalFormats'],
  options: InternalRenderReportOptions,
): RenderBandBox | undefined {
  const runtimeContext = withRuntimeContext(context, options);
  const eventBand = prepareBandInstance(band, runtimeContext, options, templatePage);
  if (!eventBand) {
    return undefined;
  }

  const layoutContext = withParameters(runtimeContext, options.parameters);
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
    conditionalFormats,
    renderSubreport: createSubreportRenderer(rowsByBand, options, true),
    eventRuntime: withEventPage(options.eventRuntime, templatePage),
  });
  if (behavior.printIfEmpty === false && box.components.length === 0) {
    return undefined;
  }

  finishBandInstance(eventBand, runtimeContext, options, templatePage);
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
  const bodyRows = rows;
  if (bodyRows.length === 0) return undefined;
  const availableFirstPage = pageBottomY - cursorY - tableTopOffset;
  const totalTableHeight = rowsHeight(rows);
  if (availableFirstPage >= totalTableHeight) return undefined;

  const chunks: TableChunk[] = [];
  let remainingBodyRows = bodyRows;
  let availableHeight = availableFirstPage;

  while (remainingBodyRows.length > 0) {
    const chunk = takeTableRowsForPage(table, remainingBodyRows, availableHeight);
    if (chunk.bodyRows.length === 0) {
      chunk.bodyRows = [remainingBodyRows[0]];
    }
    const chunkRows = normalizeTableChunkRows(chunk.bodyRows);
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
  bodyRows: RenderTableCell[][],
  availableHeight: number,
): { bodyRows: RenderTableCell[][] } {
  const bodyBudget = Math.max(0, availableHeight);
  const selected: RenderTableCell[][] = [];
  let used = 0;

  for (const row of bodyRows) {
    const rowHeight = renderTableRowHeight(row);
    if (selected.length > 0 && used + rowHeight > bodyBudget) break;
    if (selected.length === 0 && rowHeight > Math.max(0, availableHeight)) break;
    selected.push(row);
    used += rowHeight;
  }

  if (selected.length === 0 && bodyRows.length > 0 && renderTableRowHeight(bodyRows[0]) <= table.height) {
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
      && (band.type === 'data' || band.type === 'hierarchicalData'),
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
  if (!isSinglePlaceholder) {
    try {
      return evalExpression(
        value,
        (source, field) => resolveField(context, source, field),
        context.rowIndex,
        expressionVariables(context, { rowsByBand }),
        undefined,
        context.expressionFunctions,
      );
    } catch {
      // Fall through to mixed literal placeholder replacement.
    }
  }

  if (!isSinglePlaceholder && placeholderPattern.test(value)) {
    return value.replace(/\{([^{}]+)\}/g, (match, expressionBody) => {
      try {
        const result = evalExpression(
          `{${expressionBody}}`,
          (source, field) => resolveField(context, source, field),
          context.rowIndex,
          expressionVariables(context),
          undefined,
          context.expressionFunctions,
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
      expressionVariables(context, { rowsByBand }),
      undefined,
      context.expressionFunctions,
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

  if (!source && context.expressionVariables && field in context.expressionVariables) {
    return context.expressionVariables[field];
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

function createEmptyContext(
  options: Pick<InternalRenderReportOptions, 'parameters' | 'expressionVariables' | 'expressionFunctions'>,
  rowsByBand: Record<string, Record<string, unknown>[]> = {},
): RenderContext {
  const rootRow = rowsByBand.root?.[0];
  return {
    row: rootRow,
    rowIndex: 0,
    dataSourceId: rootRow ? 'root' : undefined,
    groupValues: {},
    parameters: options.parameters,
    expressionVariables: options.expressionVariables,
    expressionFunctions: options.expressionFunctions,
  };
}

function withParameters(context: RenderContext, parameters?: Record<string, unknown>): RenderContext {
  return {
    ...context,
    parameters: context.parameters ?? parameters,
  };
}

function withRuntimeContext(context: RenderContext, options: Pick<InternalRenderReportOptions, 'expressionVariables' | 'expressionFunctions'>): RenderContext {
  return {
    ...context,
    expressionVariables: context.expressionVariables ?? options.expressionVariables,
    expressionFunctions: context.expressionFunctions ?? options.expressionFunctions,
  };
}

function expressionVariables(context: RenderContext, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    row: context.row,
    groupValues: context.groupValues,
    parameters: context.parameters,
    ...extra,
    ...(context.expressionVariables ?? {}),
  };
}

function getBandBehavior(band: Band): NonNullable<Band['behavior']> {
  return band.behavior ?? {
    enabled: true,
    printOn: 'allPages',
    printIfEmpty: true,
    printOnAllPages: isRepeatOnEveryPageBandType(band.type),
    keepTogether: false,
    canBreak: band.type === 'data',
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
