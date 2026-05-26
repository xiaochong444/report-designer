import type { Band, DataField, DataSource, Page, PageBorder, PageWatermark, ReportComponent, ReportTemplate, TableComponent } from './types';
import { normalizeReportFonts } from '../fonts';
import { mapDataField } from './types';
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
        name: band.group?.name ?? band.groupField,
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
      printOnAllPages: band.type === 'pageHeader' || band.type === 'pageFooter' || band.type === 'groupHeader',
      keepTogether: false,
      canBreak: band.type === 'data' || band.type === 'child',
      printAtBottom: band.type === 'pageFooter',
    },
    dataBand,
    group,
    components: band.components.map(normalizeComponent),
  };
}

function normalizeComponent(component: ReportComponent): ReportComponent {
  if (component.type === 'panel' && Array.isArray((component as any).components)) {
    return {
      ...component,
      components: (component as any).components.map((child: ReportComponent) => normalizeComponent(child)),
    };
  }

  if (component.type === 'table') {
    const table = component as TableComponent;
    return {
      ...table,
      binding: {
        mode: table.binding?.mode ?? 'fixed',
        dataSourceId: table.binding?.dataSourceId,
        arrayPath: table.binding?.arrayPath,
      },
    };
  }

  return { ...component };
}
