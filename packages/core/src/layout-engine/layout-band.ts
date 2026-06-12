import { evalExpression } from '../expression-engine/evaluator';
import { AggregateRuntime } from '../aggregate-engine';
import type { RenderContext } from '../band-planner/band-plan';
import { createEventContext, runEventScript } from '../event-engine';
import type { EventLogCollector, EventMode, EventRuntimeState, EventExecutionState } from '../event-engine';
import { applyConditionalFormatsToStyle } from '../conditional-format';
import type { RenderBandBox, RenderComponentBox, RenderTable, RenderText } from '../render-document/types';
import type {
  Band,
  BarcodeComponent,
  ChartComponent,
  CheckboxComponent,
  DateTimeComponent,
  ImageComponent,
  LineComponent,
  Page,
  PageNumberComponent,
  PanelComponent,
  QRCodeComponent,
  BorderConfig,
  FontConfig,
  ReportComponent,
  ReportTemplate,
  ReportStyle,
  RichtextComponent,
  ShapeComponent,
  SubreportComponent,
  TableCell,
  TableComponent,
  TableRow,
  TableStyle,
  TextComponent,
  ChartDataPoint,
  ChartAggregateMode,
} from '../template-model/types';
import { isRepeatOnEveryPageBandType } from '../template-model/types';
import { formatValue } from '../text-format';
import { resolveComponentStyle, resolveTextStyle } from '../text-style';
import { measureTextBox } from './measure';

export interface LayoutBandOptions {
  x: number;
  y: number;
  width: number;
  context: RenderContext;
  rowsByBand?: Record<string, Record<string, unknown>[]>;
  pageRowsByBand?: Record<string, Record<string, unknown>[]>;
  styles?: ReportStyle[];
  conditionalFormats?: ReportTemplate['conditionalFormats'];
  renderSubreport?: (component: SubreportComponent, x: number, y: number, context: RenderContext) => { children: RenderComponentBox[]; missing: boolean; height?: number };
  eventRuntime?: LayoutEventRuntime;
  eventState?: LayoutEventState;
  eventMode?: 'measure' | 'render';
}

export interface LayoutEventRuntime {
  mode: EventMode;
  report: ReportTemplate;
  page?: Page;
  data: Record<string, Record<string, unknown>[]>;
  parameters?: Record<string, unknown>;
  variables?: Record<string, unknown>;
  state: Record<string, unknown>;
  log: EventLogCollector;
  runtime: EventRuntimeState;
}

export interface LayoutEventState {
  componentExecutions: WeakMap<ReportComponent, EventExecutionState>;
  componentAfterPrint: WeakSet<ReportComponent>;
}

export function createLayoutEventState(): LayoutEventState {
  return {
    componentExecutions: new WeakMap(),
    componentAfterPrint: new WeakSet(),
  };
}

export function layoutBand(band: Band, options: LayoutBandOptions): RenderBandBox {
  const behavior = band.behavior ?? {
    enabled: true,
    printOn: 'allPages' as const,
    printIfEmpty: true,
    printOnAllPages: isRepeatOnEveryPageBandType(band.type),
    keepTogether: false,
    canBreak: band.type === 'data',
    printAtBottom: band.type === 'pageFooter',
    autoGrow: true,
    autoShrink: false,
  };
  const hierarchyIndentComponentId = findHierarchyIndentComponentId(band);
  const hierarchyIndent = typeof options.context.row?.HierarchyIndent === 'string'
    ? options.context.row.HierarchyIndent
    : '';
  const components = band.components
    .map((component) => {
      const rendered = layoutComponentWithEvents(component, band, options);
      return applyHierarchyIndent(rendered, component, hierarchyIndentComponentId, hierarchyIndent);
    })
    .filter((component): component is RenderComponentBox => Boolean(component));
  const contentHeight = components.reduce((height, component) => Math.max(height, component.y - options.y + component.height), 0);
  const fixedHeight = Math.max(0, band.height);
  const resolvedHeight = behavior.autoGrow === false
    ? fixedHeight
    : Math.max(fixedHeight, contentHeight);
  const finalHeight = behavior.autoShrink && contentHeight < resolvedHeight ? contentHeight : resolvedHeight;

  return {
    id: `${band.id}-${options.y}`,
    bandId: band.id,
    bandType: band.type,
    x: options.x,
    y: options.y,
    width: options.width,
    height: finalHeight,
    backgroundColor: resolveDataBandRowBackground(band, options.context.rowIndex, Boolean(options.context.row)),
    components,
    overflow: components.some((component) => component.overflow) || (behavior.autoGrow === false && contentHeight > fixedHeight),
  };
}

function findHierarchyIndentComponentId(band: Band): string | undefined {
  if (band.type !== 'hierarchicalData') {
    return undefined;
  }
  return band.components
    .filter((component): component is TextComponent => component.type === 'text')
    .sort((a, b) => a.x - b.x || a.y - b.y)[0]?.id;
}

function applyHierarchyIndent(
  rendered: RenderComponentBox | undefined,
  source: ReportComponent,
  indentComponentId: string | undefined,
  indent: string,
): RenderComponentBox | undefined {
  if (!rendered || !indent || source.id !== indentComponentId || !isRenderText(rendered)) {
    return rendered;
  }
  const sourceText = source.type === 'text' ? (source as TextComponent).text : '';
  if (sourceText.includes('HierarchyIndent')) {
    return rendered;
  }
  return {
    ...rendered,
    content: `${indent}${rendered.content ?? ''}`,
  };
}

