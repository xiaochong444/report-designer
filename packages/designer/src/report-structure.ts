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

interface ComponentNameCollectionOptions {
  excludeComponentId?: string;
}

export function normalizeComponentName(name: unknown) {
  return typeof name === 'string' ? name.trim() : '';
}

export function collectComponentNames(template: ReportTemplate, options: ComponentNameCollectionOptions = {}) {
  const names = new Set<string>();
  const visit = (components: ReportComponent[]) => {
    for (const component of components) {
      const name = normalizeComponentName(component.name);
      if (name && component.id !== options.excludeComponentId) {
        names.add(name);
      }
      const children = getPanelChildComponents(component);
      if (children) {
        visit(children);
      }
    }
  };

  for (const page of template.pages) {
    for (const band of page.bands) {
      visit(band.components);
    }
  }
  return names;
}

export function isComponentNameAvailable(template: ReportTemplate, name: string, currentComponentId?: string) {
  const normalizedName = normalizeComponentName(name);
  return Boolean(normalizedName) && !collectComponentNames(template, { excludeComponentId: currentComponentId }).has(normalizedName);
}

function getPanelChildComponents(component: ReportComponent): ReportComponent[] | undefined {
  if (!('components' in component)) return undefined;
  const children = (component as ReportComponent & { components?: ReportComponent[] }).components;
  return Array.isArray(children) ? children : undefined;
}

function withPanelChildComponents(component: ReportComponent, components: ReportComponent[]) {
  return { ...component, components } as ReportComponent;
}

function createNameRegistry(template: ReportTemplate) {
  return collectComponentNames(template);
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
  const takenNames = createNameRegistry(template);
  return prepareComponentTreeForInsert(component, takenNames);
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

  const ensureComponentName = (component: ReportComponent): ReportComponent => {
    const explicitName = normalizeComponentName(component.name);
    const shouldGenerateName = !explicitName
      || explicitName === getComponentNamePrefix(component.type)
      || takenNames.has(explicitName);
    const nextName = shouldGenerateName
      ? getNextComponentName(component.type, takenNames)
      : explicitName;

    if (!shouldGenerateName) {
      takenNames.add(nextName);
    }

    const namedComponent = component.name === nextName
      ? component
      : { ...component, name: nextName };

    if (namedComponent !== component) {
      changed = true;
    }

    const children = getPanelChildComponents(namedComponent);
    if (!children) return namedComponent;

    const namedChildren = children.map(ensureComponentName);
    if (namedChildren === children) return namedComponent;
    if (namedChildren.some((child, index) => child !== children[index])) {
      changed = true;
      return withPanelChildComponents(namedComponent, namedChildren);
    }
    return namedComponent;
  };

  const pages = template.pages.map((page) => ({
    ...page,
    bands: page.bands.map((band) => ({
      ...band,
      components: band.components.map(ensureComponentName),
    })),
  }));

  return changed ? { ...template, pages } : template;
}

export function getBandDisplayName(band: Band, index: number) {
  return band.name?.trim() || `${getBandBaseName(band.type)}${index}`;
}

function prepareComponentTreeForInsert(component: ReportComponent, takenNames: Set<string>): ReportComponent {
  const explicitName = normalizeComponentName(component.name);
  const nextName = !explicitName || explicitName === getComponentNamePrefix(component.type) || takenNames.has(explicitName)
    ? getNextComponentName(component.type, takenNames)
    : explicitName;
  takenNames.add(nextName);

  let nextComponent = withDefaultText({ ...component, name: nextName });
  const children = getPanelChildComponents(nextComponent);
  if (!children) return nextComponent;

  nextComponent = withPanelChildComponents(
    nextComponent,
    children.map(child => prepareComponentTreeForInsert(child, takenNames)),
  );
  return nextComponent;
}

function withDefaultText(component: ReportComponent): ReportComponent {
  if (component.type !== 'text') return component;
  const text = (component as ReportComponent & { text?: string }).text;
  if (text !== undefined && text !== '') return component;
  return { ...component, text: component.name ?? '' } as ReportComponent;
}
