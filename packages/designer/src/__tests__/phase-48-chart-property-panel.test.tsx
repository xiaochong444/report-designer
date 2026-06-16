/* @vitest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import type { ChartComponent, ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { PropertyEditor } from '../components/PropertyEditor';
import { DesignerI18nProvider } from '../i18n';
import { useDesignerStore } from '../store/designer-store';

vi.mock('@report-designer/viewer', () => ({
  BARCODE_FORMATS: ['CODE128'],
  QR_CODE_FORMATS: ['QR_CODE'],
}));

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
      measures: [{ field: 'amount', aggregation: 'sum' }],
      sort: [],
    },
    title: { visible: true, text: 'Legacy Sales' },
    legend: { visible: true, position: 'bottom' },
    axes: { x: { visible: true, title: 'Legacy Customer', gridVisible: true }, y: { visible: true, title: 'Legacy Amount', gridVisible: true } },
    theme: { baseTheme: 'light', customPalette: ['#111111', '#222222'] },
    ...overrides,
  };
}

function loadSelectedComponent(component: ReportComponent) {
  const template = createDefaultTemplate('Phase 48 Chart Property Panel');
  template.dataSources = [{
    id: 'orders',
    name: 'orders',
    type: 'json',
    fields: [
      { name: 'customer', type: 'string' },
      { name: 'channel', type: 'string' },
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

function selectedChart(): ChartComponent {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as ChartComponent;
}

function renderEditor(locale: 'en-US' | 'zh-CN' = 'en-US') {
  return render(
    <DesignerI18nProvider locale={locale}>
      <PropertyEditor />
    </DesignerI18nProvider>,
  );
}

function selectOption(label: string, optionText: string) {
  fireEvent.mouseDown(screen.getByLabelText(label));
  fireEvent.click(screen.getByText(optionText));
}

function expandChartSection(label: string) {
  fireEvent.click(screen.getByText(label));
}

describe('phase 48 chart property panel', () => {
  it('renders compact chart sections without a comma-separated palette input', () => {
    loadSelectedComponent(chartComponent());

    renderEditor();

    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Data binding')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText('Axes')).toBeInTheDocument();
    expect(screen.getByText('Labels')).toBeInTheDocument();
    expect(screen.getByText('Type style')).toBeInTheDocument();
    expect(screen.getByLabelText('Chart type')).toBeInTheDocument();
    expect(screen.getByLabelText('Data source')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Comma separated, for example #2f6fed,#16a34a')).not.toBeInTheDocument();
  });

  it('groups chart title and axis fields with short visual labels', () => {
    loadSelectedComponent(chartComponent());

    renderEditor();

    expandChartSection('Title');
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    expect(screen.getAllByText('Size').length).toBeGreaterThan(0);
    expect(screen.queryByText('Subtitle Font color')).not.toBeInTheDocument();

    expandChartSection('Axes');
    expect(screen.getByText('X Axis')).toBeInTheDocument();
    expect(screen.getByText('Y Axis')).toBeInTheDocument();
    expect(screen.getAllByText('Text').length).toBeGreaterThan(0);
    expect(screen.queryByText('X title color')).not.toBeInTheDocument();
    expect(screen.queryByText('Y label font size')).not.toBeInTheDocument();
  });

  it('localizes chart title and axis grouping labels in Chinese', () => {
    loadSelectedComponent(chartComponent());

    renderEditor('zh-CN');

    expandChartSection('标题');
    expect(screen.getByText('标准')).toBeInTheDocument();
    expect(screen.getByText('副标题')).toBeInTheDocument();
    expect(screen.getAllByText('字号').length).toBeGreaterThan(0);
    expect(screen.queryByText('Standard')).not.toBeInTheDocument();
    expect(screen.queryByText('Subtitle')).not.toBeInTheDocument();

    expandChartSection('坐标轴');
    expect(screen.getByText('X 轴')).toBeInTheDocument();
    expect(screen.getByText('Y 轴')).toBeInTheDocument();
    expect(screen.getAllByText('文本').length).toBeGreaterThan(0);
    expect(screen.getAllByText('格式')).toHaveLength(2);
    expect(screen.queryByText('X Axis')).not.toBeInTheDocument();
    expect(screen.queryByText('Text')).not.toBeInTheDocument();
  });

  it('writes title, legend, axes, labels, plot options, and theme edits to structured chart fields', () => {
    loadSelectedComponent(chartComponent());

    renderEditor();

    expandChartSection('Title');
    expect(screen.getByLabelText('Title text')).toHaveValue('Legacy Sales');
    fireEvent.change(screen.getByLabelText('Title text'), { target: { value: 'Quarterly Sales' } });
    fireEvent.change(screen.getByLabelText('Title font size'), { target: { value: '18' } });

    expandChartSection('Legend');
    fireEvent.change(screen.getByLabelText('Legend font size'), { target: { value: '13' } });

    expandChartSection('Axes');
    fireEvent.change(screen.getByLabelText('X axis title'), { target: { value: 'Customer' } });
    expect(screen.getByLabelText('X title color')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('X title font size'), { target: { value: '13' } });
    fireEvent.change(screen.getByLabelText('X label font size'), { target: { value: '11' } });
    fireEvent.change(screen.getByLabelText('Y axis title'), { target: { value: 'Amount' } });
    expect(screen.getByLabelText('Y title color')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Y title font size'), { target: { value: '14' } });
    fireEvent.change(screen.getByLabelText('Y label font size'), { target: { value: '12' } });

    expandChartSection('Labels');
    fireEvent.click(screen.getByLabelText('Labels visible'));
    selectOption('Label content', 'Value');

    expandChartSection('Type style');
    fireEvent.change(screen.getByLabelText('Corner radius'), { target: { value: '6' } });

    expandChartSection('Theme');
    selectOption('Base theme', 'Dark');

    const chart = selectedChart();
    expect(chart.title).toMatchObject({ visible: true, text: 'Quarterly Sales', font: { size: 18 } });
    expect(chart.legend).toMatchObject({ visible: true, position: 'bottom', font: { size: 13 } });
    expect(chart.axes).toMatchObject({
      x: { visible: true, title: 'Customer', titleFont: { size: 13 }, labelFont: { size: 11 } },
      y: { visible: true, title: 'Amount', titleFont: { size: 14 }, labelFont: { size: 12 } },
    });
    expect(chart.labels).toMatchObject({ visible: true, content: 'value' });
    expect(chart.plotOptions).toMatchObject({ bar: { cornerRadius: 6 } });
    expect(chart.theme).toMatchObject({ baseTheme: 'dark' });
    expect(chart.title?.text).toBe('Quarterly Sales');
  });

  it('shows distinct short labels inside the legend panel', () => {
    loadSelectedComponent(chartComponent());

    renderEditor();

    expandChartSection('Legend');
    expect(screen.getAllByText('Position')).toHaveLength(1);
    expect(screen.getByText('Marker')).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Max rows')).toBeInTheDocument();
    expect(screen.getByText('Max columns')).toBeInTheDocument();
  });

  it('shows distinct short labels inside the legend panel in Chinese', () => {
    loadSelectedComponent(chartComponent());

    renderEditor('zh-CN');

    expandChartSection('图例');
    expect(screen.getAllByText('位置')).toHaveLength(1);
    expect(screen.getByText('标记')).toBeInTheDocument();
    expect(screen.getByText('布局')).toBeInTheDocument();
    expect(screen.getByText('最大行数')).toBeInTheDocument();
    expect(screen.getByText('最大列数')).toBeInTheDocument();
  });

  it('shows and edits the chart series field for categorical charts', () => {
    loadSelectedComponent(chartComponent());

    renderEditor();

    expect(screen.getByLabelText('Series field')).toBeInTheDocument();
    selectOption('Series field', 'channel');

    expect(selectedChart().binding.seriesField).toBe('channel');
  });

  it('edits palette through preset and swatch controls', () => {
    loadSelectedComponent(chartComponent({
      theme: { baseTheme: 'light', palettePresetId: 'business', customPalette: ['#111111', '#222222'] },
    }));

    renderEditor();

    expandChartSection('Theme');
    expect(screen.getByLabelText('Palette preset')).toBeInTheDocument();
    expect(screen.getAllByTestId(/chart-palette-swatch-/)).toHaveLength(2);
    expect(screen.queryByPlaceholderText('Comma separated, for example #2f6fed,#16a34a')).not.toBeInTheDocument();

    selectOption('Palette preset', 'Vivid');
    expect(selectedChart().theme).toMatchObject({ palettePresetId: 'vivid' });
    expect(selectedChart().theme?.customPalette).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: 'Add color' }));
    expect(selectedChart().theme?.customPalette).toHaveLength(7);

    const paletteEditor = screen.getByTestId('chart-palette-editor');
    fireEvent.click(within(paletteEditor).getByRole('button', { name: 'Delete color 1' }));
    expect(selectedChart().theme?.customPalette).toEqual(['#5AD8A6', '#F6BD16', '#E8684A', '#6DC8EC', '#9270CA', '#2f6fed']);
  });

  it('keeps palette swatch controls mounted when switching presets', () => {
    loadSelectedComponent(chartComponent({
      theme: { baseTheme: 'light', palettePresetId: 'business' },
    }));

    renderEditor();

    expandChartSection('Theme');
    const firstSwatch = screen.getByTestId('chart-palette-swatch-0');
    selectOption('Palette preset', 'Soft');

    expect(screen.getByTestId('chart-palette-swatch-0')).toBe(firstSwatch);
    expect(selectedChart().theme).toMatchObject({ palettePresetId: 'soft' });
  });
});
