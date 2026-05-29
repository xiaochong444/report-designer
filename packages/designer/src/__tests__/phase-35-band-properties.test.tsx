/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { DesignerI18nProvider } from '../i18n';
import { BandPropertyGrid } from '../components/properties/BandPropertyGrid';
import { useDesignerStore } from '../store/designer-store';

function loadSelectedDataBand() {
  const template = createDefaultTemplate('Band Properties');
  const dataBand = template.pages[0].bands.find(band => band.type === 'data');
  if (!dataBand) throw new Error('Missing data band');
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectBand(dataBand.id);
  return dataBand.id;
}

function selectedBand() {
  const state = useDesignerStore.getState();
  return state.template.pages[0].bands.find(band => band.id === state.selectedBandId);
}

describe('phase 35 band properties', () => {
  it('edits common data band identity, conditions, and print rules from grouped sections', () => {
    loadSelectedDataBand();
    render(
      <DesignerI18nProvider locale="zh-CN">
        <BandPropertyGrid />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('基础')).toBeInTheDocument();
    expect(screen.getByText('数据')).toBeInTheDocument();
    expect(screen.getByText('分页/打印行为')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('名称'), { target: { value: '订单明细' } });
    fireEvent.change(screen.getByLabelText('可见表达式'), { target: { value: '{Parameters.ShowDetails}' } });
    fireEvent.change(screen.getByLabelText('过滤表达式'), { target: { value: '{Orders.Amount} > 0' } });
    fireEvent.mouseDown(screen.getByLabelText('打印页面'));
    fireEvent.click(screen.getByText('除第一页外'));

    expect(selectedBand()).toMatchObject({
      name: '订单明细',
      dataBand: expect.objectContaining({
        filterExpression: '{Orders.Amount} > 0',
      }),
      behavior: expect.objectContaining({
        visibleExpression: '{Parameters.ShowDetails}',
        printOn: 'exceptFirstPage',
      }),
    });
  });

  it('uses component-like horizontal property rows for band sections', () => {
    loadSelectedDataBand();
    render(
      <DesignerI18nProvider locale="zh-CN">
        <BandPropertyGrid />
      </DesignerI18nProvider>,
    );

    expect(screen.getByTestId('band-properties-basic-form')).toHaveClass('ant-form-horizontal');
    expect(screen.getByTestId('band-properties-data-form')).toHaveClass('ant-form-horizontal');
    expect(screen.getByTestId('band-properties-behavior-form')).toHaveClass('ant-form-horizontal');
  });

  it('opens the shared expression editor from band expression fields and applies the edited value', async () => {
    loadSelectedDataBand();
    render(
      <DesignerI18nProvider locale="zh-CN">
        <BandPropertyGrid />
      </DesignerI18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: '打开表达式编辑器：可见表达式' }));
    fireEvent.change(screen.getByPlaceholderText('{Sum(Products.UnitPrice * Products.UnitsInStock) - 0}'), {
      target: { value: '{Parameters.VisibleBand}' },
    });
    fireEvent.click(await screen.findByRole('button', { name: /确\s*定/ }));

    expect(selectedBand()?.behavior?.visibleExpression).toBe('{Parameters.VisibleBand}');

    fireEvent.click(screen.getByRole('button', { name: '打开表达式编辑器：过滤表达式' }));
    fireEvent.change(screen.getByPlaceholderText('{Sum(Products.UnitPrice * Products.UnitsInStock) - 0}'), {
      target: { value: '{Orders.Amount} > 100' },
    });
    fireEvent.click(await screen.findByRole('button', { name: /确\s*定/ }));

    expect(selectedBand()?.dataBand?.filterExpression).toBe('{Orders.Amount} > 100');
  });

  it('shows group properties only for group header bands', async () => {
    const template = createDefaultTemplate('Band Properties');
    const page = template.pages[0];
    const groupBand = {
      id: 'group-1',
      name: 'Department Group',
      type: 'groupHeader' as const,
      height: 10,
      group: { name: 'Department', conditionExpression: '{Employees.Department}' },
      components: [],
    };
    page.bands = [groupBand, ...page.bands];
    useDesignerStore.getState().loadTemplate(template);
    useDesignerStore.getState().selectBand(groupBand.id);

    render(
      <DesignerI18nProvider locale="zh-CN">
        <BandPropertyGrid />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('分组')).toBeInTheDocument();
    expect(screen.queryByText('数据')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('分组名称'), { target: { value: '按部门' } });
    fireEvent.change(screen.getByLabelText('分组表达式'), { target: { value: '{Employees.Team}' } });
    fireEvent.click(screen.getByRole('button', { name: '打开表达式编辑器：分组表达式' }));
    fireEvent.change(screen.getByPlaceholderText('{Sum(Products.UnitPrice * Products.UnitsInStock) - 0}'), {
      target: { value: '{Employees.Department}' },
    });
    fireEvent.click(await screen.findByRole('button', { name: /确\s*定/ }));

    expect(selectedBand()?.group).toMatchObject({
      name: '按部门',
      conditionExpression: '{Employees.Department}',
    });
  });

  it('updates band pagination behavior from the property grid', () => {
    loadSelectedDataBand();
    render(
      <DesignerI18nProvider locale="zh-CN">
        <BandPropertyGrid />
      </DesignerI18nProvider>,
    );

    fireEvent.click(screen.getByLabelText('自动伸展'));
    fireEvent.click(screen.getByLabelText('自动收缩'));
    fireEvent.click(screen.getByLabelText('打印在底部'));
    fireEvent.change(screen.getByLabelText('不足高度换页'), { target: { value: '12' } });

    expect(selectedBand()?.behavior).toMatchObject({
      autoGrow: false,
      autoShrink: true,
      printAtBottom: true,
      breakIfLessThan: 12,
    });
  });

  it('hides band behavior controls that do not affect the selected band type', () => {
    loadSelectedDataBand();
    render(
      <DesignerI18nProvider locale="zh-CN">
        <BandPropertyGrid />
      </DesignerI18nProvider>,
    );

    expect(screen.getByLabelText('自动伸展')).toBeInTheDocument();
    expect(screen.getByLabelText('自动收缩')).toBeInTheDocument();
    expect(screen.queryByLabelText('每页重复打印')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('保持整体')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('允许跨页')).not.toBeInTheDocument();
  });

  it('localizes band behavior controls to English', () => {
    loadSelectedDataBand();
    render(
      <DesignerI18nProvider locale="en-US">
        <BandPropertyGrid />
      </DesignerI18nProvider>,
    );

    expect(screen.getByText('Pagination / Print Behavior')).toBeInTheDocument();
    expect(screen.getByLabelText('Auto Grow')).toBeInTheDocument();
    expect(screen.getByLabelText('Auto Shrink')).toBeInTheDocument();
    expect(screen.queryByText('分页/打印行为')).not.toBeInTheDocument();
  });
});