function isRenderText(component: RenderComponentBox): component is RenderText {
  return component.type === 'text' && 'content' in component;
}

function resolveDataBandRowBackground(band: Band, rowIndex: number, hasRow: boolean): string | undefined {
  if (!hasRow || (band.type !== 'data' && band.type !== 'hierarchicalData')) {
    return undefined;
  }
  return rowIndex % 2 === 0
    ? band.dataBand?.oddRowBackgroundColor
    : band.dataBand?.evenRowBackgroundColor;
}

function layoutComponentWithEvents(component: ReportComponent, band: Band, options: LayoutBandOptions): RenderComponentBox | undefined {
  if (!isComponentRenderable(component, options)) {
    return undefined;
  }

  if (!options.eventRuntime) {
    return layoutComponent(component, band, options);
  }

  const cachedExecution = options.eventState?.componentExecutions.get(component);
  const execution: EventExecutionState = cachedExecution ?? { canceled: false, hidden: false, hasValue: false };
  if (!cachedExecution) {
    runComponentEvent(component, band, options, 'getValue', execution);
    runComponentEvent(component, band, options, 'beforePrint', execution);
    options.eventState?.componentExecutions.set(component, execution);
  }

  if (execution.hidden || execution.canceled) {
    return undefined;
  }

  const box = layoutComponent(component, band, options, execution);
  if (options.eventMode !== 'measure' && !options.eventState?.componentAfterPrint.has(component)) {
    runComponentEvent(component, band, options, 'afterPrint', execution);
    options.eventState?.componentAfterPrint.add(component);
  }
  return box;
}

