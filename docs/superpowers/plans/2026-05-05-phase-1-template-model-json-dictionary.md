# Phase 1 Template Model current model And JSON Dictionary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reference-style report template model and JSON-only data dictionary while keeping existing templates migratable.

**Architecture:** Add current model files next to the existing model, plus migration and validation utilities. JSON dictionary inference becomes a core capability consumed by designer and renderer.

**Tech Stack:** TypeScript, Vitest, existing `@report-designer/core` package.

---

## File Structure

- Create: `packages/core/src/template-model/types.ts`
- Create: `packages/core/src/template-model/normalize-template.ts`
- Create: `packages/core/src/template-model/schema.ts`
- Create: `packages/core/src/data-dictionary/json-dictionary.ts`
- Create: `packages/core/src/data-dictionary/json-path.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/__tests__/phase-1-template-model.test.ts`
- Test: `packages/core/__tests__/phase-1-json-dictionary.test.ts`

## Tasks

### Task 1: Define Bands And Components

- [ ] **Step 1: Write failing type-level/runtime tests**

Create tests asserting these band types exist in exported constants:

```ts
import { describe, expect, it } from 'vitest';
import { STANDARD_BAND_TYPES } from '../src/template-model/types';

describe('Phase 1 template model', () => {
  it('exports reference-style standard band types', () => {
    expect(STANDARD_BAND_TYPES).toEqual([
      'reportTitle',
      'reportSummary',
      'pageHeader',
      'pageFooter',
      'header',
      'footer',
      'groupHeader',
      'groupFooter',
      'columnHeader',
      'columnFooter',
      'data',
      'hierarchicalData',
      'child',
      'emptyData',
      'overlay',
    ]);
  });
});
```

- [ ] **Step 2: Implement `types.ts`**

Define:

- `ReportTemplatecurrent model`
- `ReportPagecurrent model`
- `ReportBandcurrent model`
- `ReportComponentcurrent model`
- `DataSourcecurrent model`
- `DataFieldcurrent model`
- `ReportParametercurrent model`
- `ReportStylecurrent model`

Required band fields:

```ts
type BandPrintOn = 'allPages' | 'firstPage' | 'exceptFirstPage' | 'lastPage' | 'oddPages' | 'evenPages';

interface BandBehaviorcurrent model {
  enabled: boolean;
  visibleExpression?: string;
  printOn: BandPrintOn;
  printIfEmpty: boolean;
  printOnAllPages: boolean;
  keepTogether: boolean;
  canBreak: boolean;
  breakIfLessThan?: number;
  printAtBottom: boolean;
}
```

Required DataBand fields:

```ts
interface DataBandOptionscurrent model {
  dataSourceId?: string;
  filterExpression?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  columns?: { count: number; gap: number; direction: 'downThenAcross' | 'acrossThenDown' };
}
```

### Task 2: Add Migration From historical draft

- [ ] **Step 1: Write migration test**

Use `createDefaultTemplate()` and assert migrated template has version `2.0`, equivalent pages, bands, and data sources.

- [ ] **Step 2: Implement `migrateHistoricalDraftToCurrentModel(template)`**

Map old band types directly where possible. Set new behavior defaults conservatively:

- Page headers/footers: `printOnAllPages: true`
- Data bands: `canBreak: true`
- Group bands: `keepTogether: false`
- Footer with `printAtBottom: false`
- Page footer: keep the band in the template and record `printAtBottom: true`; Phase 3 consumes this flag in the pagination engine.

### Task 3: Implement JSON Dictionary Inference

- [ ] **Step 1: Write inference tests**

Test a JSON object:

```ts
const data = {
  orders: [
    { id: 1, customer: 'A', total: 10, lines: [{ sku: 'S1', qty: 2 }] },
  ],
};
```

Expected data sources:

- `orders`
- `orders.lines`

Expected fields:

- `orders.id` number
- `orders.customer` string
- `orders.total` number
- `orders.lines.sku` string
- `orders.lines.qty` number

- [ ] **Step 2: Implement `inferJsonDictionary(data)`**

Rules:

- Top-level arrays become data sources.
- Nested arrays become child data sources with `parentSourceId` and `parentPath`.
- Primitive object fields become fields.
- Mixed primitive values infer the broadest type in this order: null, boolean, number, date, string.
- ISO-like strings remain `date` only if all non-empty samples parse as valid dates and include date separators.

### Task 4: Validate Templates

- [ ] **Step 1: Write validation tests**

Assert errors for:

- Duplicate ids.
- DataBand referencing missing data source.
- GroupHeader without a condition.
- GroupFooter without a preceding matching GroupHeader.
- Component outside printable page area when strict mode is enabled.

- [ ] **Step 2: Implement `validateTemplatecurrent model(template, options)`**

Return `{ valid: boolean; errors: Array<{ path: string; message: string }> }`.

### Task 5: Export The New API

- [ ] **Step 1: Modify `packages/core/src/index.ts`**

Export current types, migration, validation, and JSON dictionary utilities.

- [ ] **Step 2: Run tests**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-1
pnpm --filter @report-designer/core build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src packages/core/__tests__
git commit -m "feat(core): 增加报表模板和json数据字典"
```
