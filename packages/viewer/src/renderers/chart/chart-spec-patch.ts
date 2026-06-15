import type { ChartPlotOptions, RenderChart } from '@report-designer/core';
import { isBarLike, isLineLike, isPieLike } from '@report-designer/core';
import { getDimensionField, getMeasureField } from './chart-data';
import { resolveChartTheme } from './chart-theme';

export function applyReportChartSpecPatch(spec: Record<string, any>, chart: RenderChart): void {
  applyDimensions(spec, chart);
  applyTitle(spec, chart);
  applyLegend(spec, chart);
  applyAxes(spec, chart);
  applyLabels(spec, chart);
  applyPaletteFallback(spec, chart);
  applyPlotOptions(spec, chart);
  spec.animation = false;
  spec.tooltip = { visible: false };
}

function applyDimensions(spec: Record<string, any>, chart: RenderChart): void {
  spec.width = spec.width ?? chart.width;
  spec.height = spec.height ?? chart.height;
}

function applyTitle(spec: Record<string, any>, chart: RenderChart): void {
  const title = chart.titleConfig;
  if (title?.visible === false) {
    spec.title = { ...(spec.title ?? {}), visible: false };
    return;
  }
  if (!title?.visible && !chart.title) return;

  spec.title = {
    ...(spec.title ?? {}),
    visible: true,
    text: title?.text ?? chart.title,
    ...(title?.subtitle ?? chart.subtitle ? { subtext: title?.subtitle ?? chart.subtitle } : {}),
    orient: title?.position,
    align: title?.align,
    textStyle: {
      ...(spec.title?.textStyle ?? {}),
      fill: title?.color ?? chart.theme?.titleColor,
      fontFamily: title?.font?.family,
      fontSize: title?.font?.size,
      fontWeight: title?.font?.bold ? 'bold' : undefined,
      fontStyle: title?.font?.italic ? 'italic' : undefined,
    },
    subtextStyle: {
      ...(spec.title?.subtextStyle ?? {}),
      fill: title?.subtitleColor ?? chart.theme?.subtitleColor,
      fontFamily: title?.subtitleFont?.family,
      fontSize: title?.subtitleFont?.size,
    },
  };
}

function applyLegend(spec: Record<string, any>, chart: RenderChart): void {
  const legend = chart.legendConfig;
  const visible = legend?.visible ?? chart.showLegend;
  spec.legends = [{
    ...(Array.isArray(spec.legends) ? spec.legends[0] : {}),
    visible,
    orient: legend?.position ?? chart.legendPosition,
    item: {
      ...(Array.isArray(spec.legends) ? spec.legends[0]?.item : {}),
      label: {
        style: {
          fill: legend?.color ?? chart.theme?.legendLabelColor,
          fontFamily: legend?.font?.family,
          fontSize: legend?.font?.size,
        },
      },
    },
  }];
}

function applyAxes(spec: Record<string, any>, chart: RenderChart): void {
  if (!chart.showAxes && !chart.axesConfig) {
    spec.axes = [];
    return;
  }
  if (!Array.isArray(spec.axes)) {
    spec.axes = [
      { orient: 'bottom' },
      { orient: 'left' },
    ];
  }

  for (const axis of spec.axes) {
    const axisConfig = axis.orient === 'bottom' || axis.orient === 'top' ? chart.axesConfig?.x : chart.axesConfig?.y;
    if (!axisConfig) {
      applyLegacyAxis(axis, chart);
      continue;
    }
    axis.visible = axisConfig.visible;
    axis.title = {
      ...(axis.title ?? {}),
      visible: Boolean(axisConfig.title),
      text: axisConfig.title,
      style: {
        ...(axis.title?.style ?? {}),
        fill: axisConfig.titleColor ?? chart.theme?.axisTitleColor,
        fontFamily: axisConfig.titleFont?.family,
        fontSize: axisConfig.titleFont?.size,
        fontWeight: axisConfig.titleFont?.bold ? 'bold' : undefined,
      },
    };
    axis.label = {
      ...(axis.label ?? {}),
      style: {
        ...(axis.label?.style ?? {}),
        fill: axisConfig.labelColor ?? chart.theme?.axisLabelColor,
        fontFamily: axisConfig.labelFont?.family ?? chart.theme?.fontFamily,
        fontSize: axisConfig.labelFont?.size,
        angle: axisConfig.labelRotate,
      },
    };
    axis.grid = {
      ...(axis.grid ?? {}),
      visible: axisConfig.gridVisible ?? chart.showGrid,
      style: {
        ...(axis.grid?.style ?? {}),
        stroke: axisConfig.gridColor ?? chart.theme?.axisGridColor ?? chart.theme?.gridColor,
        lineDash: axisConfig.gridDash,
      },
    };
    axis.domainLine = {
      ...(axis.domainLine ?? {}),
      visible: axisConfig.lineVisible,
      style: {
        ...(axis.domainLine?.style ?? {}),
        stroke: axisConfig.lineColor ?? chart.theme?.axisLineColor,
      },
    };
  }
}

