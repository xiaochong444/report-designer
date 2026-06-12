import type { RenderChart, ChartType } from '@report-designer/core';
import type { ISpec } from '@visactor/vchart';
import { Builder, registerAll, registerLightTheme, registerDarkTheme } from '@visactor/vseed';
import { applyThemeToSpec } from './chart-themes';

// Ensure VSeed pipelines are registered once
let _registered = false;
function ensureRegistered(): void {
  if (_registered) return;
  _registered = true;
  registerAll();
  registerLightTheme();
  registerDarkTheme();
}

export interface ChartSpecSize {
  width: number;
  height: number;
}

/**
 * Build a VChart ISpec from a RenderChart using the VSeed pipeline.
 *
 * Flow:
 *   RenderChart → VSeed config → Builder.from().build() → VChart ISpec → post-process(theme/markStyle)
 */
export function buildVChartSpec(chart: RenderChart, size?: ChartSpecSize): ISpec {
  ensureRegistered();

  // If no data, return a minimal spec (caller handles empty state)
  if (chart.data.length === 0 && (!chart.rawData || chart.rawData.length === 0)) {
    return buildEmptySpec(chart, size);
  }

  const vseedConfig = buildVSeedConfig(chart, size);
  let spec: Record<string, any>;

  try {
    spec = Builder.from(vseedConfig as any).build() as Record<string, any>;
  } catch {
    // Fallback: return empty spec on VSeed error
    return buildEmptySpec(chart, size);
  }

  // Set explicit dimensions
  if (size?.width) spec.width = size.width;
  if (size?.height) spec.height = size.height;

  // Disable animation for print/snapshot stability
  spec.animation = false;

  // Disable tooltip for report rendering
  spec.tooltip = { visible: false };

  // Apply title
  applyTitle(spec, chart);

  // Apply legend
  applyLegend(spec, chart);

  // Apply labels
  applyLabels(spec, chart);

  // Apply axes customizations
  applyAxes(spec, chart);

  // Apply theme (palette, background, axis colors, fonts)
  applyThemeToSpec(spec, chart.theme);

  // Apply mark style (type-specific customizations)
  applyMarkStyle(spec, chart);

  return spec as ISpec;
}

/**
 * Build the VSeed DSL config from RenderChart.
 */
function buildVSeedConfig(chart: RenderChart, size?: ChartSpecSize): Record<string, any> {
  const dimField = getDimField(chart);
  const meaField = getMeaField(chart);
  const seriesField = getSeriesField(chart);
  const isScatter = chart.chartType === 'scatter';
  const isPieLike = isPieLikeType(chart.chartType);

  // Always use the processed (and possibly aggregated) chart.data.
  // rawData contains ALL source fields which confuses VSeed and produces
  // garbled labels when extra columns (date, yearMonth …) are present.
  const dataset = chart.data.map(point => {
    const row: Record<string, any> = {};
    if (isScatter) {
      row[dimField] = point.x;
      row[meaField] = point.y;
    } else {
      row[dimField] = point.category;
      row[meaField] = point.value;
    }
    if (point.series && seriesField) row[seriesField] = point.series;
    return row;
  });

  const vseedType = mapChartType(chart.chartType);

  const config: Record<string, any> = {
    chartType: vseedType,
    dataset,
  };

  // VSeed uses different field mappings per chart type family
  if (isPieLike) {
    config.angleField = meaField;
    config.categoryField = dimField;
  } else if (isScatter) {
    config.xField = dimField;
    config.yField = meaField;
  } else {
    config.xField = dimField;
    config.yField = meaField;
  }

  // Series / color field
  if (seriesField) {
    config.colorField = seriesField;
  }

  // Size
  if (size?.width) config.width = size.width;
  if (size?.height) config.height = size.height;

  // Label
  if (chart.showLabels) {
    config.label = { enable: true };
  }

  return config;
}

function isPieLikeType(type: ChartType): boolean {
  return type === 'pie' || type === 'donut' || type === 'rose';
}