function runComponentEvent(
  component: ReportComponent,
  band: Band,
  options: LayoutBandOptions,
  eventName: 'getValue' | 'beforePrint' | 'afterPrint',
  execution: EventExecutionState,
): void {
  const eventRuntime = options.eventRuntime;
  const event = component.events?.[eventName];
  if (!eventRuntime || !event) return;

  const target = { ownerType: 'component' as const, ownerId: component.id, eventName };
  const ctx = createEventContext({
    mode: eventRuntime.mode,
    report: eventRuntime.report,
    page: eventRuntime.page,
    band,
    component,
    row: options.context.row,
    rowIndex: options.context.rowIndex,
    dataSourceId: options.context.dataSourceId,
    data: eventRuntime.data,
    parameters: options.context.parameters ?? eventRuntime.parameters,
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

function isComponentRenderable(component: ReportComponent, options: LayoutBandOptions): boolean {
  if (!resolveOptionalBoolean(component.enabledExpression, options)) return false;
  if (!resolveOptionalBoolean(component.visible, options)) return false;
  if (!resolveOptionalBoolean(component.printableExpression, options)) return false;
  return true;
}

function resolveOptionalBoolean(value: string | undefined, options: LayoutBandOptions): boolean {
  if (!value || value.trim() === '') return true;
  return resolveTemplateBoolean(
    value,
    options.context,
    options.rowsByBand ?? {},
    options.pageRowsByBand ?? {},
  );
}

function layoutComponent(
  component: ReportComponent,
  band: Band,
  options: LayoutBandOptions,
  execution?: EventExecutionState,
): RenderComponentBox | undefined {
  if (component.type === 'text') {
    const textComponent = component as TextComponent;
    const effective = resolveTextComponentStyle(textComponent, options.styles ?? []);
    const style = applyTextConditionalFormats(effective, component, options);
    if (style.enabled === false) {
      return undefined;
    }
    const text = resolveText(effective, options.context, options.rowsByBand ?? {}, options.pageRowsByBand ?? {}, execution);
    const measured = measureTextBox({ ...effective, ...style, backgroundColor: style.background }, text);
    return {
      id: component.id,
      type: 'text',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: measured.height,
      content: text,
      overflow: measured.overflow,
      style: {
        font: style.font ?? effective.font,
        border: style.border ?? effective.border,
        backgroundColor: style.background ?? effective.backgroundColor,
        textAlign: style.textAlign ?? effective.textAlign,
        verticalAlign: style.verticalAlign ?? effective.verticalAlign,
        padding: style.padding ?? effective.padding,
        format: style.format ?? effective.format,
        canGrow: style.canGrow ?? effective.canGrow,
        canShrink: style.canShrink ?? effective.canShrink,
      },
    };
  }

  if (component.type === 'image') {
    const imageComponent = component as ImageComponent;
    return {
      id: component.id,
      type: 'image',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: component.height,
      src: resolveTemplateValue(imageComponent.src, options.context, options.rowsByBand ?? {}, options.pageRowsByBand ?? {}),
      fitMode: imageComponent.fitMode,
      style: buildBaseRenderStyle(component),
    };
  }

  if (component.type === 'richtext') {
    const richTextComponent = component as RichtextComponent;
    return {
      id: component.id,
      type: 'richtext',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: component.height,
      html: resolveRichText(richTextComponent, options.context, options.rowsByBand ?? {}, options.pageRowsByBand ?? {}),
      style: buildBaseRenderStyle(component),
    };
  }

  if (component.type === 'chart') {
    return layoutChart(component as ChartComponent, options);
  }

  if (component.type === 'barcode') {
    const barcodeComponent = component as BarcodeComponent;
    return {
      id: component.id,
      type: 'barcode',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: component.height,
      value: resolveTemplateValue(barcodeComponent.value, options.context, options.rowsByBand ?? {}, options.pageRowsByBand ?? {}),
      format: barcodeComponent.format,
      showText: barcodeComponent.showText,
      foregroundColor: barcodeComponent.foregroundColor,
      font: barcodeComponent.font,
      style: buildBaseRenderStyle(component),
    };
  }

  if (component.type === 'qrcode') {
    const qrcodeComponent = component as QRCodeComponent;
    return {
      id: component.id,
      type: 'qrcode',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: component.height,
      value: resolveTemplateValue(qrcodeComponent.value, options.context, options.rowsByBand ?? {}, options.pageRowsByBand ?? {}),
      format: qrcodeComponent.format,
      foregroundColor: qrcodeComponent.foregroundColor,
      style: buildBaseRenderStyle(component),
    };
  }

  if (component.type === 'checkbox') {
    const checkboxComponent = component as CheckboxComponent;
    return {
      id: component.id,
      type: 'checkbox',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: component.height,
      checked: typeof checkboxComponent.checked === 'boolean'
        ? checkboxComponent.checked
        : resolveTemplateBoolean(checkboxComponent.checked, options.context, options.rowsByBand ?? {}, options.pageRowsByBand ?? {}),
      label: checkboxComponent.label
        ? resolveTemplateValue(checkboxComponent.label, options.context, options.rowsByBand ?? {}, options.pageRowsByBand ?? {})
        : undefined,
      foregroundColor: checkboxComponent.foregroundColor,
      font: checkboxComponent.font,
      style: buildBaseRenderStyle(component),
    };
  }

  if (component.type === 'table') {
    return layoutTable(component as TableComponent, options);
  }

  if (component.type === 'line') {
    const lineComponent = component as LineComponent;
    return {
      id: component.id,
      type: 'line',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: component.height,
      startX: lineComponent.startX,
      startY: lineComponent.startY,
      endX: lineComponent.endX,
      endY: lineComponent.endY,
      lineColor: lineComponent.lineColor,
      lineWidth: lineComponent.lineWidth,
      lineStyle: lineComponent.lineStyle,
    };
  }

  if (component.type === 'shape') {
    const shapeComponent = component as ShapeComponent;
    return {
      id: component.id,
      type: 'shape',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: component.height,
      shapeType: shapeComponent.shapeType,
      fillColor: shapeComponent.fillColor,
      borderColor: shapeComponent.borderColor,
      borderWidth: shapeComponent.borderWidth,
      borderStyle: shapeComponent.borderStyle,
    };
  }

  if (component.type === 'pagenumber') {
    const pageNumberComponent = component as PageNumberComponent;
    return {
      id: component.id,
      type: 'text',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: component.height,
      content: pageNumberContent(pageNumberComponent.format),
      style: {
        ...buildBaseRenderStyle(component),
        font: pageNumberComponent.font,
        textAlign: pageNumberComponent.textAlign,
        verticalAlign: pageNumberComponent.verticalAlign ?? 'middle',
      },
    };
  }

  if (component.type === 'datetime') {
    const dateTimeComponent = component as DateTimeComponent;
    return {
      id: component.id,
      type: 'text',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: component.height,
      content: formatDateTime(new Date(), dateTimeComponent.format),
      style: {
        ...buildBaseRenderStyle(component),
        font: dateTimeComponent.font,
        textAlign: dateTimeComponent.textAlign,
        verticalAlign: dateTimeComponent.verticalAlign ?? 'middle',
      },
    };
  }

  if (component.type === 'panel') {
    const panelComponent = component as PanelComponent;
    const panelX = options.x + component.x;
    const panelY = options.y + component.y;
    const contentX = panelX + (panelComponent.padding?.left ?? 0);
    const contentY = panelY + (panelComponent.padding?.top ?? 0);
    const children = panelComponent.components.map((child) => layoutComponentWithEvents(child, band, {
      ...options,
      x: contentX,
      y: contentY,
    })).filter((child): child is RenderComponentBox => Boolean(child));
    const overflow = hasContainerOverflow(children, panelX, panelY, component.width, component.height);

    return {
      id: component.id,
      type: 'panel',
      x: panelX,
      y: panelY,
      width: component.width,
      height: component.height,
      children,
      overflow,
      style: {
        ...buildBaseRenderStyle(component),
        backgroundColor: panelComponent.backgroundColor ?? component.backgroundColor,
        border: panelComponent.border,
      },
    };
  }

  if (component.type === 'subreport') {
    const subreportComponent = component as SubreportComponent;
    const subreportX = options.x + component.x;
    const subreportY = options.y + component.y;
    const rendered = options.renderSubreport?.(subreportComponent, subreportX, subreportY, options.context) ?? {
      missing: true,
      children: [createSubreportPlaceholder(subreportComponent, subreportX, subreportY)],
    };
    const height = Math.max(component.height, rendered.height ?? component.height);

    return {
      id: component.id,
      type: 'subreport',
      x: subreportX,
      y: subreportY,
      width: component.width,
      height,
      templateUrl: subreportComponent.templateUrl,
      missing: rendered.missing,
      children: rendered.children,
      overflow: hasContainerOverflow(rendered.children, subreportX, subreportY, component.width, height),
      style: buildBaseRenderStyle(component),
    };
  }

  return {
    id: component.id,
    type: component.type,
    x: options.x + component.x,
    y: options.y + component.y,
    width: component.width,
    height: component.height,
  };
}

function layoutTable(component: TableComponent, options: LayoutBandOptions): RenderComponentBox {
  const effective = resolveTableComponentStyle(component, options.styles ?? []);
  const tableRows = normalizeRenderableTableRows(effective);
  const columns = renderColumnsFromRows(effective.width, tableRows);
  const rows = buildSimpleTableRows(effective, tableRows, {
    rowsByBand: options.rowsByBand ?? {},
    pageRowsByBand: options.pageRowsByBand ?? {},
    context: options.context,
  });
  const tableHeight = Math.max(effective.height, tableRows.reduce((sum, row) => sum + (row.height ?? 8), 0));

  return {
    id: effective.id,
    type: 'table',
    x: options.x + effective.x,
    y: options.y + effective.y,
    width: effective.width,
    height: tableHeight,
    columns,
    rows,
    showBorder: effective.showBorder ?? false,
    style: buildTableRenderStyle(effective),
  };
}

function resolveTableComponentStyle(component: TableComponent, styles: ReportStyle[]): TableComponent {
  const resolved = resolveComponentStyle(component, styles);
  return {
    ...component,
    font: resolved.font,
    border: resolved.border,
    backgroundColor: resolved.backgroundColor,
    padding: resolved.padding,
    textAlign: resolved.textAlign,
    verticalAlign: resolved.verticalAlign,
    format: resolved.format,
  };
}

function buildBaseRenderStyle(component: ReportComponent) {
  const border = (component as { border?: BorderConfig }).border;
  const style = {
    backgroundColor: component.backgroundColor,
    border,
    padding: component.padding,
  };
  return Object.values(style).some(value => value !== undefined) ? style : undefined;
}

function buildTableRenderStyle(component: TableComponent) {
  const style = {
    backgroundColor: component.backgroundColor,
  };
  return Object.values(style).some(value => value !== undefined) ? style : undefined;
}

function normalizeRenderableTableRows(component: TableComponent): TableRow[] {
  const sourceRows = component.rows?.length
    ? component.rows
    : legacyRenderableTableRows(component);
  const columnCount = Math.max(
    1,
    sourceRows.reduce((count, row) => Math.max(count, renderableColumnCount(row)), 0),
    component.columnCount ?? 0,
  );
  return sourceRows.map((row, rowIndex) => ({
    ...row,
    id: row.id || `row_${rowIndex + 1}`,
    height: Math.max(0.1, row.height ?? component.rowHeight ?? 8),
    cells: normalizeRowCells(row, rowIndex, columnCount),
  }));
}

function renderableColumnCount(row: TableRow): number {
  return row.cells.reduce((count, cell, sourceIndex) => {
    const columnIndex = Number.isInteger(cell.column) && cell.column != null && cell.column >= 0
      ? cell.column
      : sourceIndex;
    return Math.max(count, columnIndex + Math.max(1, cell.colSpan ?? 1));
  }, row.cells.length);
}

function normalizeRowCells(row: TableRow, rowIndex: number, columnCount: number): TableCell[] {
  const positioned = new Map<number, TableCell>();
  row.cells.forEach((cell, sourceIndex) => {
    const columnIndex = Number.isInteger(cell.column) && cell.column != null && cell.column >= 0
      ? Math.min(cell.column, columnCount - 1)
      : sourceIndex;
    positioned.set(columnIndex, cell);
  });

  return Array.from({ length: columnCount }, (_, columnIndex) => ({
    id: positioned.get(columnIndex)?.id ?? `cell_${rowIndex + 1}_${columnIndex + 1}`,
    ...positioned.get(columnIndex),
  }));
}

function legacyRenderableTableRows(component: TableComponent): TableRow[] {
  const columnCount = Math.max(1, component.columnCount ?? component.columns?.length ?? 3);
  const rowCount = Math.max(1, component.rowCount ?? 1);
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    return {
      id: `row_${rowIndex + 1}`,
      height: component.rowHeight ?? 8,
      cells: Array.from({ length: columnCount }, (_, columnIndex) => {
        const cell = component.cells?.find(item => (item.row ?? 0) === rowIndex && (item.column ?? 0) === columnIndex);
        const column = component.columns?.[columnIndex];
        return {
          id: `cell_${rowIndex + 1}_${columnIndex + 1}`,
          ...cell,
          text: cell?.text ?? (column?.field ? `{${column.field}}` : undefined),
          width: cell?.width ?? column?.width,
        };
      }),
    };
  });
}

function renderColumnsFromRows(tableWidth: number, rows: TableRow[]): TableComponent['columns'] {
  const firstRow = rows[0] ?? { cells: [] };
  const widths = resolveRenderRowWidths(firstRow, tableWidth);
  return widths.map((width, index) => ({
    id: `col_${index + 1}`,
    header: `Column ${index + 1}`,
    field: '',
    width,
    cellType: 'text' as const,
  }));
}

function resolveRenderRowWidths(row: TableRow, rowWidth: number): number[] {
  const fixed = row.cells.reduce((sum, cell) => sum + (cell.width ?? 0), 0);
  const autoCount = row.cells.filter(cell => cell.width == null).length;
  const autoWidth = autoCount > 0 ? Math.max(0, rowWidth - fixed) / autoCount : 0;
  return row.cells.map(cell => Math.round((cell.width ?? autoWidth) * 10) / 10);
}

function buildSimpleTableRows(
  component: TableComponent,
  rows: TableRow[],
  options: {
    rowsByBand: Record<string, Record<string, unknown>[]>;
    pageRowsByBand: Record<string, Record<string, unknown>[]>;
    context: RenderContext;
  },
): RenderTable['rows'] {
  const covered = new Set<string>();
  return rows.map((row, rowIndex) => {
    const renderedRow: RenderTable['rows'][number] = [];
    row.cells.forEach((cell, columnIndex) => {
      if (covered.has(`${rowIndex}-${columnIndex}`)) return;
      const rowSpan = Math.max(1, Math.min(cell.rowSpan ?? 1, rows.length - rowIndex));
      const colSpan = Math.max(1, Math.min(cell.colSpan ?? 1, row.cells.length - columnIndex));
      markCoveredCells(covered, rowIndex, columnIndex, rowSpan, colSpan);
      renderedRow.push({
        row: rowIndex,
        column: columnIndex,
        content: tableCellContent({
          cell,
          column: { id: `col_${columnIndex + 1}`, header: '', field: '', width: 0, cellType: 'text' },
          context: options.context,
          rowsByBand: options.rowsByBand,
          pageRowsByBand: options.pageRowsByBand,
        }),
        rowSpan,
        colSpan,
        height: row.height ?? 8,
        style: resolvedRenderTableCellStyle(component, row, cell, rowIndex, columnIndex),
      });
    });
    return renderedRow;
  });
}

function resolvedRenderTableCellStyle(
  component: TableComponent,
  row: TableRow,
  cell: TableCell,
  rowIndex: number,
  columnIndex: number,
): RenderTable['rows'][number][number]['style'] {
  const rowStyle = row.style ?? {};
  const cellStyle = cell.style ?? {};
  const border = cell.border
    ?? cellStyle.border
    ?? row.border
    ?? rowStyle.border
    ?? component.border;
  const style: TableStyle = {
    backgroundColor: cell.backgroundColor ?? cellStyle.backgroundColor ?? row.backgroundColor ?? rowStyle.backgroundColor ?? component.backgroundColor,
    font: mergeTableFonts(component.font, rowStyle.font, row.font, cellStyle.font, cell.font),
    border: collapsedRenderBorder(border, rowIndex, columnIndex),
    padding: cell.padding ?? cellStyle.padding ?? row.padding ?? rowStyle.padding ?? component.padding,
    textAlign: cell.textAlign ?? cellStyle.textAlign ?? row.textAlign ?? rowStyle.textAlign ?? component.textAlign,
    verticalAlign: cell.verticalAlign ?? cellStyle.verticalAlign ?? row.verticalAlign ?? rowStyle.verticalAlign ?? component.verticalAlign,
    format: cell.format ?? cellStyle.format ?? row.format ?? rowStyle.format ?? component.format,
  };
  return Object.values(style).some(value => value !== undefined) ? style : undefined;
}

function mergeTableFonts(...fonts: Array<Partial<FontConfig> | undefined>): FontConfig | undefined {
  const merged = fonts.reduce<Partial<FontConfig>>((next, font) => {
    if (!font) return next;
    Object.entries(font).forEach(([key, value]) => {
      if (value !== undefined) {
        next[key as keyof FontConfig] = value as never;
      }
    });
    return next;
  }, {});
  return Object.keys(merged).length > 0 ? merged as FontConfig : undefined;
}

function collapsedRenderBorder(border: BorderConfig | undefined, rowIndex: number, columnIndex: number): BorderConfig | undefined {
  if (!border || border.style === 'none' || !border.width) return undefined;
  return {
    ...border,
    sides: {
      top: rowIndex === 0 && Boolean(border.sides.top),
      left: columnIndex === 0 && Boolean(border.sides.left),
      right: Boolean(border.sides.right),
      bottom: Boolean(border.sides.bottom),
    },
  };
}

function layoutChart(component: ChartComponent, options: LayoutBandOptions): RenderComponentBox {
  const chartX = options.x + component.x;
  const chartY = options.y + component.y;
  const rows = resolveChartRows(component, options);
  const sortedRows = applyChartSort(rows, component.binding?.sort ?? [], options.context);
  const aggregate = component.binding?.aggregate ?? 'none';
  const data = buildChartData(component, sortedRows, aggregate, options);

  return {
    id: component.id,
    type: 'chart',
    x: chartX,
    y: chartY,
    width: component.width,
    height: component.height,
    chartType: component.chartType,
    data,
    rawData: sortedRows,
    binding: component.binding ?? { dimensions: [], measures: [], aggregate: 'none', sort: [] },
    title: component.appearance?.title,
    subtitle: component.appearance?.subtitle,
    showLegend: component.appearance?.showLegend ?? true,
    legendPosition: component.appearance?.legendPosition ?? 'bottom',
    showAxes: component.appearance?.showAxes ?? true,
    showGrid: component.appearance?.showGrid ?? true,
    showLabels: component.appearance?.showLabels ?? false,
    labelType: component.appearance?.labelType,
    axisTitleX: component.appearance?.axisTitleX,
    axisTitleY: component.appearance?.axisTitleY,
    axisLabelRotation: component.appearance?.axisLabelRotation,
    titleConfig: component.title,
    legendConfig: component.legend,
    axesConfig: component.axes,
    labelsConfig: component.labels,
    theme: component.theme ?? component.appearance?.theme,
    markStyle: component.appearance?.markStyle,
    plotOptions: component.plotOptions,
    aggregate,
    emptyMessage: component.emptyMessage ?? 'No data',
    style: buildBaseRenderStyle(component),
  };
}

function resolveChartRows(component: ChartComponent, options: LayoutBandOptions): Record<string, unknown>[] {
  const binding = component.binding;
  const dataSourceId = binding?.dataSourceId;
  if (binding?.arrayPath && options.context.row) {
    const nested = asRecordArray(valueAtPath(options.context.row, binding.arrayPath));
    if (nested.length > 0) return nested;
  }
  if (!dataSourceId) {
    return options.context.row ? [options.context.row] : [];
  }
  if (dataSourceId === options.context.dataSourceId && options.context.row) {
    return [options.context.row];
  }
  return options.context.rowsByBand?.[dataSourceId] ?? options.rowsByBand?.[dataSourceId] ?? [];
}

function applyChartSort(rows: Record<string, unknown>[], sort: Array<{ field: string; direction: 'asc' | 'desc' }>, context: RenderContext): Record<string, unknown>[] {
  if (sort.length === 0) return rows;
  return [...rows].sort((left, right) => {
    for (const rule of sort) {
      const leftValue = resolveChartExpressionValue(rule.field, left, context);
      const rightValue = resolveChartExpressionValue(rule.field, right, context);
      const order = compareChartValues(leftValue, rightValue);
      if (order !== 0) {
        return rule.direction === 'desc' ? -order : order;
      }
    }
    return 0;
  });
}

function buildChartData(component: ChartComponent, rows: Record<string, unknown>[], aggregate: ChartAggregateMode, options: LayoutBandOptions): ChartDataPoint[] {
  const dimField = component.binding?.dimensions?.[0]?.field;
  const meaField = component.binding?.measures?.[0]?.field;
  const seriesField = component.binding?.seriesField;
  const labelField = component.binding?.labelField;
  const isScatter = component.chartType === 'scatter';

  const points: ChartDataPoint[] = rows.map((row) => {
    if (isScatter) {
      const xDim = component.binding?.dimensions?.[0]?.field;
      const yMea = component.binding?.measures?.[0]?.field;
      const x = resolveNumber(row[xDim ?? '']);
      const y = resolveNumber(row[yMea ?? '']);
      const series = seriesField ? String(row[seriesField] ?? '') : undefined;
      return {
        category: x == null ? '' : String(x),
        value: y,
        series: series || undefined,
        label: labelField ? String(row[labelField] ?? '') : (x == null ? undefined : String(x)),
        x, y,
        raw: row,
      };
    }
    const category = dimField ? row[dimField] : undefined;
    const value = meaField ? resolveNumber(row[meaField]) : null;
    const series = seriesField ? String(row[seriesField] ?? '') : undefined;
    const label = labelField ? String(row[labelField] ?? '') : (category == null ? undefined : String(category));
    return {
      category: category == null ? '' : String(category),
      value,
      series: series || undefined,
      label,
      x: null,
      y: value,
      raw: row,
    };
  });

  if (aggregate === 'none') return points;
  return aggregateChartPoints(points, isScatter, aggregate);
}

function aggregateChartPoints(points: ChartDataPoint[], isScatter: boolean, aggregate: ChartAggregateMode): ChartDataPoint[] {
  const grouped = new Map<string, { point: ChartDataPoint; values: number[]; count: number }>();
  for (const point of points) {
    const key = isScatter
      ? `${point.x ?? point.category}::${point.series ?? ''}`
      : `${point.category}::${point.series ?? ''}`;
    const entry = grouped.get(key);
    if (!entry) {
      grouped.set(key, { point, values: point.value == null ? [] : [point.value], count: 1 });
      continue;
    }
    entry.count += 1;
    if (point.value != null) entry.values.push(point.value);
  }
  return Array.from(grouped.values()).map(({ point, values, count }) => {
    const value = aggregateValues(values, count, aggregate);
    return { ...point, value, y: point.x == null ? value : (point.y ?? value), x: point.x ?? null };
  });
}

function aggregateValues(values: number[], count: number, aggregate: ChartAggregateMode): number | null {
  if (aggregate === 'count') return count;
  if (values.length === 0) return null;
  if (aggregate === 'min') return Math.min(...values);
  if (aggregate === 'max') return Math.max(...values);
  if (aggregate === 'avg') return values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + value, 0);
}

