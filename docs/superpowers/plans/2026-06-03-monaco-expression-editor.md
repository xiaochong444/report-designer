# Monaco Expression Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the report expression textarea with a Monaco-based editor that provides report-expression syntax, function/field completion, diagnostics, and design-time test evaluation.

**Architecture:** Add designer-side expression modules for function metadata, validation, preview evaluation, and Monaco integration. Keep `ExpressionEditor` as the public modal shell while moving editor-specific behavior into `components/expression/ExpressionMonacoEditor.tsx` and `components/expression/expression-monaco.ts`.

**Tech Stack:** React 19, Ant Design 6, `@monaco-editor/react`, Vitest, Testing Library, existing `@report-designer/core` expression parser/evaluator.

---

## File Structure

- Create `packages/designer/src/expression/function-catalog.ts`: runtime-supported function metadata and category helpers.
- Create `packages/designer/src/expression/expression-validation.ts`: structured expression diagnostics.
- Create `packages/designer/src/expression/expression-preview.ts`: best-effort sample context and evaluation helper.
- Create `packages/designer/src/components/expression/expression-monaco.ts`: Monaco language registration and completion builders.
- Create `packages/designer/src/components/expression/ExpressionMonacoEditor.tsx`: reusable Monaco editor wrapper.
- Modify `packages/designer/src/components/ExpressionEditor.tsx`: modal layout, category browser, Monaco replacement, test result footer.
- Modify `packages/designer/src/i18n/messages.ts`: Chinese and English labels.
- Add/modify tests under `packages/designer/src/__tests__/`.

---

### Task 1: Function Catalog

**Files:**
- Create: `packages/designer/src/expression/function-catalog.ts`
- Test: `packages/designer/src/__tests__/phase-44-expression-function-catalog.test.ts`

- [ ] **Step 1: Write the failing catalog test**

Create `packages/designer/src/__tests__/phase-44-expression-function-catalog.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  EXPRESSION_FUNCTIONS,
  EXPRESSION_FUNCTION_CATEGORIES,
  getExpressionFunctionsByCategory,
  getExpressionFunctionNames,
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
      expect.arrayContaining(['CONCAT', 'LEN', 'UPPER', 'LOWER', 'TRIM', 'SUBSTRING', 'CONTAINS', 'STARTSWITH', 'ENDSWITH', 'TOSTRING']),
    );
    expect(getExpressionFunctionsByCategory('aggregate').map(item => item.name)).toEqual(
      expect.arrayContaining(['SUM', 'AVG', 'COUNT', 'COUNTDISTINCT', 'MIN', 'MAX', 'SUMIF', 'COUNTIF', 'RUNNINGSUM']),
    );
    expect(getExpressionFunctionNames()).toContain('DATEADD');
    expect(EXPRESSION_FUNCTIONS.every(item => item.insertText.length > 0 && item.signature.length > 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test and verify red**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-function-catalog
```

Expected: FAIL because `../expression/function-catalog` does not exist.

- [ ] **Step 3: Implement the function catalog**

Create `packages/designer/src/expression/function-catalog.ts`:

