import type {
  BarcodeComponent,
  BarcodeFormat,
  CheckboxComponent,
  ComponentType,
  ImageComponent,
  PanelComponent,
  QRCodeComponent,
  ReportComponent,
  RichtextComponent,
  TableCell,
  TableComponent,
  TextComponent,
} from '../template-model/types';
import {
  insertTableColumn,
  insertTableRow,
  mergeTableCellRange,
  normalizeTable,
  setTableCellText,
  setTableCellWidth,
} from '../table/table-structure';
import { setComponentProperty } from './event-template';

export type EventComponentBounds = Partial<Pick<ReportComponent, 'x' | 'y' | 'width' | 'height'>>;

export interface EventComponentHandle<TComponent extends ReportComponent = ReportComponent> {
  readonly component: TComponent;
  readonly id: string;
  readonly name: string | undefined;
  readonly type: TComponent['type'];
  setProperty(path: string, value: unknown): this;
  getProperty(path: string): unknown;
  setBounds(bounds: EventComponentBounds): this;
  show(): this;
  hide(): this;
}

export interface EventTextComponentHandle extends EventComponentHandle<TextComponent> {
  setText(text: string): this;
  bindText(expression: string): this;
}

export interface EventImageComponentHandle extends EventComponentHandle<ImageComponent> {
  setSource(src: string): this;
}

export interface EventBarcodeComponentHandle extends EventComponentHandle<BarcodeComponent> {
  setValue(value: string): this;
  setFormat(format: BarcodeFormat): this;
}

export interface EventQRCodeComponentHandle extends EventComponentHandle<QRCodeComponent> {
  setValue(value: string): this;
}

export interface EventCheckboxComponentHandle extends EventComponentHandle<CheckboxComponent> {
  setChecked(checked: string | boolean): this;
  setLabel(label: string): this;
}

export interface EventRichtextComponentHandle extends EventComponentHandle<RichtextComponent> {
  setHtml(html: string): this;
}

export interface EventTableCellMatch {
  row: number;
  column: number;
  cell: TableCell;
}

export interface EventTableComponentHandle extends EventComponentHandle<TableComponent> {
  readonly rowCount: number;
  readonly columnCount: number;
  findCellText(text: string): EventTableCellMatch | undefined;
  ensureColumnCount(columnCount: number): this;
  ensureRowCount(rowCount: number): this;
  insertColumnsAfter(afterColumn: number, count?: number): this;
  insertRowsAfter(afterRow: number, count?: number): this;
  setCellText(row: number, column: number, text: string): this;
  setCell(row: number, column: number, cell: Partial<TableCell>): this;
  mergeCells(row: number, column: number, rowSpan: number, colSpan: number): this;
  setColumnWidth(column: number, width: number | undefined): this;
  distributeColumns(startColumn?: number, count?: number): this;
}

export type EventBaseComponentFactory = (name: string) => EventComponentHandle;
export type EventTextComponentFactory = (name: string) => EventTextComponentHandle;
export type EventImageComponentFactory = (name: string) => EventImageComponentHandle;
export type EventTableComponentFactory = (name: string) => EventTableComponentHandle;
export type EventBarcodeComponentFactory = (name: string) => EventBarcodeComponentHandle;
export type EventQRCodeComponentFactory = (name: string) => EventQRCodeComponentHandle;
export type EventCheckboxComponentFactory = (name: string) => EventCheckboxComponentHandle;
export type EventRichtextComponentFactory = (name: string) => EventRichtextComponentHandle;
export type EventTypedComponentFactory = (name: string) => EventComponentHandle;

export interface EventComponentHelperFamily {
  component: EventBaseComponentFactory;
  text: EventTextComponentFactory;
  image: EventImageComponentFactory;
  table: EventTableComponentFactory;
  barcode: EventBarcodeComponentFactory;
  qrcode: EventQRCodeComponentFactory;
  checkbox: EventCheckboxComponentFactory;
  richtext: EventRichtextComponentFactory;
  chart: EventTypedComponentFactory;
  line: EventTypedComponentFactory;
  shape: EventTypedComponentFactory;
  pageNumber: EventTypedComponentFactory;
  dateTime: EventTypedComponentFactory;
  panel: EventTypedComponentFactory;
}

export interface CreateEventComponentHelpersOptions {
  getComponentByName(name: string): ReportComponent | undefined;
}

