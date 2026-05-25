# Phase 9 Text Format Styles Totals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align common reference-style text binding, text properties, style set selection, value formatting, and page/report totals for JSON-only reports.

**Architecture:** Keep formatting and total calculation in `@report-designer/core` so designer, viewer, PDF, and tests share one behavior. The designer only edits text binding, style reference, and formatting metadata; render-time layout resolves expression values, applies formatting, resolves style sets, and evaluates page/report totals using the existing band pagination flow.

**Tech Stack:** TypeScript, React 19, Zustand, Ant Design 6-compatible APIs, Vitest, Testing Library.

---

### Task 1: Text Format Model And Formatter

**Files:**
- Modify: `packages/core/src/template-model/types.ts`
- Create: `packages/core/src/text-format/index.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/__tests__/phase-9-text-formatting.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/core/__tests__/phase-9-text-formatting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatValue } from '../src';

describe('Phase 9 text formatting', () => {
  it('formats common reference-style number, currency, percent, date, boolean, and null values', () => {
    expect(formatValue(1234.5, { type: 'number', pattern: '#,##0.00' })).toBe('1,234.50');
    expect(formatValue(1234.5, { type: 'currency', pattern: '$#,##0.00' })).toBe('$1,234.50');
    expect(formatValue(0.257, { type: 'percent', pattern: '0.0%' })).toBe('25.7%');
    expect(formatValue('2026-05-06T09:08:07Z', { type: 'date', pattern: 'yyyy-MM-dd' })).toBe('2026-05-06');
    expect(formatValue(true, { type: 'boolean', trueText: 'Yes', falseText: 'No' })).toBe('Yes');
    expect(formatValue(null, { type: 'number', nullValue: '-' })).toBe('-');
  });
});
```

- [ ] **Step 2: Run the red test**

Run: `pnpm --filter @report-designer/core test -- phase-9-text-formatting`

Expected: FAIL because `formatValue` does not exist.

- [ ] **Step 3: Add the format config type**

In `types.ts`, add:

```ts
export type TextFormatType = 'none' | 'number' | 'currency' | 'date' | 'time' | 'percent' | 'boolean' | 'custom';

export interface TextFormatConfig {
  type: TextFormatType;
  pattern?: string;
  nullValue?: string;
  trueText?: string;
  falseText?: string;
}
```

Extend `TextComponent`:

```ts
format?: TextFormatConfig;
```

- [ ] **Step 4: Implement `formatValue`**

Create `packages/core/src/text-format/index.ts` with:

```ts
import type { TextFormatConfig } from '../template-model/types';

export function formatValue(value: unknown, format?: TextFormatConfig): string {
  if (!format || format.type === 'none') return value == null ? '' : String(value);
  if (value == null || value === '') return format.nullValue ?? '';
  if (format.type === 'boolean') return Boolean(value) ? format.trueText ?? 'True' : format.falseText ?? 'False';
  if (format.type === 'date' || format.type === 'time') return formatDate(value, format.pattern ?? (format.type === 'date' ? 'yyyy-MM-dd' : 'HH:mm:ss'));
  if (format.type === 'percent') return formatNumber(Number(value) * 100, format.pattern ?? '0.00%') + '%';
  if (format.type === 'currency') return formatCurrency(Number(value), format.pattern ?? '$#,##0.00');
  if (format.type === 'number' || format.type === 'custom') return formatNumber(Number(value), format.pattern ?? '#,##0.##');
  return String(value);
}
```

Implement helpers for decimal count, thousands separators, currency prefix/suffix, and `yyyy/MM/dd HH:mm:ss` tokens. Export it from `packages/core/src/index.ts`.

- [ ] **Step 5: Run the green test**

Run: `pnpm --filter @report-designer/core test -- phase-9-text-formatting`

Expected: PASS.

### Task 2: Render-Time Text Formatting And Styles

