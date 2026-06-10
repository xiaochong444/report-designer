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
