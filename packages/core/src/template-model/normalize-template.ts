import type {
  Band,
  ChartBinding,
  ChartComponent,
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
import { getChartCapabilities } from '../chart';

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
    return {
      ...chart,
      chartType: chart.chartType ?? 'column',
      binding: normalizeChartBinding(chart.binding, chart.chartType ?? 'column'),
      title: chart.title,
      legend: chart.legend,
      axes: chart.axes,
      labels: chart.labels,
      theme: chart.theme ?? { baseTheme: 'light' },
      plotOptions: chart.plotOptions,
    } as ChartComponent;
  }

  return { ...component };
}

function normalizeChartBinding(binding: ChartBinding | undefined, chartType: ChartComponent['chartType']): ChartBinding {
  const caps = getChartCapabilities(chartType);
  const dimensions = binding?.dimensions ?? [];
  const measures = binding?.measures ?? [];

  // 维度裁剪：single 保留 1 个，dual 保留 2 个，hierarchical 保留全部有序维度
  const trimmedDimensions = caps.dimensions === 'hierarchical'
    ? dimensions
    : caps.dimensions === 'dual'
      ? dimensions.slice(0, 2)
      : dimensions.slice(0, 1);

  // 度量裁剪：single 保留 1 个，multi 保留 1-N 个，dualAxis 至少补齐 left/right
  let trimmedMeasures = measures;
  if (caps.measures === 'single') {
    trimmedMeasures = measures.slice(0, 1);
  } else if (caps.measures === 'dualAxis') {
    trimmedMeasures = measures.slice(0, 2);
    if (trimmedMeasures.length < 2) {
      const first = trimmedMeasures[0];
      if (first) {
        trimmedMeasures = [first, { ...first, axis: 'right' }];
      }
    }
    // 保证一个 left 一个 right
    if (trimmedMeasures[0] && !trimmedMeasures[0].axis) trimmedMeasures[0] = { ...trimmedMeasures[0], axis: 'left' };
    if (trimmedMeasures[1] && !trimmedMeasures[1].axis) trimmedMeasures[1] = { ...trimmedMeasures[1], axis: 'right' };
  }

  return {
    dataSourceId: binding?.dataSourceId,
    arrayPath: binding?.arrayPath,
    dimensions: trimmedDimensions,
    seriesField: caps.series === false ? undefined : binding?.seriesField,
    measures: trimmedMeasures,
    sort: binding?.sort ?? [],
    filterExpression: binding?.filterExpression,
  };
}
