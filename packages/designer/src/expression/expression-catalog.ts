import type { EvalContext } from '@report-designer/core';
import type { DesignerLocale } from '../i18n/messages';
import {
  EXPRESSION_FUNCTIONS,
  type ExpressionFunctionMeta,
} from './function-catalog';

export type ExpressionRuntimeFunction = (args: unknown[], ctx: EvalContext) => unknown;

export interface ExpressionSystemVariableMeta {
  name: string;
  insertText?: string;
  description: Record<DesignerLocale, string>;
  previewValue?: unknown | ((ctx: ExpressionVariablePreviewContext) => unknown);
}

export interface ExpressionVariablePreviewContext {
  templateName: string;
  rowIndex: number;
  date: Date;
}

export interface ExpressionFormatMeta {
  name: string;
  insertText: string;
  detail: Record<DesignerLocale, string>;
  description: Record<DesignerLocale, string>;
}

export interface ExpressionCatalogExtensions {
  functions?: Array<ExpressionFunctionMeta & { evaluate?: ExpressionRuntimeFunction }>;
  variables?: ExpressionSystemVariableMeta[];
  formats?: ExpressionFormatMeta[];
}

export interface ResolvedExpressionCatalog {
  functions: ExpressionFunctionMeta[];
  variables: ExpressionSystemVariableMeta[];
  formats: ExpressionFormatMeta[];
  runtimeFunctions: Record<string, ExpressionRuntimeFunction>;
}

export const BUILTIN_SYSTEM_VARIABLES: ExpressionSystemVariableMeta[] = [
  variable('{Today}', {
    'zh-CN': '当前日期。返回运行报表时的日期，可用于页眉、页脚和日期字段。',
    'en-US': 'Current date. Returns the date when the report runs and is commonly used in headers, footers, and date fields.',
  }, (ctx: ExpressionVariablePreviewContext) => ctx.date.toISOString().slice(0, 10)),
  variable('{Now}', {
    'zh-CN': '当前日期时间。返回运行报表时的完整日期和时间。',
    'en-US': 'Current date and time. Returns the full date and time when the report runs.',
  }, (ctx: ExpressionVariablePreviewContext) => ctx.date.toISOString()),
  variable('{PageNumber}', {
    'zh-CN': '当前页码。渲染和打印时按实际分页结果输出当前页序号。',
    'en-US': 'Current page number. Prints the page index from the actual rendered pagination result.',
  }, 1),
  variable('{TotalPages}', {
    'zh-CN': '总页数。渲染完成后输出报表的总页数。',
    'en-US': 'Total pages. Prints the total number of pages after the report has been rendered.',
  }, 1),
  variable('{Line}', {
    'zh-CN': '当前数据行序号。通常用于明细区显示行号。',
    'en-US': 'Current line number. Usually used in detail bands to display row numbers.',
  }, (ctx: ExpressionVariablePreviewContext) => ctx.rowIndex + 1),
  variable('{RowIndex}', {
    'zh-CN': '当前数据行索引，从 0 开始。',
    'en-US': 'Current zero-based data row index.',
  }, (ctx: ExpressionVariablePreviewContext) => ctx.rowIndex),
  variable('{RowNumber}', {
    'zh-CN': '当前数据行序号，从 1 开始。',
    'en-US': 'Current one-based data row number.',
  }, (ctx: ExpressionVariablePreviewContext) => ctx.rowIndex + 1),
  variable('{ReportName}', {
    'zh-CN': '当前报表名称。',
    'en-US': 'Current report name.',
  }, (ctx: ExpressionVariablePreviewContext) => ctx.templateName),
  variable('{UserName}', {
    'zh-CN': '当前用户名。预览时使用浏览器环境能够提供的默认用户值。',
    'en-US': 'Current user name. Preview uses the default user value available in the browser environment.',
  }, 'User'),
];

