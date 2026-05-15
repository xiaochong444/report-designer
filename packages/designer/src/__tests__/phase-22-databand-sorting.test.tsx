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

    fireEvent.click(screen.getByRole('button', { name: 'Add sort rule' }));
    await chooseCombobox('Sort field 1', 'Customer');
    fireEvent.click(screen.getByRole('button', { name: 'Descending' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add sort rule' }));
    await chooseCombobox('Sort field 2', 'Amount');

    const dataBand = () => useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data');
    expect(dataBand()?.dataBand?.sort).toEqual([
      { field: 'customer', direction: 'desc' },
      { field: 'amount', direction: 'asc' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Move sort rule 2 up' }));

    expect(dataBand()?.dataBand?.sort).toEqual([
      { field: 'amount', direction: 'asc' },
      { field: 'customer', direction: 'desc' },
    ]);
  });

  it('refreshes sort fields from schema fallback fields after changing data source', async () => {
    renderBandProperties('en-US');

    await chooseCombobox('Data source', 'Fields Only');
    fireEvent.click(screen.getByRole('button', { name: 'Add sort rule' }));
    await chooseCombobox('Sort field 1', 'Created At');

    const dataBand = useDesignerStore.getState().template.pages[0].bands.find(band => band.type === 'data');
    expect(dataBand?.dataBand).toMatchObject({
      dataSourceId: 'fieldsOnly',
      sort: [{ field: 'createdAt', direction: 'asc' }],
    });
  });

  it('localizes sorting controls to Chinese', () => {
    renderBandProperties('zh-CN');

    const grid = screen.getByTestId('databand-sort-rules');
    expect(within(grid).getByText('排序')).toBeInTheDocument();
    expect(within(grid).getByRole('button', { name: '添加排序规则' })).toBeInTheDocument();
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

    expect(screen.getByTestId('databand-sort-rules')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add sort rule' })).toBeEnabled();
  });
});