```ts
import type { DesignerLocale } from '../i18n/messages';

export type ExpressionFunctionCategory =
  | 'common'
  | 'aggregate'
  | 'number'
  | 'text'
  | 'date'
  | 'logic'
  | 'report'
  | 'money'
  | 'format';

export interface ExpressionFunctionMeta {
  name: string;
  category: ExpressionFunctionCategory;
  description: Record<DesignerLocale, string>;
  signature: string;
  insertText: string;
  detail: string;
  examples: string[];
}

export const EXPRESSION_FUNCTION_CATEGORIES: Array<{ key: ExpressionFunctionCategory; labelKey: string }> = [
  { key: 'common', labelKey: 'expressionEditor.category.common' },
  { key: 'aggregate', labelKey: 'expressionEditor.category.aggregate' },
  { key: 'number', labelKey: 'expressionEditor.category.number' },
  { key: 'text', labelKey: 'expressionEditor.category.text' },
  { key: 'date', labelKey: 'expressionEditor.category.date' },
  { key: 'logic', labelKey: 'expressionEditor.category.logic' },
  { key: 'report', labelKey: 'expressionEditor.category.report' },
  { key: 'money', labelKey: 'expressionEditor.category.money' },
  { key: 'format', labelKey: 'expressionEditor.category.format' },
];

function fn(
  name: string,
  category: ExpressionFunctionCategory,
  zh: string,
  en: string,
  signature: string,
  insertText: string,
  examples: string[],
): ExpressionFunctionMeta {
  return {
    name,
    category,
    description: { 'zh-CN': zh, 'en-US': en },
    signature,
    insertText,
    detail: signature,
    examples,
  };
}

export const EXPRESSION_FUNCTIONS: ExpressionFunctionMeta[] = [
  fn('IF', 'common', '条件判断', 'Conditional expression', 'IF(condition, trueValue, falseValue)', 'IF(${1:condition}, ${2:trueValue}, ${3:falseValue})', ['IF({Orders.Amount} > 0, "Y", "N")']),
  fn('FORMAT', 'common', '格式化值', 'Format value', 'FORMAT(pattern, value)', 'FORMAT("${1:N2}", ${2:value})', ['FORMAT("N2", {Orders.Amount})']),
  fn('SUM', 'common', '求和', 'Sum', 'SUM(source, expression)', 'SUM("${1:source}", "${2:{source.field}}")', ['SUM("Orders", "{Orders.Amount}")']),
  fn('TODAY', 'common', '当前日期', 'Current date', 'TODAY()', 'TODAY()', ['TODAY()']),
  fn('CONCAT', 'common', '拼接文本', 'Concatenate text', 'CONCAT(value1, value2)', 'CONCAT(${1:value1}, ${2:value2})', ['CONCAT({Customer.Name}, " - ", {Orders.Code})']),
  fn('AVG', 'aggregate', '平均值', 'Average', 'AVG(source, expression)', 'AVG("${1:source}", "${2:{source.field}}")', ['AVG("Orders", "{Orders.Amount}")']),
  fn('COUNT', 'aggregate', '计数', 'Count', 'COUNT(source)', 'COUNT("${1:source}")', ['COUNT("Orders")']),
  fn('COUNTDISTINCT', 'aggregate', '去重计数', 'Distinct count', 'COUNTDISTINCT(source, expression)', 'COUNTDISTINCT("${1:source}", "${2:{source.field}}")', ['COUNTDISTINCT("Orders", "{Orders.CustomerId}")']),
  fn('MIN', 'aggregate', '最小值', 'Minimum', 'MIN(source, expression)', 'MIN("${1:source}", "${2:{source.field}}")', ['MIN("Orders", "{Orders.Amount}")']),
  fn('MAX', 'aggregate', '最大值', 'Maximum', 'MAX(source, expression)', 'MAX("${1:source}", "${2:{source.field}}")', ['MAX("Orders", "{Orders.Amount}")']),
  fn('SUMIF', 'aggregate', '条件求和', 'Conditional sum', 'SUMIF(source, expression, condition)', 'SUMIF("${1:source}", "${2:{source.field}}", "${3:{source.status} = \\"OK\\"}")', ['SUMIF("Orders", "{Orders.Amount}", "{Orders.Status} = \\"OK\\"")']),
  fn('COUNTIF', 'aggregate', '条件计数', 'Conditional count', 'COUNTIF(source, condition)', 'COUNTIF("${1:source}", "${2:{source.status} = \\"OK\\"}")', ['COUNTIF("Orders", "{Orders.Status} = \\"OK\\"")']),
  fn('RUNNINGSUM', 'aggregate', '运行合计', 'Running sum', 'RUNNINGSUM(source, expression)', 'RUNNINGSUM("${1:source}", "${2:{source.field}}")', ['RUNNINGSUM("Orders", "{Orders.Amount}")']),
  fn('ROUND', 'number', '四舍五入', 'Round', 'ROUND(value, digits)', 'ROUND(${1:value}, ${2:2})', ['ROUND({Orders.Amount}, 2)']),
  fn('CEIL', 'number', '向上取整', 'Ceiling', 'CEIL(value)', 'CEIL(${1:value})', ['CEIL({Orders.Amount})']),
  fn('FLOOR', 'number', '向下取整', 'Floor', 'FLOOR(value)', 'FLOOR(${1:value})', ['FLOOR({Orders.Amount})']),
  fn('ABS', 'number', '绝对值', 'Absolute value', 'ABS(value)', 'ABS(${1:value})', ['ABS({Orders.Amount})']),
  fn('TONUMBER', 'number', '转换为数字', 'Convert to number', 'TONUMBER(value)', 'TONUMBER(${1:value})', ['TONUMBER({Orders.AmountText})']),
  fn('LEN', 'text', '文本长度', 'Text length', 'LEN(value)', 'LEN(${1:value})', ['LEN({Customer.Name})']),
  fn('UPPER', 'text', '转换为大写', 'Uppercase', 'UPPER(value)', 'UPPER(${1:value})', ['UPPER({Customer.Code})']),
  fn('LOWER', 'text', '转换为小写', 'Lowercase', 'LOWER(value)', 'LOWER(${1:value})', ['LOWER({Customer.Code})']),
  fn('TRIM', 'text', '去除首尾空格', 'Trim whitespace', 'TRIM(value)', 'TRIM(${1:value})', ['TRIM({Customer.Name})']),
  fn('SUBSTRING', 'text', '截取文本', 'Substring', 'SUBSTRING(value, start, length)', 'SUBSTRING(${1:value}, ${2:0}, ${3:3})', ['SUBSTRING({Customer.Name}, 0, 3)']),
  fn('CONTAINS', 'text', '包含文本', 'Contains text', 'CONTAINS(value, search)', 'CONTAINS(${1:value}, ${2:search})', ['CONTAINS({Customer.Name}, "Ltd")']),
  fn('STARTSWITH', 'text', '以文本开头', 'Starts with', 'STARTSWITH(value, search)', 'STARTSWITH(${1:value}, ${2:search})', ['STARTSWITH({Customer.Code}, "A")']),
  fn('ENDSWITH', 'text', '以文本结尾', 'Ends with', 'ENDSWITH(value, search)', 'ENDSWITH(${1:value}, ${2:search})', ['ENDSWITH({Customer.Code}, "Z")']),
  fn('TOSTRING', 'text', '转换为文本', 'Convert to string', 'TOSTRING(value)', 'TOSTRING(${1:value})', ['TOSTRING({Orders.Amount})']),
  fn('NOW', 'date', '当前日期时间', 'Current date and time', 'NOW()', 'NOW()', ['NOW()']),
  fn('YEAR', 'date', '年份', 'Year', 'YEAR(date)', 'YEAR(${1:date})', ['YEAR({Orders.Date})']),
  fn('MONTH', 'date', '月份', 'Month', 'MONTH(date)', 'MONTH(${1:date})', ['MONTH({Orders.Date})']),
  fn('DAY', 'date', '日期中的天', 'Day', 'DAY(date)', 'DAY(${1:date})', ['DAY({Orders.Date})']),
  fn('DATEADD', 'date', '日期加减', 'Add date interval', 'DATEADD(date, unit, amount)', 'DATEADD(${1:date}, "${2:day}", ${3:1})', ['DATEADD({Orders.Date}, "day", 7)']),
  fn('DATEDIFF', 'date', '日期差值', 'Date difference', 'DATEDIFF(start, end, unit)', 'DATEDIFF(${1:start}, ${2:end}, "${3:day}")', ['DATEDIFF({Orders.Start}, {Orders.End}, "day")']),
  fn('IIF', 'logic', '条件判断别名', 'Conditional alias', 'IIF(condition, trueValue, falseValue)', 'IIF(${1:condition}, ${2:trueValue}, ${3:falseValue})', ['IIF({Orders.Amount} > 0, "Y", "N")']),
  fn('ISNULL', 'logic', '是否为空', 'Is null', 'ISNULL(value)', 'ISNULL(${1:value})', ['ISNULL({Customer.Name})']),
  fn('COALESCE', 'logic', '返回第一个非空值', 'First non-null value', 'COALESCE(value1, value2)', 'COALESCE(${1:value1}, ${2:value2})', ['COALESCE({Customer.Name}, "Unknown")']),
  fn('PAGE', 'report', '当前页码', 'Current page', 'PAGE()', 'PAGE()', ['PAGE()']),
  fn('TOTALPAGES', 'report', '总页数', 'Total pages', 'TOTALPAGES()', 'TOTALPAGES()', ['TOTALPAGES()']),
  fn('ROWINDEX', 'report', '当前行索引', 'Current row index', 'ROWINDEX()', 'ROWINDEX()', ['ROWINDEX()']),
  fn('RMBUPPER', 'money', '人民币金额大写', 'RMB uppercase', 'RMBUPPER(value)', 'RMBUPPER(${1:value})', ['RMBUPPER({Orders.Amount})']),
  fn('MONEYUPPER', 'money', '金额大写别名', 'Money uppercase alias', 'MONEYUPPER(value)', 'MONEYUPPER(${1:value})', ['MONEYUPPER({Orders.Amount})']),
  fn('CNYUPPER', 'money', '人民币大写别名', 'CNY uppercase alias', 'CNYUPPER(value)', 'CNYUPPER(${1:value})', ['CNYUPPER({Orders.Amount})']),
  fn('CHINESEMONEY', 'money', '中文金额大写别名', 'Chinese money uppercase alias', 'CHINESEMONEY(value)', 'CHINESEMONEY(${1:value})', ['CHINESEMONEY({Orders.Amount})']),
  fn('FORMAT', 'format', '格式化值', 'Format value', 'FORMAT(pattern, value)', 'FORMAT("${1:N2}", ${2:value})', ['FORMAT("C", {Orders.Amount})']),
];

export function getExpressionFunctionsByCategory(category: ExpressionFunctionCategory): ExpressionFunctionMeta[] {
  return EXPRESSION_FUNCTIONS.filter(item => item.category === category);
}

export function getExpressionFunctionNames(): string[] {
  return Array.from(new Set(EXPRESSION_FUNCTIONS.map(item => item.name)));
}
```

