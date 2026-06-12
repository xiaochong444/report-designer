import type { RenderChart } from '@report-designer/core';
import { buildChartDataset, getDimensionField, getMeasureField, getSecondDimensionField, getSecondMeasureField } from './chart-data';
import { isPieLikeChart, mapVSeedChartType } from './chart-type-capabilities';
import { resolveChartTheme } from './chart-theme';
import type { ChartSpecSize } from './chart-spec';

export function buildVSeedInput(chart: RenderChart, size?: ChartSpecSize): Record<string, any> {
  const chartType = mapVSeedChartType(chart.chartType);
  const xField = getDimensionField(chart, 'category');
  const yField = getMeasureField(chart, 'value');
  const input: Record<string, any> = {
    chartType,
    dataset: buildChartDataset(chart),
    theme: resolveChartTheme(chart.theme).themeName,
  };

  if (isPieLikeChart(chart.chartType)) {
    input.categoryField = xField;
    input.angleField = yField;
  } else if (chart.chartType === 'heatmap') {
    input.xField = xField;
    input.yField = getSecondDimensionField(chart, 'series');
    input.valueField = yField;
  } else if (chart.chartType === 'dualAxis') {
    input.xField = xField;
    input.yField = yField;
    input.yField2 = getSecondMeasureField(chart, 'value2');
  } else {
    input.xField = chart.chartType === 'scatter' ? getDimensionField(chart, 'x') : xField;
    input.yField = chart.chartType === 'scatter' ? getMeasureField(chart, 'y') : yField;
  }

  if (chart.binding?.seriesField) input.colorField = chart.binding.seriesField;
  if (chart.labelsConfig?.visible || chart.showLabels) input.label = { enable: true };
  if (size?.width) input.width = size.width;
  if (size?.height) input.height = size.height;

  return input;
}
