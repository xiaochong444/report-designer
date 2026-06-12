import type { ChartType } from '@report-designer/core';

export const STABLE_CHART_TYPES: readonly ChartType[] = [
  'column', 'columnParallel', 'columnPercent',
  'bar', 'barParallel', 'barPercent',
  'line', 'area', 'areaPercent',
  'pie', 'donut', 'rose',
  'scatter', 'radar', 'funnel', 'dualAxis', 'heatmap',
];

export const ADVANCED_CHART_TYPES: readonly ChartType[] = [
  'histogram', 'boxPlot', 'sankey', 'treeMap', 'sunburst', 'circlePacking',
];

export function isPieLikeChart(type: ChartType): boolean {
  return type === 'pie' || type === 'donut' || type === 'rose';
}

export function isBarLikeChart(type: ChartType): boolean {
  return type === 'column' || type === 'columnParallel' || type === 'columnPercent'
    || type === 'bar' || type === 'barParallel' || type === 'barPercent';
}

export function isLineLikeChart(type: ChartType): boolean {
  return type === 'line' || type === 'area' || type === 'areaPercent';
}

export function isCartesianChart(type: ChartType): boolean {
  return !isPieLikeChart(type) && type !== 'funnel' && type !== 'radar';
}

export function mapVSeedChartType(type: ChartType): string {
  return STABLE_CHART_TYPES.includes(type) || ADVANCED_CHART_TYPES.includes(type) ? type : 'column';
}
