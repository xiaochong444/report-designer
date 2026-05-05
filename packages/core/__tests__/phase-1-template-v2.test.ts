import { describe, expect, it } from 'vitest';
import { createDefaultTemplate } from '../src/template-model';
import {
  STANDARD_BAND_TYPES,
  migrateV1ToV2,
  validateTemplateV2,
  type ReportTemplateV2,
  type TextComponentV2,
} from '../src';

describe('Phase 1 template v2', () => {
  it('exports Stimulsoft-style standard band types', () => {
    expect(STANDARD_BAND_TYPES).toEqual([
      'reportTitle',
      'reportSummary',
      'pageHeader',
      'pageFooter',
      'header',
      'footer',
      'groupHeader',
      'groupFooter',
      'columnHeader',
      'columnFooter',
      'data',
      'hierarchicalData',
      'child',
      'emptyData',
      'overlay',
    ]);
  });

  it('migrates v1 templates into v2 without losing pages, bands, or json data sources', () => {
    const template = createDefaultTemplate('Employees');
    template.dataSources = [
      {
        id: 'employees',
        name: 'Employees',
        type: 'json',
        schema: [
          { name: 'Name', type: 'string' },
          { name: 'Salary', type: 'number' },
        ],
      },
    ];
    const dataBand = template.pages[0].bands.find((band) => band.type === 'data')!;
    dataBand.dataSource = 'employees';

    const migrated = migrateV1ToV2(template);

    expect(migrated.version).toBe('2.0');
    expect(migrated.pages).toHaveLength(template.pages.length);
    expect(migrated.pages[0].bands.map((band) => band.type)).toEqual(template.pages[0].bands.map((band) => band.type));
    expect(migrated.dataSources[0]).toMatchObject({
      id: 'employees',
      name: 'Employees',
      type: 'json',
      path: 'employees',
    });
    expect(migrated.dataSources[0].fields.map((field) => [field.path, field.type])).toEqual([
      ['employees.Name', 'string'],
      ['employees.Salary', 'number'],
    ]);
    expect(migrated.pages[0].bands.find((band) => band.type === 'pageHeader')?.behavior.printOnAllPages).toBe(true);
    expect(migrated.pages[0].bands.find((band) => band.type === 'pageFooter')?.behavior.printAtBottom).toBe(true);
    expect(migrated.pages[0].bands.find((band) => band.type === 'data')?.behavior.canBreak).toBe(true);
    expect(migrated.pages[0].bands.find((band) => band.type === 'data')?.dataBand?.dataSourceId).toBe('employees');
  });

  it('validates duplicate ids', () => {
    const template = migrateV1ToV2(createDefaultTemplate());
    template.pages[0].bands[1].id = template.pages[0].bands[0].id;

    const result = validateTemplateV2(template);

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('Duplicate id');
  });

  it('validates data bands referencing missing data sources', () => {
    const template = migrateV1ToV2(createDefaultTemplate());
    template.pages[0].bands.find((band) => band.type === 'data')!.dataBand = { dataSourceId: 'missing' };

    const result = validateTemplateV2(template);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.message.includes('missing data source'))).toBe(true);
  });

  it('validates group headers and matching group footers', () => {
    const template = migrateV1ToV2(createDefaultTemplate());
    template.pages[0].bands.splice(2, 0, {
      id: 'group-header-1',
      type: 'groupHeader',
      height: 12,
      components: [],
      behavior: defaultTestBehavior(),
    });
    template.pages[0].bands.splice(3, 0, {
      id: 'group-footer-1',
      type: 'groupFooter',
      height: 12,
      components: [],
      behavior: defaultTestBehavior(),
      group: { name: 'Department' },
    });

    const result = validateTemplateV2(template);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.message.includes('GroupHeader requires a condition'))).toBe(true);
    expect(result.errors.some((error) => error.message.includes('GroupFooter requires a preceding matching GroupHeader'))).toBe(true);
  });

  it('validates components outside the printable page area in strict mode', () => {
    const template = migrateV1ToV2(createDefaultTemplate());
    const component: TextComponentV2 = {
      id: 'outside',
      type: 'text',
      x: 190,
      y: 5,
      width: 30,
      height: 10,
      text: 'Outside',
      font: {
        family: 'Arial',
        size: 10,
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        color: '#000',
      },
      textAlign: 'left',
      verticalAlign: 'top',
      border: {
        style: 'none',
        width: 0,
        color: '#000',
        sides: { top: false, right: false, bottom: false, left: false },
      },
      canGrow: false,
      canShrink: false,
    };
    template.pages[0].bands[0].components.push(component);

    const result = validateTemplateV2(template, { strictPrintableArea: true });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.message.includes('outside printable area'))).toBe(true);
  });
});

function defaultTestBehavior(): ReportTemplateV2['pages'][number]['bands'][number]['behavior'] {
  return {
    enabled: true,
    printOn: 'allPages',
    printIfEmpty: true,
    printOnAllPages: false,
    keepTogether: false,
    canBreak: true,
    printAtBottom: false,
  };
}
