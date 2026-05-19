import { describe, expect, it } from 'vitest';
import {
  buildEventEditorDataDts,
  toEventEditorPropertyName,
  toEventEditorTypeName,
} from '../src/event-engine';

describe('phase 25 event editor data contract', () => {
  it('builds typed data source rows for the active data source', () => {
    const dts = buildEventEditorDataDts({
      activeDataSourceId: 'employees',
      dataSources: [
        {
          id: 'employees',
          name: 'Employees',
          fields: [
            { name: 'name', type: 'string' },
            { name: 'salary', type: 'number' },
            { name: 'active', type: 'boolean' },
            { name: 'hireDate', type: 'date' },
            { name: 'note', type: 'string', nullable: true },
          ],
        },
      ],
      parameters: [],
    });

    expect(dts).toContain('interface EventDataSource_employees');
    expect(dts).toContain('name: string;');
    expect(dts).toContain('salary: number;');
    expect(dts).toContain('active: boolean;');
    expect(dts).toContain('hireDate: string;');
    expect(dts).toContain('note: string | null;');
    expect(dts).toContain('employees: EventDataSource_employees[];');
    expect(dts).toContain('row?: EventDataSource_employees;');
  });

  it('normalizes invalid data source ids and quotes invalid field names', () => {
    const dts = buildEventEditorDataDts({
      activeDataSourceId: 'order-lines',
      dataSources: [
        {
          id: 'order-lines',
          name: 'Order Lines',
          fields: [{ name: 'unit-price', type: 'number' }],
        },
      ],
      parameters: [],
    });

    expect(toEventEditorTypeName('order-lines')).toBe('EventDataSource_order_lines');
    expect(toEventEditorPropertyName('unit-price')).toBe('"unit-price"');
    expect(dts).toContain('interface EventDataSource_order_lines');
    expect(dts).toContain('"unit-price": number;');
    expect(dts).toContain('"order-lines": EventDataSource_order_lines[];');
  });

  it('adds typed parameters and falls back to generic row without an active data source', () => {
    const dts = buildEventEditorDataDts({
      dataSources: [],
      parameters: [
        { id: 'amount_field', name: 'amountField', type: 'string' },
        { id: 'showDetails', name: '', type: 'boolean' },
      ],
    });

    expect(dts).toContain('amountField?: string;');
    expect(dts).toContain('showDetails?: boolean;');
    expect(dts).toContain('row?: Record<string, unknown>;');
  });

  it('prefers schema fields, supports empty sources, and preserves leading digits in type names', () => {
    const dts = buildEventEditorDataDts({
      activeDataSourceId: '123-orders',
      dataSources: [
        {
          id: '123-orders',
          name: 'Orders',
          fields: [{ name: 'fromFields', type: 'string' }],
          schema: [{ name: 'fromSchema', type: 'number' }],
        },
        {
          id: 'empty',
          name: 'Empty',
          fields: [],
        },
      ],
      parameters: [],
    });

    expect(toEventEditorTypeName('123-orders')).toBe('EventDataSource__123_orders');
    expect(dts).toContain('interface EventDataSource__123_orders');
    expect(dts).toContain('fromSchema: number;');
    expect(dts).not.toContain('fromFields');
    expect(dts).toContain('interface EventDataSource_empty {\n  [key: string]: unknown;\n}');
    expect(dts).toContain('row?: EventDataSource__123_orders;');
  });
});
