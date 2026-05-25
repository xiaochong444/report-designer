/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ReportComponent, TableComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { DesignerPropertyPanel } from '../components/panels/DesignerPropertyPanel';
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
  };
}

function loadWith(component: ReportComponent) {
  const template = createDefaultTemplate('Phase 34 Cell Selection');
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(component);
  useDesignerStore.getState().loadTemplate(template);
}

function clickCell(row: number, column: number, shiftKey = false) {
  const cell = screen.getByTestId(`designer-table-cell-${row}-${column}`);
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn(() => cell),
  });
  fireEvent.mouseDown(cell, { button: 0, clientX: 20, clientY: 20, shiftKey });
}

describe('phase 34 table cell selection', () => {
  it('selects a table cell and shows cell properties', () => {
    loadWith(tableComponent());
    render(
      <>
        <Canvas />
        <DesignerPropertyPanel />
      </>,
    );

    clickCell(1, 1);

    expect(useDesignerStore.getState().selectedTableCell).toMatchObject({
      tableId: 'table-1',
      startRow: 1,
      startColumn: 1,
      endRow: 1,
      endColumn: 1,
    });
    expect(screen.getByTestId('designer-table-cell-properties')).toBeInTheDocument();
    expect(screen.getByLabelText('文本内容')).toHaveValue('Subtotal');
  });

  it('extends selection to a rectangle with shift click', () => {
    loadWith(tableComponent());
    render(<Canvas />);

    clickCell(1, 0);
    clickCell(2, 2, true);

    expect(useDesignerStore.getState().selectedTableCell).toMatchObject({
      tableId: 'table-1',
      startRow: 1,
      startColumn: 0,
      endRow: 2,
      endColumn: 2,
    });
    expect(screen.getByTestId('designer-table-cell-2-2')).toHaveStyle({ backgroundColor: '#e6f4ff' });
  });

  it('updates selected table cell text from the property panel', () => {
    loadWith(tableComponent());
    render(
      <>
        <Canvas />
        <DesignerPropertyPanel />
      </>,
    );

    clickCell(1, 1);
    fireEvent.change(screen.getByLabelText('文本内容'), { target: { value: 'Total' } });

    const table = useDesignerStore.getState().template.pages[0].bands
      .flatMap(band => band.components)
      .find(component => component.id === 'table-1') as TableComponent;
    expect(table.cells).toContainEqual({ row: 1, column: 1, text: 'Total' });
  });
});