export function createEventComponentHelpers(options: CreateEventComponentHelpersOptions): EventComponentHelperFamily {
  const resolve = (name: string): ReportComponent => {
    const component = options.getComponentByName(name);
    if (!component) {
      throw new Error(`Component "${name}" was not found.`);
    }
    return component;
  };

  const typed = <TComponent extends ReportComponent>(name: string, type: ComponentType): TComponent => {
    const component = resolve(name);
    if (component.type !== type) {
      throw new Error(`Component "${name}" is type "${component.type}", expected "${type}".`);
    }
    return component as TComponent;
  };

  return {
    component: (name) => createBaseHandle(resolve(name)),
    text: (name) => createTextHandle(typed<TextComponent>(name, 'text')),
    image: (name) => createImageHandle(typed<ImageComponent>(name, 'image')),
    table: (name) => createTableHandle(typed<TableComponent>(name, 'table')),
    barcode: (name) => createBarcodeHandle(typed<BarcodeComponent>(name, 'barcode')),
    qrcode: (name) => createQRCodeHandle(typed<QRCodeComponent>(name, 'qrcode')),
    checkbox: (name) => createCheckboxHandle(typed<CheckboxComponent>(name, 'checkbox')),
    richtext: (name) => createRichtextHandle(typed<RichtextComponent>(name, 'richtext')),
    chart: (name) => createBaseHandle(typed(name, 'chart')),
    line: (name) => createBaseHandle(typed(name, 'line')),
    shape: (name) => createBaseHandle(typed(name, 'shape')),
    pageNumber: (name) => createBaseHandle(typed(name, 'pagenumber')),
    dateTime: (name) => createBaseHandle(typed(name, 'datetime')),
    panel: (name) => createBaseHandle(typed<PanelComponent>(name, 'panel')),
  };
}

export function createBaseHandle<TComponent extends ReportComponent>(component: TComponent): EventComponentHandle<TComponent> {
  const handle = {
    component,
    get id() {
      return component.id;
    },
    get name() {
      return component.name;
    },
    get type() {
      return component.type;
    },
    setProperty(path: string, value: unknown) {
      setComponentProperty(component, path, value);
      return this;
    },
    getProperty(path: string): unknown {
      return getComponentProperty(component, path);
    },
    setBounds(bounds: EventComponentBounds) {
      Object.assign(component, bounds);
      return this;
    },
    show() {
      component.visible = undefined;
      return this;
    },
    hide() {
      component.visible = 'false';
      return this;
    },
  };

  return handle as EventComponentHandle<TComponent>;
}

function createTextHandle(component: TextComponent): EventTextComponentHandle {
  return Object.assign(createBaseHandle(component), {
    setText(text: string) {
      component.text = text;
      return this;
    },
    bindText(expression: string) {
      component.text = expression;
      return this;
    },
  }) as EventTextComponentHandle;
}

function createImageHandle(component: ImageComponent): EventImageComponentHandle {
  return Object.assign(createBaseHandle(component), {
    setSource(src: string) {
      component.src = src;
      return this;
    },
  }) as EventImageComponentHandle;
}

function createBarcodeHandle(component: BarcodeComponent): EventBarcodeComponentHandle {
  return Object.assign(createBaseHandle(component), {
    setValue(value: string) {
      component.value = value;
      return this;
    },
    setFormat(format: BarcodeFormat) {
      component.format = format;
      return this;
    },
  }) as EventBarcodeComponentHandle;
}

function createQRCodeHandle(component: QRCodeComponent): EventQRCodeComponentHandle {
  return Object.assign(createBaseHandle(component), {
    setValue(value: string) {
      component.value = value;
      return this;
    },
  }) as EventQRCodeComponentHandle;
}

function createCheckboxHandle(component: CheckboxComponent): EventCheckboxComponentHandle {
  return Object.assign(createBaseHandle(component), {
    setChecked(checked: string | boolean) {
      component.checked = typeof checked === 'boolean' ? String(checked) : checked;
      return this;
    },
    setLabel(label: string) {
      component.label = label;
      return this;
    },
  }) as EventCheckboxComponentHandle;
}

function createRichtextHandle(component: RichtextComponent): EventRichtextComponentHandle {
  return Object.assign(createBaseHandle(component), {
    setHtml(html: string) {
      component.html = html;
      return this;
    },
  }) as EventRichtextComponentHandle;
}

