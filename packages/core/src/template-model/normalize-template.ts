import type { Band, ChartAppearance, ChartBinding, ChartComponent, ChartVariant, DataField, DataSource, Page, PageBorder, PageWatermark, PanelComponent, ReportComponent, ReportTemplate, TableComponent } from './types';
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
      canBreak: band.type === 'data' || band.type === 'child',
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
    return {
      ...chart,
      chartType: chart.chartType ?? 'bar',
      variant: chart.variant ?? defaultChartVariant(chart.chartType),
      binding: normalizeChartBinding(chart.binding),
      appearance: normalizeChartAppearance(chart.appearance),
    } as ChartComponent;
  }

  return { ...component };
}

function defaultChartVariant(type?: ChartComponent['chartType']): ChartVariant {
  if (type === 'point') return 'scatter';
  if (type === 'pie') return 'default';
  return 'default';
}

function normalizeChartBinding(binding: ChartBinding | undefined): ChartBinding {
  return {
    dataSourceId: binding?.dataSourceId,
    arrayPath: binding?.arrayPath,
    categoryExpression: binding?.categoryExpression ?? '',
    valueExpression: binding?.valueExpression ?? '',
    xExpression: binding?.xExpression ?? '',
    yExpression: binding?.yExpression ?? '',
    seriesExpression: binding?.seriesExpression,
    labelExpression: binding?.labelExpression,
    sort: binding?.sort ?? [],
    aggregate: binding?.aggregate ?? 'none',
  };
}

function normalizeChartAppearance(appearance: ChartAppearance | undefined): ChartAppearance {
  return {
    title: appearance?.title ?? '',
    subtitle: appearance?.subtitle ?? '',
    showLegend: appearance?.showLegend ?? true,
    legendPosition: appearance?.legendPosition ?? 'bottom',
    showAxes: appearance?.showAxes ?? true,
    showGrid: appearance?.showGrid ?? true,
    showLabels: appearance?.showLabels ?? false,
    palette: appearance?.palette?.length ? [...appearance.palette] : ['#2f6fed', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    valueFormat: appearance?.valueFormat,
    categoryFormat: appearance?.categoryFormat,
    labelFormat: appearance?.labelFormat,
    axisTitleX: appearance?.axisTitleX ?? '',
    axisTitleY: appearance?.axisTitleY ?? '',
    backgroundColor: appearance?.backgroundColor,
    padding: appearance?.padding,
    innerRadius: appearance?.innerRadius ?? 0.55,
    outerRadius: appearance?.outerRadius ?? 0.85,
  };
}
