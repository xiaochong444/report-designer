import type { TableCell, TableComponent, TableRow } from '../template-model/types';

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
  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const height = table.rowHeight ?? DEFAULT_ROW_HEIGHT;
    const cells = Array.from({ length: columnCount }, (_, columnIndex) => {
      const legacyCell = table.cells?.find(cell => (cell.row ?? 0) === rowIndex && (cell.column ?? 0) === columnIndex);
      const column = table.columns?.[columnIndex];
      const text = legacyCell?.text
        ?? (column?.field ? `{${column.field}}` : undefined);
      return makeCell(rowIndex, columnIndex, {
        ...legacyCell,
        row: undefined,
        column: undefined,
        text,
        width: legacyCell?.width ?? column?.width,
      });
    });
    return makeRow(rowIndex, columnCount, { height, cells });
  });
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
      cells,
    };
  });
  while (rows.length < rowCount) {
    rows.push(makeRow(rows.length, columnCount));
  }
  return rows;
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
    rowHeight: undefined,
    dataSource: undefined,
    binding: undefined,
    showBorder: table.showBorder ?? false,
    canBreak: table.canBreak ?? true,
  };
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

export function insertTableRow(table: TableComponent, afterRow?: number): TableComponent {
  const normalized = normalizeTable(table);
  const rowCount = normalized.rows!.length;
  const columnCount = normalized.rows![0]?.cells.length ?? MIN_TABLE_COLUMNS;
  const index = Math.min(Math.max(afterRow ?? rowCount - 1, -1), rowCount - 1);
  const source = normalized.rows![Math.max(0, index)] ?? makeRow(0, columnCount);
  const row = makeRow(index + 1, columnCount, {
    height: source.height,
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

export function setTableCellText(table: TableComponent, row: number, column: number, text: string): TableComponent {
  return updateTableCell(table, row, column, cell => ({ ...cell, text }));
}

export function setTableCellWidth(table: TableComponent, row: number, column: number, width: number | undefined): TableComponent {
  return updateTableCell(table, row, column, cell => ({
    ...cell,
    width: width == null ? undefined : normalizePositiveMm(width, 1),
  }));
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

export function resolveTableRowCellWidths(row: TableRow, rowWidth: number): number[] {
  const fixed = row.cells.reduce((sum, cell) => sum + (cell.width ?? 0), 0);
  const autoCount = row.cells.filter(cell => cell.width == null).length;
  const autoWidth = autoCount > 0 ? Math.max(0, rowWidth - fixed) / autoCount : 0;
  return row.cells.map(cell => roundMm(cell.width ?? autoWidth));
}
