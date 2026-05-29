/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { BandPropertyGrid } from '../components/properties/BandPropertyGrid';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

function loadTemplateWithDataBand() {
  const template = createDefaultTemplate('DataBand Sorting');
  template.dataSources = [{
    id: 'orders',
    name: 'Orders',
    type: 'json',
    schema: [
      { name: 'customer', type: 'string', label: 'Customer' },
      { name: 'amount', type: 'number', label: 'Amount' },
      { name: 'active', type: 'boolean', label: 'Active' },
    ],
  }, {
    id: 'fieldsOnly',
    name: 'Fields Only',
    type: 'json',
    fields: [
      { name: 'createdAt', type: 'date', label: 'Created At' },
    ],
  }];
  const dataBand = template.pages[0].bands.find(band => band.type === 'data');
  if (!dataBand) {
    throw new Error('Missing data band');
  }
  dataBand.dataBand = { dataSourceId: 'orders' };
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectBand(dataBand.id);
  return dataBand.id;
}

function renderBandProperties(locale: 'zh-CN' | 'en-US' = 'en-US') {
  render(
    <DesignerI18nProvider locale={locale}>
      <BandPropertyGrid />
    </DesignerI18nProvider>,
  );
}

async function chooseCombobox(name: string, option: string) {
  const input = screen.getByRole('combobox', { name });
  fireEvent.mouseDown(input);
  const matches = await screen.findAllByText(option);
  fireEvent.click(matches[matches.length - 1]);
}

