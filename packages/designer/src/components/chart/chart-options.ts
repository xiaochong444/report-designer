import type {
  ChartAggregateMode,
  ChartAppearance,
  ChartAxesConfig,
  ChartComponent,
  ChartLabelConfig,
  ChartLegendConfig,
  ChartPlotOptions,
  ChartThemeConfig,
  ChartTitleConfig,
  ChartType,
} from '@report-designer/core';

export type ChartPanelT = (key: any, values?: Record<string, string | number>) => string;

export const CHART_PALETTE_PRESETS = [
  { id: 'classic', label: 'Classic', colors: ['#2f6fed', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6'] },
  { id: 'vivid', label: 'Vivid', colors: ['#2563eb', '#db2777', '#ea580c', '#059669', '#7c3aed'] },
  { id: 'calm', label: 'Calm', colors: ['#0f766e', '#3b82f6', '#64748b', '#84cc16', '#06b6d4'] },
  { id: 'warm', label: 'Warm', colors: ['#dc2626', '#f97316', '#eab308', '#a16207', '#be123c'] },
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
    legendColor: 'Legend color',
    xAxisVisible: 'X axis visible',
    yAxisVisible: 'Y axis visible',
    xAxisTitle: 'X axis title',
    yAxisTitle: 'Y axis title',
    xLabelColor: 'X label color',
    yLabelColor: 'Y label color',
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
    legendColor: '图例颜色',
    xAxisVisible: '显示 X 轴',
    yAxisVisible: '显示 Y 轴',
    xAxisTitle: 'X 轴标题',
    yAxisTitle: 'Y 轴标题',
    xLabelColor: 'X 标签颜色',
    yLabelColor: 'Y 标签颜色',
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
  return chart.theme ?? chart.appearance?.theme ?? { baseTheme: 'light' };
}

export function getChartTitle(chart: ChartComponent): ChartTitleConfig {
  return {
    visible: true,
    text: chart.appearance?.title ?? '',
    subtitle: chart.appearance?.subtitle ?? '',
    ...chart.title,
  };
}

export function getChartLegend(chart: ChartComponent): ChartLegendConfig {
  return {
    visible: chart.appearance?.showLegend ?? true,
    position: chart.appearance?.legendPosition ?? 'bottom',
    ...chart.legend,
  };
}

export function getChartAxes(chart: ChartComponent): ChartAxesConfig {
  const appearance = chart.appearance ?? {};
  return {
    x: {
      visible: appearance.showAxes ?? true,
      title: appearance.axisTitleX ?? '',
      labelRotate: appearance.axisLabelRotation ?? 0,
      gridVisible: appearance.showGrid ?? true,
      ...chart.axes?.x,
    },
    y: {
      visible: appearance.showAxes ?? true,
      title: appearance.axisTitleY ?? '',
      gridVisible: appearance.showGrid ?? true,
      ...chart.axes?.y,
    },
    rightY: chart.axes?.rightY,
  };
}

export function getChartLabels(chart: ChartComponent): ChartLabelConfig {
  return {
    visible: chart.appearance?.showLabels ?? false,
    content: chart.appearance?.labelType ?? 'name',
    position: 'auto',
    ...chart.labels,
  };
}

export function getChartPlotOptions(chart: ChartComponent): ChartPlotOptions {
  if (chart.plotOptions) return chart.plotOptions;
  return markStyleToPlotOptions(chart.appearance?.markStyle);
}

export function markStyleToPlotOptions(markStyle?: ChartAppearance['markStyle']): ChartPlotOptions {
  if (!markStyle) return {};
  return {
    bar: {
      barWidth: markStyle.barWidth,
      cornerRadius: markStyle.cornerRadius,
      fillOpacity: markStyle.fillOpacity,
      borderColor: markStyle.stroke,
      borderWidth: markStyle.lineWidth,
      labelPosition: markStyle.barLabelPosition,
    },
    line: {
      curveType: markStyle.curveType,
      lineWidth: markStyle.lineWidth,
      showPoint: markStyle.showPoint,
      pointSize: markStyle.pointSize,
      pointShape: markStyle.pointShape,
      connectNulls: markStyle.connectNulls,
    },
    area: {
      showArea: markStyle.showArea,
      areaOpacity: markStyle.areaOpacity,
    },
    pie: {
      innerRadius: markStyle.innerRadius,
      outerRadius: markStyle.outerRadius,
      startAngle: markStyle.startAngle,
      padAngle: markStyle.padAngle,
      roseType: markStyle.roseType,
    },
    scatter: {
      pointSize: markStyle.pointSize,
      pointShape: markStyle.pointShape,
      fillOpacity: markStyle.fillOpacity,
      showTrendLine: markStyle.showTrendLine,
      trendLineType: markStyle.trendLineType,
    },
    radar: {
      shape: markStyle.radarShape,
      showArea: markStyle.showRadarArea,
      areaOpacity: markStyle.radarAreaOpacity,
      lineWidth: markStyle.lineWidth,
      showPoint: markStyle.showPoint,
      pointSize: markStyle.pointSize,
      axisCount: markStyle.axisCount,
    },
    funnel: {
      direction: markStyle.funnelDirection,
      shape: markStyle.funnelShape,
      showConversionRate: markStyle.showConversionRate,
      gap: markStyle.funnelGap,
      minSize: markStyle.funnelMinSize,
      maxSize: markStyle.funnelMaxSize,
    },
    dualAxis: {
      primaryType: markStyle.primaryType,
      secondaryType: markStyle.secondaryType,
    },
  };
}

export function plotOptionsToMarkStyle(plotOptions: ChartPlotOptions): ChartAppearance['markStyle'] {
  return {
    barWidth: plotOptions.bar?.barWidth,
    cornerRadius: plotOptions.bar?.cornerRadius,
    fillOpacity: plotOptions.bar?.fillOpacity ?? plotOptions.scatter?.fillOpacity,
    stroke: plotOptions.bar?.borderColor,
    lineWidth: plotOptions.bar?.borderWidth ?? plotOptions.line?.lineWidth ?? plotOptions.radar?.lineWidth,
    barLabelPosition: plotOptions.bar?.labelPosition,
    curveType: plotOptions.line?.curveType,
    showPoint: plotOptions.line?.showPoint ?? plotOptions.radar?.showPoint,
    pointSize: plotOptions.line?.pointSize ?? plotOptions.scatter?.pointSize ?? plotOptions.radar?.pointSize,
    pointShape: plotOptions.line?.pointShape ?? plotOptions.scatter?.pointShape,
    connectNulls: plotOptions.line?.connectNulls,
    showArea: plotOptions.area?.showArea,
    areaOpacity: plotOptions.area?.areaOpacity,
    innerRadius: plotOptions.pie?.innerRadius,
    outerRadius: plotOptions.pie?.outerRadius,
    startAngle: plotOptions.pie?.startAngle,
    padAngle: plotOptions.pie?.padAngle,
    roseType: plotOptions.pie?.roseType,
    showTrendLine: plotOptions.scatter?.showTrendLine,
    trendLineType: plotOptions.scatter?.trendLineType,
    radarShape: plotOptions.radar?.shape,
    showRadarArea: plotOptions.radar?.showArea,
    radarAreaOpacity: plotOptions.radar?.areaOpacity,
    axisCount: plotOptions.radar?.axisCount,
    funnelDirection: plotOptions.funnel?.direction,
    funnelShape: plotOptions.funnel?.shape,
    showConversionRate: plotOptions.funnel?.showConversionRate,
    funnelGap: plotOptions.funnel?.gap,
    funnelMinSize: plotOptions.funnel?.minSize,
    funnelMaxSize: plotOptions.funnel?.maxSize,
    primaryType: plotOptions.dualAxis?.primaryType,
    secondaryType: plotOptions.dualAxis?.secondaryType,
  };
}

export function isBarLike(chartType: ChartType) {
  return chartType === 'column' || chartType === 'columnParallel' || chartType === 'columnPercent' || chartType === 'bar' || chartType === 'barParallel' || chartType === 'barPercent';
}

export function isLineLike(chartType: ChartType) {
  return chartType === 'line' || chartType === 'area' || chartType === 'areaPercent';
}

export function isPieLike(chartType: ChartType) {
  return chartType === 'pie' || chartType === 'donut' || chartType === 'rose';
}
