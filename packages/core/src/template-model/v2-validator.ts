import type { ReportBandV2, ReportComponentV2, ReportPageV2, ReportTemplateV2 } from './v2-types';

export interface TemplateValidationErrorV2 {
  path: string;
  message: string;
}

export interface TemplateValidationResultV2 {
  valid: boolean;
  errors: TemplateValidationErrorV2[];
}

export interface TemplateValidationOptionsV2 {
  strictPrintableArea?: boolean;
}

export function validateTemplateV2(
  template: ReportTemplateV2,
  options: TemplateValidationOptionsV2 = {},
): TemplateValidationResultV2 {
  const errors: TemplateValidationErrorV2[] = [];
  const dataSourceIds = new Set(template.dataSources.map((source) => source.id));

  collectUniqueIds(template, errors);

  template.pages.forEach((page, pageIndex) => {
    validatePage(page, pageIndex, dataSourceIds, options, errors);
  });

  return { valid: errors.length === 0, errors };
}

function validatePage(
  page: ReportPageV2,
  pageIndex: number,
  dataSourceIds: Set<string>,
  options: TemplateValidationOptionsV2,
  errors: TemplateValidationErrorV2[],
): void {
  const groupHeaders: ReportBandV2[] = [];
  const pendingSectionBands: Array<{ band: ReportBandV2; path: string }> = [];

  page.bands.forEach((band, bandIndex) => {
    const path = `pages[${pageIndex}].bands[${bandIndex}]`;

    if (band.height < 0) {
      errors.push({ path: `${path}.height`, message: `Band height must be non-negative, got ${band.height}` });
    }

    if (band.dataBand?.dataSourceId && !dataSourceIds.has(band.dataBand.dataSourceId)) {
      errors.push({ path: `${path}.dataBand.dataSourceId`, message: `DataBand references missing data source "${band.dataBand.dataSourceId}"` });
    }

    if ((band.type === 'data' || band.type === 'hierarchicalData') && !band.dataBand?.dataSourceId) {
      errors.push({ path: `${path}.dataBand.dataSourceId`, message: 'DataBand requires dataBand.dataSourceId' });
    }

    if (band.type === 'header' || band.type === 'columnHeader' || band.type === 'groupHeader') {
      pendingSectionBands.push({ band, path });
    }

    if (band.type === 'data' || band.type === 'hierarchicalData') {
      pendingSectionBands.length = 0;
    }

    if (band.type === 'groupHeader') {
      if (!band.group?.conditionExpression) {
        errors.push({ path: `${path}.group.conditionExpression`, message: 'GroupHeader requires a condition expression' });
      }
      groupHeaders.push(band);
    }

    if (band.type === 'groupFooter' && !hasMatchingGroupHeader(band, groupHeaders)) {
      errors.push({ path: `${path}.group`, message: 'GroupFooter requires a preceding matching GroupHeader' });
    }

    if (options.strictPrintableArea) {
      band.components.forEach((component, componentIndex) => {
        validatePrintableArea(component, page, band, `${path}.components[${componentIndex}]`, errors);
      });
    }
  });

  pendingSectionBands.forEach(({ band, path }) => {
    errors.push({ path, message: `${getBandDisplayName(band)} requires a following DataBand` });
  });
}

function getBandDisplayName(band: ReportBandV2): string {
  if (band.type === 'header') return 'HeaderBand';
  if (band.type === 'columnHeader') return 'ColumnHeaderBand';
  if (band.type === 'groupHeader') return 'GroupHeaderBand';
  return band.type;
}

function hasMatchingGroupHeader(footer: ReportBandV2, headers: ReportBandV2[]): boolean {
  const groupName = footer.group?.name;
  const groupHeaderId = footer.group?.groupHeaderId;

  if (groupHeaderId) {
    return headers.some((header) => header.id === groupHeaderId);
  }

  if (groupName) {
    return headers.some((header) => header.group?.name === groupName);
  }

  return false;
}

function validatePrintableArea(
  component: ReportComponentV2,
  page: ReportPageV2,
  band: ReportBandV2,
  path: string,
  errors: TemplateValidationErrorV2[],
): void {
  const left = page.margins.left;
  const right = page.width - page.margins.right;
  const componentRight = component.x + component.width;
  const componentBottom = component.y + component.height;

  if (component.x < left || componentRight > right || component.y < 0 || componentBottom > band.height) {
    errors.push({
      path,
      message: `Component "${component.id}" is outside printable area`,
    });
  }
}

function collectUniqueIds(template: ReportTemplateV2, errors: TemplateValidationErrorV2[]): void {
  const ids = new Map<string, string>();

  const check = (id: string, path: string) => {
    const firstPath = ids.get(id);
    if (firstPath) {
      errors.push({ path, message: `Duplicate id "${id}" also used at ${firstPath}` });
      return;
    }
    ids.set(id, path);
  };

  check(template.id, 'id');
  template.pages.forEach((page, pageIndex) => {
    check(page.id, `pages[${pageIndex}].id`);
    page.bands.forEach((band, bandIndex) => {
      check(band.id, `pages[${pageIndex}].bands[${bandIndex}].id`);
      band.components.forEach((component, componentIndex) => {
        collectComponentIds(component, `pages[${pageIndex}].bands[${bandIndex}].components[${componentIndex}]`, check);
      });
    });
  });
  template.dataSources.forEach((source, sourceIndex) => {
    check(source.id, `dataSources[${sourceIndex}].id`);
    source.fields.forEach((field, fieldIndex) => check(field.id, `dataSources[${sourceIndex}].fields[${fieldIndex}].id`));
  });
  template.styles.forEach((style, styleIndex) => check(style.id, `styles[${styleIndex}].id`));
  template.conditionalFormats.forEach((format, formatIndex) => check(format.id, `conditionalFormats[${formatIndex}].id`));
  template.parameters.forEach((parameter, parameterIndex) => check(parameter.id, `parameters[${parameterIndex}].id`));
}

function collectComponentIds(component: ReportComponentV2, path: string, check: (id: string, path: string) => void): void {
  check(component.id, `${path}.id`);
  if (component.type === 'panel' && 'components' in component && Array.isArray(component.components)) {
    component.components.forEach((child, index) => collectComponentIds(child, `${path}.components[${index}]`, check));
  }
}