function resolveChartExpressionValue(expression: string, row: Record<string, unknown>, context: RenderContext): unknown {
  if (!expression) return undefined;
  try {
    return evalExpression(
      expression,
      (source, field) => resolveFieldForChart(row, context, source, field),
      context.rowIndex,
      expressionVariables(context, { row }),
      new AggregateRuntime({ rowsByBand: context.rowsByBand ?? {}, pageRowsByBand: {}, defaultDataSourceId: context.dataSourceId }),
      context.expressionFunctions,
    );
  } catch {
    return expression;
  }
}

function resolveFieldForChart(row: Record<string, unknown>, context: RenderContext, source: string, field: string): unknown {
  if (['Parameter', 'Parameters', 'Params'].includes(source)) {
    return context.parameters?.[field];
  }
  if (!source && context.parameters && field in context.parameters) {
    return context.parameters[field];
  }
  if (!source && context.expressionVariables && field in context.expressionVariables) {
    return context.expressionVariables[field];
  }
  const scoped = row[source];
  if (scoped && typeof scoped === 'object' && !Array.isArray(scoped)) {
    return (scoped as Record<string, unknown>)[field];
  }
  return row[field] ?? row[`${source}.${field}`] ?? context.groupValues[field];
}

function compareChartValues(left: unknown, right: unknown): number {
  if (left == null && right == null) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }
  return String(left).localeCompare(String(right));
}

function resolveNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function valueAtPath(row: Record<string, unknown> | undefined, path: string): unknown {
  return path.split('.').filter(Boolean).reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, row);
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : [];
}

function createSubreportPlaceholder(component: SubreportComponent, x: number, y: number): RenderComponentBox {
  return {
    id: `${component.id}-missing-placeholder`,
    type: 'text',
    x,
    y,
    width: component.width,
    height: component.height,
    content: `Missing subreport: ${component.templateUrl}`,
  };
}

function hasContainerOverflow(children: RenderComponentBox[], x: number, y: number, width: number, height: number): boolean {
  return children.some(child => (
    Boolean(child.overflow)
    || child.x < x
    || child.y < y
    || child.x + child.width > x + width
    || child.y + child.height > y + height
  ));
}

function markCoveredCells(covered: Set<string>, row: number, column: number, rowSpan: number, colSpan: number): void {
  for (let coveredRow = row; coveredRow < row + rowSpan; coveredRow += 1) {
    for (let coveredColumn = column; coveredColumn < column + colSpan; coveredColumn += 1) {
      if (coveredRow === row && coveredColumn === column) continue;
      covered.add(`${coveredRow}-${coveredColumn}`);
    }
  }
}

function tableCellContent(options: {
  cell?: TableCell;
  column: NonNullable<TableComponent['columns']>[number];
  context: RenderContext;
  rowsByBand: Record<string, Record<string, unknown>[]>;
  pageRowsByBand: Record<string, Record<string, unknown>[]>;
}): string {
  if (options.cell?.text) {
    const value = resolveTableCellText(options.cell.text, options.context, options.rowsByBand, options.pageRowsByBand);
    return formatValue(value, options.cell.format);
  }
  if (!options.column.field) {
    return '';
  }
  const value = options.context.row?.[options.column.field] ?? options.context.row?.[`${options.context.dataSourceId}.${options.column.field}`];
  return formatValue(value, options.cell?.format);
}

