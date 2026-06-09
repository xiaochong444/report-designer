/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ReportComponent, TableComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { PropertyEditor } from '../components/PropertyEditor';
import { useDesignerStore } from '../store/designer-store';
import { normalizeTable } from '../table/table-structure';

function loadWith(component: ReportComponent) {
  const template = createDefaultTemplate('Shortcut Contract');
  template.dataSources = [{
    id: 'employees',
    name: 'employees',
    type: 'json',
    schema: [
      { name: 'name', type: 'string' },
      { name: 'salary', type: 'number' },
    ],
  }];
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(component);
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents([component.id]);
}

function selectedComponent() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as any;
}

function selectedCell(row: number, column: number) {
  return normalizeTable(selectedComponent() as TableComponent).rows?.[row]?.cells[column];
}

function clickCell(row: number, column: number) {
  const cell = screen.getByTestId(`designer-table-cell-${row}-${column}`);
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: vi.fn(() => cell),
  });
  fireEvent.mouseDown(cell, { button: 0, clientX: 20, clientY: 20 });
}

describe('Phase 7 designer shortcuts and table context menu', () => {
  it('toggles text font style with Ctrl+B, Ctrl+I, and Ctrl+U', () => {
    loadWith({
      id: 'text-1',
      type: 'text',
      x: 10,
      y: 10,
      width: 40,
      height: 10,
      text: 'Name',
      font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: false,
      canShrink: false,
    } as ReportComponent);

    render(<Canvas />);
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'i', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'u', ctrlKey: true });

    const component = selectedComponent();
    expect(component.font.bold).toBe(true);
    expect(component.font.italic).toBe(true);
    expect(component.font.underline).toBe(true);
  });

  it('shows table row and column actions from the component context menu', () => {
    loadWith({
      id: 'table-1',
      type: 'table',
      x: 10,
      y: 10,
      width: 80,
      height: 30,
      dataSource: 'employees',
      columns: [{ id: 'col-1', header: 'Name', field: 'name', width: 40, cellType: 'text' }],
      rowCount: 2,
      columnCount: 1,
      headerRowsCount: 1,
      footerRowsCount: 0,
      canBreak: true,
      headerHeight: 8,
      rowHeight: 8,
      showBorder: true,
    } as ReportComponent);

    render(<Canvas />);
    const cell = screen.getByTestId('designer-table-cell-1-0');
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => cell),
    });
    fireEvent.mouseDown(cell, { button: 2, clientX: 20, clientY: 20 });
    fireEvent.mouseEnter(screen.getByText('插入'));
    fireEvent.click(screen.getByText('在右侧插入列'));

    const table = selectedComponent();
    expect(table.columnCount).toBe(2);
    expect(table.rows?.[0]?.cells).toHaveLength(2);
  });

  it('does not replace a component context menu with the band context menu', () => {
    loadWith({
      id: 'text-1',
      type: 'text',
      x: 10,
      y: 10,
      width: 40,
      height: 10,
      text: 'Name',
      font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: false,
      canShrink: false,
    } as ReportComponent);

    render(<Canvas />);
    const componentNode = document.querySelector('[data-component-id="text-1"]') as HTMLElement;
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => componentNode),
    });

    fireEvent.mouseDown(componentNode, { button: 2, clientX: 20, clientY: 20 });
    expect(screen.getByText('复制一份')).toBeInTheDocument();

    fireEvent.contextMenu(componentNode, { clientX: 20, clientY: 20 });

    expect(screen.queryByTestId('designer-band-context-menu')).not.toBeInTheDocument();
    expect(screen.getByText('复制一份')).toBeInTheDocument();
  });

  it('clears the selected table cell on Delete without deleting the table', () => {
    loadWith({
      id: 'table-1',
      type: 'table',
      x: 10,
      y: 10,
      width: 80,
      height: 30,
      dataSource: 'employees',
      columns: [{ id: 'col-1', header: 'Name', field: 'name', width: 40, cellType: 'text' }],
      rowCount: 2,
      columnCount: 1,
      headerRowsCount: 1,
      footerRowsCount: 0,
      canBreak: true,
      headerHeight: 8,
      rowHeight: 8,
      showBorder: true,
      cells: [{ row: 1, column: 0, text: 'Employee Name' }],
    } as TableComponent);

    render(<Canvas />);
    clickCell(1, 0);
    fireEvent.keyDown(window, { key: 'Delete' });

    let table = selectedComponent() as TableComponent;
    expect(table.type).toBe('table');
    expect(selectedCell(1, 0)?.text).toBeUndefined();

    act(() => {
      useDesignerStore.getState().undo();
    });
    expect(selectedCell(1, 0)?.text).toBe('Employee Name');
  });

  it('edits table column count from the property panel', () => {
    loadWith({
      id: 'table-2',
      type: 'table',
      x: 10,
      y: 10,
      width: 80,
      height: 30,
      dataSource: 'employees',
      columns: [{ id: 'col-1', header: 'Name', field: 'name', width: 40, cellType: 'text' }],
      rowCount: 2,
      columnCount: 1,
      headerRowsCount: 1,
      footerRowsCount: 0,
      canBreak: true,
      headerHeight: 8,
      rowHeight: 8,
      showBorder: true,
    } as ReportComponent);

    render(<PropertyEditor />);
    fireEvent.change(screen.getByLabelText('列数'), { target: { value: '3' } });

    const table = selectedComponent();
    expect(table.columnCount).toBe(3);
    expect(table.rows?.[0]?.cells).toHaveLength(3);
  });

  it('edits table structure from the property panel without old column definition controls', () => {
    loadWith({
      id: 'table-3',
      type: 'table',
      x: 10,
      y: 10,
      width: 80,
      height: 30,
      dataSource: 'employees',
      columns: [{ id: 'col-1', header: 'Name', field: 'name', width: 40, cellType: 'text' }],
      rowCount: 2,
      columnCount: 1,
      headerRowsCount: 1,
      footerRowsCount: 0,
      canBreak: true,
      headerHeight: 8,
      rowHeight: 8,
      showBorder: true,
    } as ReportComponent);

    render(<PropertyEditor />);
    fireEvent.change(screen.getByLabelText('行数'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('列数'), { target: { value: '3' } });
    expect(screen.queryByLabelText('交替行样式')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('表头高度')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('第 1 列标题')).not.toBeInTheDocument();

    const table = selectedComponent();
    expect(table.rowCount).toBe(4);
    expect(table.columnCount).toBe(3);
    expect(table.rows).toHaveLength(4);
    expect(table.rows[0].cells).toHaveLength(3);
  });
});
