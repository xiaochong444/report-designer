import type { RenderChart } from '@report-designer/core';

export function buildChartDataset(chart: RenderChart): Record<string, unknown>[] {
  const xField = chart.chartType === 'scatter' ? getDimensionField(chart, 'x') : getDimensionField(chart, 'category');
  const yField = chart.chartType === 'scatter' ? getMeasureField(chart, 'y') : getMeasureField(chart, 'value');
  const seriesField = chart.binding?.seriesField || 'series';

  return chart.data.map(point => {
    const row: Record<string, unknown> = {};
    row[xField] = chart.chartType === 'scatter' ? point.x : point.category;
    row[yField] = chart.chartType === 'scatter' ? point.y : point.value;
    if (point.series) row[seriesField] = point.series;
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
