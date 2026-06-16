import type { ChartPlotOptions, ChartType } from '../template-model/types';

/**
 * 图表类型能力矩阵。
 *
 * 作为"每种 chartType 该显示哪些属性面板/字段/数据角色"的单一事实来源，
 * 由 designer（属性面板显隐、字段槽位）和 viewer（VSeed 字段映射、数据 reshape）共享读取。
 *
 * 9 个维度逐一对账现状代码，无冗余：
 * - axes：坐标轴形态，决定 ChartAxesPanel 是否出现及内部分支
 * - legend：图例形态，决定 ChartLegendPanel 是否出现及形态
 * - labelContent：可选标签内容，过滤 ChartLabelPanel 的 content 下拉；空数组隐藏面板
 * - styleOptions：适用样式组，过滤 ChartTypeStylePanel 渲染哪些字段组；空数组隐藏面板
 * - series：系列来源；fieldOrMeasureNames 表示可显式绑定系列字段，也可由多度量生成系列名
 * - dimensions：维度结构，控制 ChartDataPanel 的维度槽位数量与提示
 * - measures：度量槽位数量与 axis 字段
 * - grid：仅 cartesian 图表显示网格开关
 * - stability：viewer 原 STABLE/ADVANCED 分类迁入 core
 */
export interface ChartCapabilities {
  axes: false | 'xy' | 'radial' | 'rightY';
  legend: false | 'categorical' | 'continuous';
  labelContent: Array<'name' | 'value' | 'percent' | 'name-value'>;
  styleOptions: Array<keyof ChartPlotOptions>;
  series: false | 'measureNames' | 'fieldOrMeasureNames';
  dimensions: 'single' | 'dual' | 'hierarchical';
  measures: 'single' | 'multi' | 'dualAxis';
  grid: boolean;
  stability: 'stable' | 'advanced';
}