- [ ] **Step 4: Verify green**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-function-catalog
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/designer/src/expression/function-catalog.ts packages/designer/src/__tests__/phase-44-expression-function-catalog.test.ts
git commit -m "feat(expression): 增加表达式函数目录"
```

---

### Task 2: Expression Validation

**Files:**
- Create: `packages/designer/src/expression/expression-validation.ts`
- Test: `packages/designer/src/__tests__/phase-44-expression-validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create `packages/designer/src/__tests__/phase-44-expression-validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { validateReportExpression } from '../expression/expression-validation';

function templateWithOrders() {
  const template = createDefaultTemplate('Expression Validation');
  template.dataSources = [{
    id: 'Orders',
    name: 'Orders',
    type: 'json',
    schema: [
      { name: 'Amount', type: 'number' },
      { name: 'CreatedAt', type: 'date' },
    ],
  }];
  return template;
}

describe('phase 44 expression validation', () => {
  it('passes a valid function and field expression', () => {
    expect(validateReportExpression('FORMAT("N2", {Orders.Amount})', templateWithOrders())).toEqual([]);
  });

  it('reports unknown functions and missing fields', () => {
    const diagnostics = validateReportExpression('UNKNOWN({Orders.Missing})', templateWithOrders());
    expect(diagnostics.map(item => item.message)).toEqual(expect.arrayContaining([
      'Unknown function: UNKNOWN',
      'Unknown field: {Orders.Missing}',
    ]));
  });

  it('reports unbalanced braces, parentheses, and strings', () => {
    expect(validateReportExpression('SUM({Orders.Amount)', templateWithOrders()).map(item => item.message)).toContain('Brace count does not match');
    expect(validateReportExpression('SUM({Orders.Amount}', templateWithOrders()).map(item => item.message)).toContain('Parenthesis count does not match');
    expect(validateReportExpression('FORMAT("N2, {Orders.Amount})', templateWithOrders()).map(item => item.message)).toContain('String literal is not closed');
  });
});
```

