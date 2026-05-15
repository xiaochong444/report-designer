import { describe, expect, it } from 'vitest';
import { buildBandPlan, executeBandPlan } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

function renderedNames(rows: Record<string, unknown>[], sort: Array<{ field: string; direction: 'asc' | 'desc' }>) {
  const template = makeTemplate([
    band('data', 'data', { dataBand: { dataSourceId: 'employees', sort } }),
  ]);

  return executeBandPlan(buildBandPlan(template), { employees: rows })
    .filter(item => item.kind === 'band' && item.band.id === 'data')
    .map(item => item.context.row?.Name);
}

describe('Phase 22 DataBand sorting', () => {
  it('sorts by multiple rules and keeps original order for equal keys', () => {
    expect(renderedNames([
      { Name: 'First B', Department: 'Engineering', Score: 2 },
      { Name: 'First A', Department: 'Engineering', Score: 1 },
      { Name: 'Second A', Department: 'Engineering', Score: 1 },
      { Name: 'Sales A', Department: 'Sales', Score: 1 },
    ], [
      { field: 'Department', direction: 'asc' },
      { field: 'Score', direction: 'asc' },
    ])).toEqual(['First A', 'Second A', 'First B', 'Sales A']);
  });

  it('places nullish and empty values last for ascending and first for descending', () => {
    const rows = [
      { Name: 'Has 2', Rank: 2 },
      { Name: 'Missing', Rank: null },
      { Name: 'Has 1', Rank: 1 },
      { Name: 'Empty', Rank: '' },
    ];

    expect(renderedNames(rows, [{ field: 'Rank', direction: 'asc' }])).toEqual(['Has 1', 'Has 2', 'Missing', 'Empty']);
    expect(renderedNames(rows, [{ field: 'Rank', direction: 'desc' }])).toEqual(['Missing', 'Empty', 'Has 2', 'Has 1']);
  });

  it('compares valid dates by time before falling back to locale strings', () => {
    expect(renderedNames([
      { Name: 'February', Started: '2024-02-01' },
      { Name: 'January later', Started: '2024-01-02T12:00:00Z' },
      { Name: 'January earlier', Started: new Date('2024-01-02T08:00:00Z') },
    ], [{ field: 'Started', direction: 'asc' }])).toEqual(['January earlier', 'January later', 'February']);
  });

  it('passes each original row index to sort expressions', () => {
    expect(renderedNames([
      { Name: 'First' },
      { Name: 'Second' },
      { Name: 'Third' },
    ], [{ field: 'ROWINDEX()', direction: 'desc' }])).toEqual(['Third', 'Second', 'First']);
  });
});
