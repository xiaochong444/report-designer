import type { RenderChart } from '@report-designer/core';
import type { ISpec } from '@visactor/vchart';

export interface ChartSpecSize {
  width: number;
  height: number;
}

export function buildVChartSpec(chart: RenderChart, size?: ChartSpecSize): ISpec {
  const values = chart.data.map((point) => ({
    category: point.category,
    value: point.value,
    series: point.series ?? chart.title ?? 'Value',
    label: point.label ?? point.category,
    x: point.x,
    y: point.y,
  }));
  const hasSeries = values.some(point => Boolean(point.series));
  const common = {
    width: size?.width,
    height: size?.height,
    data: [{ id: 'chartData', values }],
    color: chart.palette,
    animation: false,
    title: chart.title ? { visible: true, text: chart.title } : undefined,
    legends: chart.showLegend && hasSeries && chart.chartType !== 'pie'
      ? [{ visible: true, orient: chart.legendPosition }]
      : chart.showLegend && chart.chartType === 'pie'
        ? [{ visible: true, orient: chart.legendPosition }]
        : undefined,
    label: { visible: chart.showLabels },
    tooltip: { visible: false },
  };

  if (chart.chartType === 'pie') {
    return {
      ...common,
      type: 'pie',
      categoryField: 'category',
      valueField: 'value',
      innerRadius: chart.variant === 'donut' ? 0.55 : 0,
      outerRadius: 0.85,
    } as ISpec;
  }

  if (chart.chartType === 'point') {
    return {
      ...common,
      type: 'scatter',
      xField: 'x',
      yField: 'y',
      seriesField: hasSeries ? 'series' : undefined,
      axes: chart.showAxes ? cartesianAxes(chart, 'bottom', 'left') : undefined,
    } as ISpec;
  }

  if (chart.chartType === 'bar') {
    const horizontal = chart.variant === 'horizontal';
    return {
      ...common,
      type: 'bar',
      direction: horizontal ? 'horizontal' : 'vertical',
      xField: horizontal ? 'value' : 'category',
      yField: horizontal ? 'category' : 'value',
      seriesField: hasSeries ? 'series' : undefined,
      stack: chart.variant === 'stacked',
      axes: chart.showAxes
        ? cartesianAxes(chart, horizontal ? 'bottom' : 'bottom', horizontal ? 'left' : 'left')
        : undefined,
    } as ISpec;
  }

  if (chart.chartType === 'area') {
    return {
      ...common,
      type: 'area',
      xField: 'category',
      yField: 'value',
      seriesField: hasSeries ? 'series' : undefined,
      stack: chart.variant === 'stacked',
      area: chart.variant === 'smooth' ? { style: { curveType: 'monotone' } } : undefined,
      line: chart.variant === 'smooth' ? { style: { curveType: 'monotone' } } : undefined,
      axes: chart.showAxes ? cartesianAxes(chart, 'bottom', 'left') : undefined,
    } as ISpec;
  }

  return {
    ...common,
    type: 'line',
    xField: 'category',
    yField: 'value',
    seriesField: hasSeries ? 'series' : undefined,
    line: lineStyle(chart.variant),
    point: { visible: true },
    axes: chart.showAxes ? cartesianAxes(chart, 'bottom', 'left') : undefined,
  } as ISpec;
}

function cartesianAxes(chart: RenderChart, xOrient: 'bottom' | 'top', yOrient: 'left' | 'right') {
  return [
    {
      orient: xOrient,
      title: chart.axisTitleX ? { visible: true, text: chart.axisTitleX } : undefined,
      grid: { visible: false },
    },
    {
      orient: yOrient,
      title: chart.axisTitleY ? { visible: true, text: chart.axisTitleY } : undefined,
      grid: { visible: chart.showGrid },
    },
  ];
}

function lineStyle(variant: RenderChart['variant']) {
  if (variant === 'smooth') return { style: { curveType: 'monotone' } };
  if (variant === 'step') return { style: { curveType: 'step' } };
  return undefined;
}