- [ ] **Step 2: Run tests and verify red**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-validation
```

Expected: FAIL because validation module does not exist.

- [ ] **Step 3: Implement validation**

Create `packages/designer/src/expression/expression-validation.ts`:

```ts
import type { ReportTemplate } from '@report-designer/core';
import { parse, tokenize } from '@report-designer/core';
import { getExpressionFunctionNames } from './function-catalog';

export interface ExpressionDiagnostic {
  severity: 'error' | 'warning';
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

const DEFAULT_RANGE = {
  startLineNumber: 1,
  startColumn: 1,
  endLineNumber: 1,
  endColumn: 1,
};

function error(message: string, column = 1): ExpressionDiagnostic {
  return {
    severity: 'error',
    message,
    startLineNumber: 1,
    startColumn: column,
    endLineNumber: 1,
    endColumn: column + 1,
  };
}

export function validateReportExpression(expression: string, template: ReportTemplate): ExpressionDiagnostic[] {
  const diagnostics: ExpressionDiagnostic[] = [];
  if (!expression.trim()) return diagnostics;

  const openBraces = (expression.match(/{/g) ?? []).length;
  const closeBraces = (expression.match(/}/g) ?? []).length;
  const openParens = (expression.match(/\(/g) ?? []).length;
  const closeParens = (expression.match(/\)/g) ?? []).length;
  const quoteCount = (expression.match(/"/g) ?? []).length;

  if (openBraces !== closeBraces) diagnostics.push(error('Brace count does not match'));
  if (openParens !== closeParens) diagnostics.push(error('Parenthesis count does not match'));
  if (quoteCount % 2 !== 0) diagnostics.push(error('String literal is not closed'));

  diagnostics.push(...validateFunctionNames(expression));
  diagnostics.push(...validateFieldReferences(expression, template));

  if (diagnostics.length === 0) {
    try {
      parse(tokenize(expression));
    } catch (err) {
      diagnostics.push({ ...DEFAULT_RANGE, severity: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  return diagnostics;
}

function validateFunctionNames(expression: string): ExpressionDiagnostic[] {
  const supported = new Set(getExpressionFunctionNames().map(name => name.toUpperCase()));
  const diagnostics: ExpressionDiagnostic[] = [];
  const regex = /\b([A-Za-z][A-Za-z0-9_]*)\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(expression))) {
    const name = match[1].toUpperCase();
    if (!supported.has(name)) {
      diagnostics.push(error(`Unknown function: ${match[1]}`, match.index + 1));
    }
  }
  return diagnostics;
}

function validateFieldReferences(expression: string, template: ReportTemplate): ExpressionDiagnostic[] {
  const fields = new Set<string>();
  for (const source of template.dataSources) {
    for (const field of source.schema ?? source.fields ?? []) {
      fields.add(`${source.id}.${field.name}`.toLowerCase());
    }
  }

  const diagnostics: ExpressionDiagnostic[] = [];
  const regex = /{([^{}]+)}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(expression))) {
    const key = match[1].trim();
    if (key.includes('.') && !fields.has(key.toLowerCase())) {
      diagnostics.push(error(`Unknown field: {${key}}`, match.index + 1));
    }
  }
  return diagnostics;
}
```

- [ ] **Step 4: Export parser helpers from core if needed**

If `@report-designer/core` does not export `tokenize` and `parse`, modify `packages/core/src/expression-engine/index.ts`:

```ts
export { tokenize } from './lexer';
export { parse } from './parser';
export { evaluate, evalExpression, builtinFunctions } from './evaluator';
```

Then ensure `packages/core/src/index.ts` re-exports expression-engine:

```ts
export * from './expression-engine';
```

- [ ] **Step 5: Verify green**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-validation
pnpm --filter @report-designer/core test -- expression
```

Expected: designer validation tests pass and existing core expression tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/designer/src/expression/expression-validation.ts packages/designer/src/__tests__/phase-44-expression-validation.test.ts packages/core/src/expression-engine/index.ts packages/core/src/index.ts
git commit -m "feat(expression): 增加表达式校验"
```

---

### Task 3: Monaco Language and Completion Builders

**Files:**
- Create: `packages/designer/src/components/expression/expression-monaco.ts`
- Test: `packages/designer/src/__tests__/phase-44-expression-monaco.test.ts`

- [ ] **Step 1: Write failing Monaco helper tests**

Create `packages/designer/src/__tests__/phase-44-expression-monaco.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createDefaultTemplate } from '@report-designer/core';
import {
  buildExpressionCompletions,
  getExpressionModelPath,
  registerReportExpressionLanguage,
} from '../components/expression/expression-monaco';

const monaco = {
  languages: {
    CompletionItemKind: { Function: 1, Field: 2, Variable: 3, Snippet: 4 },
    CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
    register: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
    registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
  },
};

function templateWithOrders() {
  const template = createDefaultTemplate('Expression Monaco');
  template.dataSources = [{
    id: 'Orders',
    name: 'Orders',
    type: 'json',
    schema: [{ name: 'Amount', type: 'number' }],
  }];
  return template;
}

describe('phase 44 expression monaco helpers', () => {
  it('uses a stable report expression model path', () => {
    expect(getExpressionModelPath()).toBe('inmemory://report-designer/expression/report-expression.expr');
  });

  it('registers the report-expression language', () => {
    registerReportExpressionLanguage(monaco as any);
    expect(monaco.languages.register).toHaveBeenCalledWith({ id: 'report-expression' });
    expect(monaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith('report-expression', expect.any(Object));
  });

  it('builds function, field, and system completions', () => {
    const suggestions = buildExpressionCompletions(templateWithOrders(), 'zh-CN', monaco as any);
    expect(suggestions.map(item => item.label)).toEqual(expect.arrayContaining([
      'DATEADD',
      'ROUND',
      '{Orders.Amount}',
      '{Today}',
    ]));
    expect(suggestions.find(item => item.label === 'DATEADD')).toMatchObject({
      kind: 1,
      insertTextRules: 4,
    });
    expect(suggestions.find(item => item.label === '{Orders.Amount}')).toMatchObject({
      kind: 2,
      insertText: '{Orders.Amount}',
    });
  });
});
```

- [ ] **Step 2: Run test and verify red**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-monaco
```

Expected: FAIL because `expression-monaco.ts` does not exist.

- [ ] **Step 3: Implement Monaco helpers**

Create `packages/designer/src/components/expression/expression-monaco.ts`:

```ts
import type { ReportTemplate } from '@report-designer/core';
import type { DesignerLocale } from '../../i18n/messages';
import { EXPRESSION_FUNCTIONS } from '../../expression/function-catalog';

export interface MonacoCompletionConstants {
  languages?: MonacoCompletionConstants & {
    register?: (language: { id: string }) => void;
    setMonarchTokensProvider?: (languageId: string, provider: unknown) => void;
    registerCompletionItemProvider?: (languageId: string, provider: { provideCompletionItems: () => { suggestions: ExpressionCompletionItem[] } }) => { dispose: () => void };
  };
  CompletionItemKind?: Record<string, number>;
  CompletionItemInsertTextRule?: Record<string, number>;
}

export interface ExpressionCompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText: string;
  insertTextRules?: number;
}

export function getExpressionModelPath() {
  return 'inmemory://report-designer/expression/report-expression.expr';
}

export function registerReportExpressionLanguage(monaco: MonacoCompletionConstants) {
  const languages = monaco.languages;
  languages?.register?.({ id: 'report-expression' });
  languages?.setMonarchTokensProvider?.('report-expression', {
    tokenizer: {
      root: [
        [/{[^{}]*}/, 'variable'],
        [/"([^"\\\\]|\\\\.)*$/, 'string.invalid'],
        [/"([^"\\\\]|\\\\.)*"/, 'string'],
        [/\b(AND|OR|NOT)\b/i, 'keyword'],
        [/\b[A-Za-z][A-Za-z0-9_]*(?=\s*\()/, 'function'],
        [/[0-9]+(\.[0-9]+)?/, 'number'],
        [/[+\-*/%=<>!]+/, 'operator'],
      ],
    },
  });
}

export function buildExpressionCompletions(template: ReportTemplate, locale: DesignerLocale, monaco: MonacoCompletionConstants): ExpressionCompletionItem[] {
  const kind = monaco.languages?.CompletionItemKind ?? monaco.CompletionItemKind ?? {};
  const insertTextRule = monaco.languages?.CompletionItemInsertTextRule ?? monaco.CompletionItemInsertTextRule ?? {};
  const suggestions: ExpressionCompletionItem[] = [];

  for (const item of EXPRESSION_FUNCTIONS) {
    suggestions.push({
      label: item.name,
      kind: kind.Function ?? 1,
      detail: item.signature,
      documentation: `${item.description[locale]}\n\n${item.examples.join('\n')}`,
      insertText: item.insertText,
      insertTextRules: insertTextRule.InsertAsSnippet ?? 4,
    });
  }

  for (const source of template.dataSources) {
    for (const field of source.schema ?? source.fields ?? []) {
      const insertText = `{${source.id}.${field.name}}`;
      suggestions.push({
        label: insertText,
        kind: kind.Field ?? 2,
        detail: field.label || field.name,
        insertText,
      });
    }
  }

  for (const variable of ['{Today}', '{PageNumber}', '{TotalPages}', '{Line}']) {
    suggestions.push({
      label: variable,
      kind: kind.Variable ?? 3,
      insertText: variable,
    });
  }

  return suggestions;
}
```

- [ ] **Step 4: Verify green**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-monaco
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/designer/src/components/expression/expression-monaco.ts packages/designer/src/__tests__/phase-44-expression-monaco.test.ts
git commit -m "feat(expression): 增加monaco表达式语言提示"
```

---

### Task 4: Monaco Editor Component

**Files:**
- Create: `packages/designer/src/components/expression/ExpressionMonacoEditor.tsx`
- Test: `packages/designer/src/__tests__/phase-44-expression-monaco-editor.test.tsx`

- [ ] **Step 1: Write failing component test**

Create `packages/designer/src/__tests__/phase-44-expression-monaco-editor.test.tsx`:

```tsx
/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { ExpressionMonacoEditor } from '../components/expression/ExpressionMonacoEditor';

const monacoEditorMock = vi.hoisted(() => ({
  lastProps: undefined as Record<string, unknown> | undefined,
}));

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => {
    monacoEditorMock.lastProps = props;
    return (
      <textarea
        aria-label={props['aria-label'] as string}
        value={props.value as string}
        onChange={(event) => (props.onChange as (value: string | undefined) => void)(event.target.value)}
      />
    );
  },
}));

