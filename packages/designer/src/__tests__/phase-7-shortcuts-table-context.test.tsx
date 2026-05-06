/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { PropertyEditor } from '../components/PropertyEditor';
import { useDesignerStore } from '../store/designer-store';

function loadWith(component: ReportComponent) {
  const template = createDefaultTemplate('Shortcut Contract');
  template.dataSources = [{ id: 'employees', name: 'employees', type: 'json', schema: [{ name: 'name', type: 'string' }] }];
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(component);
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents([component.id]);
}

function selectedComponent() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as any;
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
    const grid = screen.getByTestId('designer-table-grid');
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => grid),
    });
    fireEvent.mouseDown(grid, { button: 2, clientX: 20, clientY: 20 });
    fireEvent.click(screen.getByText('插入列到右侧'));

    const table = selectedComponent();
    expect(table.columnCount).toBe(2);
    expect(table.columns).toHaveLength(2);
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
    expect(table.columns).toHaveLength(3);
  });
});
