import { describe, expect, it } from 'vitest';
import type { ReportComponent, TableComponent } from '@report-designer/core';
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

function textComponent(): ReportComponent {
  return {
    id: 'text-1',
    type: 'text',
    x: 10,
    y: 10,
    width: 30,
    height: 8,
    text: 'Name',
    font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
  } as ReportComponent;
}

function loadWith(component: ReportComponent) {
  const template = createDefaultTemplate('Phase 8 Store');
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(component);
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents([component.id]);
}

function selectedComponent() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as any;
}

function selectedBandId() {
  return useDesignerStore.getState().template.pages[0].bands.find(band => band.components.some(component => component.id === 'table-1'))!.id;
}

describe('Phase 8 selected table cell store operations', () => {
  it('merges, splits, and clears the selected table cell by row and column', () => {
    loadWith(tableComponent());

    useDesignerStore.getState().mergeSelectedTableCellRight(1, 1);
    expect(selectedComponent().cells).toContainEqual({ row: 1, column: 1, text: 'Subtotal', rowSpan: 1, colSpan: 2 });

    useDesignerStore.getState().splitSelectedTableCell(1, 1);
    expect(selectedComponent().cells).toContainEqual({ row: 1, column: 1, text: 'Subtotal', rowSpan: 1, colSpan: 1 });

    useDesignerStore.getState().clearSelectedTableCell(1, 1);
    expect(selectedComponent().cells).toContainEqual({ row: 1, column: 1, rowSpan: 1, colSpan: 1 });
  });

  it('equalizes selected table columns and rows', () => {
    loadWith(tableComponent());

    useDesignerStore.getState().equalizeSelectedTableColumns();
    useDesignerStore.getState().equalizeSelectedTableRows();

    expect(selectedComponent().columns.map((column: any) => column.width)).toEqual([30, 30, 30]);
    expect(selectedComponent().rowHeight).toBe(10);
  });

  it('leaves non-table selected components unchanged', () => {
    loadWith(textComponent());
    const before = selectedComponent();

    useDesignerStore.getState().mergeSelectedTableCellRight(0, 0);
    useDesignerStore.getState().equalizeSelectedTableColumns();

    expect(selectedComponent()).toEqual(before);
  });

  it('copies, pastes, and clears selected table cell style without changing content or spans', () => {
    loadWith(tableComponent());
    useDesignerStore.getState().selectTableCell({
      tableId: 'table-1',
      bandId: selectedBandId(),
      startRow: 1,
      startColumn: 1,
      endRow: 1,
      endColumn: 1,
    });
    useDesignerStore.getState().updateSelectedTableCell({
      rowSpan: 1,
      colSpan: 2,
      text: 'Styled',
      backgroundColor: '#ffeecc',
      font: { family: 'Arial', size: 12, bold: true, italic: false, underline: false, strikethrough: false, color: '#224466' },
      textAlign: 'center',
      verticalAlign: 'middle',
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
      border: { style: 'solid', width: 0.2, color: '#112233', sides: { top: true, right: true, bottom: true, left: true } },
      format: { type: 'number', decimalDigits: 2, useGroupSeparator: true },
    });

    useDesignerStore.getState().selectTableCell({
      tableId: 'table-1',
      bandId: selectedBandId(),
      startRow: 1,
      startColumn: 1,
      endRow: 1,
      endColumn: 1,
    });
    useDesignerStore.getState().copySelectedTableCellStyle(1, 1);
    useDesignerStore.getState().selectTableCell({
      tableId: 'table-1',
      bandId: selectedBandId(),
      startRow: 2,
      startColumn: 0,
      endRow: 2,
      endColumn: 0,
    });
    useDesignerStore.getState().updateSelectedTableCell({ text: 'Target' });
    useDesignerStore.getState().pasteSelectedTableCellStyle(2, 0);

    expect(selectedComponent().cells).toContainEqual(expect.objectContaining({
      row: 2,
      column: 0,
      text: 'Target',
      backgroundColor: '#ffeecc',
      textAlign: 'center',
      verticalAlign: 'middle',
      font: expect.objectContaining({ bold: true, color: '#224466' }),
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
      border: { style: 'solid', width: 0.2, color: '#112233', sides: { top: true, right: true, bottom: true, left: true } },
      format: { type: 'number', decimalDigits: 2, useGroupSeparator: true },
    }));

    useDesignerStore.getState().clearSelectedTableCellStyle(1, 1);

    expect(selectedComponent().cells).toContainEqual({
      row: 1,
      column: 1,
      rowSpan: 1,
      colSpan: 2,
      text: 'Styled',
    });
  });

  it('merges the selected rectangular table cell range from the top-left cell', () => {
    loadWith(tableComponent());
    useDesignerStore.getState().selectTableCell({
      tableId: 'table-1',
      bandId: selectedBandId(),
      startRow: 1,
      startColumn: 0,
      endRow: 2,
      endColumn: 2,
    });

    useDesignerStore.getState().mergeSelectedTableCellRange();

    expect(selectedComponent().cells).toContainEqual({ row: 1, column: 0, rowSpan: 2, colSpan: 3 });
    expect(selectedComponent().cells?.some((cell: any) => cell.row === 1 && cell.column === 1)).toBe(false);
  });
});
