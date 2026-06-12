import type { RenderChart } from '@report-designer/core';

export function buildChartDataset(chart: RenderChart): Record<string, unknown>[] {
  const xField = chart.chartType === 'scatter' ? getDimensionField(chart, 'x') : getDimensionField(chart, 'category');
  const yField = chart.chartType === 'scatter' ? getMeasureField(chart, 'y') : getMeasureField(chart, 'value');
  const secondDimensionField = getSecondDimensionField(chart, 'series');
  const secondMeasureField = getSecondMeasureField(chart, 'value2');
  const explicitSeriesField = chart.binding?.seriesField;
  const seriesField = explicitSeriesField || 'series';

  return chart.data.map(point => {
    const row: Record<string, unknown> = {};
    row[xField] = readPointField(point, xField, chart.chartType === 'scatter' ? point.x : point.category);
    row[yField] = readPointField(point, yField, chart.chartType === 'scatter' ? point.y : point.value);
    if (chart.chartType === 'heatmap') {
      row[secondDimensionField] = readPointField(point, secondDimensionField, point.series);
    }
    if (chart.chartType === 'dualAxis') {
      row[secondMeasureField] = readPointField(point, secondMeasureField, undefined);
    }
    if (point.series && (explicitSeriesField || chart.chartType !== 'heatmap')) row[seriesField] = point.series;
    return row;
  });
}

export function getDimensionField(chart: RenderChart, fallback: string): string {
  return chart.binding?.dimensions?.[0]?.field || fallback;
}

export function getSecondDimensionField(chart: RenderChart, fallback: string): string {
  return chart.binding?.dimensions?.[1]?.field || fallback;
}

export function getMeasureField(chart: RenderChart, fallback: string): string {
  return chart.binding?.measures?.[0]?.field || fallback;
}

export function getSecondMeasureField(chart: RenderChart, fallback: string): string {
  return chart.binding?.measures?.[1]?.field || fallback;
}

function readPointField(
  point: RenderChart['data'][number],
  field: string,
  fallback: unknown,
): unknown {
  if (point.raw && Object.prototype.hasOwnProperty.call(point.raw, field)) {
    return point.raw[field];
  }
  return fallback;
}
