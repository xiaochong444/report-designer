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
    headerRowsCount: 1,
    footerRowsCount: 0,
    headerHeight: 8,
    rowHeight: 8,
    showBorder: true,
    ...overrides,
  };
}

function loadSelectedTable(component: TableComponent = tableComponent()) {
  const template: ReportTemplate = createDefaultTemplate('Phase 40 Table Binding Properties');
  template.dataSources = [
    {
      id: 'orders',
      name: 'Orders',
      type: 'json',
      schema: [
        { name: 'orderNo', type: 'string' },
      ],
    },
    {
      id: 'orders.items',
      name: 'Items',
      type: 'json',
      path: 'orders.items',
      parentSourceId: 'orders',
      schema: [
        { name: 'name', type: 'string' },
        { name: 'qty', type: 'number' },
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
  it('shows table binding controls and stores detail binding metadata', () => {
    loadSelectedTable();

    render(<PropertyEditor />);

    expect(screen.getByLabelText('绑定模式')).toBeInTheDocument();
    expect(screen.getByText('固定')).toBeInTheDocument();
    expect(screen.getByText('明细')).toBeInTheDocument();
    expect(screen.getByLabelText('绑定数组属性')).toBeInTheDocument();
    expect(screen.getByLabelText('数组路径')).toBeInTheDocument();
    expect(screen.queryByLabelText('表格数据源')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('明细'));
    fireEvent.mouseDown(screen.getByLabelText('绑定数组属性'));
    fireEvent.click(screen.getByText('Items (orders.items)'));
    fireEvent.change(screen.getByLabelText('数组路径'), { target: { value: 'Items' } });

    expect(selectedTable().binding).toMatchObject({
      mode: 'detail',
      dataSourceId: 'orders.items',
      arrayPath: 'Items',
    });
  });

  it('updates table binding through the store in one table edit command', () => {
    loadSelectedTable();

    act(() => {
      useDesignerStore.getState().updateSelectedTable({
        binding: { mode: 'detail', dataSourceId: 'orders.items', arrayPath: 'Items' },
      });
    });

    expect(selectedTable().binding).toEqual({
      mode: 'detail',
      dataSourceId: 'orders.items',
      arrayPath: 'Items',
    });
  });

  it('localizes table binding controls in English', () => {
    loadSelectedTable(tableComponent({ binding: { mode: 'detail', dataSourceId: 'orders.items', arrayPath: 'Items' } }));

    render(
      <DesignerI18nProvider locale="en-US">
        <PropertyEditor />
      </DesignerI18nProvider>,
    );

    expect(screen.getByLabelText('Binding mode')).toBeInTheDocument();
    expect(screen.getByText('Fixed')).toBeInTheDocument();
    expect(screen.getByText('Detail')).toBeInTheDocument();
    expect(screen.getByLabelText('Bound array property')).toBeInTheDocument();
    expect(screen.getByLabelText('Array path')).toHaveValue('Items');
    expect(screen.queryByLabelText('Table data source')).not.toBeInTheDocument();
  });

  it('uses fields from the bound array item for table cell field choices', () => {
    loadSelectedTable(tableComponent({ binding: { mode: 'detail', dataSourceId: 'orders.items', arrayPath: 'Items' } }));

    render(<PropertyEditor />);

    const fieldInput = screen.getByLabelText('第 1 列字段');
    expect(fieldInput).toHaveAttribute('list');
    const options = Array.from(document.querySelectorAll(`#${fieldInput.getAttribute('list')} option`)).map(option => option.getAttribute('value'));

    expect(options).toEqual(['name', 'qty']);
  });

  it('only exposes text table column type for the current table rendering contract', () => {
    loadSelectedTable();

    render(
      <DesignerI18nProvider locale="en-US">
        <PropertyEditor />
      </DesignerI18nProvider>,
    );

    fireEvent.mouseDown(screen.getByLabelText('Column 1 type'));

    expect(screen.getAllByText('Text').length).toBeGreaterThan(0);
    expect(screen.queryByText('Image')).not.toBeInTheDocument();
    expect(screen.queryByText('Barcode')).not.toBeInTheDocument();
    expect(screen.queryByText('Checkbox')).not.toBeInTheDocument();
  });
});
