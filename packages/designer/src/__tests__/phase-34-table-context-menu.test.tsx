/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ReportComponent, TableComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { useDesignerStore } from '../store/designer-store';
import { normalizeTable } from '../table/table-structure';

function tableComponent(overrides: Partial<TableComponent> = {}): TableComponent {
  return {
    id: 'table-1',
    type: 'table',
    x: 10,
    y: 10,
    width: 90,
    height: 30,
    dataSource: 'orders',
    columns: [
      { id: 'c1', header: 'Name', field: 'name', width: 30, cellType: 'text' },
      { id: 'c2', header: 'Qty', field: 'qty', width: 30, cellType: 'text' },
      { id: 'c3', header: 'Amount', field: 'amount', width: 30, cellType: 'text' },
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
  const template = createDefaultTemplate('Phase 34 Context Menu');
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(component);
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents([component.id]);
}

function loadWithComponents(components: ReportComponent[], selectedIds: string[]) {
  const template = createDefaultTemplate('Phase 34 Context Menu');
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(...components);
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents(selectedIds);
}

function selectedTable() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as TableComponent;
}

function tableById(id: string) {
  return useDesignerStore.getState().template.pages[0].bands
    .flatMap(band => band.components)
    .find(component => component.id === id) as TableComponent;
}

function snapshotSelectedTable() {
  return structuredClone(selectedTable());
}

function selectedCell(row: number, column: number) {
  return normalizeTable(selectedTable()).rows?.[row]?.cells[column];
}

function openCellMenu(row: number, column: number) {
  const cell = screen.getByTestId(`designer-table-cell-${row}-${column}`);
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn(() => cell),
  });
  fireEvent.mouseDown(cell, { button: 2, clientX: 20, clientY: 20 });
}

