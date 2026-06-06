/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ReportComponent, TableComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

function tableComponent(overrides: Partial<TableComponent> = {}): TableComponent {
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
    ...overrides,
  };
}

function loadWith(component: ReportComponent) {
  const template = createDefaultTemplate('Phase 8 Context');
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(component);
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents([component.id]);
}

function selectedTable() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as TableComponent;
}

function selectedCell(row: number, column: number) {
  return selectedTable().rows?.[row]?.cells[column];
}

function openCellMenu(row: number, column: number) {
  const cell = screen.getByTestId(`designer-table-cell-${row}-${column}`);
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn(() => cell),
  });
  fireEvent.mouseDown(cell, { button: 2, clientX: 20, clientY: 20 });
}

describe('Phase 8 table cell context menu', () => {
  it('merges, splits, and clears the right-clicked table cell', () => {
    loadWith(tableComponent());
    render(<Canvas />);

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('合并右侧单元格'));
    expect(selectedCell(1, 1)).toMatchObject({ text: 'Subtotal', rowSpan: 1, colSpan: 2 });

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('拆分单元格'));
    expect(selectedCell(1, 1)).toMatchObject({ text: 'Subtotal', rowSpan: 1, colSpan: 1 });

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('清空单元格'));
    expect(selectedCell(1, 1)).toMatchObject({ rowSpan: 1, colSpan: 1 });
    expect(selectedCell(1, 1)?.text).toBeUndefined();
  });

  it('equalizes table columns and rows from the table context menu', () => {
    loadWith(tableComponent());
    render(<Canvas />);

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('均分列宽'));
    expect(selectedTable().rows?.[0]?.cells.map(cell => cell.width)).toEqual([undefined, undefined, undefined]);

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('均分行高'));
    expect(selectedTable().rows?.map(row => row.height)).toEqual([10, 10, 10]);
  });

  it('copies, pastes, and clears table cell style from the context menu', () => {
    loadWith(tableComponent({
      cells: [{
        row: 1,
        column: 1,
        text: 'Subtotal',
        backgroundColor: '#ffeecc',
        font: { family: 'Arial', size: 12, bold: true, italic: false, underline: false, strikethrough: false, color: '#224466' },
        textAlign: 'center',
        padding: { top: 1, right: 2, bottom: 3, left: 4 },
      }],
    }));
    render(<Canvas />);

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('复制单元格样式'));

    openCellMenu(2, 0);
    fireEvent.click(screen.getByText('粘贴单元格样式'));
    expect(selectedCell(2, 0)).toMatchObject({
      backgroundColor: '#ffeecc',
      font: expect.objectContaining({ bold: true, color: '#224466' }),
      textAlign: 'center',
      padding: { top: 1, right: 2, bottom: 3, left: 4 },
    });

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('清空单元格样式'));
    expect(selectedCell(1, 1)).toEqual(expect.objectContaining({ text: 'Subtotal' }));
    expect(selectedCell(1, 1)?.backgroundColor).toBeUndefined();
  });

  it('keeps the selected cell range on right-click and merges it from the context menu', () => {
    loadWith(tableComponent());
    render(<Canvas />);

    const start = screen.getByTestId('designer-table-cell-1-0');
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => start),
    });
    fireEvent.mouseDown(start, { button: 0, clientX: 20, clientY: 20 });

    const end = screen.getByTestId('designer-table-cell-2-2');
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => end),
    });
    fireEvent.mouseDown(end, { button: 0, clientX: 20, clientY: 20, shiftKey: true });
    fireEvent.mouseDown(end, { button: 2, clientX: 20, clientY: 20 });

    fireEvent.click(screen.getByText('合并选中单元格'));

    expect(selectedCell(1, 0)).toMatchObject({ rowSpan: 2, colSpan: 3 });
    expect(screen.queryByTestId('designer-table-cell-1-1')).not.toBeInTheDocument();
  });

  it('inserts columns and rows relative to the right-clicked table cell', () => {
    loadWith(tableComponent({ cells: [{ row: 2, column: 2, text: 'Tail' }] }));
    render(<Canvas />);

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('插入列到右侧'));
    expect(selectedTable().rows?.[0]?.cells).toHaveLength(4);
    expect(selectedCell(2, 3)?.text).toBe('Tail');

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('插入行到下方'));
    expect(selectedTable().rows).toHaveLength(4);
    expect(selectedCell(3, 3)?.text).toBe('Tail');
  });

  it('renders merged table cells as grid spans in the designer preview', () => {
    loadWith(tableComponent({ cells: [{ row: 1, column: 0, text: 'Merged', rowSpan: 1, colSpan: 2 }] }));
    render(<Canvas />);

    const merged = screen.getByTestId('designer-table-cell-1-0');
    expect(merged).toHaveStyle({ width: '113px' });
    expect(screen.queryByTestId('designer-table-cell-1-1')).not.toBeInTheDocument();
  });

  it('renders table column widths and row heights from table properties on the canvas', () => {
    loadWith(tableComponent({
      width: 90,
      height: 26,
      columns: [
        { id: 'c1', header: 'Name', field: 'name', width: 10, cellType: 'text' },
        { id: 'c2', header: 'Title', field: 'title', width: 20, cellType: 'text' },
        { id: 'c3', header: 'Team', field: 'team', width: 60, cellType: 'text' },
      ],
      rowCount: 3,
      columnCount: 3,
      headerHeight: 6,
      rowHeight: 10,
    }));

    render(<Canvas />);

    const grid = screen.getByTestId('designer-table-grid');
    expect(grid).toHaveStyle({ position: 'relative' });
    expect(screen.getByTestId('designer-table-cell-0-0')).toHaveStyle({ width: '38px', height: '23px' });
    expect(screen.getByTestId('designer-table-cell-1-1')).toHaveStyle({ width: '76px', height: '38px' });
  });

  it('localizes table context menu actions to English', () => {
    loadWith(tableComponent());
    render(
      <DesignerI18nProvider locale="en-US">
        <Canvas />
      </DesignerI18nProvider>,
    );

    openCellMenu(1, 1);

    expect(screen.getByText('Insert Column Right')).toBeInTheDocument();
    expect(screen.getByText('Merge Cell Right')).toBeInTheDocument();
    expect(screen.getByText('Merge Selected Cells')).toBeInTheDocument();
    expect(screen.getByText('Copy Cell Style')).toBeInTheDocument();
    expect(screen.getByText('Clear Cell Style')).toBeInTheDocument();
    expect(screen.getByText('Distribute Columns')).toBeInTheDocument();
    expect(screen.queryByText('插入列到右侧')).not.toBeInTheDocument();
  });
});
