import type { Band, DataSource, Page, PanelComponent, ReportComponent, ReportTemplate, ValidationResult } from './types';
import { normalizeTemplate } from './normalize-template';

export interface TemplateValidationError {
  path: string;
  message: string;
}

export interface TemplateValidationOptions {
  strictPrintableArea?: boolean;
}

export function validateTemplate(
  template: ReportTemplate,
  options: TemplateValidationOptions = {},
): ValidationResult<TemplateValidationError> {
  const normalizedTemplate = normalizeTemplate(template);
  const errors: TemplateValidationError[] = [];
  const dataSources = new Map(normalizedTemplate.dataSources.map(source => [source.id, source]));

  if (normalizedTemplate.pages.length === 0) {
    errors.push({ path: 'pages', message: 'Template must contain at least one page' });
    return { valid: false, errors };
  }

  collectUniqueIds(normalizedTemplate, errors);
  normalizedTemplate.pages.forEach((page, pageIndex) => {
    validatePage(page, pageIndex, dataSources, normalizedTemplate.dataSources.length > 0, options, errors);
  });

  return { valid: errors.length === 0, errors };
}

function validatePage(
  page: Page,
  pageIndex: number,
  dataSources: Map<string, DataSource>,
  hasAnyDataSources: boolean,
  options: TemplateValidationOptions,
  errors: TemplateValidationError[],
) {
  if (page.width <= 0) {
    errors.push({ path: `pages[${pageIndex}].width`, message: `Page width must be greater than 0, got ${page.width}` });
  }

  if (page.height <= 0) {
    errors.push({ path: `pages[${pageIndex}].height`, message: `Page height must be greater than 0, got ${page.height}` });
  }

  const groupHeaders: Band[] = [];
  const pendingSectionBands: Array<{ band: Band; path: string }> = [];

  page.bands.forEach((band, bandIndex) => {
    const path = `pages[${pageIndex}].bands[${bandIndex}]`;

    if (band.height < 0) {
      errors.push({ path: `${path}.height`, message: `Band height must be non-negative, got ${band.height}` });
    }

    if (band.dataBand?.dataSourceId && !dataSources.has(band.dataBand.dataSourceId)) {
      errors.push({ path: `${path}.dataBand.dataSourceId`, message: `Data band references missing data source "${band.dataBand.dataSourceId}"` });
    }

    if (hasAnyDataSources && (band.type === 'data' || band.type === 'hierarchicalData') && !band.dataBand?.dataSourceId) {
      errors.push({ path: `${path}.dataBand.dataSourceId`, message: 'Data band requires dataBand.dataSourceId' });
    }

    if (band.type === 'header' || band.type === 'columnHeader' || band.type === 'groupHeader') {
      pendingSectionBands.push({ band, path });
    }

    if (band.type === 'data' || band.type === 'hierarchicalData') {
      pendingSectionBands.length = 0;
    }

    if (band.type === 'groupHeader') {
      if (!band.group?.conditionExpression) {
        errors.push({ path: `${path}.group.conditionExpression`, message: 'Group header requires a condition expression' });
      }
      groupHeaders.push(band);
    }

    if (band.type === 'groupFooter' && !hasMatchingGroupHeader(groupHeaders)) {
      errors.push({ path: `${path}.group`, message: 'Group footer requires a preceding matching group header' });
    }
    if (band.type === 'groupFooter') {
      groupHeaders.pop();
    }

    if (options.strictPrintableArea) {
      band.components.forEach((component, componentIndex) => validateComponent(
        component,
        page,
        band,
        `${path}.components[${componentIndex}]`,
        options,
        errors,
        true,
      ));
    } else {
      band.components.forEach((component, componentIndex) => validateComponent(
        component,
        page,
        band,
        `${path}.components[${componentIndex}]`,
        options,
        errors,
        true,
      ));
    }
  });

  pendingSectionBands.forEach(({ band, path }) => {
    errors.push({ path, message: `${getBandDisplayName(band)} requires a following data band` });
  });
}

function validateComponent(
  component: ReportComponent,
  page: Page,
  band: Band,
  path: string,
  options: TemplateValidationOptions,
  errors: TemplateValidationError[],
  checkPrintableArea: boolean,
) {
  if (component.width < 0 || component.height < 0) {
    errors.push({
      path,
      message: `Component "${component.id}" dimensions must be non-negative`,
    });
  }

  if (options.strictPrintableArea && checkPrintableArea) {
    validatePrintableArea(component, page, band, path, errors);
  }

  if (component.type === 'panel') {
    (component as PanelComponent).components.forEach((child, childIndex) => validateComponent(
      child,
      page,
      band,
      `${path}.components[${childIndex}]`,
      options,
      errors,
      false,
    ));
  }
}

function getBandDisplayName(band: Band): string {
  if (band.type === 'header') return 'HeaderBand';
  if (band.type === 'columnHeader') return 'ColumnHeaderBand';
  if (band.type === 'groupHeader') return 'GroupHeaderBand';
  return band.type;
}

function hasMatchingGroupHeader(headers: Band[]): boolean {
  return headers.length > 0;
}

function validatePrintableArea(
  component: ReportComponent,
  page: Page,
  band: Band,
  path: string,
  errors: TemplateValidationError[],
) {
  const left = page.margins.left;
  const right = page.width - page.margins.right;
  const componentRight = component.x + component.width;
  const componentBottom = component.y + component.height;

  if (component.x < left || componentRight > right || component.y < 0 || componentBottom > band.height) {
    errors.push({ path, message: `Component "${component.id}" is outside printable area` });
  }
}

function collectUniqueIds(template: ReportTemplate, errors: TemplateValidationError[]) {
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
    (source.fields ?? []).forEach((field, fieldIndex) => check(field.id ?? `${source.id}.${field.name}`, `dataSources[${sourceIndex}].fields[${fieldIndex}].id`));
  });
  template.styles.forEach((style, styleIndex) => check(style.id, `styles[${styleIndex}].id`));
  template.conditionalFormats.forEach((format, formatIndex) => check(format.id, `conditionalFormats[${formatIndex}].id`));
  template.parameters.forEach((parameter, parameterIndex) => check(parameter.id, `parameters[${parameterIndex}].id`));
}

function collectComponentIds(component: ReportComponent, path: string, check: (id: string, path: string) => void) {
  check(component.id, `${path}.id`);
  if (component.type === 'panel' && Array.isArray((component as any).components)) {
    (component as any).components.forEach((child: ReportComponent, index: number) => collectComponentIds(child, `${path}.components[${index}]`, check));
  }
}
