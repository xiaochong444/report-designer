/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate, type ReportTemplate } from '@report-designer/core';
import { Designer } from '../components/Designer';
import { ExpressionEditor } from '../components/ExpressionEditor';
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

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

function makeDictionaryTemplate(): ReportTemplate {
  const template = createDefaultTemplate('Dictionary Demo');
  template.dataSources = [
    {
      id: 'Products',
      name: 'Products',
      type: 'json',
      schema: [
        { name: 'ProductID', type: 'number' },
        { name: 'ProductName', type: 'string' },
        { name: 'UnitPrice', type: 'number' },
        { name: 'Discontinued', type: 'boolean' },
      ],
    },
  ];
  return template;
}

describe('Phase 16 dictionary tree and expression shell', () => {
  it('shows a larger searchable dictionary tree and filters fields by name', async () => {
    render(<Designer template={makeDictionaryTemplate()} />);

    fireEvent.click(screen.getByRole('tab', { name: /字典/ }));

    const searchInput = await screen.findByPlaceholderText('搜索数据源和字段');
    expect(searchInput).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Data Source/i })).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'UnitPrice' } });

    const dictionaryPanel = screen.getByTestId('dictionary-tree');
    expect(within(dictionaryPanel).getByText('UnitPrice')).toBeInTheDocument();
    await waitFor(() => {
      expect(within(dictionaryPanel).queryByText('ProductName')).not.toBeInTheDocument();
    });
  });

  it('renders the expression shell with category rail and searchable insert tree', async () => {
    useDesignerStore.getState().loadTemplate(makeDictionaryTemplate());

    let nextValue = '';
    render(
      <ExpressionEditor
        open
        value=""
        onChange={(value) => {
          nextValue = value;
        }}
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: /表达式/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /数据列/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /系统变量/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /聚合/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /html/i })).toBeInTheDocument();

    const treeSearch = screen.getByPlaceholderText('搜索');
    const editorInput = screen.getAllByRole('textbox')[0] as HTMLTextAreaElement;
    expect(treeSearch).toBeInTheDocument();
    expect(screen.getByText('数据源')).toBeInTheDocument();
    expect(screen.getByText('格式')).toBeInTheDocument();

    fireEvent.change(treeSearch, { target: { value: 'UnitPrice' } });
    const unitPriceItem = await screen.findByRole('treeitem', { name: 'Products.UnitPrice' });
    fireEvent.click(within(unitPriceItem).getByText('Products.UnitPrice'));
    await waitFor(() => {
      expect(editorInput.value).toContain('{Products.UnitPrice}');
    });

    fireEvent.click(screen.getByRole('button', { name: /聚合/i }));
    const sumItem = await screen.findByRole('treeitem', { name: 'SUM' });
    fireEvent.click(within(sumItem).getByText('SUM'));
    await waitFor(() => {
      expect(editorInput.value).toContain('SUM');
    });
    fireEvent.click(screen.getByRole('button', { name: '确 定' }));

    await waitFor(() => {
      expect(nextValue).toContain('{Products.UnitPrice}');
      expect(nextValue).toContain('SUM');
    });
  });
});
