import type { Band, BandType, ReportComponent, ReportTemplate } from '@report-designer/core';

const COMPONENT_NAME_PREFIX: Record<ReportComponent['type'], string> = {
  text: 'Text',
  image: 'Image',
  chart: 'Chart',
  barcode: 'BarCode',
  qrcode: 'QRCode',
  table: 'Table',
  checkbox: 'CheckBox',
  richtext: 'RichText',
  subreport: 'SubReport',
  panel: 'Panel',
  line: 'Line',
  shape: 'Shape',
  pagenumber: 'PageNumber',
  datetime: 'DateTime',
};

const BAND_BASE_NAME: Record<BandType, string> = {
  reportTitle: 'ReportTitleBand',
  reportSummary: 'ReportSummaryBand',
  pageHeader: 'PageHeaderBand',
  pageFooter: 'PageFooterBand',
  header: 'HeaderBand',
  footer: 'FooterBand',
  columnHeader: 'ColumnHeaderBand',
  columnFooter: 'ColumnFooterBand',
  groupHeader: 'GroupHeaderBand',
  groupFooter: 'GroupFooterBand',
  data: 'DataBand',
  hierarchicalData: 'HierarchicalDataBand',
  overlay: 'OverlayBand',
};

function createNameRegistry(template: ReportTemplate) {
  const taken = new Set<string>();
  for (const page of template.pages) {
    for (const band of page.bands) {
      for (const component of band.components) {
        if (component.name?.trim()) {
          taken.add(component.name.trim());
        }
      }
    }
  }
  return taken;
}

function createBandNameRegistry(template: ReportTemplate) {
  const taken = new Set<string>();
  for (const page of template.pages) {
    for (const band of page.bands) {
      if (band.name?.trim()) {
        taken.add(band.name.trim());
      }
    }
  }
  return taken;
}

export function getComponentNamePrefix(type: ReportComponent['type']) {
  return COMPONENT_NAME_PREFIX[type];
}

export function isAutoNameSeed(component: ReportComponent) {
  const prefix = getComponentNamePrefix(component.type);
  const currentName = component.name?.trim();
  return !currentName || currentName === prefix;
}

export function getNextComponentName(type: ReportComponent['type'], takenNames: Set<string>) {
  const prefix = getComponentNamePrefix(type);
  let index = 1;
  let candidate = `${prefix}${index}`;
  while (takenNames.has(candidate)) {
    index += 1;
    candidate = `${prefix}${index}`;
  }
  takenNames.add(candidate);
  return candidate;
}

export function prepareComponentForInsert(template: ReportTemplate, component: ReportComponent): ReportComponent {
  const withDefaultText = (next: ReportComponent): ReportComponent => {
    if (next.type !== 'text') return next;
    const text = (next as ReportComponent & { text?: string }).text;
    if (text !== undefined && text !== '') return next;
    return { ...next, text: next.name ?? '' } as ReportComponent;
  };

  if (!isAutoNameSeed(component)) {
    return withDefaultText(component);
  }

  const takenNames = createNameRegistry(template);
  return withDefaultText({
    ...component,
    name: getNextComponentName(component.type, takenNames),
  });
}

export function getBandBaseName(type: BandType) {
  return BAND_BASE_NAME[type] ?? type;
}

export function isAutoBandNameSeed(band: Band) {
  const baseName = getBandBaseName(band.type);
  const currentName = band.name?.trim();
  return !currentName || currentName === baseName;
}

export function getNextBandName(type: BandType, takenNames: Set<string>) {
  const baseName = getBandBaseName(type);
  let index = 1;
  let candidate = `${baseName}${index}`;
  while (takenNames.has(candidate)) {
    index += 1;
    candidate = `${baseName}${index}`;
  }
  takenNames.add(candidate);
  return candidate;
}

export function ensureTemplateBandNames(template: ReportTemplate): ReportTemplate {
  const takenNames = new Set<string>();
  let changed = false;

  const pages = template.pages.map((page) => ({
    ...page,
    bands: page.bands.map((band) => {
      if (!isAutoBandNameSeed(band)) {
        takenNames.add(band.name!.trim());
        return band;
      }

      changed = true;
      return {
        ...band,
        name: getNextBandName(band.type, takenNames),
      };
    }),
  }));

  return changed ? { ...template, pages } : template;
}

export function prepareBandForInsert(template: ReportTemplate, band: Band): Band {
  if (!isAutoBandNameSeed(band)) {
    return band;
  }

  const takenNames = createBandNameRegistry(template);
  return {
    ...band,
    name: getNextBandName(band.type, takenNames),
  };
}

export function ensureTemplateComponentNames(template: ReportTemplate): ReportTemplate {
  const takenNames = new Set<string>();
  let changed = false;

  const pages = template.pages.map((page) => ({
    ...page,
    bands: page.bands.map((band) => ({
      ...band,
      components: band.components.map((component) => {
        if (!isAutoNameSeed(component)) {
          takenNames.add(component.name!.trim());
          return component;
        }

        changed = true;
        return {
          ...component,
          name: getNextComponentName(component.type, takenNames),
        };
      }),
    })),
  }));

  return changed ? { ...template, pages } : template;
}

export function getBandDisplayName(band: Band, index: number) {
  return band.name?.trim() || `${getBandBaseName(band.type)}${index}`;
}