describe('phase 44 expression monaco editor component', () => {
  it('renders Monaco with the report-expression language and propagates changes', () => {
    const template = createDefaultTemplate('Monaco Editor');
    let nextValue = '';

    render(
      <ExpressionMonacoEditor
        ariaLabel="Expression"
        value="SUM()"
        template={template}
        locale="zh-CN"
        onChange={(value) => { nextValue = value; }}
        onDiagnostics={() => {}}
      />,
    );

    expect(monacoEditorMock.lastProps).toMatchObject({
      language: 'report-expression',
      value: 'SUM()',
      height: 260,
    });
    fireEvent.change(screen.getByLabelText('Expression'), { target: { value: 'DATEADD(TODAY(), "day", 1)' } });
    expect(nextValue).toBe('DATEADD(TODAY(), "day", 1)');
  });
});
```

- [ ] **Step 2: Run test and verify red**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-monaco-editor
```

Expected: FAIL because `ExpressionMonacoEditor` does not exist.

- [ ] **Step 3: Implement component**

Create `packages/designer/src/components/expression/ExpressionMonacoEditor.tsx`:

```tsx
import React, { useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { ReportTemplate } from '@report-designer/core';
import type { DesignerLocale } from '../../i18n/messages';
import { validateReportExpression, type ExpressionDiagnostic } from '../../expression/expression-validation';
import {
  buildExpressionCompletions,
  getExpressionModelPath,
  registerReportExpressionLanguage,
  type MonacoCompletionConstants,
} from './expression-monaco';

interface Disposable {
  dispose: () => void;
}

interface MonacoLike extends MonacoCompletionConstants {
  editor?: {
    setModelMarkers?: (model: unknown, owner: string, markers: unknown[]) => void;
  };
  languages?: MonacoCompletionConstants['languages'] & {
    registerCompletionItemProvider?: (languageId: string, provider: { provideCompletionItems: () => { suggestions: unknown[] } }) => Disposable;
  };
}

export const ExpressionMonacoEditor: React.FC<{
  ariaLabel: string;
  value: string;
  template: ReportTemplate;
  locale: DesignerLocale;
  height?: number;
  onChange: (value: string) => void;
  onDiagnostics: (diagnostics: ExpressionDiagnostic[]) => void;
}> = ({ ariaLabel, height = 260, locale, onChange, onDiagnostics, template, value }) => {
  const monacoRef = useRef<MonacoLike | null>(null);
  const editorRef = useRef<{ getModel?: () => unknown } | null>(null);
  const completionDisposableRef = useRef<Disposable | null>(null);

  const updateDiagnostics = useCallback((nextValue: string) => {
    const diagnostics = validateReportExpression(nextValue, template);
    onDiagnostics(diagnostics);
    const model = editorRef.current?.getModel?.();
    monacoRef.current?.editor?.setModelMarkers?.(model, 'report-expression', diagnostics);
  }, [onDiagnostics, template]);

  useEffect(() => {
    updateDiagnostics(value);
  }, [updateDiagnostics, value]);

  const beforeMount = useCallback((monaco: MonacoLike) => {
    registerReportExpressionLanguage(monaco);
  }, []);

  const onMount = useCallback((editor: { getModel?: () => unknown }, monaco: MonacoLike) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    completionDisposableRef.current?.dispose();
    completionDisposableRef.current = monaco.languages?.registerCompletionItemProvider?.('report-expression', {
      provideCompletionItems: () => ({
        suggestions: buildExpressionCompletions(template, locale, monaco),
      }),
    }) ?? null;
    updateDiagnostics(value);
  }, [locale, template, updateDiagnostics, value]);

  useEffect(() => () => {
    completionDisposableRef.current?.dispose();
  }, []);

  return (
    <Editor
      aria-label={ariaLabel}
      beforeMount={beforeMount}
      onMount={onMount}
      height={height}
      language="report-expression"
      path={getExpressionModelPath()}
      value={value}
      onChange={(nextValue) => {
        const text = nextValue ?? '';
        onChange(text);
        updateDiagnostics(text);
      }}
      options={{
        minimap: { enabled: false },
        wordWrap: 'on',
        lineNumbers: 'off',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        suggestOnTriggerCharacters: true,
      }}
    />
  );
};
```

