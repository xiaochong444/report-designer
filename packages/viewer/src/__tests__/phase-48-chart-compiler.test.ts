import { describe, expect, it } from 'vitest';
import type { RenderChart } from '@report-designer/core';
import { buildChartDataset } from '../renderers/chart/chart-data';
import { buildVSeedInput } from '../renderers/chart/chart-vseed';
import { resolveChartTheme } from '../renderers/chart/chart-theme';
import { buildVChartSpec } from '../renderers/chart/chart-spec';

function chart(overrides: Partial<RenderChart> = {}): RenderChart {
  return {
    id: 'chart-1',
    type: 'chart',
    x: 0,
    y: 0,
    width: 120,
    height: 60,
    chartType: 'column',
    data: [
      { category: 'East', series: 'Online', value: 25, label: 'East', x: null, y: 25, raw: {} },
      { category: 'West', series: 'Retail', value: 15, label: 'West', x: null, y: 15, raw: {} },
    ],
    rawData: [],
    binding: {
      dimensions: [{ field: 'category' }],
      measures: [{ field: 'value' }],
      seriesField: 'series',
      aggregate: 'sum',
      sort: [],
    },
    title: 'Sales',
    showLegend: true,
    legendPosition: 'right',
    showAxes: true,
    showGrid: true,
    showLabels: true,
    labelType: 'name-value',
    axisTitleX: 'Region',
    axisTitleY: 'Amount',
    aggregate: 'sum',
    emptyMessage: 'No chart data',
    titleConfig: {
      visible: true,
      text: 'Sales',
      subtitle: 'Monthly',
      color: '#111827',
      font: { family: 'Arial', size: 16, bold: true },
    },
    legendConfig: {
      visible: true,
      position: 'right',
      color: '#334155',
      font: { family: 'Arial', size: 11 },
    },
    axesConfig: {
      x: {
        visible: true,
        title: 'Region',
        labelRotate: -20,
        labelColor: '#475569',
        titleColor: '#0f172a',
        gridVisible: true,
        gridColor: '#e2e8f0',
      },
      y: {
        visible: true,
        title: 'Amount',
        labelColor: '#475569',
        titleColor: '#0f172a',
        gridVisible: true,
        gridColor: '#e2e8f0',
      },
    },
    labelsConfig: {
      visible: true,
      content: 'name-value',
      color: '#1f2937',
      font: { family: 'Arial', size: 10 },
    },
    theme: {
      baseTheme: 'light',
      customPalette: ['#ff0000', '#00ff00'],
      fontFamily: 'Arial',
      axisLabelColor: '#475569',
      axisTitleColor: '#0f172a',
      axisGridColor: '#e2e8f0',
      labelColor: '#1f2937',
      legendLabelColor: '#334155',
    },
    plotOptions: {
      bar: {
        cornerRadius: 6,
        fillOpacity: 0.75,
      },
    },
    style: {},
    ...overrides,
  };
}

describe('phase 48 chart compiler', () => {
  it('builds chart datasets from render chart points', () => {
    expect(buildChartDataset(chart())).toEqual([
      { category: 'East', value: 25, series: 'Online' },
      { category: 'West', value: 15, series: 'Retail' },
    ]);
  });

  it('builds VSeed input with verified field mappings', () => {
    const input = buildVSeedInput(chart(), { width: 320, height: 180 });
    expect(input).toMatchObject({
      chartType: 'column',
      xField: 'category',
      yField: 'value',
      colorField: 'series',
      width: 320,
      height: 180,
    });
    expect(input.dataset).toHaveLength(2);
  });

  it('resolves a deterministic token theme name and palette', () => {
    const resolved = resolveChartTheme(chart().theme);
    expect(resolved.themeName).toMatch(/^rd-chart-light-/);
    expect(resolved.palette).toEqual(['#ff0000', '#00ff00']);
  });

  it('applies report title, axis, labels, palette, and bar options to final spec', () => {
    const spec = buildVChartSpec(chart(), { width: 320, height: 180 }) as Record<string, any>;

    expect(spec.width).toBe(320);
    expect(spec.height).toBe(180);
    expect(spec.title?.text).toBe('Sales');
    expect(spec.title?.textStyle?.fill).toBe('#111827');
    expect(spec.color?.range ?? spec.color?.colorScheme).toEqual(['#ff0000', '#00ff00']);
    expect(JSON.stringify(spec)).toContain('#475569');
    expect(JSON.stringify(spec)).toContain('#1f2937');
    expect(JSON.stringify(spec)).toContain('cornerRadius');
  });
});
