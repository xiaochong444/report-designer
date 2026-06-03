import { createDefaultTemplate } from '@report-designer/core';
import { describe, expect, it } from 'vitest';
import { validateReportExpression } from '../expression/expression-validation';

function templateWithOrders() {
  const template = createDefaultTemplate('Expression Validation');
  template.dataSources = [
    {
      id: 'Orders',
      name: 'Orders',
      type: 'json',
      schema: [
        { name: 'Amount', type: 'number' },
        { name: 'CreatedAt', type: 'date' },
      ],
    },
  ];
  return template;
}

describe('phase 44 expression validation', () => {
  it('passes a valid function and field expression', () => {
    expect(validateReportExpression('FORMAT("N2", {Orders.Amount})', templateWithOrders())).toEqual([]);
  });

  it('reports unknown functions and missing fields', () => {
    const diagnostics = validateReportExpression('UNKNOWN({Orders.Missing})', templateWithOrders());
    expect(diagnostics.map(item => item.message)).toEqual(
      expect.arrayContaining(['Unknown function: UNKNOWN', 'Unknown field: {Orders.Missing}']),
    );
  });

  it('reports unbalanced braces, parentheses, and strings', () => {
    expect(validateReportExpression('SUM({Orders.Amount)', templateWithOrders()).map(item => item.message)).toContain(
      'Brace count does not match',
    );
    expect(validateReportExpression('SUM({Orders.Amount}', templateWithOrders()).map(item => item.message)).toContain(
      'Parenthesis count does not match',
    );
    expect(validateReportExpression('FORMAT("N2, {Orders.Amount})', templateWithOrders()).map(item => item.message)).toContain(
      'String literal is not closed',
    );
  });
});
