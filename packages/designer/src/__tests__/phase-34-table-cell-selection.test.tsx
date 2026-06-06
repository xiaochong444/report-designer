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

function tableById(id = 'table-1') {
  return useDesignerStore.getState().template.pages[0].bands
    .flatMap(band => band.components)
    .find(component => component.id === id) as TableComponent;
}

function tableCell(row: number, column: number, id = 'table-1') {
  return tableById(id).rows?.[row]?.cells[column];
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

    expect(tableCell(1, 1)?.text).toBe('Total');
  });

  it('updates selected table cell appearance from the property panel', () => {
    loadWith(tableComponent());
    render(
      <>
        <Canvas />
        <DesignerPropertyPanel />
      </>,
    );

    clickCell(1, 1);
    fireEvent.change(screen.getByLabelText('边框宽度'), { target: { value: '0.4' } });
    fireEvent.change(screen.getByLabelText('上'), { target: { value: '2' } });

    expect(tableCell(1, 1)).toMatchObject({
      border: { width: 0.4 },
      padding: { top: 2 },
    });
  });

  it('shows unset table cell border and padding as blank editor defaults without writing inherited values', () => {
    loadWith(tableComponent());
    render(
      <>
        <Canvas />
        <DesignerPropertyPanel />
      </>,
    );

    clickCell(1, 1);

    expect((screen.getByLabelText('边框宽度') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('上') as HTMLInputElement).value).toBe('');
    expect(screen.getByLabelText('边框上边')).not.toBeChecked();
    expect(screen.getByLabelText('边框右边')).not.toBeChecked();
    expect(screen.getByLabelText('边框下边')).not.toBeChecked();
    expect(screen.getByLabelText('边框左边')).not.toBeChecked();
    expect(screen.getByText('应用边')).toBeInTheDocument();
    expect(screen.queryByText('边框边')).not.toBeInTheDocument();
    expect(screen.getByTestId('border-editor-sides')).toHaveStyle({ flexWrap: 'nowrap' });
    expect(tableCell(1, 1)?.border).toBeUndefined();
    expect(tableCell(1, 1)?.padding).toBeUndefined();
  });

  it('updates selected table cell border sides independently', () => {
    loadWith(tableComponent());
    render(
      <>
        <Canvas />
        <DesignerPropertyPanel />
      </>,
    );

    clickCell(1, 1);
    fireEvent.click(screen.getByLabelText('边框左边'));

    expect(tableCell(1, 1)?.border?.sides).toMatchObject({
      top: false,
      right: false,
      bottom: false,
      left: true,
    });
  });

  it('updates selected table row border sides independently', () => {
    loadWith(tableComponent());
    useDesignerStore.getState().selectTableRow({ tableId: 'table-1', bandId: useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data')!.id, row: 1 });
    render(<DesignerPropertyPanel />);

    fireEvent.click(screen.getByLabelText('边框上边'));

    expect(tableById().rows?.[1].border?.sides).toMatchObject({
      top: true,
      right: false,
      bottom: false,
      left: false,
    });
  });

  it('renders selected table cell styles on the design canvas', () => {
    loadWith({
      ...tableComponent(),
      cells: [{
        row: 1,
        column: 1,
        text: 'Styled',
        backgroundColor: '#fffbe6',
        textAlign: 'right',
        verticalAlign: 'middle',
        padding: { top: 1, right: 2, bottom: 1, left: 3 },
        border: { style: 'dashed', width: 0.4, color: '#faad14', sides: { top: true, right: true, bottom: true, left: true } },
      }],
    } as TableComponent);
    render(<Canvas />);

    expect(screen.getByTestId('designer-table-cell-1-1')).toHaveStyle({
      backgroundColor: '#fffbe6',
      textAlign: 'right',
      alignItems: 'center',
    });
    expect(screen.getByTestId('designer-table-border-line-1-1-right')).toHaveStyle({
      borderLeftStyle: 'dashed',
      borderLeftColor: '#faad14',
      zIndex: '3',
    });
    expect(screen.getByTestId('designer-table-border-line-1-1-bottom')).toHaveStyle({
      borderTopStyle: 'dashed',
      borderTopColor: '#faad14',
      zIndex: '3',
    });
  });

  it('applies cell appearance updates to every selected cell in the range', () => {
    loadWith(tableComponent());
    render(
      <>
        <Canvas />
        <DesignerPropertyPanel />
      </>,
    );

    clickCell(1, 0);
    clickCell(2, 2, true);
    fireEvent.change(screen.getByLabelText('边框宽度'), { target: { value: '0.5' } });

    const updatedCells = tableById().rows
      ?.flatMap((row, rowIndex) => row.cells.map((cell, columnIndex) => ({ cell, key: `${rowIndex}-${columnIndex}` })))
      .filter(item => item.cell.border?.width === 0.5)
      .map(item => item.key)
      .sort();
    expect(updatedCells).toEqual([
      '1-0',
      '1-1',
      '1-2',
      '2-0',
      '2-1',
      '2-2',
    ]);
  });

  it('updates selected table cell font from the property panel', () => {
    loadWith(tableComponent());
    render(
      <>
        <Canvas />
        <DesignerPropertyPanel />
      </>,
    );

    clickCell(1, 1);
    fireEvent.change(screen.getByLabelText('字号'), { target: { value: '14' } });
    fireEvent.change(screen.getByLabelText('字体颜色'), { target: { value: '#112233' } });
    fireEvent.click(screen.getByRole('button', { name: '加粗' }));
    fireEvent.click(screen.getByRole('button', { name: '斜体' }));
    fireEvent.click(screen.getByRole('button', { name: '下划线' }));
    fireEvent.click(screen.getByRole('button', { name: '删除线' }));

    expect(tableCell(1, 1)?.font).toMatchObject({
      size: 14,
      color: '#112233',
      bold: true,
      italic: true,
      underline: true,
      strikethrough: true,
    });
  });
});
