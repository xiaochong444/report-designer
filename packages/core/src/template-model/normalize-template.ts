import type {
  Band,
  ChartAppearance,
  ChartAxesConfig,
  ChartBinding,
  ChartComponent,
  ChartLabelConfig,
  ChartLegendConfig,
  ChartPlotOptions,
  ChartTitleConfig,
  DataField,
  DataSource,
  Page,
  PageBorder,
  PageWatermark,
  PanelComponent,
  ReportComponent,
  ReportTemplate,
  TableComponent,
} from './types';
import { normalizeReportFonts } from '../fonts';
import { isRepeatOnEveryPageBandType, mapDataField } from './types';
import { createDefaultPageBorder, createDefaultPageWatermark } from './template';

export function normalizeTemplate(template: ReportTemplate): ReportTemplate {
  return {
    ...template,
    version: '2.0',
    pages: template.pages.map(normalizePage),
    dataSources: template.dataSources.map(normalizeDataSource),
    parameters: template.parameters ?? [],
    fonts: normalizeReportFonts(template.fonts),
  };
}

function normalizePage(page: Page): Page {
  return {
    ...page,
    watermark: normalizePageWatermark(page.watermark),
    pageBorder: normalizePageBorder(page.pageBorder),
    bands: page.bands.map(normalizeBand),
  };
}

function normalizePageWatermark(watermark: Page['watermark']): PageWatermark {
  return {
    ...createDefaultPageWatermark(),
    ...watermark,
  };
}

function normalizePageBorder(pageBorder: Page['pageBorder']): PageBorder {
  const defaults = createDefaultPageBorder();
  return {
    ...defaults,
    ...pageBorder,
    sides: {
      ...defaults.sides,
      ...pageBorder?.sides,
    },
  };
}

function normalizeDataSource(source: DataSource): DataSource {
  const sourceFields = source.fields?.length ? source.fields : (source.schema ?? []);
  const fields = sourceFields.map(field => normalizeField(source, field));

  return {
    ...source,
    path: source.path ?? source.id,
    fields,
    schema: fields,
  };
}

function normalizeField(source: Pick<DataSource, 'id'>, field: DataField): DataField {
  if (field.id && field.path && field.nullable !== undefined) {
    return field;
  }

  const mapped = mapDataField(source, field);
  return {
    ...mapped,
    ...field,
    id: field.id ?? mapped.id,
    path: field.path ?? mapped.path,
    nullable: field.nullable ?? mapped.nullable,
  };
}

function normalizeBand(band: Band): Band {
  const dataBand = band.dataBand || band.dataSource || band.sort
    ? {
        ...band.dataBand,
        dataSourceId: band.dataBand?.dataSourceId ?? band.dataSource,
        sort: band.dataBand?.sort ?? band.sort,
      }
    : undefined;
  const group = band.group || band.groupField
    ? {
        ...band.group,
        conditionExpression: band.group?.conditionExpression ?? (band.type === 'groupHeader' && band.groupField ? band.groupField : undefined),
      }
    : undefined;

  return {
    ...band,
    behavior: band.behavior ?? {
      enabled: true,
      visibleExpression: band.visible,
      printOn: 'allPages',
      printIfEmpty: true,
      printOnAllPages: isRepeatOnEveryPageBandType(band.type),
      keepTogether: false,
      canBreak: band.type === 'data',
      printAtBottom: band.type === 'pageFooter',
      autoGrow: true,
      autoShrink: false,
    },
    dataBand,
    group,
    components: band.components.map(normalizeComponent),
  };
}

function normalizeComponent(component: ReportComponent): ReportComponent {
  if (component.type === 'panel' && Array.isArray((component as any).components)) {
    const panel = component as PanelComponent;
    return {
      ...panel,
      components: panel.components.map((child: ReportComponent) => normalizeComponent(child)),
    } as PanelComponent;
  }

  if (component.type === 'table') {
    const table = component as TableComponent;
    return {
      ...table,
      binding: undefined,
      dataSource: undefined,
    } as TableComponent;
  }

  if (component.type === 'chart') {
    const chart = component as ChartComponent;
    const appearance = normalizeChartAppearance(chart.appearance);
    return {
      ...chart,
      chartType: chart.chartType ?? 'column',
      binding: normalizeChartBinding(chart.binding),
      appearance,
      title: chart.title ?? normalizeChartTitle(appearance),
      legend: chart.legend ?? normalizeChartLegend(appearance),
      axes: chart.axes ?? normalizeChartAxes(appearance),
      labels: chart.labels ?? normalizeChartLabels(appearance),
      theme: chart.theme ?? appearance.theme ?? { baseTheme: 'light' },
      plotOptions: chart.plotOptions ?? normalizeChartPlotOptions(appearance.markStyle),
    } as ChartComponent;
  }

  return { ...component };
}

