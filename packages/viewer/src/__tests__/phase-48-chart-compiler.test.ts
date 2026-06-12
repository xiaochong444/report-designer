import { describe, expect, it } from 'vitest';
import type { RenderChart } from '@report-designer/core';
import { buildChartDataset } from '../renderers/chart/chart-data';
import { buildVSeedInput } from '../renderers/chart/chart-vseed';
import { resolveChartTheme } from '../renderers/chart/chart-theme';
import { buildVChartSpec } from '../renderers/chart/chart-spec';
import { getChartTypeCapability } from '../renderers/chart/chart-type-capabilities';

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

  it('builds pie and scatter field mappings from chart data', () => {
    const pieInput = buildVSeedInput(chart({ chartType: 'pie' }));
    expect(pieInput).toMatchObject({
      chartType: 'pie',
      categoryField: 'category',
      angleField: 'value',
    });
    expect(pieInput.dataset[0]).toEqual({ category: 'East', value: 25, series: 'Online' });

    const scatterInput = buildVSeedInput(chart({
      chartType: 'scatter',
      data: [
        { category: 'A', series: 'Online', value: 0, label: 'A', x: 10, y: 25, raw: {} },
      ],
      binding: {
        dimensions: [{ field: 'x' }],
        measures: [{ field: 'y' }],
        seriesField: 'series',
        aggregate: 'none',
        sort: [],
      },
    }));
    expect(scatterInput).toMatchObject({
      chartType: 'scatter',
      xField: 'x',
      yField: 'y',
      colorField: 'series',
    });
    expect(scatterInput.dataset[0]).toEqual({ x: 10, y: 25, series: 'Online' });
  });

  it('builds heatmap and dualAxis datasets with every mapped field present', () => {
    const heatmapInput = buildVSeedInput(chart({
      chartType: 'heatmap',
      data: [
        { category: 'Mon', series: 'Morning', value: 7, label: 'Mon', x: null, y: 7, raw: { weekday: 'Mon', shift: 'Morning', incidents: 7 } },
      ],
      binding: {
        dimensions: [{ field: 'weekday' }, { field: 'shift' }],
        measures: [{ field: 'incidents' }],
        aggregate: 'sum',
        sort: [],
      },
    }));
    expect(heatmapInput).toMatchObject({
      chartType: 'heatmap',
      xField: 'weekday',
      yField: 'shift',
      valueField: 'incidents',
    });
    expect(heatmapInput.dataset[0]).toEqual({ weekday: 'Mon', shift: 'Morning', incidents: 7 });

    const dualAxisInput = buildVSeedInput(chart({
      chartType: 'dualAxis',
      data: [
        { category: 'Jan', series: undefined, value: 100, label: 'Jan', x: null, y: 100, raw: { month: 'Jan', revenue: 100, margin: 0.34 } },
      ],
      binding: {
        dimensions: [{ field: 'month' }],
        measures: [{ field: 'revenue' }, { field: 'margin' }],
        aggregate: 'sum',
        sort: [],
      },
    }));
    expect(dualAxisInput).toMatchObject({
      chartType: 'dualAxis',
      xField: 'month',
      yField: 'revenue',
      yField2: 'margin',
    });
    expect(dualAxisInput.dataset[0]).toEqual({ month: 'Jan', revenue: 100, margin: 0.34 });
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

  it('maps label content settings to VChart label formatters', () => {
    const nameValueSpec = buildVChartSpec(chart({
      labelsConfig: { visible: true, content: 'name-value' },
    })) as Record<string, any>;
    expect(nameValueSpec.label.formatMethod({ category: 'East', value: 25 })).toBe('East: 25');

    const valueSpec = buildVChartSpec(chart({
      labelsConfig: { visible: true, content: 'value' },
    })) as Record<string, any>;
    expect(valueSpec.label.formatMethod({ value: 25 })).toBe(25);

    const percentSpec = buildVChartSpec(chart({
      labelsConfig: undefined,
      labelType: 'percent',
    })) as Record<string, any>;
    expect(percentSpec.label.formatMethod({ percent: 0.125 })).toBe('12.5%');
  });

  it('maps label formatters to custom binding fields from compiled datasets', () => {
    const customBindingChart = chart({
      data: [
        { category: 'East', series: undefined, value: 25, label: 'East', x: null, y: 25, raw: { region: 'East', sales: 25 } },
      ],
      binding: {
        dimensions: [{ field: 'region' }],
        measures: [{ field: 'sales' }],
        aggregate: 'sum',
        sort: [],
      },
    });

    const valueSpec = buildVChartSpec(chart({
      ...customBindingChart,
      labelsConfig: { visible: true, content: 'value' },
    })) as Record<string, any>;
    expect(valueSpec.label.formatMethod({ region: 'East', sales: 25 })).toBe(25);

    const nameValueSpec = buildVChartSpec(chart({
      ...customBindingChart,
      labelsConfig: { visible: true, content: 'name-value' },
    })) as Record<string, any>;
    expect(nameValueSpec.label.formatMethod({ region: 'East', sales: 25 })).toBe('East: 25');
  });

  it('exposes chart type capability metadata for field requirements', () => {
    expect(getChartTypeCapability('column')).toMatchObject({
      type: 'column',
      fields: {
        category: { role: 'dimension', required: true, max: 1 },
        value: { role: 'measure', required: true, min: 1 },
        series: { role: 'series', required: false, max: 1 },
      },
    });
    expect(getChartTypeCapability('heatmap')).toMatchObject({
      fields: {
        x: { role: 'dimension', required: true, max: 1 },
        y: { role: 'dimension', required: true, max: 1 },
        value: { role: 'measure', required: true, max: 1 },
      },
    });
    expect(getChartTypeCapability('dualAxis')).toMatchObject({
      fields: {
        category: { role: 'dimension', required: true, max: 1 },
        value: { role: 'measure', required: true, max: 1 },
        secondaryMeasure: { role: 'measure', required: true, max: 1 },
      },
    });
  });
});
