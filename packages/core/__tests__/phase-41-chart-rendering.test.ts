import { describe, expect, it } from 'vitest';
import { normalizeTemplate, renderReport } from '../src';
import type { ChartComponent, ReportTemplate } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

function chartTemplate(component: Partial<ChartComponent> = {}): ReportTemplate {
  const chart: ChartComponent = {
    id: 'chart-1',
    type: 'chart',
    name: 'SalesChart',
    x: 0,
    y: 0,
    width: 120,
    height: 60,
    chartType: 'column',
    binding: {
      dataSourceId: 'sales',
      dimensions: [{ field: 'Region' }],
      measures: [{ field: 'Amount', aggregation: 'sum' }],
      sort: [{ field: 'Region', direction: 'asc' }],
    },
    title: { visible: true, text: 'Sales by Region' },
    legend: { visible: true, position: 'right' },
    axes: { x: { visible: true, gridVisible: true }, y: { visible: true, gridVisible: true } },
    labels: { visible: true, content: 'name' },
    theme: { baseTheme: 'light', customPalette: ['#2f6fed', '#f59e0b'] },
    ...component,
  };

  const template = makeTemplate([
    band('title', 'reportTitle', {
      height: 70,
      components: [chart],
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

describe('phase 41 chart rendering', () => {
  it('normalizes chart components with safe defaults', () => {
    const normalized = normalizeTemplate(chartTemplate({
      binding: {
        dataSourceId: 'sales',
        dimensions: [{ field: 'Region' }],
        measures: [{ field: 'Amount' }],
      },
    }));

    const chart = normalized.pages[0].bands[0].components[0] as ChartComponent;
    expect(chart).toMatchObject({
      type: 'chart',
      chartType: 'column',
      binding: {
        dataSourceId: 'sales',
        dimensions: [{ field: 'Region' }],
        measures: [{ field: 'Amount' }],
      },
      theme: {
        baseTheme: 'light',
      },
    });
  });

  it('renders aggregated chart data from a JSON data source', () => {
    const document = renderReport(chartTemplate(), {
      sales: [
        { Region: 'East', Channel: 'Online', Amount: 10 },
        { Region: 'East', Channel: 'Online', Amount: 15 },
        { Region: 'East', Channel: 'Retail', Amount: 20 },
        { Region: 'West', Channel: 'Online', Amount: 8 },
      ],
    });

    const chart = document.pages[0].items[0].components[0];
    expect(chart.type).toBe('chart');
    expect(chart).toMatchObject({
      chartType: 'column',
      title: 'Sales by Region',
      showLegend: true,
      legendPosition: 'right',
      showAxes: true,
      showGrid: true,
      showLabels: true,
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
      },
    });
    // 单维度单度量（sum 聚合）：East=45, West=8
    expect(('data' in chart ? chart.data : []).map(({ category, value, label, x, y }) => ({ category, value, label, x, y }))).toEqual([
      { category: 'East', value: 45, label: 'East', x: null, y: 45 },
      { category: 'West', value: 8, label: 'West', x: null, y: 8 },
    ]);
  });

  it('renders scatter charts with x and y dimensions/measures', () => {
    const document = renderReport(chartTemplate({
      chartType: 'scatter',
      binding: {
        dataSourceId: 'sales',
        dimensions: [{ field: 'Amount' }],
        measures: [{ field: 'Margin', aggregation: 'none' }],
      },
    }), {
      sales: [
        { Channel: 'Online', Amount: 10, Margin: 3 },
        { Channel: 'Retail', Amount: 20, Margin: 9 },
      ],
    });

    const chart = document.pages[0].items[0].components[0];
    expect(chart.type).toBe('chart');
    // scatter 删除 seriesField 后 series 为 undefined
    expect(('data' in chart ? chart.data : []).map(({ category, series, value, label, x, y }) => ({ category, series, value, label, x, y }))).toEqual([
      { category: '10', series: undefined, value: 3, label: '10', x: 10, y: 3 },
      { category: '20', series: undefined, value: 9, label: '20', x: 20, y: 9 },
    ]);
  });

  it('renders dual axis aggregate values for every measure field', () => {
    const document = renderReport(chartTemplate({
      chartType: 'dualAxis',
      binding: {
        dataSourceId: 'sales',
        dimensions: [{ field: 'Region' }],
        measures: [
          { field: 'Amount', aggregation: 'sum', axis: 'left' },
          { field: 'Margin', aggregation: 'sum', axis: 'right' },
        ],
        sort: [],
      },
    }), {
      sales: [
        { Region: 'East', Amount: 10, Margin: 3 },
        { Region: 'East', Amount: 15, Margin: 4 },
      ],
    });

    const chart = document.pages[0].items[0].components[0];
    expect(chart.type).toBe('chart');
    // dualAxis 多度量展开：每行按 measure 展开为 point，sum 聚合后按 category::series 分组
    expect(('data' in chart ? chart.data : []).map(point => ({
      category: point.category,
      series: point.series,
      value: point.value,
      y: point.y,
      measureValues: (point as { measureValues?: Record<string, number | null> }).measureValues,
    }))).toEqual([
      { category: 'East', series: 'Amount', value: 25, y: 25, measureValues: { Amount: 25, Margin: 7 } },
      { category: 'East', series: 'Margin', value: 7, y: 7, measureValues: { Amount: 25, Margin: 7 } },
    ]);
  });
});
