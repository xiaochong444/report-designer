import type { ReportTemplate } from '@report-designer/core';
import type { DesignerLocale } from '../../i18n/messages';
import { EXPRESSION_FUNCTIONS } from '../../expression/function-catalog';

export const REPORT_EXPRESSION_LANGUAGE_ID = 'report-expression';

export interface MonacoCompletionConstants {
  CompletionItemKind?: {
    Function: number;
    Field: number;
    Variable: number;
    Snippet: number;
  };
  CompletionItemInsertTextRule?: {
    InsertAsSnippet: number;
  };
  languages?: MonacoCompletionConstants & {
    register?: (language: { id: string }) => void;
    setMonarchTokensProvider?: (languageId: string, provider: unknown) => void;
    setLanguageConfiguration?: (languageId: string, configuration: unknown) => void;
  };
}

export interface ExpressionCompletionItem {
  label: string;
  kind: number;
  insertText: string;
  detail?: string;
  documentation?: string;
  insertTextRules?: number;
}

export function getExpressionModelPath(): string {
  return 'inmemory://report-expression/expression.expr';
}

export function registerReportExpressionLanguage(monaco: MonacoCompletionConstants): void {
  monaco.languages?.register?.({ id: REPORT_EXPRESSION_LANGUAGE_ID });
  monaco.languages?.setMonarchTokensProvider?.(REPORT_EXPRESSION_LANGUAGE_ID, {
    tokenizer: {
      root: [
        [/{[^}]*}/, 'variable'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/\b[A-Za-z][A-Za-z0-9_]*(?=\s*\()/, 'keyword'],
        [/[0-9]+(?:\.[0-9]+)?/, 'number'],
        [/[()+\-*/%=<>!]+/, 'operator'],
      ],
    },
  });
  monaco.languages?.setLanguageConfiguration?.(REPORT_EXPRESSION_LANGUAGE_ID, {
    brackets: [
      ['{', '}'],
      ['(', ')'],
      ['[', ']'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
    ],
  });
}

export function buildExpressionCompletions(
  template: ReportTemplate,
  locale: DesignerLocale,
  monaco: MonacoCompletionConstants,
): ExpressionCompletionItem[] {
  const constants = getCompletionConstants(monaco);
  const functionCompletions = EXPRESSION_FUNCTIONS.map(item => ({
    label: item.name,
    kind: constants.CompletionItemKind.Function,
    detail: item.signature,
    documentation: item.description[locale],
    insertText: item.insertText,
    insertTextRules: constants.CompletionItemInsertTextRule.InsertAsSnippet,
  }));
  const fieldCompletions = template.dataSources.flatMap(source =>
    (source.schema ?? source.fields ?? []).map(field => {
      const insertText = `{${source.id}.${field.name}}`;
      return {
        label: insertText,
        kind: constants.CompletionItemKind.Field,
        detail: field.label || field.name,
        insertText,
      };
    }),
  );
  const systemVariables = ['{Today}', '{PageNumber}', '{TotalPages}', '{Line}'].map(variable => ({
    label: variable,
    kind: constants.CompletionItemKind.Variable,
    insertText: variable,
  }));
  const formatSnippets = [
    {
      label: 'FORMAT("N2", value)',
      detail: 'Number with 2 decimals',
      insertText: 'FORMAT("${1:N2}", ${2:value})',
    },
    {
      label: 'FORMAT("C", value)',
      detail: 'Currency',
      insertText: 'FORMAT("${1:C}", ${2:value})',
    },
    {
      label: 'FORMAT("D", value)',
      detail: 'Date',
      insertText: 'FORMAT("${1:D}", ${2:value})',
    },
  ].map(item => ({
    ...item,
    kind: constants.CompletionItemKind.Snippet,
    insertTextRules: constants.CompletionItemInsertTextRule.InsertAsSnippet,
  }));

  return [...functionCompletions, ...fieldCompletions, ...systemVariables, ...formatSnippets];
}

function getCompletionConstants(monaco: MonacoCompletionConstants): Required<Pick<MonacoCompletionConstants, 'CompletionItemKind' | 'CompletionItemInsertTextRule'>> {
  const source = monaco.languages ?? monaco;
  const kind = source.CompletionItemKind ?? monaco.CompletionItemKind;
  const insertTextRule = source.CompletionItemInsertTextRule ?? monaco.CompletionItemInsertTextRule;

  if (
    typeof kind?.Function !== 'number' ||
    typeof kind.Field !== 'number' ||
    typeof kind.Variable !== 'number' ||
    typeof kind.Snippet !== 'number' ||
    typeof insertTextRule?.InsertAsSnippet !== 'number'
  ) {
    throw new Error('Monaco completion constants are not available.');
  }

  return {
    CompletionItemKind: kind,
    CompletionItemInsertTextRule: insertTextRule,
  };
}