- [ ] **Step 4: Verify green**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-monaco-editor
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/designer/src/components/expression/ExpressionMonacoEditor.tsx packages/designer/src/__tests__/phase-44-expression-monaco-editor.test.tsx
git commit -m "feat(expression): 封装monaco表达式编辑器"
```

---

### Task 5: Preview Evaluation

**Files:**
- Create: `packages/designer/src/expression/expression-preview.ts`
- Test: `packages/designer/src/__tests__/phase-44-expression-preview.test.ts`

- [ ] **Step 1: Write failing preview tests**

Create `packages/designer/src/__tests__/phase-44-expression-preview.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { previewReportExpression } from '../expression/expression-preview';

function templateWithOrders() {
  const template = createDefaultTemplate('Expression Preview');
  template.dataSources = [{
    id: 'Orders',
    name: 'Orders',
    type: 'json',
    schema: [
      { name: 'Amount', type: 'number' },
      { name: 'Name', type: 'string' },
    ],
    sampleRows: [{ Amount: 123.456, Name: 'ACME' }],
  } as any];
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
```

- [ ] **Step 2: Run test and verify red**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-preview
```

Expected: FAIL because preview module does not exist.

- [ ] **Step 3: Implement preview**

Create `packages/designer/src/expression/expression-preview.ts`:

```ts
import { evalExpression, type ReportTemplate } from '@report-designer/core';

export type ExpressionPreviewResult =
  | { ok: true; value: unknown }
  | { ok: false; message: string };

export function previewReportExpression(expression: string, template: ReportTemplate): ExpressionPreviewResult {
  try {
    const rows = buildSampleRows(template);
    const value = evalExpression(expression, (source, field) => rows[source]?.[field]);
    return { ok: true, value };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

function buildSampleRows(template: ReportTemplate): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const source of template.dataSources) {
    const firstSample = Array.isArray((source as any).sampleRows) ? (source as any).sampleRows[0] : undefined;
    if (firstSample && typeof firstSample === 'object') {
      result[source.id] = firstSample as Record<string, unknown>;
      continue;
    }
    result[source.id] = {};
    for (const field of source.schema ?? source.fields ?? []) {
      result[source.id][field.name] = defaultFieldValue(field.type);
    }
  }
  return result;
}

function defaultFieldValue(type: string | undefined) {
  if (type === 'number') return 0;
  if (type === 'boolean') return false;
  if (type === 'date') return new Date().toISOString();
  return '';
}
```

- [ ] **Step 4: Verify green**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-preview
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/designer/src/expression/expression-preview.ts packages/designer/src/__tests__/phase-44-expression-preview.test.ts
git commit -m "feat(expression): 增加表达式测试预览"
```

---

### Task 6: Replace ExpressionEditor TextArea with Monaco

**Files:**
- Modify: `packages/designer/src/components/ExpressionEditor.tsx`
- Modify: `packages/designer/src/i18n/messages.ts`
- Test: `packages/designer/src/__tests__/phase-44-expression-editor-monaco-shell.test.tsx`
- Update existing tests that mock `@monaco-editor/react`: `packages/designer/src/__tests__/phase-16-dictionary-expression-shell.test.tsx`, `packages/designer/src/__tests__/phase-35-band-properties.test.tsx`, `packages/designer/src/__tests__/phase-27-component-property-model.test.tsx`

- [ ] **Step 1: Write failing shell test**

Create `packages/designer/src/__tests__/phase-44-expression-editor-monaco-shell.test.tsx`:

```tsx
/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { DesignerI18nProvider } from '../i18n';
import { ExpressionEditor } from '../components/ExpressionEditor';
import { useDesignerStore } from '../store/designer-store';

const monacoEditorMock = vi.hoisted(() => ({
  lastProps: undefined as Record<string, unknown> | undefined,
}));

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, unknown>) => {
    monacoEditorMock.lastProps = props;
    return (
      <textarea
        aria-label={props['aria-label'] as string}
        value={props.value as string}
        onChange={(event) => (props.onChange as (value: string | undefined) => void)(event.target.value)}
      />
    );
  },
}));

