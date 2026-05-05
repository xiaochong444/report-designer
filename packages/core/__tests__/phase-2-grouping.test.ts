import { describe, expect, it } from 'vitest';
import { buildBandPlan, executeBandPlan } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

describe('Phase 2 grouping', () => {
  it('emits group headers, data rows, and group footers in data order', () => {
    const template = makeTemplate([
      band('group-header', 'groupHeader', { group: { name: 'Department', conditionExpression: '{employees.Department}' } }),
      band('data', 'data', { dataBand: { dataSourceId: 'employees' } }),
      band('group-footer', 'groupFooter', { group: { name: 'Department' } }),
    ]);
    const plan = buildBandPlan(template);

    const items = executeBandPlan(plan, {
      employees: [
        { Name: 'Alice', Department: 'Engineering' },
        { Name: 'Bob', Department: 'Engineering' },
        { Name: 'Cara', Department: 'Sales' },
      ],
    });

    expect(items.map((item) => item.kind === 'band' ? item.band.type : item.kind)).toEqual([
      'groupHeader',
      'data',
      'data',
      'groupFooter',
      'groupHeader',
      'data',
      'groupFooter',
    ]);
    const bandItems = items.filter((item) => item.kind === 'band');
    expect(bandItems[0].context.groupValues.Department).toBe('Engineering');
    expect(bandItems[1].context.row?.Name).toBe('Alice');
    expect(bandItems[4].context.groupValues.Department).toBe('Sales');
    expect(bandItems[5].context.row?.Name).toBe('Cara');
  });
});