function mapChartType(type: ChartType): string {
  // VSeed chart type names map directly for most types
  const typeMap: Record<string, string> = {
    column: 'column',
    columnParallel: 'columnParallel',
    columnPercent: 'columnPercent',
    bar: 'bar',
    barParallel: 'barParallel',
    barPercent: 'barPercent',
    line: 'line',
    area: 'area',
    areaPercent: 'areaPercent',
    pie: 'pie',
    donut: 'donut',
    rose: 'rose',
    scatter: 'scatter',
    radar: 'radar',
    funnel: 'funnel',
    dualAxis: 'dualAxis',
    heatmap: 'heatmap',
    histogram: 'histogram',
    boxPlot: 'boxPlot',
    sankey: 'sankey',
    treeMap: 'treeMap',
    sunburst: 'sunburst',
    circlePacking: 'circlePacking',
  };
  return typeMap[type] ?? 'column';
}

function getDimField(chart: RenderChart): string {
  return chart.binding?.dimensions?.[0]?.field ?? 'category';
}

function getMeaField(chart: RenderChart): string {
  return chart.binding?.measures?.[0]?.field ?? 'value';
}

function getSeriesField(chart: RenderChart): string | undefined {
  return chart.binding?.seriesField;
}

// ─── Post-processing helpers ──────────────────────────────

function applyTitle(spec: Record<string, any>, chart: RenderChart): void {
  if (chart.title) {
    spec.title = {
      visible: true,
      text: chart.title,
      ...(chart.subtitle ? { subtext: chart.subtitle } : {}),
    };
  }
}

function applyLegend(spec: Record<string, any>, chart: RenderChart): void {
  if (chart.showLegend) {
    const orient = mapLegendOrient(chart.legendPosition);
    spec.legends = [{ visible: true, orient }];
  } else {
    spec.legends = [{ visible: false }];
  }
}

function mapLegendOrient(position: string): string {
  switch (position) {
    case 'top': return 'top';
    case 'bottom': return 'bottom';
    case 'left': return 'left';
    case 'right': return 'right';
    default: return 'bottom';
  }
}

function applyLabels(spec: Record<string, any>, chart: RenderChart): void {
  if (!chart.showLabels) {
    spec.label = { visible: false };
    return;
  }
  const labelConfig: Record<string, any> = { visible: true };

  // Map labelType to VChart label format
  switch (chart.labelType) {
    case 'value':
      labelConfig.formatMethod = (datum: any) => datum?.value ?? '';
      break;
    case 'percent':
      labelConfig.formatMethod = (datum: any) => {
        const pct = datum?.percent;
        return pct != null ? `${(pct * 100).toFixed(1)}%` : '';
      };
      break;
    case 'name-value':
      labelConfig.formatMethod = (datum: any) => `${datum?.category ?? datum?.name ?? ''}: ${datum?.value ?? ''}`;
      break;
    case 'name':
    default:
      // Use default label behavior
      break;
  }

  if (chart.theme?.labelColor) {
    labelConfig.style = { fill: chart.theme.labelColor };
  }

  spec.label = labelConfig;
}

function applyAxes(spec: Record<string, any>, chart: RenderChart): void {
  if (!chart.showAxes) {
    spec.axes = [];
    return;
  }

  if (!Array.isArray(spec.axes) || spec.axes.length === 0) return;

  // Apply axis titles
  for (const axis of spec.axes) {
    if (axis.orient === 'bottom' && chart.axisTitleX) {
      axis.title = { visible: true, text: chart.axisTitleX };
    }
    if (axis.orient === 'left' && chart.axisTitleY) {
      axis.title = { visible: true, text: chart.axisTitleY };
    }

    // Grid visibility
    if (axis.grid) {
      axis.grid = { ...axis.grid, visible: chart.showGrid };
    }

    // Axis label rotation
    if (chart.axisLabelRotation != null && axis.label) {
      axis.label = {
        ...axis.label,
        style: { ...axis.label.style, angle: chart.axisLabelRotation },
      };
    }
  }
}

