import type { TableCell, TableColumn, TableComponent } from '@report-designer/core';

const MIN_TABLE_ROWS = 1;
const MIN_TABLE_COLUMNS = 1;

function columnId(index: number): string {
  return `col_${index + 1}`;
}

function normalizePositive(value: number | undefined, fallback: number): number {
  const next = Number.isFinite(value) ? Math.round(value as number) : fallback;
  return Math.max(1, next);
}

function createColumn(index: number, width: number): TableColumn {
  return {
    id: columnId(index),
    header: `Column ${index + 1}`,
    field: '',
    width,
    cellType: 'text',
  };
}

function resizeColumns(columns: TableColumn[], count: number, totalWidth: number): TableColumn[] {
  const safeCount = Math.max(MIN_TABLE_COLUMNS, count);
  const width = Math.round((totalWidth / safeCount) * 10) / 10;
  const next = columns.slice(0, safeCount).map((column, index) => ({
    ...column,
    id: column.id || columnId(index),
    header: column.header || `Column ${index + 1}`,
    width: column.width || width,
    cellType: column.cellType || 'text',
  }));

  while (next.length < safeCount) {
    next.push(createColumn(next.length, width));
  }

  return next;
}

function remapCellsForColumnInsert(cells: TableCell[] | undefined, index: number): TableCell[] | undefined {
  return cells?.map(cell => cell.column > index ? { ...cell, column: cell.column + 1 } : cell);
}

function remapCellsForColumnDelete(cells: TableCell[] | undefined, index: number): TableCell[] | undefined {
  return cells
    ?.filter(cell => cell.column !== index)
    .map(cell => cell.column > index ? { ...cell, column: cell.column - 1 } : cell);
}

function remapCellsForRowInsert(cells: TableCell[] | undefined, index: number): TableCell[] | undefined {
  return cells?.map(cell => cell.row > index ? { ...cell, row: cell.row + 1 } : cell);
}

function remapCellsForRowDelete(cells: TableCell[] | undefined, index: number): TableCell[] | undefined {
  return cells
    ?.filter(cell => cell.row !== index)
    .map(cell => cell.row > index ? { ...cell, row: cell.row - 1 } : cell);
}

export function getTableColumnCount(table: TableComponent): number {
  return normalizePositive(table.columnCount, table.columns?.length || MIN_TABLE_COLUMNS);
}

export function getTableRowCount(table: TableComponent): number {
  return normalizePositive(table.rowCount, 3);
}

export function normalizeTable(table: TableComponent): TableComponent {
  const columnCount = getTableColumnCount(table);
  const rowCount = getTableRowCount(table);
  const headerRowsCount = Math.max(0, Math.min(rowCount, table.headerRowsCount ?? 1));
  const footerRowsCount = Math.max(0, Math.min(rowCount - headerRowsCount, table.footerRowsCount ?? 0));

  return {
    ...table,
    columns: resizeColumns(table.columns || [], columnCount, table.width),
    columnCount,
    rowCount,
    headerRowsCount,
    footerRowsCount,
    canBreak: table.canBreak ?? true,
    cells: table.cells?.filter(cell => cell.row < rowCount && cell.column < columnCount),
  };
}

export function setTableStructure(table: TableComponent, structure: {
  rowCount?: number;
  columnCount?: number;
  headerRowsCount?: number;
  footerRowsCount?: number;
  canBreak?: boolean;
  showBorder?: boolean;
  dataSource?: string;
}): TableComponent {
  const normalized = normalizeTable(table);
  const rowCount = normalizePositive(structure.rowCount, normalized.rowCount ?? 3);
  const columnCount = normalizePositive(structure.columnCount, normalized.columnCount ?? normalized.columns.length);
  const headerRowsCount = Math.max(0, Math.min(rowCount, structure.headerRowsCount ?? normalized.headerRowsCount ?? 1));
  const footerRowsCount = Math.max(0, Math.min(rowCount - headerRowsCount, structure.footerRowsCount ?? normalized.footerRowsCount ?? 0));

  return normalizeTable({
    ...normalized,
    ...('canBreak' in structure ? { canBreak: structure.canBreak } : {}),
    ...('showBorder' in structure ? { showBorder: structure.showBorder } : {}),
    ...('dataSource' in structure ? { dataSource: structure.dataSource || '' } : {}),
    columns: resizeColumns(normalized.columns, columnCount, normalized.width),
    columnCount,
    rowCount,
    headerRowsCount,
    footerRowsCount,
  });
}

export function insertTableColumn(table: TableComponent, afterColumn?: number): TableComponent {
  const normalized = normalizeTable(table);
  const index = Math.min(Math.max(afterColumn ?? normalized.columns.length - 1, -1), normalized.columns.length - 1);
  const columns = [...normalized.columns];
  columns.splice(index + 1, 0, createColumn(index + 1, normalized.width / (normalized.columns.length + 1)));

  return normalizeTable({
    ...normalized,
    columns,
    columnCount: columns.length,
    cells: remapCellsForColumnInsert(normalized.cells, index),
  });
}

export function deleteTableColumn(table: TableComponent, columnIndex?: number): TableComponent {
  const normalized = normalizeTable(table);
  if (normalized.columns.length <= MIN_TABLE_COLUMNS) return normalized;
  const index = Math.min(Math.max(columnIndex ?? normalized.columns.length - 1, 0), normalized.columns.length - 1);
  const columns = normalized.columns.filter((_, i) => i !== index);

  return normalizeTable({
    ...normalized,
    columns,
    columnCount: columns.length,
    cells: remapCellsForColumnDelete(normalized.cells, index),
  });
}

export function insertTableRow(table: TableComponent, afterRow?: number): TableComponent {
  const normalized = normalizeTable(table);
  const index = Math.min(Math.max(afterRow ?? normalized.rowCount! - 1, -1), normalized.rowCount! - 1);
  return normalizeTable({
    ...normalized,
    rowCount: normalized.rowCount! + 1,
    cells: remapCellsForRowInsert(normalized.cells, index),
  });
}

export function deleteTableRow(table: TableComponent, rowIndex?: number): TableComponent {
  const normalized = normalizeTable(table);
  if (normalized.rowCount! <= MIN_TABLE_ROWS) return normalized;
  const index = Math.min(Math.max(rowIndex ?? normalized.rowCount! - 1, 0), normalized.rowCount! - 1);
  return normalizeTable({
    ...normalized,
    rowCount: normalized.rowCount! - 1,
    cells: remapCellsForRowDelete(normalized.cells, index),
  });
}