describe('Phase 22 DataBand sorting property grid', () => {
  beforeEach(() => {
    loadTemplateWithDataBand();
  });

  it('adds multiple sort rules from the selected data source schema and stores UI order as priority', async () => {
    renderBandProperties('en-US');

    expect(screen.getByLabelText('Sorting')).toHaveValue('No sorting');
    fireEvent.click(screen.getByRole('button', { name: 'Edit sorting' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add sort rule' }));
    await chooseCombobox('Sort field 1', 'Customer');
    await chooseCombobox('Sort direction 1', 'Descending');
    fireEvent.click(screen.getByRole('button', { name: 'Add sort rule' }));
    await chooseCombobox('Sort field 2', 'Amount');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    const dataBand = () => useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data');
    expect(dataBand()?.dataBand?.sort).toEqual([
      { field: 'customer', direction: 'desc' },
      { field: 'amount', direction: 'asc' },
    ]);
    expect(screen.getByLabelText('Sorting')).toHaveValue('Customer DESC, Amount ASC');

    fireEvent.click(screen.getByRole('button', { name: 'Edit sorting' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move sort rule 2 up' }));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    expect(dataBand()?.dataBand?.sort).toEqual([
      { field: 'amount', direction: 'asc' },
      { field: 'customer', direction: 'desc' },
    ]);
  });

  it('refreshes sort fields from schema fallback fields after changing data source', async () => {
    renderBandProperties('en-US');

    await chooseCombobox('Data source', 'Fields Only');
    fireEvent.click(screen.getByRole('button', { name: 'Edit sorting' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add sort rule' }));
    await chooseCombobox('Sort field 1', 'Created At');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    const dataBand = useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data');
    expect(dataBand?.dataBand).toMatchObject({
      dataSourceId: 'fieldsOnly',
      sort: [{ field: 'createdAt', direction: 'asc' }],
    });
  });

  it('localizes sorting controls to Chinese', () => {
    renderBandProperties('zh-CN');

    const dataForm = screen.getByTestId('band-properties-data-form');
    expect(within(dataForm).getByLabelText('排序')).toBeInTheDocument();
    expect(within(dataForm).getByRole('button', { name: '编辑排序' })).toBeInTheDocument();
    expect(screen.queryByText('Report Designer')).not.toBeInTheDocument();
  });

  it('shows sorting controls for hierarchical data bands too', () => {
    const state = useDesignerStore.getState();
    const page = state.template.pages[0];
    const dataBand = page.bands.find(band => band.type === 'data');
    if (!dataBand) throw new Error('Missing data band');
    useDesignerStore.getState().updateTemplate(current => ({
      ...current,
      pages: current.pages.map(nextPage => nextPage.id === page.id ? {
        ...nextPage,
        bands: nextPage.bands.map(band => band.id === dataBand.id ? { ...band, type: 'hierarchicalData' } : band),
      } : nextPage),
    }));

    renderBandProperties('en-US');

    expect(within(screen.getByTestId('band-properties-data-form')).getByLabelText('Sorting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit sorting' })).toBeEnabled();
  });

  it('edits filter conditions in a dialog and stores a filter expression', async () => {
    renderBandProperties('en-US');

    expect(screen.getByLabelText('Filter')).toHaveValue('Not filtered');
    fireEvent.click(screen.getByRole('button', { name: 'Edit filter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add filter condition' }));
    await chooseCombobox('Filter field 1', 'Amount');
    await chooseCombobox('Filter comparison 1', 'Greater than');
    fireEvent.change(screen.getByLabelText('Filter value 1'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    const dataBand = useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data');
    expect(dataBand?.dataBand?.filterExpression).toBe('{orders.amount} > 100');
    expect(screen.getByLabelText('Filter')).toHaveValue('Filtered');
  });

  it('keeps multiple filter conditions editable after reopening the dialog', async () => {
    renderBandProperties('en-US');

    fireEvent.click(screen.getByRole('button', { name: 'Edit filter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add filter condition' }));
    await chooseCombobox('Filter field 1', 'Amount');
    await chooseCombobox('Filter comparison 1', 'Greater than');
    fireEvent.change(screen.getByLabelText('Filter value 1'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add filter condition' }));
    await chooseCombobox('Filter field 2', 'Customer');
    fireEvent.change(screen.getByLabelText('Filter value 2'), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    const dataBand = useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data');
    expect(dataBand?.dataBand?.filterExpression).toBe('{orders.amount} > 100 AND {orders.customer} = "Alice"');

    fireEvent.click(screen.getByRole('button', { name: 'Edit filter' }));

    expect(screen.getByLabelText('Filter value 1')).toHaveValue('100');
    expect(screen.getByLabelText('Filter value 2')).toHaveValue('Alice');
  });

  it('uses the expression editor for filter condition values', async () => {
    renderBandProperties('en-US');

    fireEvent.click(screen.getByRole('button', { name: 'Edit filter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add filter condition' }));
    await chooseCombobox('Filter field 1', 'Amount');
    await chooseCombobox('Filter comparison 1', 'Greater than or equal');
    fireEvent.click(screen.getByRole('button', { name: 'Open expression editor: Filter value 1' }));
    fireEvent.change(screen.getByPlaceholderText('{Sum(Products.UnitPrice * Products.UnitsInStock) - 0}'), {
      target: { value: '{Parameters.MinAmount}' },
    });
    const okButtons = await screen.findAllByRole('button', { name: 'OK' });
    fireEvent.click(okButtons[okButtons.length - 1]);
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    const dataBand = useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data');
    expect(dataBand?.dataBand?.filterExpression).toBe('{orders.amount} >= {Parameters.MinAmount}');
  });

  it('shows comparison choices that match the selected filter field type', async () => {
    renderBandProperties('en-US');

    fireEvent.click(screen.getByRole('button', { name: 'Edit filter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add filter condition' }));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Filter comparison 1' }));
    expect(await screen.findByText('Contains')).toBeInTheDocument();
    expect(screen.queryByText('Greater than')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Contains'));
    fireEvent.change(screen.getByLabelText('Filter value 1'), { target: { value: 'Ali' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    let dataBand = useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data');
    expect(dataBand?.dataBand?.filterExpression).toBe('CONTAINS({orders.customer}, "Ali")');

    fireEvent.click(screen.getByRole('button', { name: 'Edit filter' }));
    await chooseCombobox('Filter field 1', 'Active');
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Filter comparison 1' }));
    const equalMatches = await screen.findAllByText('Equal');
    expect(equalMatches.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not equal').length).toBeGreaterThan(0);
    expect(screen.queryByText('Contains')).not.toBeInTheDocument();
    fireEvent.click(equalMatches[equalMatches.length - 1]);
    fireEvent.change(screen.getByLabelText('Filter value 1'), { target: { value: 'true' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    dataBand = useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data');
    expect(dataBand?.dataBand?.filterExpression).toBe('{orders.active} = true');
  });
});
