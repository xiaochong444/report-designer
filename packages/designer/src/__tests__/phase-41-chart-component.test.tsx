/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import type { ChartComponent, ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { LeftPanel } from '../components/LeftPanel';
import { PropertyEditor } from '../components/PropertyEditor';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

function chartComponent(overrides: Partial<ChartComponent> = {}): ChartComponent {
  return {
    id: 'chart-1',
    type: 'chart',
    name: 'Chart1',
    x: 10,
    y: 8,
    width: 80,
    height: 45,
    chartType: 'column',
    binding: {
      dataSourceId: 'orders',
      dimensions: [{ field: 'customer' }],
      measures: [{ field: 'amount' }],
      seriesField: '',
      labelField: '',
      sort: [],
      aggregate: 'sum',
    },
    appearance: {
      title: 'Sales',
      showLegend: true,
      legendPosition: 'bottom',
      showAxes: true,
      showGrid: true,
      showLabels: false,
      theme: { baseTheme: 'light' },
      axisTitleX: '',
      axisTitleY: 'Amount',
    },
    ...overrides,
  };
}

function loadSelectedComponent(component: ReportComponent) {
  const template = createDefaultTemplate('Phase 41 Chart Designer');
  template.dataSources = [{
    id: 'orders',
    name: 'orders',
    type: 'json',
    fields: [
      { name: 'customer', type: 'string' },
      { name: 'amount', type: 'number' },
      { name: 'qty', type: 'number' },
    ],
  }];
  template.pages[0].bands.find(band => band.type === 'data')!.components = [component];

  act(() => {
    useDesignerStore.getState().loadTemplate(template);
    useDesignerStore.getState().selectComponents([component.id]);
  });
}

describe('phase 41 chart component designer integration', () => {
  it('shows chart in the component palette', () => {
    render(<DesignerI18nProvider locale="zh-CN"><LeftPanel /></DesignerI18nProvider>);

    fireEvent.click(screen.getByText('组件'));

    expect(screen.getByTestId('component-palette-item-chart')).toHaveTextContent('图表');
    expect(screen.getByTestId('component-palette-item-chart')).toHaveAttribute('draggable', 'true');
  });

  it('renders chart binding and appearance properties', () => {
    loadSelectedComponent(chartComponent());

    render(<PropertyEditor />);

    expect(screen.getByLabelText('图表类型')).toBeInTheDocument();
    expect(screen.getByLabelText('数据源')).toBeInTheDocument();
    expect(screen.getByLabelText('图表标题')).toHaveValue('Sales');
  });

  it('renders a lightweight chart preview on the design canvas', () => {
    loadSelectedComponent(chartComponent({
      data: [
        { category: 'A', value: 20, raw: {} },
        { category: 'B', value: 40, raw: {} },
      ],
    }));

    render(<Canvas />);

    expect(screen.getByTestId('designer-component-chart-content')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
  });

  it('uses localized chart property labels in English', () => {
    loadSelectedComponent(chartComponent());

    render(<DesignerI18nProvider locale="en-US"><PropertyEditor /></DesignerI18nProvider>);

    expect(screen.getByText('Chart Properties')).toBeInTheDocument();
    expect(screen.getByLabelText('Chart type')).toBeInTheDocument();
  });
});
