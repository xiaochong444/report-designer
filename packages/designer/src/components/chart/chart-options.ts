import type {
  ChartAggregateMode,
  ChartAxesConfig,
  ChartComponent,
  ChartLabelConfig,
  ChartLegendConfig,
  ChartPlotOptions,
  ChartThemeConfig,
  ChartTitleConfig,
  ChartType,
} from '@report-designer/core';
import { isBarLike, isLineLike, isPieLike } from '@report-designer/core';

// 重新导出，供本目录内其它面板文件沿用同源判断（单一事实来源已迁入 core）。
export { isBarLike, isLineLike, isPieLike };

export type ChartPanelT = (key: any, values?: Record<string, string | number>) => string;

export const CHART_PALETTE_PRESETS = [
  { id: 'business', label: 'Business', colors: ['#1E40AF', '#0F766E', '#B45309', '#991B1B', '#5B21B6', '#155E75'] },
  { id: 'vivid', label: 'Vivid', colors: ['#5B8FF9', '#5AD8A6', '#F6BD16', '#E8684A', '#6DC8EC', '#9270CA'] },
  { id: 'soft', label: 'Soft', colors: ['#93C5FD', '#86EFAC', '#FDE68A', '#FCA5A5', '#C4B5FD', '#A5F3FC'] },
  { id: 'ocean', label: 'Ocean', colors: ['#0EA5E9', '#0284C7', '#0369A1', '#38BDF8', '#06B6D4', '#155E75'] },
  { id: 'forest', label: 'Forest', colors: ['#16A34A', '#15803D', '#22C55E', '#4ADE80', '#059669', '#047857'] },
  { id: 'sunset', label: 'Sunset', colors: ['#F97316', '#EA580C', '#F59E0B', '#FBBF24', '#EF4444', '#DC2626'] },
] as const;

export const DEFAULT_PALETTE_COLOR = '#2f6fed';

export function chartUiText(t: ChartPanelT) {
  const english = t('chartType') === 'Chart type';
  return english ? {
    basic: 'Basic',
    data: 'Data binding',
    theme: 'Theme',
    title: 'Title',
    legend: 'Legend',
    axes: 'Axes',
    labels: 'Labels',
    typeStyle: 'Type style',
    visible: 'Visible',
    titleVisible: 'Title visible',
    titleText: 'Title text',
    titleColor: 'Title color',
    titleFontSize: 'Title font size',
    legendVisible: 'Legend visible',
    legendPositionShort: 'Position',
    legendMarkerShape: 'Marker',
    legendLayout: 'Layout',
    legendMaxRows: 'Max rows',
    legendMaxColumns: 'Max columns',
    legendColor: 'Legend color',
    legendFontSize: 'Legend font size',
    xAxisVisible: 'X axis visible',
    yAxisVisible: 'Y axis visible',
    xAxisTitle: 'X axis title',
    yAxisTitle: 'Y axis title',
    xTitleColor: 'X title color',
    yTitleColor: 'Y title color',
    xTitleFontSize: 'X title font size',
    yTitleFontSize: 'Y title font size',
    xLabelColor: 'X label color',
    yLabelColor: 'Y label color',
    xLabelFontSize: 'X label font size',
    yLabelFontSize: 'Y label font size',
    xGridVisible: 'X grid visible',
    yGridVisible: 'Y grid visible',
    xGridColor: 'X grid color',
    yGridColor: 'Y grid color',
    labelsVisible: 'Labels visible',
    labelContent: 'Label content',
    labelColor: 'Label color',
    labelFontSize: 'Label font size',
    baseTheme: 'Base theme',
    palettePreset: 'Palette preset',
    customPalette: 'Custom palette',
    addColor: 'Add color',
    deleteColor: (index: number) => `Delete color ${index}`,
    swatch: (index: number) => `Palette color ${index}`,
    lineWidth: 'Line width',
    heatmapCellGap: 'Cell gap',
    heatmapStartColor: 'Start color',
    heatmapEndColor: 'End color',
    standardGroup: 'Standard',
    subtitleGroup: 'Subtitle',
    axisTitleGroup: 'Title',
    axisLabelGroup: 'Label',
    axisGridGroup: 'Grid',
    axisScaleGroup: 'Scale',
    axisFormatGroup: 'Format',
    textShort: 'Text',
    familyShort: 'Family',
    sizeShort: 'Size',
    colorShort: 'Color',
    visibleShort: 'Visible',
    rotateShort: 'Rotate',
    minShort: 'Min',
    maxShort: 'Max',
    xAxisGroup: 'X Axis',
    yAxisGroup: 'Y Axis',
    rightYAxisGroup: 'Right Y Axis',
    radarAxisCount: 'Axis count',
    radarAxisShape: 'Shape',
    radarVisible: 'Visible',
  } : {
    basic: '基础',
    data: '数据绑定',
    theme: '主题',
    title: '标题',
    legend: '图例',
    axes: '坐标轴',
    labels: '标签',
    typeStyle: '类型样式',
    visible: '显示',
    titleVisible: '显示标题',
    titleText: t('chartTitle'),
    titleColor: '标题颜色',
    titleFontSize: '标题字号',
    legendVisible: '显示图例',
    legendPositionShort: '位置',
    legendMarkerShape: '标记',
    legendLayout: '布局',
    legendMaxRows: '最大行数',
    legendMaxColumns: '最大列数',
    legendColor: '图例颜色',
    legendFontSize: '图例字号',
    xAxisVisible: '显示 X 轴',
    yAxisVisible: '显示 Y 轴',
    xAxisTitle: 'X 轴标题',
    yAxisTitle: 'Y 轴标题',
    xTitleColor: 'X 标题颜色',
    yTitleColor: 'Y 标题颜色',
    xTitleFontSize: 'X 标题字号',
    yTitleFontSize: 'Y 标题字号',
    xLabelColor: 'X 标签颜色',
    yLabelColor: 'Y 标签颜色',
    xLabelFontSize: 'X 标签字号',
    yLabelFontSize: 'Y 标签字号',
    xGridVisible: '显示 X 网格',
    yGridVisible: '显示 Y 网格',
    xGridColor: 'X 网格颜色',
    yGridColor: 'Y 网格颜色',
    labelsVisible: '显示标签',
    labelContent: '标签内容',
    labelColor: '标签颜色',
    labelFontSize: '标签字号',
    baseTheme: '基础主题',
    palettePreset: '色板预设',
    customPalette: '自定义色板',
    addColor: '添加颜色',
    deleteColor: (index: number) => `删除颜色 ${index}`,
    swatch: (index: number) => `色板颜色 ${index}`,
    lineWidth: '线宽',
    heatmapCellGap: '单元间距',
    heatmapStartColor: '起始颜色',
    heatmapEndColor: '结束颜色',
    standardGroup: '标准',
    subtitleGroup: '副标题',
    axisTitleGroup: '标题',
    axisLabelGroup: '标签',
    axisGridGroup: '网格',
    axisScaleGroup: '范围',
    axisFormatGroup: '格式',
    textShort: '文本',
    familyShort: '字体',
    sizeShort: '字号',
    colorShort: '颜色',
    visibleShort: '显示',
    rotateShort: '旋转',
    minShort: '最小值',
    maxShort: '最大值',
    xAxisGroup: 'X 轴',
    yAxisGroup: 'Y 轴',
    rightYAxisGroup: '右 Y 轴',
    radarAxisCount: '轴数量',
    radarAxisShape: '形状',
    radarVisible: '显示',
  };
}