**Files:**
- Modify: `packages/core/src/layout-engine/layout-band.ts`
- Modify: `packages/core/src/render-document/types.ts`
- Test: `packages/core/__tests__/phase-9-text-rendering.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/core/__tests__/phase-9-text-rendering.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderReportcurrent model } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

describe('Phase 9 text rendering', () => {
  it('applies text format metadata after expression evaluation', () => {
    const template = makeTemplate([
      band('data', 'data', {
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'salary',
          type: 'text',
          x: 0, y: 0, width: 50, height: 8,
          text: '{employees.Salary}',
          format: { type: 'number', pattern: '#,##0.00' },
          font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
          textAlign: 'right',
          verticalAlign: 'top',
          border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
          canGrow: false,
          canShrink: false,
        }],
      }),
    ]);

    const document = renderReportcurrent model(template, { employees: [{ Salary: 1234.5 }] });
    expect(document.pages[0].items[0].components[0].content).toBe('1,234.50');
  });

  it('resolves named report style sets into render styles', () => {
    const template = makeTemplate([
      band('data', 'data', {
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'label',
          type: 'text',
          style: 'total-style',
          x: 0, y: 0, width: 50, height: 8,
          text: '{employees.Name}',
          font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
          textAlign: 'left',
          verticalAlign: 'top',
          border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
          canGrow: false,
          canShrink: false,
        }],
      }),
    ]);
    template.styles = [{
      id: 'total-style',
      name: 'Total',
      font: { bold: true, color: '#ff0000' },
      border: { style: 'solid', width: 0.2, color: '#ff0000', sides: { top: true, right: false, bottom: true, left: false } },
      backgroundColor: '#fff7e6',
    }];

    const box = renderReportcurrent model(template, { employees: [{ Name: 'Alice' }] }).pages[0].items[0].components[0];
    expect(box.style?.font?.bold).toBe(true);
    expect(box.style?.font?.color).toBe('#ff0000');
    expect(box.style?.backgroundColor).toBe('#fff7e6');
  });
});
```

- [ ] **Step 2: Run the red test**

Run: `pnpm --filter @report-designer/core test -- phase-9-text-rendering`

Expected: FAIL because layout does not apply format metadata or template styles.

- [ ] **Step 3: Add template styles to layout options**

Extend `LayoutBandOptions` with `styles?: ReportStylecurrent model[]`, pass template styles from `paginatecurrent model`, and merge `component.style` by id before creating `RenderStyle`.

- [ ] **Step 4: Apply formatting in `resolveText`**

Keep expression evaluation unchanged, but apply `formatValue(value, component.format)` to evaluated values. Literal text without expressions remains unchanged.

- [ ] **Step 5: Run the green test**

Run: `pnpm --filter @report-designer/core test -- phase-9-text-rendering`

Expected: PASS.

### Task 3: Page And Report Totals

**Files:**
- Modify: `packages/core/src/aggregate-engine/aggregate-types.ts`
- Modify: `packages/core/src/aggregate-engine/aggregate-runtime.ts`
- Modify: `packages/core/src/expression-engine/evaluator.ts`
- Modify: `packages/core/src/expression-engine/report-functions.ts`
- Modify: `packages/core/src/pagination/paginate.ts`
- Test: `packages/core/__tests__/phase-9-page-report-totals.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/core/__tests__/phase-9-page-report-totals.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { AggregateRuntime, evalExpression, renderReportcurrent model } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

const rows = [
  { Name: 'A', Salary: 100 },
  { Name: 'B', Salary: 200 },
  { Name: 'C', Salary: 150 },
];

describe('Phase 9 page and report totals', () => {
  it('evaluates page and report aggregate aliases through the runtime', () => {
    const runtime = new AggregateRuntime({
      rowsByBand: { employees: rows },
      pageRowsByBand: { employees: rows.slice(0, 2) },
    });

    expect(evalExpression('PAGESUM("employees", "{employees.Salary}")', () => null, 0, {}, runtime)).toBe(300);
    expect(evalExpression('PAGECOUNT("employees")', () => null, 0, {}, runtime)).toBe(2);
    expect(evalExpression('REPORTSUM("employees", "{employees.Salary}")', () => null, 0, {}, runtime)).toBe(450);
    expect(evalExpression('TOTALS.PAGESUM("employees", "{employees.Salary}")', () => null, 0, {}, runtime)).toBe(300);
    expect(evalExpression('TOTALS.REPORTSUM("employees", "{employees.Salary}")', () => null, 0, {}, runtime)).toBe(450);
  });

  it('renders page totals in PageFooter per physical page and report totals in ReportSummary', () => {
    const template = makeTemplate([
      band('data', 'data', {
        height: 15,
        dataBand: { dataSourceId: 'employees' },
        components: [{
          id: 'detail', type: 'text', x: 0, y: 0, width: 50, height: 8,
          text: '{employees.Salary}',
          font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
          textAlign: 'left', verticalAlign: 'top',
          border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
          canGrow: false, canShrink: false,
        }],
      }),
      band('report-summary', 'reportSummary', {
        height: 8,
        components: [{
          id: 'report-total', type: 'text', x: 0, y: 0, width: 50, height: 8,
          text: 'REPORTSUM("employees", "{employees.Salary}")',
          font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
          textAlign: 'left', verticalAlign: 'top',
          border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
          canGrow: false, canShrink: false,
        }],
      }),
      band('page-footer', 'pageFooter', {
        height: 8,
        behavior: { enabled: true, printOn: 'allPages', printIfEmpty: true, printOnAllPages: true, keepTogether: false, canBreak: false, printAtBottom: true },
        components: [{
          id: 'page-total', type: 'text', x: 0, y: 0, width: 50, height: 8,
          text: 'PAGESUM("employees", "{employees.Salary}")',
          font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
          textAlign: 'left', verticalAlign: 'top',
          border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
          canGrow: false, canShrink: false,
        }],
      }),
    ]);
    template.pages[0].height = 55;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReportcurrent model(template, { employees: rows });
    const pageFooterTotals = document.pages.map(page => page.items.find(item => item.bandType === 'pageFooter')!.components[0].content);
    const reportSummary = document.pages.flatMap(page => page.items).find(item => item.bandType === 'reportSummary')!.components[0].content;

    expect(pageFooterTotals).toEqual(['300', '150']);
    expect(reportSummary).toBe('450');
  });
});
```

