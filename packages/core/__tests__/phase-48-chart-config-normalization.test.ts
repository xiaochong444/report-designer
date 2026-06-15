import { describe, expect, it } from 'vitest';
import { normalizeTemplate, renderReport } from '../src';
import type { ChartComponent, ReportTemplate } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

function makeChart(overrides: Partial<ChartComponent> = {}): ChartComponent {
  return {
    id: 'chart-1',
    type: 'chart',
    name: 'Chart1',
    x: 0,
    y: 0,
    width: 120,
    height: 60,
    chartType: 'column',
    binding: {
      dataSourceId: 'sales',
      dimensions: [{ field: 'Region' }],
      measures: [{ field: 'Amount', aggregation: 'sum' }],
      sort: [],
    },
    title: {
      visible: true,
      text: 'Sales by Region',
      subtitle: 'Monthly',
    },
    legend: { visible: true, position: 'right' },
    axes: {
      x: { visible: true, title: 'Region', labelRotate: -30, gridVisible: true },
      y: { visible: true, title: 'Amount', gridVisible: true },
    },
    labels: { visible: true, content: 'name-value' },
    theme: {
      baseTheme: 'dark',
      customPalette: ['#ff0000', '#00ff00'],
      axisLabelColor: '#cbd5e1',
      labelColor: '#f8fafc',
    },
    plotOptions: {
      bar: { cornerRadius: 4, fillOpacity: 0.8 },
    },
    emptyMessage: 'No chart data',
    ...overrides,
  };
}

function makeChartTemplate(component: ChartComponent): ReportTemplate {
  const template = makeTemplate([
    band('title', 'reportTitle', {
      height: 70,
      components: [component],
    }),
  ]);
  template.dataSources = [{
    id: 'sales',
    name: 'Sales',
    type: 'json',
    fields: [
      { name: 'Region', type: 'string' },
      { name: 'Channel', type: 'string' },
      { name: 'Amount', type: 'number' },
    ],
  }];
  return template;
}

describe('phase 48 chart config normalization', () => {
  it('preserves structured chart config through normalization', () => {
    const normalized = normalizeTemplate(makeChartTemplate(makeChart()));
    const chart = normalized.pages[0].bands[0].components[0] as ChartComponent;

    expect(chart.title).toMatchObject({
      visible: true,
      text: 'Sales by Region',
      subtitle: 'Monthly',
    });
    expect(chart.legend).toMatchObject({
      visible: true,
      position: 'right',
    });
    expect(chart.axes).toMatchObject({
      x: { visible: true, title: 'Region', labelRotate: -30, gridVisible: true },
      y: { visible: true, title: 'Amount', gridVisible: true },
    });
    expect(chart.labels).toMatchObject({
      visible: true,
      content: 'name-value',
    });
    expect(chart.theme).toMatchObject({
      baseTheme: 'dark',
      customPalette: ['#ff0000', '#00ff00'],
      axisLabelColor: '#cbd5e1',
      labelColor: '#f8fafc',
    });
    expect(chart.plotOptions).toMatchObject({
      bar: { cornerRadius: 4, fillOpacity: 0.8 },
    });
  });

  it('clips binding dimensions/measures by chart capabilities (single dim + multi measure for column)', () => {
    const normalized = normalizeTemplate(makeChartTemplate(makeChart({
      binding: {
        dataSourceId: 'sales',
        dimensions: [
          { field: 'Region' },
          { field: 'Channel' },
          { field: 'Extra' },
        ],
        measures: [
          { field: 'Amount', aggregation: 'sum' },
          { field: 'Margin', aggregation: 'sum' },
        ],
        sort: [],
      },
    })));
    const chart = normalized.pages[0].bands[0].components[0] as ChartComponent;
    // column 是 single 维度，多余维度被裁剪
    expect(chart.binding.dimensions?.length).toBe(1);
    expect(chart.binding.dimensions?.[0]?.field).toBe('Region');
    // column 是 multi 度量，保留全部
    expect(chart.binding.measures?.length).toBe(2);
  });

  it('passes structured chart config into render documents', () => {
    const document = renderReport(makeChartTemplate(makeChart()), {
      sales: [
        { Region: 'East', Channel: 'Online', Amount: 10 },
      ],
    });
    const chart = document.pages[0].items[0].components[0];

    expect(chart.type).toBe('chart');
    expect(chart).toMatchObject({
      titleConfig: {
        visible: true,
        text: 'Sales by Region',
      },
      legendConfig: {
        visible: true,
        position: 'right',
      },
      labelsConfig: {
        visible: true,
        content: 'name-value',
      },
      theme: {
        baseTheme: 'dark',
      },
      plotOptions: {
        bar: { cornerRadius: 4 },
      },
    });
  });

  it('derives render legacy fields from structured config', () => {
    const document = renderReport(makeChartTemplate(makeChart({
      title: { visible: true, text: 'Structured Title', subtitle: 'Structured Subtitle' },
      legend: { visible: false, position: 'bottom' },
      axes: {
        x: { visible: true, title: 'Structured X', labelRotate: 15, gridVisible: false },
        y: { visible: true, title: 'Structured Y', gridVisible: false },
      },
      labels: { visible: false, content: 'percent' },
      plotOptions: { bar: { cornerRadius: 9, fillOpacity: 0.4 } },
    })), {
      sales: [
        { Region: 'East', Channel: 'Online', Amount: 10 },
      ],
    });
    const chart = document.pages[0].items[0].components[0];

    expect(chart.type).toBe('chart');
    expect(chart).toMatchObject({
      title: 'Structured Title',
      subtitle: 'Structured Subtitle',
      showLegend: false,
      legendPosition: 'bottom',
      showGrid: false,
      showLabels: false,
      labelType: 'percent',
      axisTitleX: 'Structured X',
      axisTitleY: 'Structured Y',
      axisLabelRotation: 15,
      plotOptions: {
        bar: { cornerRadius: 9, fillOpacity: 0.4 },
      },
    });
  });
});
