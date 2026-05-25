import { evalExpression } from '../expression-engine/evaluator';
import { AggregateRuntime } from '../aggregate-engine';
import type { RenderContext } from '../band-planner/band-plan';
import { createEventContext, runEventScript } from '../event-engine';
import type { EventLogCollector, EventMode, EventRuntimeState, EventExecutionState } from '../event-engine';
import type { RenderBandBox, RenderComponentBox } from '../render-document/types';
import type {
  Band,
  BarcodeComponent,
  CheckboxComponent,
  DateTimeComponent,
  ImageComponent,
  LineComponent,
  Page,
  PageNumberComponent,
  PanelComponent,
  BorderConfig,
  ReportComponent,
  ReportTemplate,
  ReportStyle,
  RichtextComponent,
  ShapeComponent,
  SubreportComponent,
  TableCell,
  TableComponent,
  TextComponent,
} from '../template-model/types';
import { formatValue } from '../text-format';
import { measureTextBox } from './measure';

export interface LayoutBandOptions {
  x: number;
  y: number;
  width: number;
  context: RenderContext;
  rowsByBand?: Record<string, Record<string, unknown>[]>;
  pageRowsByBand?: Record<string, Record<string, unknown>[]>;
  styles?: ReportStyle[];
  renderSubreport?: (component: SubreportComponent, x: number, y: number, context: RenderContext) => { children: RenderComponentBox[]; missing: boolean; height?: number };
  eventRuntime?: LayoutEventRuntime;
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

export function layoutBand(band: Band, options: LayoutBandOptions): RenderBandBox {
  const components = band.components
    .map((component) => layoutComponentWithEvents(component, band, options))
    .filter((component): component is RenderComponentBox => Boolean(component));
  const contentHeight = components.reduce((height, component) => Math.max(height, component.y - options.y + component.height), band.height);

  return {
    id: `${band.id}-${options.y}`,
    bandId: band.id,
    bandType: band.type,
    x: options.x,
    y: options.y,
    width: options.width,
    height: Math.max(band.height, contentHeight),
    components,
    overflow: components.some((component) => component.overflow),
  };
}

function layoutComponentWithEvents(component: ReportComponent, band: Band, options: LayoutBandOptions): RenderComponentBox | undefined {
  if (!isComponentRenderable(component, options)) {
    return undefined;
  }

  if (!options.eventRuntime) {
    return layoutComponent(component, band, options);
  }

  const execution: EventExecutionState = { canceled: false, hidden: false, hasValue: false };
  runComponentEvent(component, band, options, 'getValue', execution);
  runComponentEvent(component, band, options, 'beforePrint', execution);

  if (execution.hidden || execution.canceled) {
    return undefined;
  }

  const box = layoutComponent(component, band, options, execution);
  runComponentEvent(component, band, options, 'afterPrint', execution);
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
): RenderComponentBox {
  if (component.type === 'text') {
    const textComponent = component as TextComponent;
    const effective = resolveTextComponentStyle(textComponent, options.styles ?? []);
    const text = resolveText(textComponent, options.context, options.rowsByBand ?? {}, options.pageRowsByBand ?? {}, execution);
    const measured = measureTextBox(effective, text);
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
        font: effective.font,
        border: effective.border,
        backgroundColor: effective.backgroundColor,
        textAlign: effective.textAlign,
        verticalAlign: effective.verticalAlign,
        padding: effective.padding,
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

  if (component.type === 'checkbox') {
    const checkboxComponent = component as CheckboxComponent;
    return {
      id: component.id,
      type: 'checkbox',
      x: options.x + component.x,
      y: options.y + component.y,
      width: component.width,
      height: component.height,
      checked: resolveTemplateBoolean(checkboxComponent.checked, options.context, options.rowsByBand ?? {}, options.pageRowsByBand ?? {}),
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
  const columnCount = Math.max(1, component.columnCount ?? component.columns.length);
  const rowCount = Math.max(1, component.rowCount ?? 1);
  const columns = normalizeTableColumns(component, columnCount);
  const headerRowsCount = Math.max(0, Math.min(rowCount, component.headerRowsCount ?? 1));
  const footerRowsCount = Math.max(0, Math.min(rowCount - headerRowsCount, component.footerRowsCount ?? 0));
  const rows = buildTableRows(component, columns, {
    rowCount,
    headerRowsCount,
    footerRowsCount,
    rowsByBand: options.rowsByBand ?? {},
    pageRowsByBand: options.pageRowsByBand ?? {},
    context: options.context,
  });

  return {
    id: component.id,
    type: 'table',
    x: options.x + component.x,
    y: options.y + component.y,
    width: component.width,
    height: component.height,
    columns,
    rows,
    showBorder: component.showBorder,
    style: buildBaseRenderStyle(component),
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

function normalizeTableColumns(component: TableComponent, count: number): TableComponent['columns'] {
  const width = Math.round((component.width / Math.max(1, count)) * 10) / 10;
  return Array.from({ length: count }, (_, index) => {
    const column = component.columns[index];
    return {
      id: column?.id || `col_${index + 1}`,
      header: column?.header || `Column ${index + 1}`,
      field: column?.field || '',
      width: column?.width || width,
      cellType: column?.cellType || 'text',
    };
  });
}

function buildTableRows(
  component: TableComponent,
  columns: TableComponent['columns'],
  options: {
    rowCount: number;
    headerRowsCount: number;
    footerRowsCount: number;
    rowsByBand: Record<string, Record<string, unknown>[]>;
    pageRowsByBand: Record<string, Record<string, unknown>[]>;
    context: RenderContext;
  },
) {
  const sourceRows = tableSourceRows(component, options.context, options.rowsByBand);
  const covered = tableCoveredCells(component.cells, options.rowCount, columns.length);
  const rows = [];
  for (let row = 0; row < options.rowCount; row += 1) {
    const renderedRow = [];
    const isHeader = row < options.headerRowsCount;
    const isFooter = row >= options.rowCount - options.footerRowsCount;
    const detailIndex = Math.max(0, row - options.headerRowsCount);
    const rowContext: RenderContext = {
      ...options.context,
      row: sourceRows[detailIndex] ?? options.context.row,
      rowIndex: detailIndex,
      dataSourceId: component.dataSource || options.context.dataSourceId,
    };

    for (let column = 0; column < columns.length; column += 1) {
      if (covered.has(`${row}-${column}`)) continue;
      const customCell = component.cells?.find(cell => cell.row === row && cell.column === column);
      const rowSpan = Math.max(1, Math.min(customCell?.rowSpan ?? 1, options.rowCount - row));
      const colSpan = Math.max(1, Math.min(customCell?.colSpan ?? 1, columns.length - column));
      const content = tableCellContent({
        cell: customCell,
        column: columns[column],
        isHeader,
        isFooter,
        context: rowContext,
        rowsByBand: options.rowsByBand,
        pageRowsByBand: options.pageRowsByBand,
      });
      renderedRow.push({
        row,
        column,
        content,
        field: columns[column]?.field,
        rowSpan,
        colSpan,
        height: isHeader ? component.headerHeight : component.rowHeight,
        isHeader,
        isFooter,
        style: tableCellStyle(customCell),
      });
    }
    rows.push(renderedRow);
  }
  return rows;
}

function tableSourceRows(
  component: TableComponent,
  context: RenderContext,
  rowsByBand: Record<string, Record<string, unknown>[]>,
): Record<string, unknown>[] {
  if (component.dataSource) {
    return context.rowsByBand?.[component.dataSource] ?? rowsByBand[component.dataSource] ?? [];
  }
  return context.row ? [context.row] : [];
}

function tableCoveredCells(cells: TableCell[] | undefined, rowCount: number, columnCount: number): Set<string> {
  const covered = new Set<string>();
  for (const cell of cells ?? []) {
    const rowSpan = Math.max(1, Math.min(cell.rowSpan ?? 1, rowCount - cell.row));
    const colSpan = Math.max(1, Math.min(cell.colSpan ?? 1, columnCount - cell.column));
    for (let row = cell.row; row < cell.row + rowSpan; row += 1) {
      for (let column = cell.column; column < cell.column + colSpan; column += 1) {
        if (row === cell.row && column === cell.column) continue;
        covered.add(`${row}-${column}`);
      }
    }
  }
  return covered;
}

function tableCellContent(options: {
  cell?: TableCell;
  column: TableComponent['columns'][number];
  isHeader: boolean;
  isFooter: boolean;
  context: RenderContext;
  rowsByBand: Record<string, Record<string, unknown>[]>;
  pageRowsByBand: Record<string, Record<string, unknown>[]>;
}): string {
  if (options.cell?.text) {
    const value = resolveTemplateValue(options.cell.text, options.context, options.rowsByBand, options.pageRowsByBand);
    return formatValue(value, options.cell.format);
  }
  if (options.isHeader) {
    return options.column.header;
  }
  if (options.isFooter) {
    return '';
  }
  if (!options.column.field) {
    return '';
  }
  const value = options.context.row?.[options.column.field] ?? options.context.row?.[`${options.context.dataSourceId}.${options.column.field}`];
  return formatValue(value, options.cell?.format);
}

function tableCellStyle(cell?: TableCell) {
  if (!cell) return undefined;
  const style = {
    backgroundColor: cell.backgroundColor,
    border: cell.border,
    padding: cell.padding,
    textAlign: cell.textAlign,
    verticalAlign: cell.verticalAlign,
  };
  return Object.values(style).some(value => value !== undefined) ? style : undefined;
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
      { row: context.row, groupValues: context.groupValues },
      new AggregateRuntime({ rowsByBand: context.rowsByBand ?? rowsByBand, pageRowsByBand }),
    );
    return formatValue(value, component.format);
  } catch {
    return component.text;
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

  const placeholderPattern = /\{([^{}]+)\}/g;
  const isSinglePlaceholder = value.trim().match(/^\{([^{}]+)\}$/);
  if (!isSinglePlaceholder && placeholderPattern.test(value)) {
    return value.replace(/\{([^{}]+)\}/g, (match, expressionBody) => {
      try {
        const result = evalExpression(
          `{${expressionBody}}`,
          (source, field) => resolveField(context, source, field),
          context.rowIndex,
          { row: context.row, groupValues: context.groupValues },
          new AggregateRuntime({ rowsByBand: context.rowsByBand ?? rowsByBand, pageRowsByBand }),
        );
        return result == null ? '' : String(result);
      } catch {
        return match;
      }
    });
  }

  try {
    const result = evalExpression(
      value,
      (source, field) => resolveField(context, source, field),
      context.rowIndex,
      { row: context.row, groupValues: context.groupValues },
      new AggregateRuntime({ rowsByBand: context.rowsByBand ?? rowsByBand, pageRowsByBand }),
    );
    return result == null ? '' : String(result);
  } catch {
    return value;
  }
}

function resolveTextComponentStyle(component: TextComponent, styles: ReportStyle[]): TextComponent {
  const style = component.style ? styles.find(item => item.id === component.style) : undefined;
  if (!style) return component;

  return {
    ...component,
    font: {
      ...component.font,
      ...(style.font ?? {}),
    },
    border: {
      ...component.border,
      ...(style.border ?? {}),
      sides: {
        ...component.border.sides,
        ...(style.border?.sides ?? {}),
      },
    },
    backgroundColor: style.backgroundColor ?? component.backgroundColor,
  };
}

function resolveField(context: RenderContext, source: string, field: string): unknown {
  if (['Parameter', 'Parameters', 'Params'].includes(source)) {
    return context.parameters?.[field];
  }

  if (!source && context.parameters && field in context.parameters) {
    return context.parameters[field];
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
