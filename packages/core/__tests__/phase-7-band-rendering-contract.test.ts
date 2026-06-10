import { describe, expect, it } from 'vitest';
import { buildBandPlan, executeBandPlan, renderReport, validateTemplate } from '../src';
import type { Band } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

function bandTypesForData(templateBands: Band[], employees: Record<string, unknown>[]) {
  const template = makeTemplate(templateBands);
  const plan = buildBandPlan(template);
  return executeBandPlan(plan, { employees })
    .filter(item => item.kind === 'band')
    .map(item => item.band.type);
}

describe('Phase 7 band rendering contract', () => {
  it('renders a data section in Header, ColumnHeader, GroupHeader, Data, GroupFooter, ColumnFooter, Footer order', () => {
    const sequence = bandTypesForData([
      band('report-title', 'reportTitle'),
      band('header', 'header'),
      band('column-header', 'columnHeader'),
      band('group-header', 'groupHeader', { group: { conditionExpression: '{employees.Department}' } }),
      band('data', 'data', { dataBand: { dataSourceId: 'employees', sort: [{ field: 'Department', direction: 'asc' }] } }),
      band('group-footer', 'groupFooter'),
      band('column-footer', 'columnFooter'),
      band('footer', 'footer'),
      band('report-summary', 'reportSummary'),
    ], [
      { Name: 'A', Department: 'Engineering' },
      { Name: 'B', Department: 'Engineering' },
      { Name: 'C', Department: 'Sales' },
    ]);

    expect(sequence).toEqual([
      'reportTitle',
      'header',
      'columnHeader',
      'groupHeader',
      'data',
      'data',
      'groupFooter',
      'groupHeader',
      'data',
      'groupFooter',
      'columnFooter',
      'footer',
      'reportSummary',
    ]);
  });

  it('does not render section bands when a data section has no rows', () => {
    const sequence = bandTypesForData([
      band('header', 'header'),
      band('data', 'data', { dataBand: { dataSourceId: 'employees' } }),
      band('footer', 'footer'),
    ], []);

    expect(sequence).toEqual([]);
  });

  it('renders nested groups from outer GroupHeader to inner GroupHeader before data rows', () => {
    const template = makeTemplate([
      band('department-header', 'groupHeader', { group: { conditionExpression: '{employees.Department}' } }),
      band('team-header', 'groupHeader', { group: { conditionExpression: '{employees.Team}', sortDirection: 'asc' } }),
      band('data', 'data', { dataBand: { dataSourceId: 'employees', sort: [{ field: 'Team', direction: 'asc' }] } }),
      band('team-footer', 'groupFooter'),
      band('department-footer', 'groupFooter'),
    ]);

    const items = executeBandPlan(buildBandPlan(template), {
      employees: [
        { Name: 'A', Department: 'Engineering', Team: 'Platform' },
        { Name: 'B', Department: 'Engineering', Team: 'UI' },
      ],
    }).filter(item => item.kind === 'band');

    expect(items.map(item => item.band.id)).toEqual([
      'department-header',
      'team-header',
      'data',
      'team-footer',
      'team-header',
      'data',
      'team-footer',
      'department-footer',
    ]);
  });

  it('renders hierarchical data bands from tree-shaped rows using children by default', () => {
    const template = makeTemplate([
      band('data', 'hierarchicalData', { dataBand: { dataSourceId: 'employees', hierarchical: { indentChars: 3 } } }),
    ]);

    const items = executeBandPlan(buildBandPlan(template), {
      employees: [
        {
          Name: 'Company',
          children: [
            { Name: 'Sales', children: [{ Name: 'East' }] },
            { Name: 'Engineering' },
          ],
        },
      ],
    }).filter(item => item.kind === 'band');

    expect(items.map(item => item.context.row?.Name)).toEqual(['Company', 'Sales', 'East', 'Engineering']);
    expect(items.map(item => item.context.row?.HierarchyLevel)).toEqual([0, 1, 2, 1]);
    expect(items.map(item => item.context.row?.HierarchyIndent)).toEqual(['', '   ', '      ', '   ']);
  });

  it('renders hierarchical data bands with a custom child property name', () => {
    const template = makeTemplate([
      band('data', 'hierarchicalData', { dataBand: { dataSourceId: 'employees', hierarchical: { childrenField: 'nodes', indentChars: 2 } } }),
    ]);

    const items = executeBandPlan(buildBandPlan(template), {
      employees: [
        {
          Name: 'Root',
          nodes: [
            { Name: 'Branch', nodes: [{ Name: 'Leaf' }] },
          ],
        },
      ],
    }).filter(item => item.kind === 'band');

    expect(items.map(item => item.context.row?.Name)).toEqual(['Root', 'Branch', 'Leaf']);
    expect(items.map(item => item.context.row?.HierarchyIndent)).toEqual(['', '  ', '    ']);
    expect(items.every(item => !('nodes' in (item.context.row ?? {})))).toBe(true);
  });

  it('automatically indents the first text component in a hierarchical data band', () => {
    const template = makeTemplate([
      band('data', 'hierarchicalData', {
        dataBand: { dataSourceId: 'employees', hierarchical: { indentChars: 2 } },
        components: [{
          id: 'name',
          type: 'text',
          x: 0,
          y: 0,
          width: 40,
          height: 6,
          text: '{employees.Name}',
          font: { family: 'Arial', size: 9 },
          textAlign: 'left',
        }],
      }),
    ]);

    const document = renderReport(template, {
      employees: [{ Name: 'Root', children: [{ Name: 'Child' }] }],
    });
    const contents = document.pages.flatMap(page => page.items).flatMap(item => item.components).map(component => component.content);

    expect(contents).toEqual(['Root', '  Child']);
  });

  it('lays out data band rows across configured columns before moving down', () => {
    const template = makeTemplate([
      band('labels', 'data', {
        height: 12,
        dataBand: { dataSourceId: 'employees', columns: { count: 3, gap: 5, direction: 'acrossThenDown' } },
        components: [textComponent('label', '{employees.Name}')],
      }),
    ]);

    const document = renderReport(template, {
      employees: [
        { Name: 'A' },
        { Name: 'B' },
        { Name: 'C' },
        { Name: 'D' },
      ],
    });

    const boxes = document.pages[0].items.filter(item => item.bandId === 'labels');
    expect(boxes).toHaveLength(4);
    expect(boxes.map(box => box.components[0]?.content)).toEqual(['A', 'B', 'C', 'D']);
    expect(boxes.map(box => Math.round(box.y * 10) / 10)).toEqual([20, 20, 20, 32]);
    expect(boxes[0].x).toBeCloseTo(20, 1);
    expect(boxes[1].x).toBeCloseTo(78.3, 1);
    expect(boxes[2].x).toBeCloseTo(136.7, 1);
    expect(boxes[3].x).toBeCloseTo(20, 1);
    expect(boxes[0].width).toBeCloseTo(53.3, 1);
  });

  it('repeats column header bands for each data band column', () => {
    const template = makeTemplate([
      band('label-header', 'columnHeader', {
        height: 8,
        components: [textComponent('header-text', 'PRICE')],
      }),
      band('labels', 'data', {
        height: 12,
        dataBand: { dataSourceId: 'employees', columns: { count: 3, gap: 5, direction: 'acrossThenDown' } },
        components: [textComponent('label', '{employees.Name}')],
      }),
    ]);

    const document = renderReport(template, {
      employees: [
        { Name: 'A' },
        { Name: 'B' },
        { Name: 'C' },
      ],
    });

    const headers = document.pages[0].items.filter(item => item.bandId === 'label-header');
    const labels = document.pages[0].items.filter(item => item.bandId === 'labels');
    expect(headers).toHaveLength(3);
    expect(headers.map(box => box.components[0]?.content)).toEqual(['PRICE', 'PRICE', 'PRICE']);
    expect(headers[0].x).toBeCloseTo(20, 1);
    expect(headers[1].x).toBeCloseTo(78.3, 1);
    expect(headers[2].x).toBeCloseTo(136.7, 1);
    expect(headers.every(box => box.width > 53 && box.width < 54)).toBe(true);
    expect(labels.map(box => Math.round(box.y * 10) / 10)).toEqual([28, 28, 28]);
  });

  it('moves down a data band column before continuing in the next column', () => {
    const template = makeTemplate([
      band('labels', 'data', {
        height: 100,
        dataBand: { dataSourceId: 'employees', columns: { count: 2, gap: 10, direction: 'downThenAcross' } },
        components: [textComponent('label', '{employees.Name}')],
      }),
    ]);
    template.pages[0].height = 260;
    template.pages[0].margins = { top: 20, right: 20, bottom: 20, left: 20 };

    const document = renderReport(template, {
      employees: [
        { Name: 'A' },
        { Name: 'B' },
        { Name: 'C' },
      ],
    });

    const boxes = document.pages[0].items.filter(item => item.bandId === 'labels');
    expect(boxes).toHaveLength(3);
    expect(boxes.map(box => Math.round(box.y * 10) / 10)).toEqual([20, 120, 20]);
    expect(boxes[0].x).toBeCloseTo(20, 1);
    expect(boxes[1].x).toBeCloseTo(20, 1);
    expect(boxes[2].x).toBeCloseTo(110, 1);
    expect(boxes[0].width).toBeCloseTo(80, 1);
  });

  it('rejects orphan HeaderBand without a following DataBand', () => {
    const template = makeTemplate([
      band('header', 'header'),
      band('page-footer', 'pageFooter'),
    ]);

    const result = validateTemplate(template);

    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.message.includes('HeaderBand requires a following data band'))).toBe(true);
  });

  it('rejects DataBand without a data source id', () => {
    const template = makeTemplate([
      band('data', 'data'),
    ]);

    const result = validateTemplate(template);

    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.message.includes('Data band requires dataBand.dataSourceId'))).toBe(true);
  });
});

function textComponent(id: string, text: string) {
  return {
    id,
    type: 'text' as const,
    x: 0,
    y: 0,
    width: 30,
    height: 6,
    text,
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left' as const,
    verticalAlign: 'top' as const,
    border: { style: 'none' as const, width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
  };
}
