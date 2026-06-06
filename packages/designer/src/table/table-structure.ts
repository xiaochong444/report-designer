import type { BorderConfig, Padding, TableCell, TableComponent, TableRow, TableStyle } from '@report-designer/core';

const MIN_TABLE_ROWS = 1;
const MIN_TABLE_COLUMNS = 1;
const DEFAULT_ROW_HEIGHT = 8;
const DEFAULT_TABLE_WIDTH = 90;

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

function rowId(index: number): string {
  return `row_${index + 1}`;
}

function cellId(row: number, column: number): string {
  return `cell_${row + 1}_${column + 1}`;
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

function makeCell(rowIndex: number, columnIndex: number, overrides: Partial<TableCell> = {}): TableCell {
  return {
    id: overrides.id ?? cellId(rowIndex, columnIndex),
    ...overrides,
  };
}

function makeRow(rowIndex: number, columnCount: number, overrides: Partial<TableRow> = {}): TableRow {
  return {
    id: overrides.id ?? rowId(rowIndex),
    height: overrides.height ?? DEFAULT_ROW_HEIGHT,
    role: overrides.role ?? 'normal',
    ...overrides,
    cells: Array.from({ length: columnCount }, (_, columnIndex) => makeCell(rowIndex, columnIndex, overrides.cells?.[columnIndex] ?? {})),
  };
}

function inferColumnCount(table: TableComponent): number {
  const rowCellCount = table.rows?.reduce((count, row) => Math.max(count, row.cells.length), 0) ?? 0;
  const oldColumnCount = table.columnCount ?? table.columns?.length ?? 0;
  const oldCellCount = table.cells?.reduce((count, cell) => Math.max(count, (cell.column ?? 0) + 1), 0) ?? 0;
  return Math.max(MIN_TABLE_COLUMNS, rowCellCount, oldColumnCount, oldCellCount, 3);
}

function inferRowCount(table: TableComponent): number {
  const oldCellCount = table.cells?.reduce((count, cell) => Math.max(count, (cell.row ?? 0) + 1), 0) ?? 0;
  return Math.max(MIN_TABLE_ROWS, table.rows?.length ?? 0, table.rowCount ?? 0, oldCellCount, 1);
}

function legacyRows(table: TableComponent, rowCount: number, columnCount: number): TableRow[] {
  const headerRows = Math.max(0, Math.min(rowCount, table.headerRowsCount ?? 0));
  const footerRows = Math.max(0, Math.min(rowCount - headerRows, table.footerRowsCount ?? 0));
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    const role: TableRow['role'] = rowIndex < headerRows
      ? 'header'
      : rowIndex >= rowCount - footerRows
        ? 'footer'
        : 'normal';
    const height = role === 'header'
      ? table.headerHeight ?? table.rowHeight ?? DEFAULT_ROW_HEIGHT
      : table.rowHeight ?? DEFAULT_ROW_HEIGHT;
    const cells = Array.from({ length: columnCount }, (_, columnIndex) => {
      const legacyCell = table.cells?.find(cell => (cell.row ?? 0) === rowIndex && (cell.column ?? 0) === columnIndex);
      const column = table.columns?.[columnIndex];
      const text = legacyCell?.text
        ?? (role === 'header' ? column?.header : role === 'normal' && column?.field ? `{${column.field}}` : undefined);
      return makeCell(rowIndex, columnIndex, {
        ...legacyCell,
        row: undefined,
        column: undefined,
        text,
        width: legacyCell?.width ?? column?.width,
      });
    });
    return makeRow(rowIndex, columnCount, { height, role, cells });
  });
  return rows;
}

function normalizeRows(table: TableComponent, rowCount: number, columnCount: number): TableRow[] {
  const sourceRows = table.rows?.length ? table.rows : legacyRows(table, rowCount, columnCount);
  const rows: TableRow[] = sourceRows.slice(0, rowCount).map((row, rowIndex) => {
    const cells = row.cells.slice(0, columnCount).map((cell, columnIndex) => makeCell(rowIndex, columnIndex, {
      ...cell,
      row: undefined,
      column: undefined,
    }));
    while (cells.length < columnCount) {
      cells.push(makeCell(rowIndex, cells.length));
    }
    return {
      ...row,
      id: row.id || rowId(rowIndex),
      height: normalizePositiveMm(row.height, DEFAULT_ROW_HEIGHT),
      role: row.role ?? 'normal',
      cells,
    };
  });
  while (rows.length < rowCount) {
    rows.push(makeRow(rows.length, columnCount));
  }
  return rows;
}