describe('phase 34 table context menu', () => {
  it('shows an Excel-like table cell menu and handles a submenu item click', () => {
    loadWith(tableComponent({ cells: [{ row: 2, column: 2, text: 'Tail' }] }));
    render(<Canvas />);

    openCellMenu(1, 1);
    expect(screen.getByText('剪切')).toBeInTheDocument();
    expect(screen.getByText('复制')).toBeInTheDocument();
    expect(screen.getByText('粘贴')).toBeInTheDocument();
    expect(screen.getByText('清除内容')).toBeInTheDocument();
    expect(screen.getByText('插入')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
    expect(screen.getByText('合并单元格')).toBeInTheDocument();
    expect(screen.getByText('拆分单元格')).toBeInTheDocument();
    expect(screen.getByText('平均分布列宽')).toBeInTheDocument();
    expect(screen.getByText('平均分布行高')).toBeInTheDocument();
    expect(screen.getByText('单元格样式')).toBeInTheDocument();
    expect(screen.getByText('表格')).toBeInTheDocument();
    expect(screen.queryByText('复制一份')).not.toBeInTheDocument();
    expect(screen.queryByText('设为表头行')).not.toBeInTheDocument();
    expect(screen.queryByText('设为表尾行')).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByText('插入'));
    const insertRowBelow = screen.getByText('在下方插入行');
    fireEvent.mouseDown(insertRowBelow);
    fireEvent.click(insertRowBelow);

    expect(selectedTable().rowCount).toBe(4);
    expect(selectedCell(3, 2)).toMatchObject({ text: 'Tail' });
  });

  it('keeps submenu actions available while moving from the parent menu item', () => {
    loadWith(tableComponent({ cells: [{ row: 2, column: 2, text: 'Tail' }] }));
    render(<Canvas />);

    openCellMenu(1, 1);
    const insertMenuItem = screen.getByText('插入');
    fireEvent.mouseEnter(insertMenuItem);
    fireEvent.mouseLeave(insertMenuItem);
    const insertRowBelow = screen.getByText('在下方插入行');
    fireEvent.mouseEnter(insertRowBelow);
    fireEvent.click(insertRowBelow);

    expect(selectedTable().rowCount).toBe(4);
    expect(selectedCell(3, 2)).toMatchObject({ text: 'Tail' });
  });

  it('inserts rows and columns before or after the clicked cell', () => {
    loadWith(tableComponent({ cells: [{ row: 2, column: 2, text: 'Tail' }] }));
    render(<Canvas />);

    openCellMenu(1, 1);
    fireEvent.mouseEnter(screen.getByText('插入'));
    fireEvent.click(screen.getByText('在左侧插入列'));
    expect(selectedTable().columnCount).toBe(4);
    expect(selectedCell(2, 3)).toMatchObject({ text: 'Tail' });

    openCellMenu(1, 1);
    fireEvent.mouseEnter(screen.getByText('插入'));
    fireEvent.click(screen.getByText('在上方插入行'));
    expect(selectedTable().rowCount).toBe(4);
    expect(selectedCell(3, 3)).toMatchObject({ text: 'Tail' });
  });

  it('applies table context menu operations only to the right-clicked table', () => {
    loadWithComponents([
      tableComponent({ id: 'table-1', x: 10 }),
      tableComponent({ id: 'table-2', x: 120 }),
    ], ['table-1', 'table-2']);
    render(<Canvas />);

    const table2Cell = screen.getAllByTestId('designer-table-cell-1-1')[1];
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => table2Cell),
    });
    fireEvent.mouseDown(table2Cell, { button: 2, clientX: 20, clientY: 20 });
    fireEvent.mouseEnter(screen.getByText('插入'));
    fireEvent.click(screen.getByText('在右侧插入列'));

    expect(tableById('table-1').columnCount).toBe(3);
    expect(tableById('table-2').columnCount).toBe(4);
  });

  it('keeps header and footer row actions in table row settings', () => {
    loadWith(tableComponent({ rowCount: 5, headerRowsCount: 1, footerRowsCount: 0 }));
    render(<Canvas />);

    openCellMenu(1, 0);
    fireEvent.mouseEnter(screen.getByText('表格'));
    fireEvent.mouseEnter(screen.getByText('行设置'));
    fireEvent.click(screen.getByText('设为表头行'));
    expect(selectedTable().rows?.[1]?.role).toBe('header');

    openCellMenu(3, 0);
    fireEvent.mouseEnter(screen.getByText('表格'));
    fireEvent.mouseEnter(screen.getByText('行设置'));
    fireEvent.click(screen.getByText('设为表尾行'));
    expect(selectedTable().rows?.[3]?.role).toBe('footer');
  });

  it('deletes the clicked column with undo support', () => {
    loadWith(tableComponent({ cells: [{ row: 2, column: 2, text: 'Tail' }] }));
    render(<Canvas />);

    openCellMenu(1, 1);
    const beforeColumnDelete = snapshotSelectedTable();
    fireEvent.mouseEnter(screen.getByText('删除'));
    fireEvent.click(screen.getByText('删除当前列'));
    expect(selectedTable().columnCount).toBe(2);
    expect(selectedCell(2, 1)).toMatchObject({ text: 'Tail' });

    act(() => {
      useDesignerStore.getState().undo();
    });
    expect(selectedTable()).toEqual(beforeColumnDelete);
  });

  it('merges, splits, and clears cells with undo support', () => {
    loadWith(tableComponent({ cells: [{ row: 1, column: 1, text: 'Subtotal', rowSpan: 1, colSpan: 2 }] }));
    render(<Canvas />);

    openCellMenu(1, 1);
    const beforeSplit = snapshotSelectedTable();
    fireEvent.click(screen.getByText('拆分单元格'));
    expect(selectedCell(1, 1)).toMatchObject({ text: 'Subtotal', rowSpan: 1, colSpan: 1 });

    act(() => {
      useDesignerStore.getState().undo();
    });
    expect(selectedTable()).toEqual(beforeSplit);

    openCellMenu(1, 1);
    const beforeClear = snapshotSelectedTable();
    fireEvent.click(screen.getByText('清除内容'));
    expect(selectedCell(1, 1)).toMatchObject({ rowSpan: 1, colSpan: 2 });
    expect(selectedCell(1, 1)?.text).toBeUndefined();

    act(() => {
      useDesignerStore.getState().undo();
    });
    expect(selectedTable()).toEqual(beforeClear);

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('拆分单元格'));
    openCellMenu(1, 1);
    const beforeMerge = snapshotSelectedTable();
    fireEvent.click(screen.getByText('合并单元格'));
    expect(selectedCell(1, 1)).toMatchObject({ text: 'Subtotal', rowSpan: 1, colSpan: 2 });

    act(() => {
      useDesignerStore.getState().undo();
    });
    expect(selectedTable()).toEqual(beforeMerge);
  });
});
