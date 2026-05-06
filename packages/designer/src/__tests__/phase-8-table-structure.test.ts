import { describe, expect, it } from 'vitest';
import type { TableComponent } from '@report-designer/core';
import {
  clearTableCell,
  equalizeTableColumns,
  equalizeTableRows,
  mergeTableCellRight,
  splitTableCell,
} from '../table/table-structure';

function baseTable(): TableComponent {
  return {
    id: 'table-1',
    type: 'table',
    x: 0,
    y: 0,
    width: 90,
    height: 30,
    dataSource: 'employees',
    columns: [
      { id: 'c1', header: 'Name', field: 'name', width: 10, cellType: 'text' },
      { id: 'c2', header: 'Title', field: 'title', width: 20, cellType: 'text' },
      { id: 'c3', header: 'Team', field: 'team', width: 60, cellType: 'text' },
    ],
    rowCount: 3,
    columnCount: 3,
    headerRowsCount: 1,
    footerRowsCount: 0,
    canBreak: true,
    cells: [{ row: 1, column: 1, text: 'Subtotal' }],
    headerHeight: 8,
    rowHeight: 8,
    showBorder: true,
  };
}

describe('Phase 8 table structure helpers', () => {
  it('merges the active cell with the right neighbor and keeps it inside the table grid', () => {
    const table = mergeTableCellRight(baseTable(), 1, 1);

    expect(table.cells).toContainEqual({ row: 1, column: 1, text: 'Subtotal', rowSpan: 1, colSpan: 2 });
    expect(mergeTableCellRight(baseTable(), 1, 2).cells).not.toContainEqual(
      expect.objectContaining({ row: 1, column: 2, colSpan: 2 }),
    );
  });

  it('splits a merged cell back to a normal cell', () => {
    const table = splitTableCell(mergeTableCellRight(baseTable(), 1, 1), 1, 1);

    expect(table.cells).toContainEqual({ row: 1, column: 1, text: 'Subtotal', rowSpan: 1, colSpan: 1 });
  });

  it('clears cell text without deleting the cell span metadata', () => {
    const table = clearTableCell(mergeTableCellRight(baseTable(), 1, 1), 1, 1);

    expect(table.cells).toContainEqual({ row: 1, column: 1, rowSpan: 1, colSpan: 2 });
  });

  it('equalizes table column widths and row height from the component bounds', () => {
    expect(equalizeTableColumns(baseTable()).columns.map(column => column.width)).toEqual([30, 30, 30]);
    expect(equalizeTableRows(baseTable()).rowHeight).toBe(10);
  });
});