- [ ] **Step 2: Run the red test**

Run: `pnpm --filter @report-designer/core test -- phase-9-page-report-totals`

Expected: FAIL because page/report aliases and page row collection do not exist.

- [ ] **Step 3: Add runtime aliases**

Add aggregate names `REPORTSUM`, `REPORTCOUNT`, `PAGESUM`, `PAGECOUNT`, `TOTALS.REPORTSUM`, `TOTALS.PAGESUM`, and `TOTALS.PAGECOUNT`. Add `pageRowsByBand` to `AggregateRuntimeOptions`.

- [ ] **Step 4: Track page rows during pagination**

In `paginatecurrent model`, collect data rows into a `WeakMap<RenderPage, Record<string, Record<string, unknown>[]>>` whenever a data band or child band with `context.row` and `context.dataSourceId` is placed. Pass the current page rows into `layoutBand` for page footer and overlay rendering.

- [ ] **Step 5: Run the green test**

Run: `pnpm --filter @report-designer/core test -- phase-9-page-report-totals`

Expected: PASS.

### Task 4: Designer Text Binding And Style Set UI

**Files:**
- Modify: `packages/designer/src/store/designer-store.ts`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Test: `packages/designer/src/__tests__/phase-9-text-binding-style.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `packages/designer/src/__tests__/phase-9-text-binding-style.test.tsx`:

```tsx
/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { PropertyEditor } from '../components/PropertyEditor';
import { useDesignerStore } from '../store/designer-store';

function loadText() {
  const component = {
    id: 'text-1', type: 'text', x: 10, y: 10, width: 40, height: 8,
    text: 'Name',
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left', verticalAlign: 'top',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false, canShrink: false,
  } as ReportComponent;
  const template = createDefaultTemplate('Phase 9 Designer');
  template.dataSources = [{ id: 'employees', name: 'employees', type: 'json', schema: [{ name: 'Salary', type: 'number' }] }];
  template.styles = [{
    id: 'total-style',
    name: 'Total',
    font: { family: 'Arial', size: 12, bold: true, italic: false, underline: false, strikethrough: false, color: '#ff0000' },
    border: { style: 'solid', width: 0.2, color: '#ff0000', sides: { top: true, right: false, bottom: true, left: false } },
    backgroundColor: '#fff7e6',
  }];
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(component);
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents([component.id]);
}

function selectedText() {
  return useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as any;
}