function resolveTableCellText(
  text: string,
  context: RenderContext,
  rowsByBand: Record<string, Record<string, unknown>[]>,
  pageRowsByBand: Record<string, Record<string, unknown>[]>,
): unknown {
  if (text.includes('{PageNumber}') || text.includes('{TotalPages}')) {
    return text;
  }

  if (!text.includes('{') && !text.includes('(') && !text.includes('=')) {
    return text;
  }

  try {
    return evalExpression(
      text,
      (source, field) => resolveField(context, source, field),
      context.rowIndex,
      expressionVariables(context),
      new AggregateRuntime({ rowsByBand: context.rowsByBand ?? rowsByBand, pageRowsByBand, defaultDataSourceId: context.dataSourceId }),
      context.expressionFunctions,
    );
  } catch {
    return resolveTemplateValue(text, context, rowsByBand, pageRowsByBand);
  }
}

function resolveTemplateBoolean(
  value: string,
  context: RenderContext,
  rowsByBand: Record<string, Record<string, unknown>[]>,
  pageRowsByBand: Record<string, Record<string, unknown>[]>,
): boolean {
  const resolved = resolveTemplateValue(value, context, rowsByBand, pageRowsByBand).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(resolved)) return true;
  if (['false', '0', 'no', 'n', ''].includes(resolved)) return false;
  return Boolean(resolved);
}

