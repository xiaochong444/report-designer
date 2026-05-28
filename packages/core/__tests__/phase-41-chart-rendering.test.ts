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
    chartType: 'bar',
    variant: 'stacked',
    binding: {
      dataSourceId: 'sales',
      categoryExpression: '{Region}',
      valueExpression: '{Amount}',
      seriesExpression: '{Channel}',
      aggregate: 'sum',
      sort: [{ field: '{Region}', direction: 'asc' }],
    },
    appearance: {
      title: 'Sales by Region',
      showLegend: true,
      legendPosition: 'right',
      showAxes: true,
      showGrid: true,
      showLabels: true,
      palette: ['#2f6fed', '#f59e0b'],
    },
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
        categoryExpression: '{Region}',
        valueExpression: '{Amount}',
      },
      appearance: undefined,
    }));

    const chart = normalized.pages[0].bands[0].components[0] as ChartComponent;
    expect(chart).toMatchObject({
      type: 'chart',
      chartType: 'bar',
      variant: 'stacked',
      binding: {
        dataSourceId: 'sales',
        categoryExpression: '{Region}',
        valueExpression: '{Amount}',
        aggregate: 'none',
      },
      appearance: {
        showLegend: true,
        showAxes: true,
        showGrid: true,
        showLabels: false,
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
      chartType: 'bar',
      variant: 'stacked',
      title: 'Sales by Region',
      showLegend: true,
      legendPosition: 'right',
      showAxes: true,
      showGrid: true,
      showLabels: true,
      palette: ['#2f6fed', '#f59e0b'],
    });
    expect(('data' in chart ? chart.data : []).map(({ category, series, value, label, x, y }) => ({ category, series, value, label, x, y }))).toEqual([
      { category: 'East', series: 'Online', value: 25, label: 'East', x: null, y: 25 },
      { category: 'East', series: 'Retail', value: 20, label: 'East', x: null, y: 20 },
      { category: 'West', series: 'Online', value: 8, label: 'West', x: null, y: 8 },
    ]);
  });

  it('renders point charts with x and y expressions', () => {
    const document = renderReport(chartTemplate({
      chartType: 'point',
      variant: 'scatter',
      binding: {
        dataSourceId: 'sales',
        xExpression: '{Amount}',
        yExpression: '{Margin}',
        seriesExpression: '{Channel}',
      },
    }), {
      sales: [
        { Channel: 'Online', Amount: 10, Margin: 3 },
        { Channel: 'Retail', Amount: 20, Margin: 9 },
      ],
    });

    const chart = document.pages[0].items[0].components[0];
    expect(chart.type).toBe('chart');
    expect(('data' in chart ? chart.data : []).map(({ category, series, value, label, x, y }) => ({ category, series, value, label, x, y }))).toEqual([
      { category: '10', series: 'Online', value: 3, label: '10', x: 10, y: 3 },
      { category: '20', series: 'Retail', value: 9, label: '20', x: 20, y: 9 },
    ]);
  });
});