export const CHART_CAPABILITIES: Record<ChartType, ChartCapabilities> = {
  // 柱状/条形家族
  column:         { axes: 'xy', legend: 'categorical', labelContent: ['name', 'value', 'percent', 'name-value'], styleOptions: ['bar'],       series: 'fieldOrMeasureNames', dimensions: 'single', measures: 'multi', grid: true, stability: 'stable' },
  columnParallel: { axes: 'xy', legend: 'categorical', labelContent: ['name', 'value', 'name-value'],           styleOptions: ['bar'],       series: 'fieldOrMeasureNames', dimensions: 'single', measures: 'multi', grid: true, stability: 'stable' },
  columnPercent:  { axes: 'xy', legend: 'categorical', labelContent: ['name', 'percent', 'name-value'],         styleOptions: ['bar'],       series: 'fieldOrMeasureNames', dimensions: 'single', measures: 'multi', grid: true, stability: 'stable' },
  bar:            { axes: 'xy', legend: 'categorical', labelContent: ['name', 'value', 'percent', 'name-value'], styleOptions: ['bar'],      series: 'fieldOrMeasureNames', dimensions: 'single', measures: 'multi', grid: true, stability: 'stable' },
  barParallel:    { axes: 'xy', legend: 'categorical', labelContent: ['name', 'value', 'name-value'],           styleOptions: ['bar'],       series: 'fieldOrMeasureNames', dimensions: 'single', measures: 'multi', grid: true, stability: 'stable' },
  barPercent:     { axes: 'xy', legend: 'categorical', labelContent: ['name', 'percent', 'name-value'],         styleOptions: ['bar'],       series: 'fieldOrMeasureNames', dimensions: 'single', measures: 'multi', grid: true, stability: 'stable' },

  // 折线/面积家族
  line:        { axes: 'xy', legend: 'categorical', labelContent: ['name', 'value'],   styleOptions: ['line', 'area'], series: 'fieldOrMeasureNames', dimensions: 'single', measures: 'multi', grid: true, stability: 'stable' },
  area:        { axes: 'xy', legend: 'categorical', labelContent: ['name', 'value'],   styleOptions: ['line', 'area'], series: 'fieldOrMeasureNames', dimensions: 'single', measures: 'multi', grid: true, stability: 'stable' },
  areaPercent: { axes: 'xy', legend: 'categorical', labelContent: ['name', 'percent'], styleOptions: ['line', 'area'], series: 'fieldOrMeasureNames', dimensions: 'single', measures: 'multi', grid: true, stability: 'stable' },

  // 饼/环/玫瑰家族（无坐标轴、无网格）
  pie:   { axes: false, legend: 'categorical', labelContent: ['name', 'value', 'percent', 'name-value'], styleOptions: ['pie'], series: false, dimensions: 'single', measures: 'single', grid: false, stability: 'stable' },
  donut: { axes: false, legend: 'categorical', labelContent: ['name', 'value', 'percent', 'name-value'], styleOptions: ['pie'], series: false, dimensions: 'single', measures: 'single', grid: false, stability: 'stable' },
  rose:  { axes: false, legend: 'categorical', labelContent: ['name', 'value', 'percent', 'name-value'], styleOptions: ['pie'], series: false, dimensions: 'single', measures: 'single', grid: false, stability: 'stable' },

  // 散点（双维度）
  scatter: { axes: 'xy', legend: false, labelContent: ['name', 'value'], styleOptions: ['scatter'], series: false, dimensions: 'dual', measures: 'single', grid: true, stability: 'stable' },

  // 雷达（径向轴）
  radar: { axes: 'radial', legend: 'categorical', labelContent: ['name', 'value'], styleOptions: ['radar'], series: 'fieldOrMeasureNames', dimensions: 'single', measures: 'multi', grid: false, stability: 'stable' },

  // 漏斗（无坐标轴）
  funnel: { axes: false, legend: 'categorical', labelContent: ['name', 'value', 'percent'], styleOptions: ['funnel'], series: false, dimensions: 'single', measures: 'single', grid: false, stability: 'stable' },

  // 双轴（右轴）
  dualAxis: { axes: 'rightY', legend: 'categorical', labelContent: ['name', 'value'], styleOptions: ['dualAxis'], series: 'fieldOrMeasureNames', dimensions: 'single', measures: 'dualAxis', grid: true, stability: 'stable' },

  // 热力（连续色带图例、双维度）
  heatmap: { axes: false, legend: 'continuous', labelContent: ['value'], styleOptions: ['heatmap'], series: false, dimensions: 'dual', measures: 'single', grid: false, stability: 'stable' },

  // 直方（复用 bar 样式）
  histogram: { axes: 'xy', legend: false, labelContent: ['value'], styleOptions: ['bar'], series: false, dimensions: 'single', measures: 'single', grid: true, stability: 'advanced' },

  // 箱线（暂不暴露样式、无标签）
  boxPlot: { axes: 'xy', legend: 'categorical', labelContent: [], styleOptions: [], series: false, dimensions: 'single', measures: 'multi', grid: true, stability: 'advanced' },

  // 桑基（源/目标双维度 + 权重）
  sankey: { axes: false, legend: false, labelContent: ['name', 'value'], styleOptions: [], series: false, dimensions: 'dual', measures: 'single', grid: false, stability: 'advanced' },

  // 层级家族（层级维度、无坐标轴、无网格）
  treeMap:       { axes: false, legend: false, labelContent: ['name', 'value'], styleOptions: [], series: false, dimensions: 'hierarchical', measures: 'single', grid: false, stability: 'advanced' },
  sunburst:      { axes: false, legend: false, labelContent: ['name', 'value'], styleOptions: [], series: false, dimensions: 'hierarchical', measures: 'single', grid: false, stability: 'advanced' },
  circlePacking: { axes: false, legend: false, labelContent: ['name', 'value'], styleOptions: [], series: false, dimensions: 'hierarchical', measures: 'single', grid: false, stability: 'advanced' },
};

const FALLBACK_CAPABILITIES: ChartCapabilities = CHART_CAPABILITIES.column;

export function getChartCapabilities(type: ChartType): ChartCapabilities {
  return CHART_CAPABILITIES[type] ?? FALLBACK_CAPABILITIES;
}

// —— 派生判断（收敛旧的 isXxxLike，designer/viewer 共用）——

export function isBarLike(type: ChartType): boolean {
  return CHART_CAPABILITIES[type].styleOptions.includes('bar');
}

export function isLineLike(type: ChartType): boolean {
  return CHART_CAPABILITIES[type].styleOptions.includes('line');
}

export function isPieLike(type: ChartType): boolean {
  const caps = CHART_CAPABILITIES[type];
  return caps.axes === false && caps.styleOptions.includes('pie');
}

export function isCartesianChart(type: ChartType): boolean {
  return CHART_CAPABILITIES[type].axes === 'xy' || CHART_CAPABILITIES[type].axes === 'rightY';
}

export const STABLE_CHART_TYPES: readonly ChartType[] = (
  Object.entries(CHART_CAPABILITIES) as Array<[ChartType, ChartCapabilities]>
).filter(([, caps]) => caps.stability === 'stable').map(([type]) => type);

export const ADVANCED_CHART_TYPES: readonly ChartType[] = (
  Object.entries(CHART_CAPABILITIES) as Array<[ChartType, ChartCapabilities]>
).filter(([, caps]) => caps.stability === 'advanced').map(([type]) => type);

/** viewer VSeed chartType 映射兜底（未知类型回退 column）。 */
export function mapVSeedChartType(type: ChartType): string {
  return type in CHART_CAPABILITIES ? type : 'column';
}
