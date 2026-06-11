/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { JsonDataSourceDialog } from '../components/dialogs/JsonDataSourceDialog';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

describe('Phase 5 JSON data source dialog', () => {
  beforeEach(() => {
    useDesignerStore.getState().loadTemplate(createDefaultTemplate('Dialog Test'));
  });

  it('previews pasted JSON and adds a single inferred JSON root source', () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <JsonDataSourceDialog open onClose={() => {}} />
      </DesignerI18nProvider>,
    );

    fireEvent.change(screen.getByLabelText('JSON'), {
      target: { value: '{ "employees": [{ "name": "Alice", "department": "Engineering", "salary": 100 }] }' },
    });

    expect(screen.getByText('root')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add data sources' }));

    const template = useDesignerStore.getState().template;
    expect(template.dataSources.map(source => source.id)).toEqual(['root']);
    expect((template.dataSources[0].schema ?? []).map((field) => field.name)).toEqual([
      'employees.name',
      'employees.department',
      'employees.salary',
    ]);
  });

  it('keeps nested arrays as root field paths instead of child data sources', () => {
    render(
      <DesignerI18nProvider locale="en-US">
        <JsonDataSourceDialog open onClose={() => {}} />
      </DesignerI18nProvider>,
    );

    fireEvent.change(screen.getByLabelText('JSON'), {
      target: { value: '{ "orders": [{ "orderNo": "A001", "items": [{ "name": "Pen", "qty": 2 }] }] }' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Add data sources' }));

    const template = useDesignerStore.getState().template;
    expect(template.dataSources.map(source => source.id)).toEqual(['root']);
    expect((template.dataSources[0].schema ?? []).map((field) => field.name)).toEqual(expect.arrayContaining([
      'orders.orderNo',
      'orders.items.name',
      'orders.items.qty',
    ]));
  });

  it('localizes visible JSON data source dialog copy to Chinese', () => {
    render(
      <DesignerI18nProvider locale="zh-CN">
        <JsonDataSourceDialog open onClose={() => {}} />
      </DesignerI18nProvider>,
    );

    fireEvent.change(screen.getByLabelText('JSON'), {
      target: { value: '{ "employees": [{ "name": "Alice" }] }' },
    });

    expect(screen.getByText('JSON 数据源')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '添加数据源' })).toBeInTheDocument();
    expect(screen.getByText('名称')).toBeInTheDocument();
    expect(screen.getByText('根数组')).toBeInTheDocument();
    expect(screen.queryByText('JSON Data Source')).not.toBeInTheDocument();
  });

  it('uses localized copy for invalid JSON parse errors', () => {
    render(
      <DesignerI18nProvider locale="zh-CN">
        <JsonDataSourceDialog open onClose={() => {}} />
      </DesignerI18nProvider>,
    );

    fireEvent.change(screen.getByLabelText('JSON'), {
      target: { value: '{ broken json' },
    });

    expect(screen.getByText('JSON 格式不正确')).toBeInTheDocument();
    expect(screen.queryByText(/Unexpected/)).not.toBeInTheDocument();
  });
});
