import { describe, expect, it } from 'vitest';
import { buildBandPlan, executeBandPlan, validateTemplate } from '../src';
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
  it('renders a data section in Header, ColumnHeader, GroupHeader, Data, Child, GroupFooter, ColumnFooter, Footer order', () => {
    const sequence = bandTypesForData([
      band('report-title', 'reportTitle'),
      band('header', 'header'),
      band('column-header', 'columnHeader'),
      band('group-header', 'groupHeader', { group: { name: 'Department', conditionExpression: '{employees.Department}' } }),
      band('data', 'data', { dataBand: { dataSourceId: 'employees', sort: [{ field: 'Department', direction: 'asc' }] } }),
      band('child', 'child'),
      band('group-footer', 'groupFooter', { group: { name: 'Department' } }),
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
      'child',
      'data',
      'child',
      'groupFooter',
      'groupHeader',
      'data',
      'child',
      'groupFooter',
      'columnFooter',
      'footer',
      'reportSummary',
    ]);
  });

  it('renders EmptyData instead of Header/Data/Footer when a data section has no rows', () => {
    const sequence = bandTypesForData([
      band('header', 'header'),
      band('data', 'data', { dataBand: { dataSourceId: 'employees' } }),
      band('empty', 'emptyData'),
      band('footer', 'footer'),
    ], []);

    expect(sequence).toEqual(['emptyData']);
  });

  it('renders nested groups from outer GroupHeader to inner GroupHeader before data rows', () => {
    const template = makeTemplate([
      band('department-header', 'groupHeader', { group: { name: 'Department', conditionExpression: '{employees.Department}' } }),
      band('team-header', 'groupHeader', { group: { name: 'Team', conditionExpression: '{employees.Team}' } }),
      band('data', 'data', { dataBand: { dataSourceId: 'employees', sort: [{ field: 'Team', direction: 'asc' }] } }),
      band('team-footer', 'groupFooter', { group: { name: 'Team' } }),
      band('department-footer', 'groupFooter', { group: { name: 'Department' } }),
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
