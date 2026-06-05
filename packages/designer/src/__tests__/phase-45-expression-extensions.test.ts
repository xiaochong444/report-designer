import { createDefaultTemplate } from '@report-designer/core';
import { describe, expect, it, vi } from 'vitest';
import { buildExpressionCompletions } from '../components/expression/expression-monaco';
import {
  getExpressionVariableValues,
  resolveExpressionCatalog,
  type ExpressionCatalogExtensions,
} from '../expression/expression-catalog';
import { previewReportExpression } from '../expression/expression-preview';
import { validateReportExpression } from '../expression/expression-validation';

const monaco = {
  languages: {
    CompletionItemKind: {
      Function: 1,
      Field: 2,
      Variable: 3,
      Snippet: 4,
    },
    CompletionItemInsertTextRule: {
      InsertAsSnippet: 4,
    },
  },
};

function templateWithOrders() {
  const template = createDefaultTemplate('Expression Extensions');
  template.dataSources = [
    {
      id: 'Orders',
      name: 'Orders',
      type: 'json',
      schema: [
        { name: 'Amount', type: 'number' },
        { name: 'Phone', type: 'string' },
      ],
      sampleRows: [{ Amount: 200, Phone: '13812345678' }],
    } as any,
  ];
  return template;
}

const extensions: ExpressionCatalogExtensions = {
  functions: [
    {
      name: 'DISCOUNT',
      category: 'number',
      signature: 'DISCOUNT(price, rate)',
      detail: 'DISCOUNT(price, rate)',
      insertText: 'DISCOUNT(${1:price}, ${2:rate})',
      description: {
        'zh-CN': '按折扣率计算折后金额。',
        'en-US': 'Calculates a discounted amount by rate.',
      },
      examples: ['DISCOUNT({Orders.Amount}, 0.8)'],
      evaluate: ([price, rate]) => Number(price) * Number(rate),
    },
    {
      name: 'sum',
      category: 'aggregate',
      signature: 'SUM(custom)',
      detail: 'SUM(custom)',
      insertText: 'SUM(${1:custom})',
      description: {
        'zh-CN': '重复函数不应覆盖内置 SUM。',
        'en-US': 'Duplicate function should not override built-in SUM.',
      },
      examples: ['SUM(custom)'],
      evaluate: () => -1,
    },
  ],
  variables: [
    {
      name: 'TenantName',
      description: {
        'zh-CN': '当前租户名称。',
        'en-US': 'Current tenant name.',
      },
      previewValue: '演示租户',
    },
    {
      name: '{Today}',
      description: {
        'zh-CN': '重复变量不应覆盖内置 Today。',
        'en-US': 'Duplicate variable should not override built-in Today.',
      },
      previewValue: 'duplicate',
    },
  ],
  formats: [
    {
      name: 'FORMAT("CN_DATE", value)',
      insertText: 'FORMAT("${1:CN_DATE}", ${2:value})',
      detail: {
        'zh-CN': '中文日期',
        'en-US': 'Chinese date',
      },
      description: {
        'zh-CN': '按中文日期习惯展示年月日。',
        'en-US': 'Formats a value as a Chinese date.',
      },
    },
    {
      name: 'FORMAT("N2", value)',
      insertText: 'FORMAT("${1:N2}", ${2:value})',
      detail: {
        'zh-CN': '重复格式不应覆盖内置 N2。',
        'en-US': 'Duplicate format should not override built-in N2.',
      },
      description: {
        'zh-CN': '重复格式。',
        'en-US': 'Duplicate format.',
      },
    },
  ],
};

describe('phase 45 expression extensions', () => {
  it('merges built-in and custom catalog entries without duplicates', () => {
    const catalog = resolveExpressionCatalog(extensions);

    expect(catalog.functions.map(item => item.name)).toEqual(expect.arrayContaining(['POWER', 'LEFT', 'DATEFORMAT', 'DISCOUNT']));
    expect(catalog.variables.map(item => item.name)).toEqual(expect.arrayContaining(['{Now}', '{ReportName}', '{TenantName}']));
    expect(catalog.formats.map(item => item.name)).toEqual(expect.arrayContaining(['FORMAT("CN_DATE", value)', 'FORMAT("N2", value)']));

    expect(catalog.functions.filter(item => item.name.toUpperCase() === 'SUM')).toHaveLength(1);
    expect(catalog.functions.find(item => item.name.toUpperCase() === 'SUM')?.signature).toBe('SUM(expression)');
    expect(catalog.variables.filter(item => item.name.toUpperCase() === '{TODAY}')).toHaveLength(1);
    expect(catalog.formats.filter(item => item.name === 'FORMAT("N2", value)')).toHaveLength(1);
    expect(catalog.runtimeFunctions.SUM).toBeUndefined();
    expect(catalog.runtimeFunctions.DISCOUNT).toBeTypeOf('function');
  });

  it('builds Monaco completions from custom functions, variables, and formats', () => {
    const completions = buildExpressionCompletions(templateWithOrders(), 'en-US', monaco, extensions);

    expect(completions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'DISCOUNT',
          detail: 'DISCOUNT(price, rate)',
          documentation: expect.stringContaining('Calculates a discounted amount by rate.'),
        }),
        expect.objectContaining({
          label: '{TenantName}',
          kind: monaco.languages.CompletionItemKind.Variable,
          documentation: expect.stringContaining('Current tenant name.'),
        }),
        expect.objectContaining({
          label: 'FORMAT("CN_DATE", value)',
          detail: 'Chinese date',
          documentation: expect.stringContaining('Formats a value as a Chinese date.'),
        }),
      ]),
    );
    expect(completions.filter(item => item.label === 'SUM')).toHaveLength(1);
    expect(completions.filter(item => item.label === '{Today}')).toHaveLength(1);
    expect(completions.filter(item => item.label === 'FORMAT("N2", value)')).toHaveLength(1);
  });

  it('validates and previews custom functions and variables', () => {
    const template = templateWithOrders();
    expect(validateReportExpression('DISCOUNT({Orders.Amount}, 0.8)', template, extensions)).toEqual([]);
    expect(validateReportExpression('DISCOUNT({Orders.Amount}, 0.8) + {TenantName}', template, extensions)).toEqual([]);

    expect(previewReportExpression('DISCOUNT({Orders.Amount}, 0.8)', template, extensions)).toMatchObject({
      ok: true,
      value: 160,
    });
    expect(previewReportExpression('{TenantName}', template, extensions)).toMatchObject({
      ok: true,
      value: '演示租户',
    });
  });

  it('normalizes variable preview values from the resolved catalog', () => {
    vi.setSystemTime(new Date('2026-06-05T08:30:00.000Z'));
    const catalog = resolveExpressionCatalog(extensions);
    const values = getExpressionVariableValues(catalog, {
      templateName: 'Demo Report',
      rowIndex: 2,
      date: new Date('2026-06-05T08:30:00.000Z'),
    });

    expect(values.Today).toBe('2026-06-05');
    expect(values.Now).toBe('2026-06-05T08:30:00.000Z');
    expect(values.ReportName).toBe('Demo Report');
    expect(values.RowIndex).toBe(2);
    expect(values.RowNumber).toBe(3);
    expect(values.TenantName).toBe('演示租户');
    vi.useRealTimers();
  });
});