export function chartTypeOptions(t: ChartPanelT): Array<{ value: ChartType; label: string }> {
  return [
    { value: 'column', label: t('chartTypeColumn') },
    { value: 'columnParallel', label: t('chartTypeColumnParallel') },
    { value: 'columnPercent', label: t('chartTypeColumnPercent') },
    { value: 'bar', label: t('chartTypeBar') },
    { value: 'barParallel', label: t('chartTypeBarParallel') },
    { value: 'barPercent', label: t('chartTypeBarPercent') },
    { value: 'line', label: t('chartTypeLine') },
    { value: 'area', label: t('chartTypeArea') },
    { value: 'areaPercent', label: t('chartTypeAreaPercent') },
    { value: 'pie', label: t('chartTypePie') },
    { value: 'donut', label: t('chartTypeDonut') },
    { value: 'rose', label: t('chartTypeRose') },
    { value: 'scatter', label: t('chartTypeScatter') },
    { value: 'radar', label: t('chartTypeRadar') },
    { value: 'funnel', label: t('chartTypeFunnel') },
    { value: 'dualAxis', label: t('chartTypeDualAxis') },
    { value: 'heatmap', label: t('chartTypeHeatmap') },
    { value: 'histogram', label: t('chartTypeHistogram') },
    { value: 'boxPlot', label: t('chartTypeBoxPlot') },
    { value: 'treeMap', label: t('chartTypeTreeMap') },
    { value: 'sunburst', label: t('chartTypeSunburst') },
    { value: 'circlePacking', label: t('chartTypeCirclePacking') },
  ];
}

export function chartAggregateOptions(t: ChartPanelT): Array<{ value: ChartAggregateMode; label: string }> {
  return [
    { value: 'none', label: t('chartAggregateNone') },
    { value: 'sum', label: t('chartAggregateSum') },
    { value: 'avg', label: t('chartAggregateAvg') },
    { value: 'count', label: t('chartAggregateCount') },
    { value: 'min', label: t('chartAggregateMin') },
    { value: 'max', label: t('chartAggregateMax') },
  ];
}

export function getChartTheme(chart: ChartComponent): ChartThemeConfig {
  return chart.theme ?? { baseTheme: 'light' };
}

export function getChartTitle(chart: ChartComponent): ChartTitleConfig {
  return { visible: true, text: '', subtitle: '', ...chart.title };
}

export function getChartLegend(chart: ChartComponent): ChartLegendConfig {
  return { visible: true, position: 'bottom', ...chart.legend };
}

export function getChartAxes(chart: ChartComponent): ChartAxesConfig {
  return chart.axes ?? {};
}

export function getChartLabels(chart: ChartComponent): ChartLabelConfig {
  return { visible: false, content: 'name', position: 'auto', ...chart.labels };
}

export function getChartPlotOptions(chart: ChartComponent): ChartPlotOptions {
  return chart.plotOptions ?? {};
}
