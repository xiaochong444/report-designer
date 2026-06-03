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

describe('phase 44 expression preview', () => {
  it('evaluates an expression against sample JSON data', () => {
    expect(previewReportExpression('FORMAT("N2", {Orders.Amount})', templateWithOrders())).toMatchObject({
      ok: true,
      value: '123.46',
    });
  });

  it('returns a readable error for invalid expressions', () => {
    const result = previewReportExpression('UNKNOWN({Orders.Amount})', templateWithOrders());
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Unknown function');
  });
});
