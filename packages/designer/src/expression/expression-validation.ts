import type { ReportTemplate } from '@report-designer/core';
import { parse, tokenize } from '@report-designer/core';
import { resolveExpressionCatalog, type ExpressionCatalogExtensions } from './expression-catalog';

export interface ExpressionDiagnostic {
  severity: 'error' | 'warning';
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

function diagnostic(message: string, column = 1, severity: ExpressionDiagnostic['severity'] = 'error'): ExpressionDiagnostic {
  return {
    severity,
    message,
    startLineNumber: 1,
    startColumn: column,
    endLineNumber: 1,
    endColumn: Math.max(column + 1, column),
  };
}

export function validateReportExpression(
  expression: string,
  template: ReportTemplate,
  extensions?: ExpressionCatalogExtensions,
): ExpressionDiagnostic[] {
  const trimmed = expression.trim();
  if (!trimmed) return [];
  const catalog = resolveExpressionCatalog(extensions);

  const diagnostics: ExpressionDiagnostic[] = [
    ...validateBalancedCharacters(expression),
    ...validateFunctionNames(expression, catalog.functions.map(item => item.name)),
    ...validateFieldReferences(expression, template, catalog.variables.map(item => item.name)),
  ];

  if (diagnostics.length === 0) {
    try {
      parse(tokenize(expression));
    } catch (error) {
      diagnostics.push(diagnostic(error instanceof Error ? error.message : String(error)));
    }
  }

  return diagnostics;
}

function validateBalancedCharacters(expression: string): ExpressionDiagnostic[] {
  const diagnostics: ExpressionDiagnostic[] = [];
  if (countMatches(expression, /{/g) !== countMatches(expression, /}/g)) {
    diagnostics.push(diagnostic('Brace count does not match'));
  }
  if (countMatches(expression, /\(/g) !== countMatches(expression, /\)/g)) {
    diagnostics.push(diagnostic('Parenthesis count does not match'));
  }
  if (countMatches(expression, /"/g) % 2 !== 0) {
    diagnostics.push(diagnostic('String literal is not closed'));
  }
  return diagnostics;
}

function countMatches(value: string, regex: RegExp): number {
  return (value.match(regex) ?? []).length;
}

function validateFunctionNames(expression: string, functionNames: string[]): ExpressionDiagnostic[] {
  const supported = new Set(functionNames.map(name => name.toUpperCase()));
  const diagnostics: ExpressionDiagnostic[] = [];
  const functionCallPattern = /\b([A-Za-z][A-Za-z0-9_]*)\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = functionCallPattern.exec(expression))) {
    const functionName = match[1];
    if (!supported.has(functionName.toUpperCase())) {
      diagnostics.push(diagnostic(`Unknown function: ${functionName}`, match.index + 1));
    }
  }

  return diagnostics;
}

function validateFieldReferences(expression: string, template: ReportTemplate, variableNames: string[]): ExpressionDiagnostic[] {
  const fields = new Set<string>();
  for (const source of template.dataSources) {
    for (const field of source.schema ?? source.fields ?? []) {
      fields.add(`${source.id}.${field.name}`.toLowerCase());
    }
  }
  const variables = new Set(variableNames.map(name => name.trim().replace(/^\{/, '').replace(/\}$/, '').toLowerCase()));

  const diagnostics: ExpressionDiagnostic[] = [];
  const fieldPattern = /{([^{}]+)}/g;
  let match: RegExpExecArray | null;

  while ((match = fieldPattern.exec(expression))) {
    const fieldPath = match[1].trim();
    if (!fieldPath.includes('.') && variables.has(fieldPath.toLowerCase())) {
      continue;
    }
    if (fieldPath.includes('.') && !fields.has(fieldPath.toLowerCase())) {
      diagnostics.push(diagnostic(`Unknown field: {${fieldPath}}`, match.index + 1));
    }
  }

  return diagnostics;
}