function normalizeChartBinding(binding: ChartBinding | undefined): ChartBinding {
  return {
    dataSourceId: binding?.dataSourceId,
    arrayPath: binding?.arrayPath,
    dimensions: binding?.dimensions ?? [],
    measures: binding?.measures ?? [],
    seriesField: binding?.seriesField,
    labelField: binding?.labelField,
    aggregate: binding?.aggregate ?? 'none',
    sort: binding?.sort ?? [],
    filterExpression: binding?.filterExpression,
  };
}

function normalizeChartAppearance(appearance: ChartAppearance | undefined): ChartAppearance {
  return {
    title: appearance?.title ?? '',
    subtitle: appearance?.subtitle ?? '',
    showLegend: appearance?.showLegend ?? true,
    legendPosition: appearance?.legendPosition ?? 'bottom',
    showLabels: appearance?.showLabels ?? false,
    labelType: appearance?.labelType ?? 'name',
    showAxes: appearance?.showAxes ?? true,
    showGrid: appearance?.showGrid ?? true,
    axisTitleX: appearance?.axisTitleX ?? '',
    axisTitleY: appearance?.axisTitleY ?? '',
    axisLabelRotation: appearance?.axisLabelRotation,
    theme: appearance?.theme ?? { baseTheme: 'light' },
    markStyle: appearance?.markStyle,
    backgroundColor: appearance?.backgroundColor,
    padding: appearance?.padding,
  };
}

function normalizeChartTitle(appearance: ChartAppearance): ChartTitleConfig {
  return {
    visible: Boolean(appearance.title || appearance.subtitle),
    text: appearance.title,
    subtitle: appearance.subtitle,
    color: appearance.theme?.titleColor,
    subtitleColor: appearance.theme?.subtitleColor,
    font: appearance.theme?.fontFamily ? { family: appearance.theme.fontFamily } : undefined,
  };
}

function normalizeChartLegend(appearance: ChartAppearance): ChartLegendConfig {
  return {
    visible: appearance.showLegend ?? true,
    position: appearance.legendPosition ?? 'bottom',
    color: appearance.theme?.legendLabelColor,
    font: appearance.theme?.fontFamily ? { family: appearance.theme.fontFamily } : undefined,
  };
}

function normalizeChartAxes(appearance: ChartAppearance): ChartAxesConfig {
  const visible = appearance.showAxes ?? true;
  const gridVisible = appearance.showGrid ?? true;
  return {
    x: {
      visible,
      title: appearance.axisTitleX ?? '',
      labelRotate: appearance.axisLabelRotation,
      labelColor: appearance.theme?.axisLabelColor,
      titleColor: appearance.theme?.axisTitleColor,
      lineColor: appearance.theme?.axisLineColor,
      gridVisible,
      gridColor: appearance.theme?.axisGridColor ?? appearance.theme?.gridColor,
    },
    y: {
      visible,
      title: appearance.axisTitleY ?? '',
      labelColor: appearance.theme?.axisLabelColor,
      titleColor: appearance.theme?.axisTitleColor,
      lineColor: appearance.theme?.axisLineColor,
      gridVisible,
      gridColor: appearance.theme?.axisGridColor ?? appearance.theme?.gridColor,
    },
  };
}

function normalizeChartLabels(appearance: ChartAppearance): ChartLabelConfig {
  return {
    visible: appearance.showLabels ?? false,
    content: appearance.labelType ?? 'name',
    color: appearance.theme?.labelColor,
    font: appearance.theme?.fontFamily ? { family: appearance.theme.fontFamily } : undefined,
  };
}

function normalizeChartPlotOptions(markStyle: ChartAppearance['markStyle']): ChartPlotOptions {
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
