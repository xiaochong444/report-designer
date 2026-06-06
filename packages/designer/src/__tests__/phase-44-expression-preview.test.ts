import { createDefaultTemplate } from '@report-designer/core';
import { describe, expect, it } from 'vitest';
import { previewReportExpression } from '../expression/expression-preview';

function templateWithOrders() {
  const template = createDefaultTemplate('Expression Preview');
  template.dataSources = [
    {
      id: 'Orders',
      name: 'Orders',
      type: 'json',
      schema: [
        { name: 'Amount', type: 'number' },
        { name: 'Name', type: 'string' },
      ],
      sampleRows: [{ Amount: 123.456, Name: 'ACME' }],
    } as any,
  ];
  return template;
}

function templateWithItems() {
  const template = createDefaultTemplate('Current Row Expression Preview');
  template.dataSources = [
    {
      id: 'items',
      name: 'items',
      type: 'json',
      schema: [
        { name: 'salesPrice', type: 'number' },
        { name: 'qty', type: 'number' },
        { name: 'salesDiscount', type: 'number' },
      ],
      sampleRows: [{ salesPrice: 5000, qty: 2, salesDiscount: 0.9 }],
    } as any,
  ];
  return template;
}

describe('phase 44 expression preview', () => {
  it('evaluates an expression against sample JSON data', () => {
    expect(previewReportExpression('FORMAT("N2", {Orders.Amount})', templateWithOrders())).toMatchObject({
      ok: true,
      value: '123.46',
    });
  });

  it('returns a readable error for invalid expressions', () => {
    const result = previewReportExpression('UNKNOWN({Orders.Amount})', templateWithOrders());
    if (result.ok) {
      throw new Error(`Expected preview to fail but received ${String(result.value)}`);
    }
    expect(result.message).toContain('Unknown function');
  });

  it('evaluates current-row fields inside custom function arguments', () => {
    expect(previewReportExpression(
      'FORMAT("N2", DISCOUNT({items.salesPrice} * {items.qty}, 1 - {items.salesDiscount}))',
      templateWithItems(),
      {
        functions: [{
          name: 'DISCOUNT',
          category: 'number',
          signature: 'DISCOUNT(price, rate)',
          detail: 'DISCOUNT(price, rate)',
          insertText: 'DISCOUNT(${1:price}, ${2:rate})',
          description: {
            'zh-CN': '按折扣率计算折后金额。',
            'en-US': 'Calculates a discounted amount by rate.',
          },
          examples: ['DISCOUNT({items.salesAmount}, 0.9)'],
          evaluate: ([price, rate]) => Number(price) * Number(rate),
        }],
      },
    )).toMatchObject({
      ok: true,
      value: '1000.00',
    });
  });
});
