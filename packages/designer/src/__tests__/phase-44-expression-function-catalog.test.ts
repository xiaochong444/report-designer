import { describe, expect, it } from 'vitest';
import {
  EXPRESSION_FUNCTION_CATEGORIES,
  EXPRESSION_FUNCTIONS,
  getExpressionFunctionNames,
  getExpressionFunctionsByCategory,
} from '../expression/function-catalog';

describe('phase 44 expression function catalog', () => {
  it('exposes runtime-supported functions grouped by category', () => {
    expect(EXPRESSION_FUNCTION_CATEGORIES.map(item => item.key)).toEqual([
      'common',
      'aggregate',
      'number',
      'text',
      'date',
      'logic',
      'report',
      'money',
      'format',
    ]);

    expect(getExpressionFunctionsByCategory('date').map(item => item.name)).toEqual(
      expect.arrayContaining(['NOW', 'TODAY', 'YEAR', 'MONTH', 'DAY', 'DATEADD', 'DATEDIFF']),
    );
    expect(getExpressionFunctionsByCategory('number').map(item => item.name)).toEqual(
      expect.arrayContaining(['ROUND', 'CEIL', 'FLOOR', 'ABS', 'TONUMBER']),
    );
    expect(getExpressionFunctionsByCategory('text').map(item => item.name)).toEqual(
      expect.arrayContaining([
        'CONCAT',
        'LEN',
        'UPPER',
        'LOWER',
        'TRIM',
        'SUBSTRING',
        'CONTAINS',
        'STARTSWITH',
        'ENDSWITH',
        'TOSTRING',
      ]),
    );
    expect(getExpressionFunctionsByCategory('aggregate').map(item => item.name)).toEqual(
      expect.arrayContaining(['SUM', 'AVG', 'COUNT', 'COUNTDISTINCT', 'MIN', 'MAX', 'SUMIF', 'COUNTIF', 'RUNNINGSUM']),
    );
    expect(getExpressionFunctionsByCategory('aggregate')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'SUM',
          signature: 'SUM(expression)',
          insertText: 'SUM(${1:{Orders.Amount}})',
          examples: ['SUM({Orders.Amount})'],
        }),
        expect.objectContaining({
          name: 'COUNT',
          signature: 'COUNT(expression)',
          insertText: 'COUNT(${1:{Orders.Id}})',
          examples: ['COUNT({Orders.Id})'],
        }),
        expect.objectContaining({
          name: 'SUMIF',
          signature: 'SUMIF(expression, condition)',
          insertText: 'SUMIF(${1:{Orders.Amount}}, "${2:{Orders.Status} = \\"OK\\"}")',
          examples: ['SUMIF({Orders.Amount}, "{Orders.Status} = \\"OK\\"")'],
        }),
        expect.objectContaining({
          name: 'COUNTIF',
          signature: 'COUNTIF(condition)',
          insertText: 'COUNTIF("${1:{Orders.Status} = \\"OK\\"}")',
          examples: ['COUNTIF("{Orders.Status} = \\"OK\\"")'],
        }),
      ]),
    );
    expect(
      getExpressionFunctionsByCategory('aggregate').some(item =>
        item.signature.includes('source')
        || item.insertText.includes('source')
        || item.examples.some(example => /"Orders"/.test(example)),
      ),
    ).toBe(false);
    expect(getExpressionFunctionNames()).toContain('DATEADD');
    expect(EXPRESSION_FUNCTIONS.every(item => item.insertText.length > 0 && item.signature.length > 0)).toBe(true);
  });
});
