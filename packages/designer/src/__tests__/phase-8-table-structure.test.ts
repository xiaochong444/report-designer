import { describe, expect, it } from 'vitest';
import type { TableComponent } from '@report-designer/core';
import {
  clearTableCell,
  equalizeTableColumns,
  equalizeTableRows,
  insertTableColumn,
  layoutTableCells,
  mergeTableCellRight,
  resolveTableCellStyle,
  resolveTableRowCellWidths,
  setTableCellWidth,
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
    canBreak: true,
    showBorder: true,
    border: { style: 'solid', width: 0.2, color: '#9ca3af', sides: { top: true, right: true, bottom: true, left: true } },
    rows: [
      { id: 'row-1', height: 8, cells: [{ id: 'c1', text: 'Name' }, { id: 'c2', text: 'Title' }, { id: 'c3', text: 'Team' }] },
      { id: 'row-2', height: 8, cells: [{ id: 'c4' }, { id: 'c5', text: 'Subtotal' }, { id: 'c6' }] },
      { id: 'row-3', height: 8, cells: [{ id: 'c7' }, { id: 'c8' }, { id: 'c9' }] },
    ],
  };
}

describe('Phase 8 table structure helpers', () => {
  it('keeps cells auto-sized by default and only fixes the dragged left cell width', () => {
    const table = setTableCellWidth(baseTable(), 0, 0, 40);

    expect(table.rows?.[0].cells.map(cell => cell.width)).toEqual([40, undefined, undefined]);
    expect(resolveTableRowCellWidths(table.rows![0], table.width)).toEqual([40, 25, 25]);
  });

  it('inserts a column without rewriting existing row widths', () => {
    const table = insertTableColumn(setTableCellWidth(baseTable(), 0, 0, 40), 0);

    expect(table.rows?.[0].cells.map(cell => cell.width)).toEqual([40, undefined, undefined, undefined]);
    expect(resolveTableRowCellWidths(table.rows![0], table.width)).toEqual([40, 16.7, 16.7, 16.7]);
  });

  it('merges the active cell with the right neighbor and keeps it inside the table grid', () => {
    const table = mergeTableCellRight(baseTable(), 1, 1);

    expect(table.rows?.[1].cells[1]).toMatchObject({ text: 'Subtotal', rowSpan: 1, colSpan: 2 });
    expect(mergeTableCellRight(baseTable(), 1, 2).rows?.[1].cells[2]).not.toMatchObject({ colSpan: 2 });
  });

  it('splits a merged cell back to a normal cell', () => {
    const table = splitTableCell(mergeTableCellRight(baseTable(), 1, 1), 1, 1);

    expect(table.rows?.[1].cells[1]).toMatchObject({ text: 'Subtotal', rowSpan: 1, colSpan: 1 });
  });

  it('clears cell text without deleting the cell span metadata', () => {
    const table = clearTableCell(mergeTableCellRight(baseTable(), 1, 1), 1, 1);

    expect(table.rows?.[1].cells[1]).toMatchObject({ rowSpan: 1, colSpan: 2 });
    expect(table.rows?.[1].cells[1].text).toBeUndefined();
  });

  it('equalizes table column widths and row height from the component bounds', () => {
    const fixed = setTableCellWidth(baseTable(), 0, 0, 40);

    expect(equalizeTableColumns(fixed).rows?.[0].cells.map(cell => cell.width)).toEqual([undefined, undefined, undefined]);
    expect(equalizeTableRows(baseTable()).rows?.map(row => row.height)).toEqual([10, 10, 10]);
  });

  it('resolves table row and cell styles through inheritance', () => {
    const table = {
      ...baseTable(),
      backgroundColor: '#ffffff',
      rows: [{
        id: 'row-1',
        backgroundColor: '#eeeeee',
        cells: [{ id: 'cell-1', text: 'A', textAlign: 'right' }],
      }],
    } as TableComponent;

    expect(resolveTableCellStyle(table, table.rows![0], table.rows![0].cells[0])).toMatchObject({
      backgroundColor: '#eeeeee',
      textAlign: 'right',
    });
  });

  it('lays out collapsed borders without drawing duplicate top or left internal lines', () => {
    const layouts = layoutTableCells(baseTable());

    expect(layouts.find(cell => cell.rowIndex === 0 && cell.columnIndex === 0)?.border?.sides).toMatchObject({
      top: true,
      left: true,
      right: true,
      bottom: true,
    });
    expect(layouts.find(cell => cell.rowIndex === 1 && cell.columnIndex === 1)?.border?.sides).toMatchObject({
      top: false,
      left: false,
      right: true,
      bottom: true,
    });
  });
});