function createTableHandle(component: TableComponent): EventTableComponentHandle {
  const handle = Object.assign(createBaseHandle(component), {
    get rowCount() {
      normalizeIntoComponent(component);
      return component.rowCount ?? 0;
    },
    get columnCount() {
      normalizeIntoComponent(component);
      return component.columnCount ?? 0;
    },
    findCellText(text: string): EventTableCellMatch | undefined {
      normalizeIntoComponent(component);
      for (let row = 0; row < (component.rows?.length ?? 0); row += 1) {
        const cells = component.rows?.[row]?.cells ?? [];
        for (let column = 0; column < cells.length; column += 1) {
          if (cells[column]?.text === text) {
            return { row, column, cell: cells[column] };
          }
        }
      }
      return undefined;
    },
    ensureColumnCount(columnCount: number) {
      while (this.columnCount < columnCount) {
        this.insertColumnsAfter(this.columnCount - 1, 1);
      }
      return this;
    },
    ensureRowCount(rowCount: number) {
      while (this.rowCount < rowCount) {
        this.insertRowsAfter(this.rowCount - 1, 1);
      }
      return this;
    },
    insertColumnsAfter(afterColumn: number, count = 1) {
      const safeCount = normalizeCount(count);
      for (let index = 0; index < safeCount; index += 1) {
        assignTable(component, insertTableColumn(component, afterColumn + index));
      }
      return this;
    },
    insertRowsAfter(afterRow: number, count = 1) {
      const safeCount = normalizeCount(count);
      for (let index = 0; index < safeCount; index += 1) {
        assignTable(component, insertTableRow(component, afterRow + index));
      }
      return this;
    },
    setCellText(row: number, column: number, text: string) {
      assignTable(component, setTableCellText(component, row, column, text));
      return this;
    },
    setCell(row: number, column: number, cell: Partial<TableCell>) {
      normalizeIntoComponent(component);
      const target = component.rows?.[row]?.cells[column];
      if (!target) {
        throw new Error(`Table cell at row ${row}, column ${column} was not found.`);
      }
      Object.assign(target, cell);
      assignTable(component, normalizeTable(component));
      return this;
    },
    mergeCells(row: number, column: number, rowSpan: number, colSpan: number) {
      const safeRowSpan = normalizeMergeSpan(rowSpan);
      const safeColSpan = normalizeMergeSpan(colSpan);
      assignTable(component, mergeTableCellRange(component, row, column, row + safeRowSpan - 1, column + safeColSpan - 1));
      return this;
    },
    setColumnWidth(column: number, width: number | undefined) {
      normalizeIntoComponent(component);
      for (let row = 0; row < (component.rows?.length ?? 0); row += 1) {
        assignTable(component, setTableCellWidth(component, row, column, width));
      }
      return this;
    },
    distributeColumns(startColumn = 0, count?: number) {
      normalizeIntoComponent(component);
      const safeStart = Math.max(0, startColumn);
      const columnCount = component.rows?.reduce((max, row) => Math.max(max, row.cells.length), component.columnCount ?? 0) ?? 0;
      const safeEnd = Math.min(columnCount, safeStart + normalizeCount(count ?? columnCount - safeStart));
      for (const row of component.rows ?? []) {
        for (let column = safeStart; column < safeEnd; column += 1) {
          if (row.cells[column]) {
            row.cells[column].width = undefined;
          }
        }
      }
      assignTable(component, normalizeTable(component));
      return this;
    },
  });

  return handle as EventTableComponentHandle;
}

function assignTable(component: TableComponent, next: TableComponent): void {
  Object.keys(component).forEach((key) => {
    delete (component as unknown as Record<string, unknown>)[key];
  });
  Object.assign(component, next);
}

function normalizeIntoComponent(component: TableComponent): void {
  assignTable(component, normalizeTable(component));
}

function normalizeCount(count: number): number {
  return Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
}

function normalizeMergeSpan(span: number): number {
  if (!Number.isFinite(span)) {
    throw new Error('Table cell merge span must be positive.');
  }

  const normalized = Math.floor(span);
  if (normalized <= 0) {
    throw new Error('Table cell merge span must be positive.');
  }

  return normalized;
}

function getComponentProperty(component: ReportComponent, path: string): unknown {
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) {
    throw new Error('Component property path is required.');
  }

  let target: unknown = component;
  for (const segment of segments) {
    if (Array.isArray(target)) {
      const index = parseArrayIndex(segment);
      if (index === undefined || index >= target.length) {
        throw new Error(`Cannot get component property path: ${path}`);
      }
      target = target[index];
      continue;
    }

    if (isRecord(target) && segment in target) {
      target = target[segment];
      continue;
    }

    throw new Error(`Cannot get component property path: ${path}`);
  }

  return target;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseArrayIndex(segment: string): number | undefined {
  if (!/^\d+$/.test(segment)) {
    return undefined;
  }

  return Number(segment);
}