function applyLegacyAxis(axis: Record<string, any>, chart: RenderChart): void {
  if (axis.orient === 'bottom' && chart.axisTitleX) {
    axis.title = { ...(axis.title ?? {}), visible: true, text: chart.axisTitleX };
  }
  if (axis.orient === 'left' && chart.axisTitleY) {
    axis.title = { ...(axis.title ?? {}), visible: true, text: chart.axisTitleY };
  }
  if (axis.grid) axis.grid = { ...axis.grid, visible: chart.showGrid };
  if (chart.axisLabelRotation != null) {
    axis.label = { ...(axis.label ?? {}), style: { ...(axis.label?.style ?? {}), angle: chart.axisLabelRotation } };
  }
}

function applyLabels(spec: Record<string, any>, chart: RenderChart): void {
  const labels = chart.labelsConfig;
  const visible = labels?.visible ?? chart.showLabels;
  if (!visible) {
    spec.label = { visible: false };
    return;
  }

  spec.label = {
    ...(spec.label ?? {}),
    visible: true,
    formatMethod: buildLabelFormatMethod(chart, labels?.content ?? chart.labelType),
    position: labels?.position === 'auto' ? undefined : labels?.position,
    style: {
      ...(spec.label?.style ?? {}),
      fill: labels?.color ?? chart.theme?.labelColor,
      fontFamily: labels?.font?.family ?? chart.theme?.fontFamily,
      fontSize: labels?.font?.size,
      fontWeight: labels?.font?.bold ? 'bold' : undefined,
      fontStyle: labels?.font?.italic ? 'italic' : undefined,
    },
  };
}

type LabelFormatMethod = (textOrDatum: unknown, datum?: Record<string, any>, ctx?: unknown) => unknown;

function buildLabelFormatMethod(chart: RenderChart, content: RenderChart['labelType'] | 'custom' | undefined): LabelFormatMethod | undefined {
  const nameField = getLabelNameField(chart);
  const valueField = getLabelValueField(chart);
  switch (content) {
    case 'value':
      return (textOrDatum, datum) => {
        const resolvedDatum = resolveFormatDatum(textOrDatum, datum);
        return readDatumValue(resolvedDatum, [valueField, 'value', 'y'], textOrDatum);
      };
    case 'percent':
      return (textOrDatum, datum) => {
        const resolvedDatum = resolveFormatDatum(textOrDatum, datum);
        const percent = resolvedDatum?.percent;
        return percent != null ? `${(percent * 100).toFixed(1)}%` : formatTextFallback(textOrDatum);
      };
    case 'name-value':
      return (textOrDatum, datum) => {
        const resolvedDatum = resolveFormatDatum(textOrDatum, datum);
        const name = readDatumValue(resolvedDatum, [nameField, 'category', 'name', 'label'], '');
        const value = readDatumValue(resolvedDatum, [valueField, 'value', 'y'], textOrDatum);
        return `${name}: ${value}`;
      };
    case 'name':
      return (textOrDatum, datum) => {
        const resolvedDatum = resolveFormatDatum(textOrDatum, datum);
        return readDatumValue(resolvedDatum, [nameField, 'category', 'name', 'label'], textOrDatum);
      };
    default:
      return undefined;
  }
}

function getLabelNameField(chart: RenderChart): string {
  if (chart.chartType === 'scatter') return getDimensionField(chart, 'x');
  if (chart.chartType === 'heatmap') return getDimensionField(chart, 'category');
  return getDimensionField(chart, 'category');
}

function getLabelValueField(chart: RenderChart): string {
  return getMeasureField(chart, chart.chartType === 'scatter' ? 'y' : 'value');
}

function resolveFormatDatum(textOrDatum: unknown, datum?: Record<string, any>): Record<string, any> | undefined {
  if (datum && typeof datum === 'object') return datum;
  if (textOrDatum && typeof textOrDatum === 'object') return textOrDatum as Record<string, any>;
  return undefined;
}