function loadTemplate() {
  const template = createDefaultTemplate('Expression Shell');
  template.dataSources = [{
    id: 'Orders',
    name: 'Orders',
    type: 'json',
    schema: [{ name: 'Amount', type: 'number' }],
    sampleRows: [{ Amount: 88.8 }],
  } as any];
  useDesignerStore.getState().loadTemplate(template);
}

describe('phase 44 expression editor monaco shell', () => {
  it('uses Monaco, shows function categories, and applies edited values', async () => {
    loadTemplate();
    let value = '';
    render(
      <DesignerI18nProvider locale="zh-CN">
        <ExpressionEditor open value="" onChange={(next) => { value = next; }} onClose={() => {}} />
      </DesignerI18nProvider>,
    );

    expect(monacoEditorMock.lastProps).toMatchObject({ language: 'report-expression' });
    expect(screen.getByRole('button', { name: /日期/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /数字/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /文本/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('表达式'), { target: { value: 'FORMAT("N2", {Orders.Amount})' } });
    fireEvent.click(screen.getByRole('button', { name: '测试' }));
    expect(await screen.findByText(/88.80/)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /确\s*定/ }));
    await waitFor(() => expect(value).toBe('FORMAT("N2", {Orders.Amount})'));
  });
});
```

- [ ] **Step 2: Run test and verify red**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-editor-monaco-shell
```

Expected: FAIL because `ExpressionEditor` still renders textarea and does not expose new categories/test button.

- [ ] **Step 3: Add i18n keys**

Modify `packages/designer/src/i18n/messages.ts` message key union and messages:

