/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ReportComponent, TableComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { useDesignerStore } from '../store/designer-store';

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

function selectedTable() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as TableComponent;
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
  it('inserts rows and columns before or after the clicked cell', () => {
    loadWith(tableComponent({ cells: [{ row: 2, column: 2, text: 'Tail' }] }));
    render(<Canvas />);

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('插入列到左侧'));
    expect(selectedTable().columnCount).toBe(4);
    expect(selectedTable().cells).toContainEqual({ row: 2, column: 3, text: 'Tail' });

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('插入行到上方'));
    expect(selectedTable().rowCount).toBe(4);
    expect(selectedTable().cells).toContainEqual({ row: 3, column: 3, text: 'Tail' });
  });

  it('sets header and footer rows from the clicked row', () => {
    loadWith(tableComponent({ rowCount: 5, headerRowsCount: 1, footerRowsCount: 0 }));
    render(<Canvas />);

    openCellMenu(1, 0);
    fireEvent.click(screen.getByText('设为表头行'));
    expect(selectedTable().headerRowsCount).toBe(2);

    openCellMenu(3, 0);
    fireEvent.click(screen.getByText('设为表尾行'));
    expect(selectedTable().footerRowsCount).toBe(2);
  });
});