export interface TableStructureUpdate {
  rowCount?: number;
  columnCount?: number;
  headerRowsCount?: number;
  footerRowsCount?: number;
  headerHeight?: number;
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

export function getTableColumnCount(table: TableComponent): number {
  return normalizeTable(table).rows?.[0]?.cells.length ?? MIN_TABLE_COLUMNS;
}

export function getTableRowCount(table: TableComponent): number {
  return normalizeTable(table).rows?.length ?? MIN_TABLE_ROWS;
}

export function normalizeTable(table: TableComponent): TableComponent {
  const columnCount = normalizePositive(table.columnCount, inferColumnCount(table));
  const rowCount = normalizePositive(table.rowCount, inferRowCount(table));
  const rows = normalizeRows(table, rowCount, columnCount);
  const height = rows.reduce((sum, row) => sum + (row.height ?? DEFAULT_ROW_HEIGHT), 0);

  return {
    ...table,
    width: normalizePositiveMm(table.width, DEFAULT_TABLE_WIDTH),
    height: normalizePositiveMm(table.height, height),
    rows,
    rowCount: rows.length,
    columnCount,
    cells: undefined,
    columns: undefined,
    headerRowsCount: undefined,
    footerRowsCount: undefined,
    headerHeight: undefined,
    rowHeight: undefined,
    dataSource: undefined,
    binding: undefined,
    showBorder: table.showBorder ?? false,
    canBreak: table.canBreak ?? true,
  };
}

export function setTableStructure(table: TableComponent, structure: TableStructureUpdate): TableComponent {
  const normalized = normalizeTable(table);
  const rowCount = normalizePositive(structure.rowCount, normalized.rows?.length ?? MIN_TABLE_ROWS);
  const columnCount = normalizePositive(structure.columnCount, normalized.rows?.[0]?.cells.length ?? MIN_TABLE_COLUMNS);
  const rows = structure.rows ?? normalizeRows(normalized, rowCount, columnCount);
  return normalizeTable({
    ...normalized,
    ...('canBreak' in structure ? { canBreak: structure.canBreak } : {}),
    ...('showBorder' in structure ? { showBorder: structure.showBorder } : {}),
    rowCount,
    columnCount,
    rows,
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

export function insertTableColumn(table: TableComponent, afterColumn?: number): TableComponent {
  const normalized = normalizeTable(table);
  const columnCount = normalized.rows![0]?.cells.length ?? MIN_TABLE_COLUMNS;
  const index = Math.min(Math.max(afterColumn ?? columnCount - 1, -1), columnCount - 1);
  const rows = normalized.rows!.map((row, rowIndex) => {
    const cells = [...row.cells];
    cells.splice(index + 1, 0, makeCell(rowIndex, index + 1));
    return { ...row, cells: cells.map((cell, columnIndex) => ({ ...cell, id: cell.id || cellId(rowIndex, columnIndex) })) };
  });
  return normalizeTable({ ...normalized, rows, columnCount: columnCount + 1 });
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

export function insertTableRow(table: TableComponent, afterRow?: number): TableComponent {
  const normalized = normalizeTable(table);
  const rowCount = normalized.rows!.length;
  const columnCount = normalized.rows![0]?.cells.length ?? MIN_TABLE_COLUMNS;
  const index = Math.min(Math.max(afterRow ?? rowCount - 1, -1), rowCount - 1);
  const source = normalized.rows![Math.max(0, index)] ?? makeRow(0, columnCount);
  const row = makeRow(index + 1, columnCount, {
    height: source.height,
    role: source.role,
    style: clone(source.style),
    backgroundColor: clone(source.backgroundColor),
    font: clone(source.font),
    border: clone(source.border),
    padding: clone(source.padding),
    textAlign: clone(source.textAlign),
    verticalAlign: clone(source.verticalAlign),
    format: clone(source.format),
  });
  const rows = [...normalized.rows!];
  rows.splice(index + 1, 0, row);
  return normalizeTable({ ...normalized, rows, rowCount: rowCount + 1 });
}

export function deleteTableRow(table: TableComponent, rowIndex?: number): TableComponent {
  const normalized = normalizeTable(table);
  if (normalized.rows!.length <= MIN_TABLE_ROWS) return normalized;
  const index = Math.min(Math.max(rowIndex ?? normalized.rows!.length - 1, 0), normalized.rows!.length - 1);
  return normalizeTable({ ...normalized, rows: normalized.rows!.filter((_, nextIndex) => nextIndex !== index) });
}

export function setTableCellWidth(table: TableComponent, row: number, column: number, width: number | undefined): TableComponent {
  return updateTableCell(table, row, column, cell => ({
    ...cell,
    width: width == null ? undefined : normalizePositiveMm(width, 1),
  }));
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

export function mergeTableCellRange(table: TableComponent, startRow: number, startColumn: number, endRow: number, endColumn: number): TableComponent {
  const normalized = normalizeTable(table);
  const top = Math.max(0, Math.min(startRow, endRow));
  const left = Math.max(0, Math.min(startColumn, endColumn));
  const bottom = Math.min(normalized.rows!.length - 1, Math.max(startRow, endRow));
  const right = Math.min((normalized.rows![top]?.cells.length ?? 1) - 1, Math.max(startColumn, endColumn));
  if (top > bottom || left > right) return normalized;
  return updateTableCell(normalized, top, left, cell => ({
    ...cell,
    rowSpan: bottom - top + 1,
    colSpan: right - left + 1,
  }));
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

export function equalizeTableColumns(table: TableComponent): TableComponent {
  const normalized = normalizeTable(table);
  const rows = normalized.rows!.map(row => ({
    ...row,
    cells: row.cells.map(cell => {
      const { width: _width, ...next } = cell;
      return next;
    }),
  }));
  return normalizeTable({ ...normalized, rows });
}

export function equalizeTableRows(table: TableComponent): TableComponent {
  const normalized = normalizeTable(table);
  const height = roundMm(normalized.height / Math.max(MIN_TABLE_ROWS, normalized.rows!.length));
  return normalizeTable({
    ...normalized,
    rows: normalized.rows!.map(row => ({ ...row, height })),
  });
}

export function resolveTableRowCellWidths(row: TableRow, rowWidth: number): number[] {
  const fixed = row.cells.reduce((sum, cell) => sum + (cell.width ?? 0), 0);
  const autoCount = row.cells.filter(cell => cell.width == null).length;
  const autoWidth = autoCount > 0 ? Math.max(0, rowWidth - fixed) / autoCount : 0;
  return row.cells.map(cell => roundMm(cell.width ?? autoWidth));
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
