import { describe, expect, it } from 'vitest';
import { formatJsonFieldExpression, inferJsonDictionary, parseJsonFieldExpression } from '../src';

describe('Phase 1 JSON dictionary', () => {
  it('infers top-level and nested array data sources from json data', () => {
    const dictionary = inferJsonDictionary({
      orders: [
        {
          id: 1,
          customer: 'A',
          total: 10,
          lines: [{ sku: 'S1', qty: 2 }],
        },
      ],
    });

    expect(dictionary.dataSources.map((source) => source.id)).toEqual(['orders', 'orders.lines']);
    expect(dictionary.dataSources[1]).toMatchObject({
      parentSourceId: 'orders',
      parentPath: 'orders.lines',
    });
    expect(flattenFields(dictionary).map((field) => [field.path, field.type])).toEqual([
      ['orders.id', 'number'],
      ['orders.customer', 'string'],
      ['orders.total', 'number'],
      ['orders.lines.sku', 'string'],
      ['orders.lines.qty', 'number'],
    ]);
  });

  it('widens mixed primitive samples and keeps date strings only when all non-empty values are date-like', () => {
    const dictionary = inferJsonDictionary({
      employees: [
        { id: 1, active: true, hiredAt: '2024-01-01', score: 10 },
        { id: 2, active: false, hiredAt: '2024-02-02', score: 'n/a' },
        { id: 3, active: null, hiredAt: '', score: 12 },
      ],
    });

    const fields = Object.fromEntries(flattenFields(dictionary).map((field) => [field.path, field.type]));
    expect(fields['employees.id']).toBe('number');
    expect(fields['employees.active']).toBe('boolean');
    expect(fields['employees.hiredAt']).toBe('date');
    expect(fields['employees.score']).toBe('string');
  });

  it('formats and parses Stimulsoft-style json field expressions', () => {
    expect(formatJsonFieldExpression('orders', 'customer')).toBe('{orders.customer}');
    expect(formatJsonFieldExpression('orders.lines', 'qty')).toBe('{orders.lines.qty}');
    expect(parseJsonFieldExpression('{orders.lines.qty}')).toEqual({
      sourceId: 'orders.lines',
      fieldName: 'qty',
      path: 'orders.lines.qty',
    });
  });
});

function flattenFields(dictionary: ReturnType<typeof inferJsonDictionary>) {
  return dictionary.dataSources.flatMap((source) => source.fields);
}
