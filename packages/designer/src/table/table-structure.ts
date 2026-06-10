import {
  equalizeTableColumns as coreEqualizeTableColumns,
  insertTableColumn as coreInsertTableColumn,
  insertTableRow as coreInsertTableRow,
  mergeTableCellRange as coreMergeTableCellRange,
  normalizeTable as coreNormalizeTable,
  resolveTableRowCellWidths as coreResolveTableRowCellWidths,
  setTableCellText as coreSetTableCellText,
  setTableCellWidth as coreSetTableCellWidth,
} from '@report-designer/core';
import type { BorderConfig, Padding, TableCell, TableComponent, TableRow, TableStyle } from '@report-designer/core';

const MIN_TABLE_ROWS = 1;
const MIN_TABLE_COLUMNS = 1;
const DEFAULT_ROW_HEIGHT = 8;

function roundMm(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizePositive(value: number | undefined, fallback: number): number {
  const next = Number.isFinite(value) ? Math.round(value as number) : fallback;
  return Math.max(1, next);
}

function normalizePositiveMm(value: number | undefined, fallback: number): number {
  const next = Number.isFinite(value) ? roundMm(value as number) : fallback;
  return Math.max(0.1, next);
}

function clone<T>(value: T): T {
  if (value === undefined || value === null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function styleFromTable(table: TableComponent): TableStyle {
  return cleanStyle({
    backgroundColor: table.backgroundColor,
    font: table.font,
    border: table.border,
    padding: table.padding,
    textAlign: table.textAlign,
    verticalAlign: table.verticalAlign,
    format: table.format,
  });
}

function styleFromRow(row: TableRow): TableStyle {
  return cleanStyle({
    ...row.style,
    backgroundColor: row.backgroundColor ?? row.style?.backgroundColor,
    font: row.font ?? row.style?.font,
    border: row.border ?? row.style?.border,
    padding: row.padding ?? row.style?.padding,
    textAlign: row.textAlign ?? row.style?.textAlign,
    verticalAlign: row.verticalAlign ?? row.style?.verticalAlign,
    format: row.format ?? row.style?.format,
  });
}

function styleFromCell(cell: TableCell): TableStyle {
  return cleanStyle({
    ...cell.style,
    backgroundColor: cell.backgroundColor ?? cell.style?.backgroundColor,
    font: cell.font ?? cell.style?.font,
    border: cell.border ?? cell.style?.border,
    padding: cell.padding ?? cell.style?.padding,
    textAlign: cell.textAlign ?? cell.style?.textAlign,
    verticalAlign: cell.verticalAlign ?? cell.style?.verticalAlign,
    format: cell.format ?? cell.style?.format,
  });
}

function cleanStyle(style: TableStyle): TableStyle {
  const next: TableStyle = {};
  for (const key of Object.keys(style) as Array<keyof TableStyle>) {
    const value = style[key];
    if (value !== undefined) {
      next[key] = clone(value) as never;
    }
  }
  return next;
}

function applyStyleToCell(cell: TableCell, style: TableCellStyleClipboard): TableCell {
  return {
    ...cell,
    backgroundColor: clone(style.backgroundColor),
    font: clone(style.font),
    border: clone(style.border),
    padding: clone(style.padding),
    textAlign: clone(style.textAlign),
    verticalAlign: clone(style.verticalAlign),
    format: clone(style.format),
  };
}

function omitCellStyle(cell: TableCell): TableCell {
  const next = { ...cell };
  delete next.backgroundColor;
  delete next.font;
  delete next.border;
  delete next.padding;
  delete next.textAlign;
  delete next.verticalAlign;
  delete next.format;
  delete next.style;
  return next;
}

export interface TableStructureUpdate {
  rowCount?: number;
  columnCount?: number;
  rowHeight?: number;
  canBreak?: boolean;
  showBorder?: boolean;
  dataSource?: string;
  rows?: TableRow[];
}

export type TableRowUpdate = Partial<Omit<TableRow, 'id' | 'cells'>>;

export type TableCellStyleClipboard = Pick<TableCell,
  'backgroundColor' | 'font' | 'border' | 'padding' | 'textAlign' | 'verticalAlign' | 'format'
>;

export interface ResolvedTableCellLayout {
  rowIndex: number;
  columnIndex: number;
  cell: TableCell;
  x: number;
  y: number;
  width: number;
  height: number;
  style: TableStyle;
  border: BorderConfig | undefined;
}

export const normalizeTable = coreNormalizeTable;
export const insertTableColumn = coreInsertTableColumn;
export const insertTableRow = coreInsertTableRow;
export const mergeTableCellRange = coreMergeTableCellRange;
export const setTableCellText = coreSetTableCellText;
export const setTableCellWidth = coreSetTableCellWidth;
export const equalizeTableColumns = coreEqualizeTableColumns;
export const resolveTableRowCellWidths = coreResolveTableRowCellWidths;

export function getTableColumnCount(table: TableComponent): number {
  return normalizeTable(table).rows?.[0]?.cells.length ?? MIN_TABLE_COLUMNS;
}

export function getTableRowCount(table: TableComponent): number {
  return normalizeTable(table).rows?.length ?? MIN_TABLE_ROWS;
}

export function setTableStructure(table: TableComponent, structure: TableStructureUpdate): TableComponent {
  const normalized = normalizeTable(table);
  const rowCount = normalizePositive(structure.rowCount, normalized.rows?.length ?? MIN_TABLE_ROWS);
  const columnCount = normalizePositive(structure.columnCount, normalized.rows?.[0]?.cells.length ?? MIN_TABLE_COLUMNS);
  return normalizeTable({
    ...normalized,
    ...('canBreak' in structure ? { canBreak: structure.canBreak } : {}),
    ...('showBorder' in structure ? { showBorder: structure.showBorder } : {}),
    rowCount,
    columnCount,
    ...(structure.rows !== undefined ? { rows: structure.rows } : {}),
  });
}

export function getTableCell(table: TableComponent, row: number, column: number): TableCell | undefined {
  return normalizeTable(table).rows?.[row]?.cells[column];
}

function updateTableCell(table: TableComponent, row: number, column: number, updater: (cell: TableCell) => TableCell): TableComponent {
  const normalized = normalizeTable(table);
  const rows = normalized.rows!.map((nextRow, rowIndex) => rowIndex !== row
    ? nextRow
    : {
        ...nextRow,
        cells: nextRow.cells.map((cell, columnIndex) => columnIndex === column ? updater(cell) : cell),
      });
  return normalizeTable({ ...normalized, rows });
}

export function deleteTableColumn(table: TableComponent, columnIndex?: number): TableComponent {
  const normalized = normalizeTable(table);
  const columnCount = normalized.rows![0]?.cells.length ?? MIN_TABLE_COLUMNS;
  if (columnCount <= MIN_TABLE_COLUMNS) return normalized;
  const index = Math.min(Math.max(columnIndex ?? columnCount - 1, 0), columnCount - 1);
  const rows = normalized.rows!.map(row => ({
    ...row,
    cells: row.cells.filter((_, cellIndex) => cellIndex !== index),
  }));
  return normalizeTable({ ...normalized, rows, columnCount: columnCount - 1 });
}

export function deleteTableRow(table: TableComponent, rowIndex?: number): TableComponent {
  const normalized = normalizeTable(table);
  if (normalized.rows!.length <= MIN_TABLE_ROWS) return normalized;
  const index = Math.min(Math.max(rowIndex ?? normalized.rows!.length - 1, 0), normalized.rows!.length - 1);
  return normalizeTable({ ...normalized, rows: normalized.rows!.filter((_, nextIndex) => nextIndex !== index) });
}

export function updateTableRow(table: TableComponent, row: number, updates: TableRowUpdate): TableComponent {
  const normalized = normalizeTable(table);
  const rows = normalized.rows!.map((nextRow, rowIndex) => {
    if (rowIndex !== row) return nextRow;
    return {
      ...nextRow,
      ...updates,
      height: updates.height === undefined
        ? nextRow.height
        : normalizePositiveMm(updates.height, nextRow.height ?? DEFAULT_ROW_HEIGHT),
    };
  });
  return normalizeTable({ ...normalized, rows });
}

export function mergeTableCellRight(table: TableComponent, row: number, column: number): TableComponent {
  const normalized = normalizeTable(table);
  const columnCount = normalized.rows![row]?.cells.length ?? 0;
  if (row < 0 || row >= normalized.rows!.length || column < 0 || column >= columnCount - 1) return normalized;
  return updateTableCell(normalized, row, column, cell => ({ ...cell, rowSpan: 1, colSpan: Math.min((cell.colSpan ?? 1) + 1, columnCount - column) }));
}

export function splitTableCell(table: TableComponent, row: number, column: number): TableComponent {
  return updateTableCell(table, row, column, cell => ({ ...cell, rowSpan: 1, colSpan: 1 }));
}

export function clearTableCell(table: TableComponent, row: number, column: number): TableComponent {
  return updateTableCell(table, row, column, cell => {
    const { text: _text, ...next } = cell;
    return next;
  });
}

export function copyTableCellStyle(table: TableComponent, row: number, column: number): TableCellStyleClipboard | null {
  const cell = getTableCell(table, row, column);
  if (!cell) return null;
  return cleanStyle(styleFromCell(cell)) as TableCellStyleClipboard;
}

export function clearTableCellStyle(table: TableComponent, row: number, column: number): TableComponent {
  return updateTableCell(table, row, column, omitCellStyle);
}

export function pasteTableCellStyle(table: TableComponent, row: number, column: number, style: TableCellStyleClipboard | null): TableComponent {
  if (!style) return normalizeTable(table);
  return updateTableCell(table, row, column, cell => applyStyleToCell(cell, style));
}

export function equalizeTableRows(table: TableComponent): TableComponent {
  const normalized = normalizeTable(table);
  const height = roundMm(normalized.height / Math.max(MIN_TABLE_ROWS, normalized.rows!.length));
  return normalizeTable({
    ...normalized,
    rows: normalized.rows!.map(row => ({ ...row, height })),
  });
}

export function resolveTableCellStyle(table: TableComponent, row: TableRow, cell: TableCell): TableStyle {
  return cleanStyle({
    ...styleFromTable(table),
    ...styleFromRow(row),
    ...styleFromCell(cell),
  });
}

export function resolveCollapsedCellBorder(table: TableComponent, row: TableRow, cell: TableCell, rowIndex: number, columnIndex: number): BorderConfig | undefined {
  const style = resolveTableCellStyle(table, row, cell);
  const border = style.border;
  if (!border || border.style === 'none' || !border.width) return undefined;
  return {
    ...border,
    sides: {
      top: rowIndex === 0 ? Boolean(border.sides.top) : false,
      left: columnIndex === 0 ? Boolean(border.sides.left) : false,
      right: Boolean(border.sides.right),
      bottom: Boolean(border.sides.bottom),
    },
  };
}

export function layoutTableCells(table: TableComponent): ResolvedTableCellLayout[] {
  const normalized = normalizeTable(table);
  const layouts: ResolvedTableCellLayout[] = [];
  let y = 0;
  normalized.rows!.forEach((row, rowIndex) => {
    const widths = resolveTableRowCellWidths(row, normalized.width);
    let x = 0;
    row.cells.forEach((cell, columnIndex) => {
      const width = widths[columnIndex];
      const style = resolveTableCellStyle(normalized, row, cell);
      layouts.push({
        rowIndex,
        columnIndex,
        cell,
        x: roundMm(x),
        y: roundMm(y),
        width,
        height: row.height ?? DEFAULT_ROW_HEIGHT,
        style,
        border: resolveCollapsedCellBorder(normalized, row, cell, rowIndex, columnIndex),
      });
      x += width;
    });
    y += row.height ?? DEFAULT_ROW_HEIGHT;
  });
  return layouts;
}