function readDatumValue(datum: Record<string, any> | undefined, fields: string[], fallback: unknown): unknown {
  for (const field of fields) {
    if (datum?.[field] != null) return datum[field];
  }
  return formatTextFallback(fallback);
}

function formatTextFallback(text: unknown): unknown {
  return text ?? '';
}

function applyPaletteFallback(spec: Record<string, any>, chart: RenderChart): void {
  const resolved = resolveChartTheme(chart.theme);
  spec.theme = resolved.themeName;
  if (chart.theme?.backgroundColor) spec.background = chart.theme.backgroundColor;
  if (chart.theme?.fontFamily) spec.fontFamily = chart.theme.fontFamily;

  if (spec.color && typeof spec.color === 'object' && !Array.isArray(spec.color)) {
    spec.color.range = resolved.palette;
  } else {
    spec.color = { range: resolved.palette };
  }
}

function applyPlotOptions(spec: Record<string, any>, chart: RenderChart): void {
  const plotOptions: ChartPlotOptions = chart.plotOptions ?? {};
  if (isBarLike(chart.chartType)) {
    const bar = plotOptions.bar;
    if (!bar) return;
    if (bar.barWidth != null) spec.barMaxWidth = bar.barWidth;
    spec.barStyle = [{
      ...(spec.barStyle?.[0] ?? {}),
      ...(bar.cornerRadius != null ? { cornerRadius: bar.cornerRadius } : {}),
      ...(bar.fillOpacity != null ? { fillOpacity: bar.fillOpacity } : {}),
      ...(bar.borderColor ? { stroke: bar.borderColor } : {}),
      ...(bar.borderWidth != null ? { lineWidth: bar.borderWidth } : {}),
    }];
  }

  if (isLineLike(chart.chartType)) {
    const line = plotOptions.line;
    const area = plotOptions.area;
    if (line) {
      spec.line = {
        ...(spec.line ?? {}),
        style: {
          ...(spec.line?.style ?? {}),
          ...(line.curveType ? { curveType: line.curveType } : {}),
          ...(line.lineWidth != null ? { lineWidth: line.lineWidth } : {}),
        },
      };
      if (line.showPoint !== undefined) {
        spec.point = { visible: line.showPoint, ...(line.pointSize != null ? { size: line.pointSize } : {}) };
      }
    }
    if (area?.areaOpacity != null) {
      spec.area = { ...(spec.area ?? {}), style: { ...(spec.area?.style ?? {}), fillOpacity: area.areaOpacity } };
    }
  }

  if (isPieLike(chart.chartType)) {
    const pie = plotOptions.pie;
    if (!pie && chart.chartType !== 'donut') return;
    if (pie?.innerRadius != null) spec.innerRadius = pie.innerRadius;
    if (pie?.outerRadius != null) spec.outerRadius = pie.outerRadius;
    if (pie?.startAngle != null) spec.startAngle = pie.startAngle;
    if (pie?.padAngle != null) spec.padAngle = pie.padAngle;
    if (chart.chartType === 'donut' && pie?.innerRadius == null) spec.innerRadius = 0.55;
  }

  if (chart.chartType === 'scatter' && plotOptions.scatter) {
    if (plotOptions.scatter.pointSize != null) spec.size = plotOptions.scatter.pointSize;
    if (plotOptions.scatter.pointShape) spec.pointStyle = [{ shape: plotOptions.scatter.pointShape }];
  }

  if (chart.chartType === 'radar' && plotOptions.radar) {
    if (plotOptions.radar.shape) spec.radar = { ...(spec.radar ?? {}), shape: plotOptions.radar.shape };
    if (plotOptions.radar.showArea) spec.area = { visible: true, ...(plotOptions.radar.areaOpacity != null ? { style: { fillOpacity: plotOptions.radar.areaOpacity } } : {}) };
  }

  if (chart.chartType === 'funnel' && plotOptions.funnel) {
    if (plotOptions.funnel.direction) spec.direction = plotOptions.funnel.direction;
    if (plotOptions.funnel.shape) spec.funnel = { ...(spec.funnel ?? {}), shape: plotOptions.funnel.shape };
    if (plotOptions.funnel.gap != null) spec.funnelGap = plotOptions.funnel.gap;
    if (plotOptions.funnel.minSize != null) spec.funnelMinSize = plotOptions.funnel.minSize;
    if (plotOptions.funnel.maxSize != null) spec.funnelMaxSize = plotOptions.funnel.maxSize;
  }
}
