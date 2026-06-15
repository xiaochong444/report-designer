import type { ChartType } from '@report-designer/core';

// 从 core re-export 能力判断与映射函数（单一事实来源）。
export {
  isBarLike as isBarLikeChart,
  isLineLike as isLineLikeChart,
  isPieLike as isPieLikeChart,
  isCartesianChart,
  mapVSeedChartType,
} from '@report-designer/core';

/**
 * 字段槽位矩阵。仅保留给 chart-compiler 的字段需求查询使用，
 * 不再作为图表类型能力的单一事实来源（后者已迁入 core 的 chart-capabilities）。
 */
export type ChartFieldKey =
  | 'category'
  | 'dimension'
  | 'measure'
  | 'series'
  | 'x'
  | 'y'
  | 'value'
  | 'secondaryMeasure';

export type ChartFieldRole = 'dimension' | 'measure' | 'series';

export interface ChartFieldRequirement {
  role: ChartFieldRole;
  required: boolean;
  min?: number;
  max?: number;
}

export interface ChartTypeCapability {
  type: ChartType;
  stable: boolean;
  fields: Partial<Record<ChartFieldKey, ChartFieldRequirement>>;
}

const CATEGORY_VALUE_FIELDS: ChartTypeCapability['fields'] = {
  category: { role: 'dimension', required: true, max: 1 },
  value: { role: 'measure', required: true, min: 1, max: 1 },
  series: { role: 'series', required: false, max: 1 },
};

const PIE_VALUE_FIELDS: ChartTypeCapability['fields'] = {
  category: { role: 'dimension', required: true, max: 1 },
  value: { role: 'measure', required: true, max: 1 },
};

export const CHART_TYPE_CAPABILITIES: Record<ChartType, ChartTypeCapability> = {
  column: { type: 'column', stable: true, fields: CATEGORY_VALUE_FIELDS },
  columnParallel: { type: 'columnParallel', stable: true, fields: CATEGORY_VALUE_FIELDS },
  columnPercent: { type: 'columnPercent', stable: true, fields: CATEGORY_VALUE_FIELDS },
  bar: { type: 'bar', stable: true, fields: CATEGORY_VALUE_FIELDS },
  barParallel: { type: 'barParallel', stable: true, fields: CATEGORY_VALUE_FIELDS },
  barPercent: { type: 'barPercent', stable: true, fields: CATEGORY_VALUE_FIELDS },
  line: { type: 'line', stable: true, fields: CATEGORY_VALUE_FIELDS },
  area: { type: 'area', stable: true, fields: CATEGORY_VALUE_FIELDS },
  areaPercent: { type: 'areaPercent', stable: true, fields: CATEGORY_VALUE_FIELDS },
  pie: { type: 'pie', stable: true, fields: PIE_VALUE_FIELDS },
  donut: { type: 'donut', stable: true, fields: PIE_VALUE_FIELDS },
  rose: { type: 'rose', stable: true, fields: PIE_VALUE_FIELDS },
  scatter: {
    type: 'scatter',
    stable: true,
    fields: {
      x: { role: 'dimension', required: true, max: 1 },
      y: { role: 'measure', required: true, max: 1 },
      series: { role: 'series', required: false, max: 1 },
    },
  },
  radar: { type: 'radar', stable: true, fields: CATEGORY_VALUE_FIELDS },
  funnel: { type: 'funnel', stable: true, fields: PIE_VALUE_FIELDS },
  dualAxis: {
    type: 'dualAxis',
    stable: true,
    fields: {
      category: { role: 'dimension', required: true, max: 1 },
      value: { role: 'measure', required: true, max: 1 },
      secondaryMeasure: { role: 'measure', required: true, max: 1 },
      series: { role: 'series', required: false, max: 1 },
    },
  },
  heatmap: {
    type: 'heatmap',
    stable: true,
    fields: {
      x: { role: 'dimension', required: true, max: 1 },
      y: { role: 'dimension', required: true, max: 1 },
      value: { role: 'measure', required: true, max: 1 },
    },
  },
  histogram: { type: 'histogram', stable: false, fields: { value: { role: 'measure', required: true, max: 1 } } },
  boxPlot: { type: 'boxPlot', stable: false, fields: { category: { role: 'dimension', required: false, max: 1 }, value: { role: 'measure', required: true } } },
  sankey: {
    type: 'sankey',
    stable: false,
    fields: {
      x: { role: 'dimension', required: true, max: 1 },
      y: { role: 'dimension', required: true, max: 1 },
      value: { role: 'measure', required: true, max: 1 },
    },
  },
  treeMap: { type: 'treeMap', stable: false, fields: { dimension: { role: 'dimension', required: true }, value: { role: 'measure', required: true, max: 1 } } },
  sunburst: { type: 'sunburst', stable: false, fields: { dimension: { role: 'dimension', required: true }, value: { role: 'measure', required: true, max: 1 } } },
  circlePacking: { type: 'circlePacking', stable: false, fields: { dimension: { role: 'dimension', required: true }, value: { role: 'measure', required: true, max: 1 } } },
};

export function getChartTypeCapability(type: ChartType): ChartTypeCapability {
  return CHART_TYPE_CAPABILITIES[type] ?? CHART_TYPE_CAPABILITIES.column;
}