function applyMarkStyle(spec: Record<string, any>, chart: RenderChart): void {
  const ms = chart.markStyle;
  if (!ms) return;

  const type = chart.chartType;

  // Bar/Column styles
  if (isBarLike(type)) {
    if (ms.barWidth != null) {
      spec.barMaxWidth = ms.barWidth;
    }
    if (ms.cornerRadius != null) {
      spec.barStyle = [{ cornerRadius: ms.cornerRadius }];
    }
    if (ms.fillOpacity != null) {
      spec.barStyle = [{ ...(spec.barStyle?.[0] ?? {}), fillOpacity: ms.fillOpacity }];
    }
    if (ms.stroke) {
      spec.barStyle = [{ ...(spec.barStyle?.[0] ?? {}), stroke: ms.stroke }];
    }
    if (ms.lineWidth != null) {
      spec.barStyle = [{ ...(spec.barStyle?.[0] ?? {}), lineWidth: ms.lineWidth }];
    }
  }

  // Line/Area styles
  if (isLineLike(type)) {
    const lineStyle: Record<string, any> = {};
    if (ms.curveType) lineStyle.curveType = ms.curveType === 'monotone' ? 'monotone' : ms.curveType;
    if (ms.lineWidth != null) lineStyle.lineWidth = ms.lineWidth;
    if (Object.keys(lineStyle).length > 0) {
      spec.line = { style: lineStyle };
    }
    if (ms.showPoint !== undefined) {
      spec.point = { visible: ms.showPoint, ...(ms.pointSize != null ? { size: ms.pointSize } : {}) };
    }
  }

  // Area-specific
  if (type === 'area' || type === 'areaPercent') {
    if (ms.areaOpacity != null) {
      spec.area = { ...(spec.area ?? {}), style: { ...(spec.area?.style ?? {}), fillOpacity: ms.areaOpacity } };
    }
  }

  // Pie/Donut/Rose styles
  if (isPieLike(type)) {
    if (ms.innerRadius != null) spec.innerRadius = ms.innerRadius;
    if (ms.outerRadius != null) spec.outerRadius = ms.outerRadius;
    if (ms.startAngle != null) spec.startAngle = ms.startAngle;
    if (ms.padAngle != null) spec.padAngle = ms.padAngle;
    // Donut default inner radius
    if (type === 'donut' && ms.innerRadius == null) {
      spec.innerRadius = 0.55;
    }
  }

  // Scatter styles
  if (type === 'scatter') {
    if (ms.pointSize != null) {
      spec.size = ms.pointSize;
    }
    if (ms.pointShape) {
      spec.pointStyle = [{ shape: ms.pointShape }];
    }
  }

  // Radar styles
  if (type === 'radar') {
    if (ms.radarShape) {
      spec.radar = { ...(spec.radar ?? {}), shape: ms.radarShape };
    }
    if (ms.showRadarArea) {
      spec.area = { visible: true, ...(ms.radarAreaOpacity != null ? { style: { fillOpacity: ms.radarAreaOpacity } } : {}) };
    }
  }

  // Funnel styles
  if (type === 'funnel') {
    if (ms.funnelDirection) {
      spec.direction = ms.funnelDirection;
    }
    if (ms.funnelShape) {
      spec.funnel = { ...(spec.funnel ?? {}), shape: ms.funnelShape };
    }
    if (ms.funnelGap != null) {
      spec.funnelGap = ms.funnelGap;
    }
    if (ms.funnelMinSize != null) {
      spec.funnelMinSize = ms.funnelMinSize;
    }
    if (ms.funnelMaxSize != null) {
      spec.funnelMaxSize = ms.funnelMaxSize;
    }
  }
}

// ─── Type helpers ──────────────────────────────

function isBarLike(type: ChartType): boolean {
  return type === 'column' || type === 'columnParallel' || type === 'columnPercent'
    || type === 'bar' || type === 'barParallel' || type === 'barPercent';
}

function isLineLike(type: ChartType): boolean {
  return type === 'line' || type === 'area' || type === 'areaPercent';
}

function isPieLike(type: ChartType): boolean {
  return type === 'pie' || type === 'donut' || type === 'rose';
}

/** Build a minimal empty spec for charts with no data */
function buildEmptySpec(chart: RenderChart, size?: ChartSpecSize): ISpec {
  return {
    type: 'bar' as any,
    width: size?.width,
    height: size?.height,
    data: [{ id: 'empty', values: [] }],
    animation: false,
    tooltip: { visible: false },
    ...(chart.title ? { title: { visible: true, text: chart.title } } : {}),
  } as ISpec;
}