function pageNumberContent(format: PageNumberComponent['format']): string {
  switch (format) {
    case '1':
      return '{PageNumber}';
    case 'Page 1':
      return 'Page {PageNumber}';
    case 'Page 1 of N':
      return 'Page {PageNumber} of {TotalPages}';
    case '1/N':
    default:
      return '{PageNumber}/{TotalPages}';
  }
}

function formatDateTime(date: Date, pattern: string): string {
  const parts: Record<string, string> = {
    yyyy: String(date.getFullYear()).padStart(4, '0'),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    dd: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0'),
  };
  return pattern.replace(/yyyy|MM|dd|HH|mm|ss/g, token => parts[token] ?? token);
}

function resolveText(
  component: TextComponent,
  context: RenderContext,
  rowsByBand: Record<string, Record<string, unknown>[]>,
  pageRowsByBand: Record<string, Record<string, unknown>[]>,
  execution?: EventExecutionState,
): string {
  if (execution?.hasValue) {
    return formatValue(execution.value, component.format);
  }

  if (component.text.includes('{PageNumber}') || component.text.includes('{TotalPages}')) {
    return component.text;
  }

  if (!component.text.includes('{') && !component.text.includes('(') && !component.text.includes('=')) {
    return component.text;
  }

  try {
    const value = evalExpression(
      component.text,
      (source, field) => resolveField(context, source, field),
      context.rowIndex,
      expressionVariables(context),
      new AggregateRuntime({ rowsByBand: context.rowsByBand ?? rowsByBand, pageRowsByBand, defaultDataSourceId: context.dataSourceId }),
      context.expressionFunctions,
    );
    return formatValue(value, component.format);
  } catch {
    return resolveTemplateValue(component.text, context, rowsByBand, pageRowsByBand);
  }
}

function resolveRichText(
  component: RichtextComponent,
  context: RenderContext,
  rowsByBand: Record<string, Record<string, unknown>[]>,
  pageRowsByBand: Record<string, Record<string, unknown>[]>,
): string {
  return resolveTemplateValue(component.html, context, rowsByBand, pageRowsByBand);
}

