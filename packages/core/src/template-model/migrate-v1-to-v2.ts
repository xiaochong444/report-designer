import type { Band, ReportComponent, ReportTemplate } from './types';
import type { BandBehaviorV2, DataSourceV2, ReportBandV2, ReportComponentV2, ReportTemplateV2, StandardBandTypeV2 } from './v2-types';
import { mapDataFieldToV2 } from './v2-types';

export function migrateV1ToV2(template: ReportTemplate): ReportTemplateV2 {
  return {
    id: template.id,
    name: template.name,
    version: '2.0',
    pages: template.pages.map((page) => ({
      id: page.id,
      width: page.width,
      height: page.height,
      margins: { ...page.margins },
      orientation: page.orientation,
      bands: page.bands.map(migrateBand),
    })),
    dataSources: template.dataSources.map((source): DataSourceV2 => ({
      id: source.id,
      name: source.name,
      type: 'json',
      path: source.id,
      fields: source.schema.map((field) => mapDataFieldToV2(source, field)),
    })),
    styles: template.styles.map((style) => ({ ...style })),
    conditionalFormats: template.conditionalFormats.map((format) => ({ ...format })),
    parameters: [],
  };
}

function migrateBand(band: Band): ReportBandV2 {
  const migrated: ReportBandV2 = {
    id: band.id,
    type: band.type as StandardBandTypeV2,
    height: band.height,
    components: cloneComponents(band.components),
    behavior: createDefaultBandBehavior(band),
  };

  if (band.type === 'data' || band.type === 'child') {
    migrated.dataBand = band.dataSource ? { dataSourceId: band.dataSource } : {};
  }

  if (band.type === 'groupHeader' || band.type === 'groupFooter') {
    migrated.group = band.groupField
      ? { name: band.groupField, conditionExpression: band.type === 'groupHeader' ? band.groupField : undefined }
      : undefined;
  }

  return migrated;
}

export function createDefaultBandBehavior(band: Pick<Band, 'type' | 'visible'>): BandBehaviorV2 {
  return {
    enabled: true,
    visibleExpression: band.visible,
    printOn: 'allPages',
    printIfEmpty: true,
    printOnAllPages: band.type === 'pageHeader' || band.type === 'pageFooter',
    keepTogether: false,
    canBreak: band.type === 'data' || band.type === 'child',
    printAtBottom: band.type === 'pageFooter',
  };
}

function cloneComponents(components: ReportComponent[]): ReportComponentV2[] {
  return components.map((component) => JSON.parse(JSON.stringify(component)) as ReportComponentV2);
}