```ts
| 'expressionEditor.category.common'
| 'expressionEditor.category.aggregate'
| 'expressionEditor.category.number'
| 'expressionEditor.category.text'
| 'expressionEditor.category.date'
| 'expressionEditor.category.logic'
| 'expressionEditor.category.report'
| 'expressionEditor.category.money'
| 'expressionEditor.category.format'
| 'expressionEditor.test'
| 'expressionEditor.result'
| 'expressionEditor.noDiagnostics'
```

Chinese values:

```ts
'expressionEditor.category.common': '常用',
'expressionEditor.category.aggregate': '聚合',
'expressionEditor.category.number': '数字',
'expressionEditor.category.text': '文本',
'expressionEditor.category.date': '日期',
'expressionEditor.category.logic': '逻辑',
'expressionEditor.category.report': '报表',
'expressionEditor.category.money': '金额',
'expressionEditor.category.format': '格式',
'expressionEditor.test': '测试',
'expressionEditor.result': '结果',
'expressionEditor.noDiagnostics': '未发现错误',
```

English values:

```ts
'expressionEditor.category.common': 'Common',
'expressionEditor.category.aggregate': 'Aggregate',
'expressionEditor.category.number': 'Number',
'expressionEditor.category.text': 'Text',
'expressionEditor.category.date': 'Date',
'expressionEditor.category.logic': 'Logic',
'expressionEditor.category.report': 'Report',
'expressionEditor.category.money': 'Money',
'expressionEditor.category.format': 'Format',
'expressionEditor.test': 'Test',
'expressionEditor.result': 'Result',
'expressionEditor.noDiagnostics': 'No errors',
```

- [ ] **Step 4: Refactor ExpressionEditor shell**

Modify `packages/designer/src/components/ExpressionEditor.tsx`:

- Import `Alert`, `Typography`, `ExpressionMonacoEditor`, function catalog, validation types, and preview helper.
- Replace `Input.TextArea` with:

```tsx
<ExpressionMonacoEditor
  ariaLabel={t('expressionEditor.inline.expression')}
  value={expression}
  template={template}
  locale={locale}
  onChange={setExpression}
  onDiagnostics={setDiagnostics}
/>
```

- Build category rail from `EXPRESSION_FUNCTION_CATEGORIES`.
- Build function tree from `getExpressionFunctionsByCategory(activeCategory)`.
- Add footer buttons:

```tsx
<Button size="small" onClick={() => setDiagnostics(validateReportExpression(expression, template))}>
  {t('expressionEditor.validate')}
</Button>
<Button size="small" onClick={() => setPreviewResult(previewReportExpression(expression, template))}>
  {t('expressionEditor.test')}
</Button>
```

- Render diagnostics:

```tsx
{diagnostics.length > 0 ? (
  <Alert type="error" title={diagnostics.map(item => item.message).join('\n')} />
) : previewResult?.ok ? (
  <Alert type="success" title={`${t('expressionEditor.result')}: ${String(previewResult.value)}`} />
) : previewResult ? (
  <Alert type="error" title={previewResult.message} />
) : (
  <Typography.Text type="secondary">{t('expressionEditor.noDiagnostics')}</Typography.Text>
)}
```

- Keep `onOk` behavior exactly the same: call `onChange(expression)` and `onClose()`.

- [ ] **Step 5: Update existing ExpressionEditor tests to mock Monaco**

For tests that render `ExpressionEditor`, add the same `vi.mock('@monaco-editor/react', ...)` textarea mock used in the new shell test. This keeps existing tests focused on expression behavior instead of loading real Monaco in jsdom.

- [ ] **Step 6: Verify green**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-44-expression-editor-monaco-shell
pnpm --filter @report-designer/designer test -- phase-16-dictionary-expression-shell
pnpm --filter @report-designer/designer test -- phase-35-band-properties
pnpm --filter @report-designer/designer test -- phase-27-component-property-model
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/designer/src/components/ExpressionEditor.tsx packages/designer/src/i18n/messages.ts packages/designer/src/__tests__/phase-44-expression-editor-monaco-shell.test.tsx packages/designer/src/__tests__/phase-16-dictionary-expression-shell.test.tsx packages/designer/src/__tests__/phase-35-band-properties.test.tsx packages/designer/src/__tests__/phase-27-component-property-model.test.tsx
git commit -m "feat(expression): 使用monaco重构表达式编辑器"
```

---

### Task 7: Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Run full designer test suite**

Run:

```bash
pnpm --filter @report-designer/designer test
```

Expected: all designer tests pass.

- [ ] **Step 2: Run designer build**

Run:

```bash
pnpm --filter @report-designer/designer build
```

Expected: `tsc -p tsconfig.json` exits with code 0.

- [ ] **Step 3: Check working tree**

Run:

```bash
git status --short
```

Expected: no uncommitted files after task commits.

---

## Self-Review

- Spec coverage: function catalog, Monaco language/completion, diagnostics, preview evaluation, i18n, caller compatibility, and full verification are each covered by tasks.
- Placeholder scan: this plan contains no `TODO`, `TBD`, or unspecified implementation steps.
- Type consistency: `ExpressionFunctionCategory`, `ExpressionDiagnostic`, `ExpressionPreviewResult`, `ExpressionMonacoEditor`, and `buildExpressionCompletions` names are consistent across tasks.
- Scope: the plan does not add new runtime functions and does not change the core expression grammar.