function resolveTemplateValue(
  value: string,
  context: RenderContext,
  rowsByBand: Record<string, Record<string, unknown>[]>,
  pageRowsByBand: Record<string, Record<string, unknown>[]>,
): string {
  if (!value.includes('{') && !value.includes('(') && !value.includes('=')) {
    return value;
  }

  const runtime = new AggregateRuntime({ rowsByBand: context.rowsByBand ?? rowsByBand, pageRowsByBand, defaultDataSourceId: context.dataSourceId });
  const evaluateTextExpression = (expression: string): string => {
    const result = evalExpression(
      expression,
      (source, field) => resolveField(context, source, field),
      context.rowIndex,
      expressionVariables(context),
      runtime,
      context.expressionFunctions,
    );
    return result == null ? '' : String(result);
  };

  const placeholderPattern = /\{([^{}]+)\}/g;
  const isSinglePlaceholder = value.trim().match(/^\{([^{}]+)\}$/);

  const withFunctions = replaceEmbeddedFunctionCalls(value, (expression) => {
    try {
      return evaluateTextExpression(expression);
    } catch {
      return expression;
    }
  });

  if (withFunctions !== value) {
    return resolveTemplateValue(withFunctions, context, rowsByBand, pageRowsByBand);
  }

  if (!isSinglePlaceholder && placeholderPattern.test(value)) {
    return value.replace(/\{([^{}]+)\}/g, (match, expressionBody) => {
      try {
        return evaluateTextExpression(`{${expressionBody}}`);
      } catch {
        return match;
      }
    });
  }

  try {
    return evaluateTextExpression(value);
  } catch {
    return value;
  }
}

function replaceEmbeddedFunctionCalls(value: string, replace: (expression: string) => string): string {
  let output = '';
  let index = 0;

  while (index < value.length) {
    const start = findNextFunctionStart(value, index);
    if (start < 0) {
      output += value.slice(index);
      break;
    }

    const end = findFunctionCallEnd(value, start);
    if (end < 0) {
      output += value.slice(index);
      break;
    }

    output += value.slice(index, start);
    output += replace(value.slice(start, end));
    index = end;
  }

  return output;
}

function findNextFunctionStart(value: string, from: number): number {
  for (let index = from; index < value.length; index += 1) {
    if (!isIdentifierStart(value[index])) {
      continue;
    }

    const previous = index > 0 ? value[index - 1] : '';
    if (isIdentifierPart(previous)) {
      continue;
    }

    let cursor = index + 1;
    while (cursor < value.length && isIdentifierPart(value[cursor])) {
      cursor += 1;
    }

    if (value[cursor] === '(') {
      return index;
    }
  }

  return -1;
}

function findFunctionCallEnd(value: string, start: number): number {
  const open = value.indexOf('(', start);
  if (open < 0) return -1;

  let depth = 0;
  let inString = false;
  let inFieldRef = false;

  for (let index = open; index < value.length; index += 1) {
    const char = value[index];
    const previous = index > 0 ? value[index - 1] : '';

    if (inString) {
      if (char === '"' && previous !== '\\') {
        inString = false;
      }
      continue;
    }

    if (inFieldRef) {
      if (char === '}') {
        inFieldRef = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      inFieldRef = true;
      continue;
    }

    if (char === '(') {
      depth += 1;
      continue;
    }

    if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
  }

  return -1;
}

function isIdentifierStart(char: string | undefined): boolean {
  return Boolean(char && /[A-Za-z_]/.test(char));
}

function isIdentifierPart(char: string | undefined): boolean {
  return Boolean(char && /[A-Za-z0-9_.]/.test(char));
}

function resolveTextComponentStyle(component: TextComponent, styles: ReportStyle[]): TextComponent {
  const resolved = resolveTextStyle(component, styles);
  return {
    ...component,
    font: resolved.font,
    border: resolved.border,
    backgroundColor: resolved.backgroundColor,
    textAlign: resolved.textAlign,
    verticalAlign: resolved.verticalAlign,
    padding: resolved.padding,
    format: resolved.format,
    canGrow: resolved.canGrow,
    canShrink: resolved.canShrink,
  };
}

function applyTextConditionalFormats(component: TextComponent, sourceComponent: ReportComponent, options: LayoutBandOptions) {
  const baseStyle = {
    font: component.font,
    background: component.backgroundColor,
    border: component.border,
    padding: component.padding,
    textAlign: component.textAlign,
    verticalAlign: component.verticalAlign,
    format: component.format,
    canGrow: component.canGrow,
    canShrink: component.canShrink,
    enabled: true,
  };

  return applyConditionalFormatsToStyle(baseStyle, options.conditionalFormats ?? [], sourceComponent, {
    resolveField: (source, field) => resolveField(options.context, source, field),
    rowIndex: options.context.rowIndex,
    variables: expressionVariables(options.context),
    functions: options.context.expressionFunctions,
    reportRuntime: new AggregateRuntime({
      rowsByBand: options.context.rowsByBand ?? options.rowsByBand ?? {},
      pageRowsByBand: options.pageRowsByBand ?? {},
      defaultDataSourceId: options.context.dataSourceId,
    }),
  });
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

  if (source === 'Group' || source === 'Groups') {
    return context.groupValues[field];
  }

  const row = context.row ?? {};
  const scoped = row[source];
  if (scoped && typeof scoped === 'object' && !Array.isArray(scoped)) {
    return (scoped as Record<string, unknown>)[field];
  }

  return row[field] ?? row[`${source}.${field}`] ?? context.groupValues[field];
}