export const BUILTIN_FORMAT_PATTERNS: ExpressionFormatMeta[] = [
  format('FORMAT("N0", value)', 'FORMAT("${1:N0}", ${2:value})', '整数数字', 'Number without decimals.', '将数字格式化为整数文本。', 'Formats a number without decimal places.'),
  format('FORMAT("N2", value)', 'FORMAT("${1:N2}", ${2:value})', '两位小数', 'Number with two decimals.', '将数字格式化为保留两位小数的文本。', 'Formats a number with two decimal places.'),
  format('FORMAT("C", value)', 'FORMAT("${1:C}", ${2:value})', '货币', 'Currency.', '将数字格式化为货币文本。', 'Formats a number as currency text.'),
  format('FORMAT("P", value)', 'FORMAT("${1:P}", ${2:value})', '百分比', 'Percent.', '将数字格式化为百分比文本。', 'Formats a number as percentage text.'),
  format('FORMAT("D", value)', 'FORMAT("${1:D}", ${2:value})', '短日期', 'Short date.', '将日期或时间值格式化为短日期文本。', 'Formats a date or time value as a short date.'),
  format('FORMAT("T", value)', 'FORMAT("${1:T}", ${2:value})', '时间', 'Time.', '将日期或时间值格式化为时间文本。', 'Formats a date or time value as time text.'),
  format('#,##0.00', '#,##0.00', '数字模式', 'Number pattern.', '常用数字格式，包含千分位并保留两位小数。', 'Common number pattern with group separators and two decimal places.'),
  format('yyyy-MM-dd', 'yyyy-MM-dd', '日期模式', 'Date pattern.', '常用日期格式，输出年、月、日。', 'Common date pattern that prints year, month, and day.'),
  format('yyyy-MM-dd HH:mm:ss', 'yyyy-MM-dd HH:mm:ss', '日期时间模式', 'Date-time pattern.', '常用日期时间格式，输出日期、小时、分钟和秒。', 'Common date-time pattern that prints date, hour, minute, and second.'),
  format('0.00%', '0.00%', '百分比模式', 'Percentage pattern.', '常用百分比格式，保留两位小数。', 'Common percentage pattern with two decimal places.'),
  format('Yes/No', 'FORMAT("${1:BOOL}", ${2:value})', '布尔文本', 'Boolean text.', '将布尔值格式化为 Yes 或 No。', 'Formats a boolean value as Yes or No.'),
];

export function resolveExpressionCatalog(extensions?: ExpressionCatalogExtensions): ResolvedExpressionCatalog {
  const runtimeFunctions: Record<string, ExpressionRuntimeFunction> = {};
  const functions = mergeUnique(
    EXPRESSION_FUNCTIONS,
    extensions?.functions ?? [],
    item => normalizeFunctionName(item.name),
    (item) => {
      if (item.evaluate) {
        runtimeFunctions[normalizeFunctionName(item.name)] = item.evaluate;
      }
      const { evaluate: _evaluate, ...meta } = item;
      return meta;
    },
  );

  return {
    functions,
    variables: mergeUnique(
      BUILTIN_SYSTEM_VARIABLES,
      extensions?.variables ?? [],
      item => normalizeVariableName(item.name),
      item => normalizeVariableMeta(item),
    ),
    formats: mergeUnique(
      BUILTIN_FORMAT_PATTERNS,
      extensions?.formats ?? [],
      item => normalizeFormatName(item.name),
      item => item,
    ),
    runtimeFunctions,
  };
}

export function getExpressionVariableValues(
  catalog: ResolvedExpressionCatalog,
  context: ExpressionVariablePreviewContext,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const item of catalog.variables) {
    const key = stripVariableBraces(item.name);
    values[key] = typeof item.previewValue === 'function' ? item.previewValue(context) : item.previewValue;
  }
  return values;
}

function mergeUnique<TInput, TOutput>(
  builtins: TOutput[],
  extensions: TInput[],
  keyOf: (item: TInput | TOutput) => string,
  normalizeExtension: (item: TInput) => TOutput,
): TOutput[] {
  const used = new Set<string>();
  const result: TOutput[] = [];
  for (const item of builtins) {
    const key = keyOf(item);
    if (!used.has(key)) {
      used.add(key);
      result.push(item);
    }
  }
  for (const item of extensions) {
    const key = keyOf(item);
    if (!used.has(key)) {
      used.add(key);
      result.push(normalizeExtension(item));
    }
  }
  return result;
}

function variable(
  name: string,
  description: Record<DesignerLocale, string>,
  previewValue: ExpressionSystemVariableMeta['previewValue'],
): ExpressionSystemVariableMeta {
  return { name, insertText: name, description, previewValue };
}

function format(
  name: string,
  insertText: string,
  zhDetail: string,
  enDetail: string,
  zhDescription: string,
  enDescription: string,
): ExpressionFormatMeta {
  return {
    name,
    insertText,
    detail: { 'zh-CN': zhDetail, 'en-US': enDetail },
    description: { 'zh-CN': zhDescription, 'en-US': enDescription },
  };
}

function normalizeVariableMeta(item: ExpressionSystemVariableMeta): ExpressionSystemVariableMeta {
  const name = `{${stripVariableBraces(item.name)}}`;
  return {
    ...item,
    name,
    insertText: item.insertText ?? name,
  };
}

function normalizeFunctionName(name: string): string {
  return name.trim().toUpperCase();
}

function normalizeVariableName(name: string): string {
  return stripVariableBraces(name).toUpperCase();
}

function normalizeFormatName(name: string): string {
  return name.trim().toUpperCase();
}

function stripVariableBraces(name: string): string {
  return name.trim().replace(/^\{/, '').replace(/\}$/, '').trim();
}
