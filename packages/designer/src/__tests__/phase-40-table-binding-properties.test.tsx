/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { createDefaultTemplate } from '@report-designer/core';
import type { ReportTemplate, TableComponent } from '@report-designer/core';
import { DesignerI18nProvider } from '../i18n';
import { PropertyEditor } from '../components/PropertyEditor';
import { useDesignerStore } from '../store/designer-store';

function tableComponent(overrides: Partial<TableComponent> = {}): TableComponent {
  return {
    id: 'table-1',
    type: 'table',
    name: 'Table1',
    x: 0,
    y: 0,
    width: 90,
    height: 32,
    dataSource: '',
    columns: [
      { id: 'c1', header: 'Name', field: 'name', width: 45, cellType: 'text' },
      { id: 'c2', header: 'Qty', field: 'qty', width: 45, cellType: 'text' },
    ],
    rowCount: 3,
    columnCount: 2,
    rowHeight: 8,
    showBorder: true,
    ...overrides,
  };
}

function loadSelectedTable(component: TableComponent = tableComponent()) {
  const template: ReportTemplate = createDefaultTemplate('Phase 40 Table Binding Properties');
  template.dataSources = [
    {
      id: 'root',
      name: 'root',
      type: 'json',
      schema: [
        { name: 'orders.orderNo', type: 'string' },
        { name: 'orders.items.name', type: 'string' },
        { name: 'orders.items.qty', type: 'number' },
      ],
    },
  ];
  template.pages[0].bands.find(band => band.type === 'data')!.components = [component];

  act(() => {
    useDesignerStore.getState().loadTemplate(template);
    useDesignerStore.getState().selectComponents([component.id]);
  });
}

function selectedTable() {
  return useDesignerStore.getState().template.pages[0].bands
    .flatMap(band => band.components)
    .find(component => component.id === 'table-1') as TableComponent;
}

describe('phase 40 table binding properties', () => {
  it('shows structure controls and removes table binding controls', () => {
    loadSelectedTable();

    render(<PropertyEditor />);

    expect(screen.getByLabelText('列数')).toBeInTheDocument();
    expect(screen.getByLabelText('行数')).toBeInTheDocument();
    expect(screen.queryByLabelText('绑定模式')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('绑定数组属性')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('数组路径')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('表格数据源')).not.toBeInTheDocument();
  });

  it('edits table border with the same border controls as other components', () => {
    loadSelectedTable(tableComponent({
      border: { style: 'solid', width: 0.2, color: '#9ca3af', sides: { top: true, right: true, bottom: true, left: true } },
    }));

    render(<PropertyEditor />);

    expect(screen.getByLabelText('边框样式')).toBeInTheDocument();
    expect(screen.getByLabelText('边框宽度')).toBeInTheDocument();
    expect(screen.getByLabelText('边框颜色')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('边框宽度'), { target: { value: '0.5' } });

    expect(selectedTable().border).toMatchObject({
      style: 'solid',
      width: 0.5,
      color: '#9ca3af',
      sides: { top: true, right: true, bottom: true, left: true },
    });
  });

  it('updates table row and column count through the store in one table edit command', () => {
    loadSelectedTable();

    act(() => {
      useDesignerStore.getState().updateSelectedTable({
        rowCount: 4,
        columnCount: 3,
      });
    });

    expect(selectedTable().rows).toHaveLength(4);
    expect(selectedTable().rows?.[0]?.cells).toHaveLength(3);
    expect(selectedTable().binding).toBeUndefined();
    expect(selectedTable().columns).toBeUndefined();
  });

  it('localizes table structure controls in English', () => {
    loadSelectedTable();

    render(
      <DesignerI18nProvider locale="en-US">
        <PropertyEditor />
      </DesignerI18nProvider>,
    );

    expect(screen.getByLabelText('Columns')).toBeInTheDocument();
    expect(screen.getByLabelText('Rows')).toBeInTheDocument();
    expect(screen.queryByLabelText('Binding mode')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Table data source')).not.toBeInTheDocument();
  });
});
