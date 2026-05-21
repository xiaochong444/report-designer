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
    expect(selectedTable().cells).toContainEqual({ row: 1, column: 1, text: 'Subtotal', rowSpan: 1, colSpan: 2 });

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('拆分单元格'));
    expect(selectedTable().cells).toContainEqual({ row: 1, column: 1, text: 'Subtotal', rowSpan: 1, colSpan: 1 });

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('清空单元格'));
    expect(selectedTable().cells).toContainEqual({ row: 1, column: 1, rowSpan: 1, colSpan: 1 });
  });

  it('equalizes table columns and rows from the table context menu', () => {
    loadWith(tableComponent());
    render(<Canvas />);

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('均分列宽'));
    expect(selectedTable().columns.map(column => column.width)).toEqual([30, 30, 30]);

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('均分行高'));
    expect(selectedTable().rowHeight).toBe(10);
  });

  it('inserts columns and rows relative to the right-clicked table cell', () => {
    loadWith(tableComponent({ cells: [{ row: 2, column: 2, text: 'Tail' }] }));
    render(<Canvas />);

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('插入列到右侧'));
    expect(selectedTable().columnCount).toBe(4);
    expect(selectedTable().cells).toContainEqual({ row: 2, column: 3, text: 'Tail' });

    openCellMenu(1, 1);
    fireEvent.click(screen.getByText('插入行到下方'));
    expect(selectedTable().rowCount).toBe(4);
    expect(selectedTable().cells).toContainEqual({ row: 3, column: 3, text: 'Tail' });
  });

  it('renders merged table cells as grid spans in the designer preview', () => {
    loadWith(tableComponent({ cells: [{ row: 1, column: 0, text: 'Merged', rowSpan: 1, colSpan: 2 }] }));
    render(<Canvas />);

    const merged = screen.getByTestId('designer-table-cell-1-0');
    expect(merged.style.gridColumn).toBe('span 2');
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
    expect(grid.style.gridTemplateColumns).toBe('38px 76px 227px');
    expect(grid.style.gridTemplateRows).toBe('23px 38px 38px');
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
    expect(screen.getByText('Distribute Columns')).toBeInTheDocument();
    expect(screen.queryByText('插入列到右侧')).not.toBeInTheDocument();
  });
});
