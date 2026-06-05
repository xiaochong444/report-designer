/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate, type ReportTemplate } from '@report-designer/core';
import { Designer } from '../components/Designer';
import { ExpressionEditor } from '../components/ExpressionEditor';
import type { ExpressionCatalogExtensions } from '../expression/expression-catalog';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => (
    <textarea
      aria-label={props['aria-label'] as string}
      value={props.value as string}
      onChange={(event) => (props.onChange as (value: string | undefined) => void)(event.target.value)}
    />
  ),
}));

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
        { name: 'CreatedAt', type: 'date' },
        { name: 'Discontinued', type: 'boolean' },
      ],
    },
  ];
  return template;
}

const expressionExtensions: ExpressionCatalogExtensions = {
  functions: [
    {
      name: 'DISCOUNT',
      category: 'number',
      signature: 'DISCOUNT(price, rate)',
      detail: 'DISCOUNT(price, rate)',
      insertText: 'DISCOUNT(${1:price}, ${2:rate})',
      description: {
        'zh-CN': '按折扣率计算折后金额。',
        'en-US': 'Calculates a discounted amount by rate.',
      },
      examples: ['DISCOUNT({Products.UnitPrice}, 0.8)'],
      evaluate: ([price, rate]) => Number(price) * Number(rate),
    },
    {
      name: 'SUM',
      category: 'aggregate',
      signature: 'SUM(custom)',
      detail: 'SUM(custom)',
      insertText: 'SUM(${1:custom})',
      description: {
        'zh-CN': '重复函数不应显示。',
        'en-US': 'Duplicate function should not be shown.',
      },
      examples: ['SUM(custom)'],
    },
  ],
  variables: [
    {
      name: '{TenantName}',
      description: {
        'zh-CN': '当前租户名称。',
        'en-US': 'Current tenant name.',
      },
      previewValue: '演示租户',
    },
    {
      name: '{Today}',
      description: {
        'zh-CN': '重复变量不应显示。',
        'en-US': 'Duplicate variable should not be shown.',
      },
      previewValue: 'duplicate',
    },
  ],
  formats: [
    {
      name: 'FORMAT("CN_DATE", value)',
      insertText: 'FORMAT("${1:CN_DATE}", ${2:value})',
      detail: {
        'zh-CN': '中文日期',
        'en-US': 'Chinese date',
      },
      description: {
        'zh-CN': '按中文日期习惯展示年月日。',
        'en-US': 'Formats a value as a Chinese date.',
      },
    },
    {
      name: 'FORMAT("N2", value)',
      insertText: 'FORMAT("${1:N2}", ${2:value})',
      detail: {
        'zh-CN': '重复格式',
        'en-US': 'Duplicate format',
      },
      description: {
        'zh-CN': '重复格式不应显示。',
        'en-US': 'Duplicate format should not be shown.',
      },
    },
  ],
};

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
    expect(screen.queryByRole('button', { name: '聚合' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /html/i })).not.toBeInTheDocument();

    const treeSearch = screen.getByPlaceholderText('搜索');
    const editorInput = screen.getAllByRole('textbox')[0] as HTMLTextAreaElement;
    expect(treeSearch).toBeInTheDocument();
    expect(editorInput.closest('.rd-expression-editor-main')).toBeInTheDocument();
    expect(treeSearch.closest('.rd-expression-browser')).toBeInTheDocument();
    expect(treeSearch.closest('.ant-input-search')).toBeInTheDocument();
    const searchButton = treeSearch.closest('.rd-expression-browser')?.querySelector('.ant-input-search-btn');
    expect(searchButton).toBeInTheDocument();
    expect(screen.getByText('数据源')).toBeInTheDocument();
    expect(screen.getAllByText('格式').length).toBeGreaterThan(0);
    expect(screen.queryByRole('treeitem', { name: 'ProductName' })).not.toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: 'SUM' })).not.toBeInTheDocument();

    fireEvent.change(treeSearch, { target: { value: 'UnitPrice' } });
    const unitPriceItem = await screen.findByRole('treeitem', { name: 'UnitPrice' });
    expect(screen.queryByRole('treeitem', { name: 'Products.UnitPrice' })).not.toBeInTheDocument();
    expect(unitPriceItem.querySelector('.rd-expression-tree-glyph-field-number')).toBeInTheDocument();
    fireEvent.click(within(unitPriceItem).getByText('UnitPrice'));
    await waitFor(() => {
      expect(editorInput.value).toContain('{Products.UnitPrice}');
    });

    fireEvent.change(treeSearch, { target: { value: 'ProductName' } });
    const productNameItem = await screen.findByRole('treeitem', { name: 'ProductName' });
    expect(productNameItem.querySelector('.rd-expression-tree-glyph-field-string')).toBeInTheDocument();

    fireEvent.change(treeSearch, { target: { value: 'CreatedAt' } });
    const createdAtItem = await screen.findByRole('treeitem', { name: 'CreatedAt' });
    expect(createdAtItem.querySelector('.rd-expression-tree-glyph-field-date')).toBeInTheDocument();

    fireEvent.change(treeSearch, { target: { value: 'Discontinued' } });
    const discontinuedItem = await screen.findByRole('treeitem', { name: 'Discontinued' });
    expect(discontinuedItem.querySelector('.rd-expression-tree-glyph-field-boolean')).toBeInTheDocument();

    fireEvent.change(treeSearch, { target: { value: 'SUM' } });
    const sumItem = await screen.findByRole('treeitem', { name: 'SUM' });
    fireEvent.click(within(sumItem).getByText('SUM'));
    const functionDescription = screen.getByTestId('expression-tree-description');
    expect(functionDescription).toHaveTextContent('SUM');
    expect(functionDescription).toHaveTextContent('对指定字段表达式进行求和');
    expect(functionDescription).toHaveTextContent('示例: SUM({Orders.Amount})');
    expect(functionDescription).toHaveClass('rd-expression-tree-description');
    await waitFor(() => {
      expect(editorInput.value).toContain('SUM');
    });
    fireEvent.click(screen.getByRole('button', { name: '确 定' }));

    await waitFor(() => {
      expect(nextValue).toContain('{Products.UnitPrice}');
      expect(nextValue).toContain('SUM');
    });
  });

  it('uses the selected designer locale in the expression shell', async () => {
    useDesignerStore.getState().loadTemplate(makeDictionaryTemplate());

    render(
      <DesignerI18nProvider locale="en-US">
        <ExpressionEditor
          open
          value=""
          onChange={() => {}}
          onClose={() => {}}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.getAllByText('Text').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Expression/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Data Column/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /System/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByText('Data sources')).toBeInTheDocument();
    expect(screen.getAllByText('Format').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Validate' })).toBeInTheDocument();

    const treeSearch = screen.getByPlaceholderText('Search');
    fireEvent.change(treeSearch, { target: { value: 'Today' } });
    const todayItem = await screen.findByRole('treeitem', { name: '{Today}' });
    fireEvent.click(within(todayItem).getByText('{Today}'));
    const systemDescription = screen.getByTestId('expression-tree-description');
    expect(systemDescription).toHaveTextContent('{Today}');
    expect(systemDescription).toHaveTextContent('Current date');

    fireEvent.change(treeSearch, { target: { value: 'N2' } });
    const numberFormatItem = await screen.findByRole('treeitem', { name: 'FORMAT("N2", value)' });
    fireEvent.click(within(numberFormatItem).getByText('FORMAT("N2", value)'));
    expect(screen.getByTestId('expression-tree-description')).toHaveTextContent('Formats a number with two decimal places.');
  });

  it('shows injected custom functions, variables, and formats with localized descriptions without duplicates', async () => {
    useDesignerStore.getState().loadTemplate(makeDictionaryTemplate());

    render(
      <DesignerI18nProvider locale="en-US">
        <ExpressionEditor
          open
          value=""
          expressionExtensions={expressionExtensions}
          onChange={() => {}}
          onClose={() => {}}
        />
      </DesignerI18nProvider>,
    );

    const treeSearch = screen.getByPlaceholderText('Search');
    const editorInput = screen.getAllByRole('textbox')[0] as HTMLTextAreaElement;

    fireEvent.change(treeSearch, { target: { value: 'DISCOUNT' } });
    const discountItem = await screen.findByRole('treeitem', { name: 'DISCOUNT' });
    expect(discountItem.querySelector('.rd-expression-tree-glyph-function')).toBeInTheDocument();
    fireEvent.click(within(discountItem).getByText('DISCOUNT'));
    expect(screen.getByTestId('expression-tree-description')).toHaveTextContent('Calculates a discounted amount by rate.');
    expect(screen.getByTestId('expression-tree-description')).toHaveTextContent('Example: DISCOUNT({Products.UnitPrice}, 0.8)');
    await waitFor(() => {
      expect(editorInput.value).toContain('DISCOUNT(price, rate)');
    });

    fireEvent.change(treeSearch, { target: { value: 'TenantName' } });
    const tenantItem = await screen.findByRole('treeitem', { name: '{TenantName}' });
    fireEvent.click(within(tenantItem).getByText('{TenantName}'));
    expect(screen.getByTestId('expression-tree-description')).toHaveTextContent('Current tenant name.');
    expect(editorInput.value).toContain('{TenantName}');

    fireEvent.change(treeSearch, { target: { value: 'CN_DATE' } });
    const formatItem = await screen.findByRole('treeitem', { name: 'FORMAT("CN_DATE", value)' });
    fireEvent.click(within(formatItem).getByText('FORMAT("CN_DATE", value)'));
    expect(screen.getByTestId('expression-tree-description')).toHaveTextContent('Formats a value as a Chinese date.');

    fireEvent.change(treeSearch, { target: { value: 'SUM' } });
    expect(await screen.findAllByRole('treeitem', { name: 'SUM' })).toHaveLength(1);

    fireEvent.change(treeSearch, { target: { value: 'Today' } });
    expect(await screen.findAllByRole('treeitem', { name: '{Today}' })).toHaveLength(1);

    fireEvent.change(treeSearch, { target: { value: 'N2' } });
    expect(await screen.findAllByRole('treeitem', { name: 'FORMAT("N2", value)' })).toHaveLength(1);
  });

  it('does not expose HTML helper entries in the expression shell', async () => {
    useDesignerStore.getState().loadTemplate(makeDictionaryTemplate());

    render(
      <DesignerI18nProvider locale="zh-CN">
        <ExpressionEditor
          open
          value=""
          onChange={() => {}}
          onClose={() => {}}
        />
      </DesignerI18nProvider>,
    );

    expect(screen.queryByRole('button', { name: /HTML/i })).not.toBeInTheDocument();
    expect(screen.queryByText('HTML 标签')).not.toBeInTheDocument();
    expect(screen.queryByText('加粗')).not.toBeInTheDocument();
    expect(screen.queryByText('斜体')).not.toBeInTheDocument();
    expect(screen.queryByText('换行')).not.toBeInTheDocument();
    expect(screen.queryByText('Html Tag')).not.toBeInTheDocument();
  });
});