describe('Phase 9 text binding and style UI', () => {
  it('binds selected text to a data field from the property panel', async () => {
    loadText();
    render(<PropertyEditor />);

    fireEvent.mouseDown(screen.getByLabelText('绑定字段'));
    fireEvent.click(await screen.findByText('Salary'));

    expect(selectedText().text).toBe('{employees.Salary}');
    expect(selectedText().dataSource).toBe('employees');
  });

  it('applies a named style set and text format from the property panel', async () => {
    loadText();
    render(<PropertyEditor />);

    fireEvent.mouseDown(screen.getByLabelText('文本样式'));
    fireEvent.click(await screen.findByText('Total'));
    fireEvent.mouseDown(screen.getByLabelText('格式类型'));
    fireEvent.click(await screen.findByText('数字'));
    fireEvent.change(screen.getByLabelText('格式模式'), { target: { value: '#,##0.00' } });

    await waitFor(() => expect(selectedText().style).toBe('total-style'));
    expect(selectedText().font.bold).toBe(true);
    expect(selectedText().backgroundColor).toBe('#fff7e6');
    expect(selectedText().format).toEqual({ type: 'number', pattern: '#,##0.00' });
  });
});
```

- [ ] **Step 2: Run the red test**

Run: `pnpm --filter @report-designer/designer test -- phase-9-text-binding-style`

Expected: FAIL because the property panel lacks these controls.

- [ ] **Step 3: Add store style application**

Add `applySelectedStyle(styleId: string | undefined)` to `DesignerState`. It sets `component.style`, copies the selected report style's `font`, `border`, and `backgroundColor` onto selected text components, and leaves other component types unchanged.

- [ ] **Step 4: Add text controls using Ant Design 6-compatible props**

In `PropertyEditor`, add:
- `绑定字段` select for text components using template data source schemas.
- `文本样式` select using `template.styles`.
- `格式类型` select with `none/number/currency/date/time/percent/boolean/custom`.
- `格式模式` input.

Do not use deprecated Ant Design props.

- [ ] **Step 5: Run the green test**

Run: `pnpm --filter @report-designer/designer test -- phase-9-text-binding-style`

Expected: PASS.

### Task 5: Expression Editor Total Shortcuts

**Files:**
- Modify: `packages/designer/src/components/ExpressionEditor.tsx`
- Test: `packages/designer/src/__tests__/phase-9-expression-editor-totals.test.tsx`

- [ ] **Step 1: Write the failing test**

Create a test that opens `ExpressionEditor`, clicks the functions tab, and expects visible entries for `PAGESUM`, `REPORTSUM`, `TOTALS.PAGESUM`, and `TOTALS.REPORTSUM`.

- [ ] **Step 2: Run the red test**

Run: `pnpm --filter @report-designer/designer test -- phase-9-expression-editor-totals`

Expected: FAIL because these shortcuts are missing.

- [ ] **Step 3: Add total shortcuts**

Extend `BUILT_IN_FUNCTIONS` with:

```ts
{ name: 'PAGESUM', desc: '按页求和', usage: 'PAGESUM("DataBand", "{DataBand.Field}")', insert: 'PAGESUM("", "")' }
{ name: 'REPORTSUM', desc: '按报表求和', usage: 'REPORTSUM("DataBand", "{DataBand.Field}")', insert: 'REPORTSUM("", "")' }
{ name: 'TOTALS.PAGESUM', desc: '按页即时求和', usage: 'TOTALS.PAGESUM("DataBand", "{DataBand.Field}")', insert: 'TOTALS.PAGESUM("", "")' }
{ name: 'TOTALS.REPORTSUM', desc: '按报表即时求和', usage: 'TOTALS.REPORTSUM("DataBand", "{DataBand.Field}")', insert: 'TOTALS.REPORTSUM("", "")' }
```

Add a totals tree group named `合计函数`.

- [ ] **Step 4: Run the green test**

Run: `pnpm --filter @report-designer/designer test -- phase-9-expression-editor-totals`

Expected: PASS.

### Task 6: Verification And Commit

**Files:**
- Verify all modified packages.

- [ ] **Step 1: Run focused Phase 9 tests**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-9
pnpm --filter @report-designer/designer test -- phase-9
```

Expected: PASS.

- [ ] **Step 2: Run package build/test sweep**

Run:

```bash
pnpm --filter @report-designer/core build
pnpm --filter @report-designer/core test
pnpm --filter @report-designer/designer build
pnpm --filter @report-designer/designer test
pnpm --filter @report-designer/viewer build
pnpm --filter @report-designer/viewer test
pnpm --filter @report-designer/example build
```

Expected: PASS. The example build may still emit the existing Vite chunk-size warning.

- [ ] **Step 3: Restore generated build output if needed**

Run: `git status --short`

If `packages/example/dist/index.html` changed only from the build, restore it before committing.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-05-06-phase-9-text-format-styles-totals.md packages/core packages/designer/src
git commit -m "feat(report): 对齐文本格式样式和合计能力"
```

Expected: Commit succeeds.

---

### Self-Review

- Spec coverage: Covers text binding, common text properties for format/style, style set selection, expression-editor total shortcuts, page totals, and report totals. Chart printing remains out of scope.
- Placeholder scan: No placeholder tasks remain.
- Type consistency: The plan consistently uses `TextFormatConfig`, `formatValue`, `pageRowsByBand`, `PAGESUM`, and `REPORTSUM`.
