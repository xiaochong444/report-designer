import type { RenderChart } from '@report-designer/core';

/**
 * 将 RenderChart.data 映射为 VSeed 所需的 dataset 行。
 * 数据已在 layout-band 的 buildChartData 中按能力矩阵 reshape（含 series/measureKey/axis/source/target/path），
 * 这里只做字段名归一化，不再读 seriesField（已删除）。
 */
export function buildChartDataset(chart: RenderChart): Record<string, unknown>[] {
  const xField = getDimensionField(chart, 'category');
  const yField = getMeasureField(chart, 'value');
  const secondDimensionField = getSecondDimensionField(chart, 'series');
  const secondMeasureField = getSecondMeasureField(chart, 'value2');
  const seriesField = 'series';

  return chart.data.map(point => {
    const row: Record<string, unknown> = {};
    row[xField] = readDimensionField(point, xField, chart.chartType === 'scatter' ? point.x : point.category);
    row[yField] = readMeasureField(point, yField, chart.chartType === 'scatter' ? point.y : point.value);
    if (chart.chartType === 'heatmap') {
      row[secondDimensionField] = readDimensionField(point, secondDimensionField, point.series);
    }
    if (chart.chartType === 'dualAxis') {
      row[secondMeasureField] = readMeasureField(point, secondMeasureField, undefined);
    }
    if (point.series && chart.chartType !== 'heatmap') row[seriesField] = point.series;
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

function readDimensionField(
  point: RenderChart['data'][number],
  field: string,
  fallback: unknown,
): unknown {
  if (point.raw && Object.prototype.hasOwnProperty.call(point.raw, field)) {
    return point.raw[field];
  }
  return fallback;
}

function readMeasureField(
  point: RenderChart['data'][number],
  field: string,
  fallback: unknown,
): unknown {
  if (point.measureValues && Object.prototype.hasOwnProperty.call(point.measureValues, field)) {
    return point.measureValues[field];
  }
  if (fallback !== undefined) return fallback;
  if (point.raw && Object.prototype.hasOwnProperty.call(point.raw, field)) {
    return point.raw[field];
  }
  return fallback;
}
