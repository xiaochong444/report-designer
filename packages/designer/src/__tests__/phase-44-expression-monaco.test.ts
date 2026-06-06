import { createDefaultTemplate } from '@report-designer/core';
import { describe, expect, it, vi } from 'vitest';
import {
  buildExpressionCompletions,
  getExpressionModelPath,
  registerReportExpressionLanguage,
} from '../components/expression/expression-monaco';

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
    register: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
    setLanguageConfiguration: vi.fn(),
  },
};

function templateWithOrders() {
  const template = createDefaultTemplate('Expression Monaco');
  template.dataSources = [
    {
      id: 'Orders',
      name: 'Orders',
      type: 'json',
      schema: [
        { name: 'Amount', type: 'number', label: 'Order Amount' },
        { name: 'CreatedAt', type: 'date' },
      ],
    },
  ];
  return template;
}

describe('phase 44 expression monaco helpers', () => {
  it('registers a report expression language and stable model path', () => {
    registerReportExpressionLanguage(monaco);

    expect(getExpressionModelPath()).toBe('inmemory://report-expression/expression.expr');
    expect(monaco.languages.register).toHaveBeenCalledWith({ id: 'report-expression' });
    expect(monaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
      'report-expression',
      expect.objectContaining({
        tokenizer: expect.any(Object),
      }),
    );
    expect(monaco.languages.setLanguageConfiguration).toHaveBeenCalledWith(
      'report-expression',
      expect.objectContaining({
        brackets: expect.any(Array),
      }),
    );
  });

  it('builds function, field, system variable, and format completions', () => {
    const completions = buildExpressionCompletions(templateWithOrders(), 'zh-CN', monaco);

    expect(completions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'DATEADD',
          kind: monaco.languages.CompletionItemKind.Function,
          detail: 'DATEADD(date, unit, amount)',
          documentation: expect.stringContaining('按指定单位对日期进行加减'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        }),
        expect.objectContaining({
          label: 'Orders.Amount',
          detail: 'Order Amount',
          kind: monaco.languages.CompletionItemKind.Field,
          insertText: '{Orders.Amount}',
        }),
        expect.objectContaining({
          label: '{PageNumber}',
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: '{PageNumber}',
        }),
        expect.objectContaining({
          label: 'FORMAT("N2", value)',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        }),
      ]),
    );
    expect(completions.find(item => item.label === 'SUM')?.documentation).toContain('示例: SUM({Orders.Amount})');
  });

  it('supports Monaco instances that expose completion constants at the root', () => {
    const completions = buildExpressionCompletions(templateWithOrders(), 'en-US', {
      CompletionItemKind: monaco.languages.CompletionItemKind,
      CompletionItemInsertTextRule: monaco.languages.CompletionItemInsertTextRule,
    });

    expect(completions.find(item => item.label === 'DATEADD')).toMatchObject({
      kind: monaco.languages.CompletionItemKind.Function,
      detail: 'DATEADD(date, unit, amount)',
      documentation: expect.stringContaining('Example: DATEADD({Orders.Date}, "day", 7)'),
    });
  });

  it('throws a clear error when Monaco completion constants are missing', () => {
    expect(() => buildExpressionCompletions(templateWithOrders(), 'zh-CN', {})).toThrow(
      'Monaco completion constants are not available.',
    );
  });
});
