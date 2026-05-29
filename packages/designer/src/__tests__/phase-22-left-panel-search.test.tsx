/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate, type ReportComponent, type ReportTemplate } from '@report-designer/core';
import { Designer } from '../components/Designer';

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

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

function textComponent(id: string, name: string): ReportComponent {
  return {
    id,
    name,
    type: 'text',
    x: 0,
    y: 0,
    width: 40,
    height: 8,
    text: name,
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
  } as ReportComponent;
}

function makeTemplate(): ReportTemplate {
  const template = createDefaultTemplate('Grouped Employees');
  template.dataSources = [{
    id: 'employees',
    name: 'Staff Records',
    type: 'json',
    schema: [
      { name: 'name', type: 'string' },
      { name: 'department', type: 'string' },
      { name: 'salary', type: 'number', label: 'Annual Pay' },
    ],
  }];
  const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
  const footerBand = template.pages[0].bands.find(band => band.type === 'pageFooter')!;
  dataBand.components = [textComponent('text-revenue', 'RevenueText')];
  footerBand.components = [textComponent('text-footer', 'FooterText')];
  return template;
}

function expectAntdSearch(input: HTMLElement) {
  const searchRoot = input.closest('.ant-input-search');
  expect(searchRoot).toBeTruthy();
  expect(searchRoot).toHaveClass('rd-panel-search');
  expect(searchRoot?.querySelector('.ant-input-search-btn')).toBeTruthy();
}

describe('Phase 22 left panel search consistency', () => {
  it('uses the shared search shell for components, dictionary, and report tree', async () => {
    render(<Designer template={makeTemplate()} locale="en-US" />);

    expectAntdSearch(await screen.findByPlaceholderText('Search report tree'));

    fireEvent.click(screen.getByRole('tab', { name: /Components/ }));
    expectAntdSearch(await screen.findByPlaceholderText('Search components'));

    fireEvent.click(screen.getByRole('tab', { name: /Dictionary/ }));
    expectAntdSearch(await screen.findByPlaceholderText('Search data sources and fields'));
  });

  it('filters report tree nodes by band and component names while keeping ancestors visible', async () => {
    render(<Designer template={makeTemplate()} locale="en-US" />);

    const reportTree = await screen.findByTestId('report-tree');
    const search = screen.getByPlaceholderText('Search report tree');

    fireEvent.change(search, { target: { value: 'RevenueText' } });

    expect(await screen.findByTestId('report-tree-component-text-revenue')).toBeInTheDocument();
    expect(within(reportTree).getByText('DataBand1')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('report-tree-component-text-footer')).not.toBeInTheDocument();
    });

    fireEvent.change(search, { target: { value: 'PageFooterBand1' } });

    expect(await screen.findByTestId('report-tree-component-text-footer')).toBeInTheDocument();
    expect(within(reportTree).getByText('PageFooterBand1')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('report-tree-component-text-revenue')).not.toBeInTheDocument();
    });
  });

  it('keeps dictionary display-name filtering with the shared search shell', async () => {
    render(<Designer template={makeTemplate()} locale="en-US" />);

    fireEvent.click(screen.getByRole('tab', { name: /Dictionary/ }));
    const search = await screen.findByPlaceholderText('Search data sources and fields');
    fireEvent.change(search, { target: { value: 'Staff Records' } });

    expect(screen.getByText('Staff Records [employees]')).toBeInTheDocument();
    expect(screen.getByText('Annual Pay')).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'Annual Pay' } });

    expect(screen.getByText('Annual Pay')).toBeInTheDocument();
    expect(screen.queryByText('department')).not.toBeInTheDocument();
    expect(search.closest('.rd-panel-search')).toBeTruthy();
  });
});
