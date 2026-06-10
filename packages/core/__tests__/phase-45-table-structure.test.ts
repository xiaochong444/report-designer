import { describe, expect, it } from 'vitest';
import type { TableComponent } from '../src';
import {
  equalizeTableColumns,
  insertTableColumn,
  insertTableRow,
  mergeTableCellRange,
  normalizeTable,
  resolveTableRowCellWidths,
  setTableCellText,
  setTableCellWidth,
} from '../src';

function legacyTable(): TableComponent {
  return {
    id: 'table-1',
    type: 'table',
    x: 0,
    y: 0,
    width: 90,
    height: 24,
    dataSource: 'orders',
    columns: [
      { id: 'col-1', header: 'Name', field: 'name', width: 20, cellType: 'text' },
      { id: 'col-2', header: 'Qty', field: 'qty', width: 30, cellType: 'text' },
      { id: 'col-3', header: 'Amount', field: 'amount', width: 40, cellType: 'text' },
    ],
    rowCount: 2,
    columnCount: 3,
    rowHeight: 8,
    cells: [
      { row: 0, column: 1, text: 'Quantity' },
      { row: 1, column: 2, text: 'Subtotal' },
    ],
  };
}

describe('phase 45 table structure helpers', () => {
  it('normalizes legacy column and cell tables into a row model', () => {
    const table = normalizeTable(legacyTable());

    expect(table.rows).toHaveLength(2);
    expect(table.rowCount).toBe(2);
    expect(table.columnCount).toBe(3);
    expect(table.rows?.[0].height).toBe(8);
    expect(table.rows?.[0].cells.map(cell => cell.text)).toEqual(['{name}', 'Quantity', '{amount}']);
    expect(table.rows?.[1].cells.map(cell => cell.width)).toEqual([20, 30, 40]);
    expect(table.cells).toBeUndefined();
    expect(table.columns).toBeUndefined();
    expect(table.dataSource).toBeUndefined();
    expect(table.binding).toBeUndefined();
    expect(table.canBreak).toBe(true);
    expect(table.showBorder).toBe(false);
  });

  it('inserts a column after the selected column while preserving existing cells', () => {
    const table = insertTableColumn(normalizeTable(legacyTable()), 0);

    expect(table.columnCount).toBe(4);
    expect(table.rows?.[0].cells.map(cell => cell.text)).toEqual(['{name}', undefined, 'Quantity', '{amount}']);
    expect(table.rows?.[1].cells.map(cell => cell.text)).toEqual(['{name}', undefined, '{qty}', 'Subtotal']);
  });

  it('inserts a row after the selected row and copies row-level presentation', () => {
    const source = normalizeTable({
      ...legacyTable(),
      rows: [
        { id: 'row-1', height: 9, backgroundColor: '#eeeeee', cells: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] },
      ],
      rowCount: 1,
    });

    const table = insertTableRow(source, 0);

    expect(table.rowCount).toBe(2);
    expect(table.rows?.[1]).toMatchObject({ height: 9, backgroundColor: '#eeeeee' });
    expect(table.rows?.[1].cells).toHaveLength(3);
  });

  it('merges a clamped cell range from any drag direction', () => {
    const table = mergeTableCellRange(normalizeTable(legacyTable()), 5, 5, 0, 1);

    expect(table.rows?.[0].cells[1]).toMatchObject({ text: 'Quantity', rowSpan: 2, colSpan: 2 });
  });

  it('sets cell text and cell width without mutating unrelated cells', () => {
    const withText = setTableCellText(legacyTable(), 1, 1, 'Total');
    const withWidth = setTableCellWidth(withText, 1, 1, 25.44);

    expect(withWidth.rows?.[1].cells[1]).toMatchObject({ text: 'Total', width: 25.4 });
    expect(withWidth.rows?.[1].cells[2]).toMatchObject({ text: 'Subtotal', width: 40 });
  });

  it('clears explicit column widths and resolves remaining widths from table width', () => {
    const fixed = setTableCellWidth(legacyTable(), 0, 0, 45);
    const equalized = equalizeTableColumns(fixed);

    expect(equalized.rows?.[0].cells.map(cell => cell.width)).toEqual([undefined, undefined, undefined]);
    expect(resolveTableRowCellWidths(fixed.rows![0], fixed.width)).toEqual([45, 30, 40]);
    expect(resolveTableRowCellWidths(equalized.rows![0], equalized.width)).toEqual([30, 30, 30]);
  });
});
