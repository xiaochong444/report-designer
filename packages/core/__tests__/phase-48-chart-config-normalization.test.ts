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
      measures: [{ field: 'Amount' }],
      seriesField: 'Channel',
      aggregate: 'sum',
      sort: [],
    },
    appearance: {
      title: 'Sales by Region',
      subtitle: 'Monthly',
      showLegend: true,
      legendPosition: 'right',
      showAxes: true,
      showGrid: true,
      showLabels: true,
      labelType: 'name-value',
      axisTitleX: 'Region',
      axisTitleY: 'Amount',
      axisLabelRotation: -30,
      theme: {
        baseTheme: 'dark',
        customPalette: ['#ff0000', '#00ff00'],
        axisLabelColor: '#cbd5e1',
        labelColor: '#f8fafc',
      },
      markStyle: {
        cornerRadius: 4,
        fillOpacity: 0.8,
      },
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
  it('normalizes legacy chart appearance into structured chart config', () => {
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
      x: {
        visible: true,
        title: 'Region',
        labelRotate: -30,
        gridVisible: true,
      },
      y: {
        visible: true,
        title: 'Amount',
        gridVisible: true,
      },
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
      bar: {
        cornerRadius: 4,
        fillOpacity: 0.8,
      },
    });
  });

  it('preserves explicit structured chart config over legacy appearance', () => {
    const normalized = normalizeTemplate(makeChartTemplate(makeChart({
      title: {
        visible: true,
        text: 'Explicit Title',
        color: '#111827',
        font: { family: 'Arial', size: 16, bold: true },
      },
      legend: {
        visible: false,
        position: 'bottom',
        color: '#334155',
      },
      labels: {
        visible: true,
        content: 'value',
        color: '#0f172a',
      },
      theme: {
        baseTheme: 'light',
        palettePresetId: 'business',
      },
      plotOptions: {
        bar: {
          cornerRadius: 8,
        },
      },
    })));
    const chart = normalized.pages[0].bands[0].components[0] as ChartComponent;

    expect(chart.title?.text).toBe('Explicit Title');
    expect(chart.title?.color).toBe('#111827');
    expect(chart.legend?.visible).toBe(false);
    expect(chart.labels?.content).toBe('value');
    expect(chart.theme?.palettePresetId).toBe('business');
    expect(chart.plotOptions?.bar?.cornerRadius).toBe(8);
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
        bar: {
          cornerRadius: 4,
        },
      },
    });
  });

  it('uses structured chart config before legacy appearance for render legacy fields', () => {
    const document = renderReport(makeChartTemplate(makeChart({
      appearance: {
        title: 'Legacy Title',
        subtitle: 'Legacy Subtitle',
        showLegend: true,
        legendPosition: 'right',
        showAxes: true,
        showGrid: true,
        showLabels: true,
        labelType: 'name-value',
        axisTitleX: 'Legacy X',
        axisTitleY: 'Legacy Y',
        axisLabelRotation: -30,
        theme: { baseTheme: 'dark' },
        markStyle: {
          cornerRadius: 4,
          fillOpacity: 0.8,
        },
      },
      title: {
        visible: true,
        text: 'Structured Title',
        subtitle: 'Structured Subtitle',
      },
      legend: {
        visible: false,
        position: 'bottom',
      },
      axes: {
        x: {
          visible: true,
          title: 'Structured X',
          labelRotate: 15,
          gridVisible: false,
        },
        y: {
          visible: true,
          title: 'Structured Y',
          gridVisible: false,
        },
      },
      labels: {
        visible: false,
        content: 'percent',
      },
      plotOptions: {
        bar: {
          cornerRadius: 9,
          fillOpacity: 0.4,
        },
      },
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
      showAxes: true,
      showGrid: false,
      showLabels: false,
      labelType: 'percent',
      axisTitleX: 'Structured X',
      axisTitleY: 'Structured Y',
      axisLabelRotation: 15,
      markStyle: {
        cornerRadius: 9,
        fillOpacity: 0.4,
      },
      plotOptions: {
        bar: {
          cornerRadius: 9,
          fillOpacity: 0.4,
        },
      },
    });
  });
});
