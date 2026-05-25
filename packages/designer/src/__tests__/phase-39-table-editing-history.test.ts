import { beforeEach, describe, expect, it } from 'vitest';
import type { TableComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { useDesignerStore } from '../store/designer-store';

function tableComponent(): TableComponent {
  return {
    id: 'table-1',
    type: 'table',
    x: 10,
    y: 10,
    width: 90,
    height: 30,
    dataSource: 'orders',
    columns: [
      { id: 'c1', header: 'Name', field: 'name', width: 10, cellType: 'text' },
      { id: 'c2', header: 'Qty', field: 'qty', width: 20, cellType: 'text' },
      { id: 'c3', header: 'Amount', field: 'amount', width: 60, cellType: 'text' },
    ],
    rowCount: 3,
    columnCount: 3,
    headerRowsCount: 1,
    footerRowsCount: 0,
    canBreak: true,
    cells: [
      { row: 1, column: 1, text: 'Subtotal' },
      { row: 2, column: 2, text: 'Tail' },
    ],
    headerHeight: 8,
    rowHeight: 8,
    showBorder: true,
  };
}

function secondTableComponent(): TableComponent {
  return {
    ...tableComponent(),
    id: 'table-2',
    x: 120,
    dataSource: 'returns',
    columns: [
      { id: 'r1', header: 'Sku', field: 'sku', width: 15, cellType: 'text' },
      { id: 'r2', header: 'Count', field: 'count', width: 25, cellType: 'text' },
      { id: 'r3', header: 'Reason', field: 'reason', width: 50, cellType: 'text' },
    ],
    cells: [
      { row: 1, column: 0, text: 'Reason' },
      { row: 2, column: 1, text: 'Damaged' },
    ],
  };
}

function loadTable() {
  const template = createDefaultTemplate('Phase 39 Table Editing History');
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(tableComponent());
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents(['table-1']);
  return template.pages[0].bands.find(band => band.type === 'data')!.id;
}

function loadTwoTables() {
  const template = createDefaultTemplate('Phase 39 Table Editing History');
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(
    tableComponent(),
    secondTableComponent(),
  );
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents(['table-1', 'table-2']);
}

function selectedTable(tableId = 'table-1'): TableComponent {
  const table = useDesignerStore.getState().template.pages[0].bands
    .flatMap(band => band.components)
    .find(component => component.id === tableId);
  if (!table || table.type !== 'table') throw new Error('Missing selected table');
  return table as TableComponent;
}

function snapshotTable(tableId = 'table-1'): TableComponent {
  return structuredClone(selectedTable(tableId));
}

function expectSingleUndoRedo(action: () => void) {
  const before = snapshotTable();

  action();
  const after = snapshotTable();
  expect(after).not.toEqual(before);

  useDesignerStore.getState().undo();
  expect(snapshotTable()).toEqual(before);

  useDesignerStore.getState().redo();
    expect(snapshotTable()).toEqual(after);
}

function snapshotTables(): TableComponent[] {
  return [snapshotTable('table-1'), snapshotTable('table-2')];
}

describe('phase 39 table editing history', () => {
  beforeEach(() => {
    loadTable();
  });

  it('records selected table structure updates as one undoable command', () => {
    expectSingleUndoRedo(() => {
      useDesignerStore.getState().updateSelectedTable({
        rowCount: 4,
        columnCount: 4,
        headerRowsCount: 2,
        footerRowsCount: 1,
        headerHeight: 9,
        rowHeight: 7,
        showBorder: false,
        dataSource: 'invoices',
      });
    });
  });

  it('records selected table cell updates as one undoable command', () => {
    useDesignerStore.getState().selectTableCell({
      tableId: 'table-1',
      bandId: loadTable(),
      startRow: 1,
      startColumn: 1,
      endRow: 1,
      endColumn: 1,
    });

    expectSingleUndoRedo(() => {
      useDesignerStore.getState().updateSelectedTableCell({
        text: 'Total',
        padding: { top: 2, right: 0, bottom: 0, left: 0 },
      });
    });
  });

  it('clamps cell spans and removes cells covered by property edits', () => {
    useDesignerStore.getState().selectTableCell({
      tableId: 'table-1',
      bandId: loadTable(),
      startRow: 1,
      startColumn: 1,
      endRow: 1,
      endColumn: 1,
    });

    useDesignerStore.getState().updateSelectedTableCell({ rowSpan: 5, colSpan: 5 });

    expect(selectedTable().cells).toContainEqual({
      row: 1,
      column: 1,
      text: 'Subtotal',
      rowSpan: 2,
      colSpan: 2,
    });
    expect(selectedTable().cells).not.toContainEqual(expect.objectContaining({ row: 2, column: 2, text: 'Tail' }));
  });

  it('records column insertion and deletion as undoable commands', () => {
    expectSingleUndoRedo(() => {
      useDesignerStore.getState().insertSelectedTableColumn(0);
    });

    expectSingleUndoRedo(() => {
      useDesignerStore.getState().deleteSelectedTableColumn(1);
    });
  });

  it('records row insertion and deletion as undoable commands', () => {
    expectSingleUndoRedo(() => {
      useDesignerStore.getState().insertSelectedTableRow(0);
    });

    expectSingleUndoRedo(() => {
      useDesignerStore.getState().deleteSelectedTableRow(1);
    });
  });

  it('records cell merge, split, and clear as undoable commands', () => {
    expectSingleUndoRedo(() => {
      useDesignerStore.getState().mergeSelectedTableCellRight(1, 1);
    });

    expectSingleUndoRedo(() => {
      useDesignerStore.getState().splitSelectedTableCell(1, 1);
    });

    expectSingleUndoRedo(() => {
      useDesignerStore.getState().clearSelectedTableCell(1, 1);
    });
  });

  it('records column and row equalization as undoable commands', () => {
    expectSingleUndoRedo(() => {
      useDesignerStore.getState().equalizeSelectedTableColumns();
    });

    expectSingleUndoRedo(() => {
      useDesignerStore.getState().equalizeSelectedTableRows();
    });
  });

  it('records multi-selected table structure updates as one undoable command', () => {
    loadTwoTables();
    const before = snapshotTables();

    useDesignerStore.getState().insertSelectedTableColumn(0);
    const after = snapshotTables();
    expect(after).not.toEqual(before);

    useDesignerStore.getState().undo();
    expect(snapshotTables()).toEqual(before);

    useDesignerStore.getState().redo();
    expect(snapshotTables()).toEqual(after);
  });
});
