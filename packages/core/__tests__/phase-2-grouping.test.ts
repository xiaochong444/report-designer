import { describe, expect, it } from 'vitest';
import { buildBandPlan, executeBandPlan } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

describe('Phase 2 grouping', () => {
  it('emits group headers, data rows, and group footers in data order', () => {
    const template = makeTemplate([
      band('group-header', 'groupHeader', { group: { conditionExpression: '{employees.Department}' } }),
      band('data', 'data', { dataBand: { dataSourceId: 'employees' } }),
      band('group-footer', 'groupFooter'),
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

  it('sorts rows by the group header expression before grouping', () => {
    const template = makeTemplate([
      band('group-header', 'groupHeader', { group: { conditionExpression: '{employees.Department}', sortDirection: 'desc' } }),
      band('data', 'data', { dataBand: { dataSourceId: 'employees' } }),
      band('group-footer', 'groupFooter'),
    ]);

    const items = executeBandPlan(buildBandPlan(template), {
      employees: [
        { Name: 'Cara', Department: 'Engineering' },
        { Name: 'Alice', Department: 'Sales' },
        { Name: 'Bob', Department: 'Engineering' },
      ],
    }).filter((item) => item.kind === 'band');

    expect(items.map(item => item.band.type)).toEqual([
      'groupHeader',
      'data',
      'groupFooter',
      'groupHeader',
      'data',
      'data',
      'groupFooter',
    ]);
    expect(items[0].context.groupValues.Department).toBe('Sales');
    expect(items[1].context.row?.Name).toBe('Alice');
    expect(items[3].context.groupValues.Department).toBe('Engineering');
    expect(items[4].context.row?.Name).toBe('Cara');
    expect(items[5].context.row?.Name).toBe('Bob');
  });
});
