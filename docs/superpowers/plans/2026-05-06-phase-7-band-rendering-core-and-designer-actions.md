# Phase 7 Band Rendering Core and Designer Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock reference-style Band rendering semantics before continuing designer shortcut and table context-menu work.

**Architecture:** Treat Band rendering as a core contract owned by `@report-designer/core`. Designer operations create and edit bands, but the renderer must be validated independently through ordered logical-plan tests and paginated RenderDocument tests. Only after these core contracts pass should UI shortcut, context-menu, and table-property changes continue.

**Tech Stack:** TypeScript, Vitest, React 19, Ant Design 6, Zustand, existing `renderReportcurrent model`, `buildBandPlan`, `executeBandPlan`, and `paginatecurrent model`.

---

## Reference Contract

Official the reference designer concepts used as the compatibility target:

- Standard bands include ReportTitle, ReportSummary, PageHeader, PageFooter, Header, Footer, GroupHeader, GroupFooter, ColumnHeader, ColumnFooter, Data, Child, EmptyData, and Overlay.
- HeaderBand belongs to the nearest DataBand below it and prints before that DataBand section.
- DataBand prints once per data row from its data source.
- PageHeader and PageFooter are page chrome and repeat per rendered page.
- ReportTitle prints once at the beginning; ReportSummary prints once after data sections.
- GroupHeader and GroupFooter wrap grouped DataBand rows; group headers may repeat on new pages when `printOnAllPages` is enabled.
- EmptyData prints when the DataBand has no rows.

Sources:

- `https://www.reference-designer.com/manuals/en/user-manual/report_internals_bands_band_types_standard_bands.htm`
- `https://www.reference-designer.com/documentation/en/user-manual/report_internals_bands_order_render.htm`
- `https://www.reference-designer.com/manuals/en/user-manual/report_internals_creating_master-detail_lists_headers_footers_and_masterdetail_reports.htm`

## Current Repository Findings

- Existing Band type already has `data` and `header` in `packages/core/src/template-model/types.ts`.
- Band type already has the broader reference-style taxonomy in `packages/core/src/template-model/types.ts`.
- `buildBandPlan()` already attaches pending `header`, `groupHeader`, `columnHeader`, `footer`, `groupFooter`, `columnFooter`, `child`, and `emptyData` around the nearest `data` section.
- `executeBandPlan()` already repeats DataBand per row and handles one group-pair layer.
- `paginatecurrent model()` already repeats PageHeader/PageFooter and supports repeated GroupHeader on new page.
- Gap: HeaderBand and ColumnHeader repeat-on-new-page behavior is not explicitly tested or implemented as a DataBand section contract.
- Gap: Nested group execution is not tested and current implementation only executes the first `groupPairs[0]`.
- Gap: `keepTogether`, `canBreak`, `breakIfLessThan`, and `printAtBottom` need strict rendering tests before any designer UI depends on them.
- Gap: Designer Band Wizard can create Header + Data + Footer, but the design surface does not yet enforce or visualize HeaderBand/DataBand ownership.
- Gap: There are interrupted WIP code edits in table/shortcut files. Preserve them, but do not expand those UI changes until the core Band rendering tests pass.

## File Structure

- Create: `packages/core/__tests__/phase-7-band-rendering-contract.test.ts`
- Create: `packages/core/__tests__/phase-7-band-pagination-contract.test.ts`
- Create: `packages/core/__tests__/phase-7-band-break-contract.test.ts`
- Modify: `packages/core/src/band-planner/band-plan.ts`
- Modify: `packages/core/src/band-planner/build-band-plan.ts`
- Modify: `packages/core/src/band-planner/execute-band-plan.ts`
- Modify: `packages/core/src/pagination/paginate.ts`
- Modify: `packages/core/src/template-model/schema.ts`
- Modify later: `packages/designer/src/components/dialogs/BandWizardDialog.tsx`
- Modify later: `packages/designer/src/components/Canvas.tsx`
- Modify later: `packages/designer/src/components/PropertyEditor.tsx`
- Modify later: `packages/designer/src/store/designer-store.ts`
- Create later: `packages/designer/src/__tests__/phase-7-band-designer-contract.test.tsx`
- Create later: `packages/designer/src/__tests__/phase-7-shortcuts-table-context.test.tsx`

## Tasks

### Task 0: Preserve Interrupted WIP and Freeze Scope

**Files:**
- Read only: all currently modified files
- No code changes in this task

- [ ] **Step 1: Inspect current WIP**

Run:

```bash
git status --short
```

Expected output includes the interrupted table/shortcut WIP and this plan file:

```text
 M packages/core/src/template-model/types.ts
 M packages/designer/src/components/Canvas.tsx
 M packages/designer/src/components/PropertyEditor.tsx
 M packages/designer/src/store/designer-store.ts
?? packages/designer/src/table/
?? docs/superpowers/plans/2026-05-06-phase-7-band-rendering-core-and-designer-actions.md
```

- [ ] **Step 2: Record the execution rule**

Do not revert the interrupted WIP. Do not continue designer shortcut/table code until Tasks 1 through 5 pass.

- [ ] **Step 3: Run current core tests before adding new tests**

Run:

```bash
pnpm --filter @report-designer/core test
```

Expected: existing core tests pass before adding the stricter Phase 7 contracts.

### Task 1: Logical Band Order Contract

**Files:**
- Create: `packages/core/__tests__/phase-7-band-rendering-contract.test.ts`
- Modify only if test fails: `packages/core/src/band-planner/build-band-plan.ts`
- Modify only if test fails: `packages/core/src/band-planner/execute-band-plan.ts`

- [ ] **Step 1: Write the failing logical-order tests**

Create `packages/core/__tests__/phase-7-band-rendering-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildBandPlan, executeBandPlan } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

function bandTypesForData(templateBands: Parameters<typeof makeTemplate>[0], employees: Record<string, unknown>[]) {
  const template = makeTemplate(templateBands);
  const plan = buildBandPlan(template);
  return executeBandPlan(plan, { employees })
    .filter(item => item.kind === 'band')
    .map(item => item.band.type);
}

describe('Phase 7 the reference designer band rendering contract', () => {
  it('renders a data section in Header, ColumnHeader, GroupHeader, Data, Child, GroupFooter, ColumnFooter, Footer order', () => {
    const sequence = bandTypesForData([
      band('report-title', 'reportTitle'),
      band('header', 'header'),
      band('column-header', 'columnHeader'),
      band('group-header', 'groupHeader', { group: { name: 'Department', conditionExpression: '{employees.Department}' } }),
      band('data', 'data', { dataBand: { dataSourceId: 'employees', sort: [{ field: 'Department', direction: 'asc' }] } }),
      band('child', 'child'),
      band('group-footer', 'groupFooter', { group: { name: 'Department' } }),
      band('column-footer', 'columnFooter'),
      band('footer', 'footer'),
      band('report-summary', 'reportSummary'),
    ], [
      { Name: 'A', Department: 'Engineering' },
      { Name: 'B', Department: 'Engineering' },
      { Name: 'C', Department: 'Sales' },
    ]);

    expect(sequence).toEqual([
      'reportTitle',
      'header',
      'columnHeader',
      'groupHeader',
      'data',
      'child',
      'data',
      'child',
      'groupFooter',
      'groupHeader',
      'data',
      'child',
      'groupFooter',
      'columnFooter',
      'footer',
      'reportSummary',
    ]);
  });

  it('renders EmptyData instead of Header/Data/Footer when a data section has no rows', () => {
    const sequence = bandTypesForData([
      band('header', 'header'),
      band('data', 'data', { dataBand: { dataSourceId: 'employees' } }),
      band('empty', 'emptyData'),
      band('footer', 'footer'),
    ], []);

    expect(sequence).toEqual(['emptyData']);
  });
});
```

- [ ] **Step 2: Run contract test and verify failure or pass**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-7-band-rendering-contract
```

Expected now:

- If it passes, keep code unchanged and continue.
- If it fails, failure must be one of these exact contract mismatches: wrong band order, EmptyData mixed with normal data-section bands, or missing Child/ColumnFooter/Footer.

- [ ] **Step 3: Fix only logical ordering defects**

If EmptyData incorrectly includes headers or footers, update `executeDataSection()` in `packages/core/src/band-planner/execute-band-plan.ts` so the empty-row branch remains:

```ts
if (rows.length === 0) {
  section.emptyDataBands.forEach((band) => items.push(createBandItem(band, { dataSourceId })));
  return;
}
```

If `child`, `columnFooter`, or `footer` ordering differs, keep this exact order in `executeDataSection()`:

```ts
section.headers.forEach((band) => items.push(createBandItem(band, { dataSourceId })));
section.columnHeaders.forEach((band) => items.push(createBandItem(band, { dataSourceId })));
// grouped or plain rows
section.columnFooters.forEach((band) => items.push(createBandItem(band, { dataSourceId })));
section.footers.forEach((band) => items.push(createBandItem(band, { dataSourceId })));
```

- [ ] **Step 4: Re-run logical contract test**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-7-band-rendering-contract
```

Expected: PASS.

### Task 2: Nested Group Contract

**Files:**
- Modify: `packages/core/__tests__/phase-7-band-rendering-contract.test.ts`
- Modify: `packages/core/src/band-planner/execute-band-plan.ts`

- [ ] **Step 1: Add nested-group test**

Append this test to `packages/core/__tests__/phase-7-band-rendering-contract.test.ts`:

```ts
it('renders nested groups from outer GroupHeader to inner GroupHeader before data rows', () => {
  const template = makeTemplate([
    band('department-header', 'groupHeader', { group: { name: 'Department', conditionExpression: '{employees.Department}' } }),
    band('team-header', 'groupHeader', { group: { name: 'Team', conditionExpression: '{employees.Team}' } }),
    band('data', 'data', { dataBand: { dataSourceId: 'employees', sort: [{ field: 'Team', direction: 'asc' }] } }),
    band('team-footer', 'groupFooter', { group: { name: 'Team' } }),
    band('department-footer', 'groupFooter', { group: { name: 'Department' } }),
  ]);

  const items = executeBandPlan(buildBandPlan(template), {
    employees: [
      { Name: 'A', Department: 'Engineering', Team: 'Platform' },
      { Name: 'B', Department: 'Engineering', Team: 'UI' },
    ],
  }).filter(item => item.kind === 'band');

  expect(items.map(item => item.band.id)).toEqual([
    'department-header',
    'team-header',
    'data',
    'team-footer',
    'team-header',
    'data',
    'team-footer',
    'department-footer',
  ]);
});
```

- [ ] **Step 2: Run nested-group test and verify it catches current limitation**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-7-band-rendering-contract
```

Expected before implementation: FAIL because current grouping executes only `section.groupPairs[0]`.

- [ ] **Step 3: Implement recursive grouped execution**

Replace `executeGroupedRows()` with a recursive helper that accepts group-pair depth:

```ts
function executeGroupedRows(
  section: DataSectionPlan,
  rows: Record<string, unknown>[],
  dataSourceId: string | undefined,
  items: LogicalBandItem[],
): void {
  executeGroupDepth(section, rows.map((row, rowIndex) => ({ row, rowIndex })), dataSourceId, items, 0, {});
}

function executeGroupDepth(
  section: DataSectionPlan,
  rows: Array<{ row: Record<string, unknown>; rowIndex: number }>,
  dataSourceId: string | undefined,
  items: LogicalBandItem[],
  depth: number,
  parentGroupValues: Record<string, unknown>,
): void {
  const pair = section.groupPairs[depth];
  if (!pair) {
    rows.forEach(({ row, rowIndex }) => {
      items.push(createBandItem(section.dataBand, { row, rowIndex, dataSourceId, groupValues: parentGroupValues }));
      section.childBands.forEach((band) => items.push(createBandItem(band, { row, rowIndex, dataSourceId, groupValues: parentGroupValues })));
    });
    return;
  }

  let currentKey: unknown = Symbol('no-group');
  let currentRows: Array<{ row: Record<string, unknown>; rowIndex: number }> = [];

  const flush = () => {
    if (currentRows.length === 0) return;
    const groupValues = pair.header.group?.name
      ? { ...parentGroupValues, [pair.header.group.name]: currentKey }
      : parentGroupValues;
    const rowsByBand = dataSourceId ? { [dataSourceId]: currentRows.map(item => item.row) } : undefined;
    items.push(createBandItem(pair.header, { row: currentRows[0].row, rowIndex: currentRows[0].rowIndex, dataSourceId, groupValues, rowsByBand }));
    executeGroupDepth(section, currentRows, dataSourceId, items, depth + 1, groupValues);
    if (pair.footer) {
      const last = currentRows[currentRows.length - 1];
      items.push(createBandItem(pair.footer, { row: last.row, rowIndex: last.rowIndex, dataSourceId, groupValues, rowsByBand }));
    }
    currentRows = [];
  };

  rows.forEach((item) => {
    const key = evaluateRowExpression(pair.header.group?.conditionExpression, item.row, dataSourceId, item.rowIndex);
    if (currentRows.length > 0 && key !== currentKey) flush();
    currentKey = key;
    currentRows.push(item);
  });

  flush();
}
```

- [ ] **Step 4: Run nested-group contract**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-7-band-rendering-contract
```

Expected: PASS.

### Task 3: Page Chrome and Section Header Repetition Contract

**Files:**
- Create: `packages/core/__tests__/phase-7-band-pagination-contract.test.ts`
- Modify: `packages/core/src/band-planner/band-plan.ts`
- Modify: `packages/core/src/band-planner/execute-band-plan.ts`
- Modify: `packages/core/src/pagination/paginate.ts`

- [ ] **Step 1: Write pagination tests for PageHeader/PageFooter and HeaderBand repeat**

Create `packages/core/__tests__/phase-7-band-pagination-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderReportcurrent model } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

const repeatBehavior = {
  enabled: true,
  printOn: 'allPages' as const,
  printIfEmpty: true,
  printOnAllPages: true,
  keepTogether: false,
  canBreak: true,
  printAtBottom: false,
};

describe('Phase 7 the reference designer band pagination contract', () => {
  it('repeats PageHeader and PageFooter on every page without duplicating ReportTitle or ReportSummary', () => {
    const template = makeTemplate([
      band('page-header', 'pageHeader', { height: 8 }),
      band('report-title', 'reportTitle', { height: 8 }),
      band('data', 'data', { height: 20, dataBand: { dataSourceId: 'employees' } }),
      band('report-summary', 'reportSummary', { height: 8 }),
      band('page-footer', 'pageFooter', { height: 8 }),
    ]);
    template.pages[0].height = 70;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReportcurrent model(template, {
      employees: Array.from({ length: 5 }, (_, index) => ({ Name: `N${index}` })),
    });

    expect(document.pages.length).toBeGreaterThan(1);
    for (const page of document.pages) {
      expect(page.items.filter(item => item.bandType === 'pageHeader')).toHaveLength(1);
      expect(page.items.filter(item => item.bandType === 'pageFooter')).toHaveLength(1);
    }
    expect(document.pages.flatMap(page => page.items).filter(item => item.bandType === 'reportTitle')).toHaveLength(1);
    expect(document.pages.flatMap(page => page.items).filter(item => item.bandType === 'reportSummary')).toHaveLength(1);
  });

  it('repeats HeaderBand and ColumnHeader on a new page when printOnAllPages is enabled', () => {
    const template = makeTemplate([
      band('section-header', 'header', { height: 8, behavior: repeatBehavior }),
      band('column-header', 'columnHeader', { height: 8, behavior: repeatBehavior }),
      band('data', 'data', { height: 18, dataBand: { dataSourceId: 'employees' } }),
    ]);
    template.pages[0].height = 64;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReportcurrent model(template, {
      employees: Array.from({ length: 5 }, (_, index) => ({ Name: `N${index}` })),
    });

    expect(document.pages.length).toBeGreaterThan(1);
    expect(document.pages[0].items.map(item => item.id)).toContain('section-header');
    expect(document.pages[0].items.map(item => item.id)).toContain('column-header');
    expect(document.pages[1].items.map(item => item.id).slice(0, 2)).toEqual(['section-header', 'column-header']);
  });
});
```

- [ ] **Step 2: Run pagination contract and confirm HeaderBand repetition gap**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-7-band-pagination-contract
```

Expected before implementation: the first test passes; the second test fails if HeaderBand/ColumnHeader are not repeated on new page.

- [ ] **Step 3: Extend `LogicalBandItem` with repeatable section headers**

Modify `packages/core/src/band-planner/band-plan.ts`:

```ts
export type LogicalBandItem =
  | {
      kind: 'band';
      band: ReportBandcurrent model;
      context: RenderContextcurrent model;
      repeatOnPageBreakBefore?: ReportBandcurrent model[];
    }
  | { kind: 'pageBreak'; reason: string };
```

- [ ] **Step 4: Attach repeatable Header/ColumnHeader bands to data and child items**

In `packages/core/src/band-planner/execute-band-plan.ts`, add:

```ts
function repeatableSectionBands(section: DataSectionPlan): ReportBandcurrent model[] {
  return [...section.headers, ...section.columnHeaders].filter((band) => band.behavior.printOnAllPages);
}

function createSectionBandItem(
  band: ReportBandcurrent model,
  context: RenderContextcurrent model,
  repeatOnPageBreakBefore: ReportBandcurrent model[],
): LogicalBandItem {
  return { kind: 'band', band, context, repeatOnPageBreakBefore };
}
```

When pushing `section.dataBand` or `section.childBands`, use `createSectionBandItem()` with `repeatableSectionBands(section)`.

- [ ] **Step 5: Repeat section bands after automatic page breaks**

In `packages/core/src/pagination/paginate.ts`, keep the current PageHeader/GroupHeader logic and add a local active section repeat list:

```ts
let activeSectionRepeatBands: ReportBandcurrent model[] = [];
```

Before placing each logical band:

```ts
if (item.repeatOnPageBreakBefore) {
  activeSectionRepeatBands = item.repeatOnPageBreakBefore;
}
```

Inside `newPage()` after page headers and repeated groups:

```ts
for (const sectionBand of activeSectionRepeatBands) {
  placeBand(sectionBand, createEmptyContext(), true);
}
```

Before placing `footer`, `columnFooter`, `reportSummary`, or an `emptyData` item, clear repeats:

```ts
if (['footer', 'columnFooter', 'reportSummary', 'emptyData'].includes(item.band.type)) {
  activeSectionRepeatBands = [];
}
```

- [ ] **Step 6: Re-run pagination contract**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-7-band-pagination-contract
```

Expected: PASS.

### Task 4: KeepTogether, CanBreak, BreakIfLessThan, and PrintAtBottom Contract

**Files:**
- Create: `packages/core/__tests__/phase-7-band-break-contract.test.ts`
- Modify: `packages/core/src/pagination/paginate.ts`
- Modify if needed: `packages/core/src/layout-engine/layout-band.ts`

- [ ] **Step 1: Write break-behavior tests**

Create `packages/core/__tests__/phase-7-band-break-contract.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderReportcurrent model } from '../src';
import { band, makeTemplate } from './phase-2-helpers';

function behavior(overrides: Partial<ReturnType<typeof band>['behavior']>) {
  return {
    enabled: true,
    printOn: 'allPages' as const,
    printIfEmpty: true,
    printOnAllPages: false,
    keepTogether: false,
    canBreak: true,
    printAtBottom: false,
    ...overrides,
  };
}

describe('Phase 7 band break behavior contract', () => {
  it('moves a keepTogether group footer to the next page when it does not fit', () => {
    const template = makeTemplate([
      band('group-header', 'groupHeader', { height: 8, group: { name: 'Department', conditionExpression: '{employees.Department}' } }),
      band('data', 'data', { height: 18, dataBand: { dataSourceId: 'employees' } }),
      band('group-footer', 'groupFooter', { height: 18, behavior: behavior({ keepTogether: true, canBreak: false }), group: { name: 'Department' } }),
    ]);
    template.pages[0].height = 60;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReportcurrent model(template, {
      employees: [
        { Name: 'A', Department: 'Engineering' },
        { Name: 'B', Department: 'Engineering' },
      ],
    });

    const footerPageIndex = document.pages.findIndex(page => page.items.some(item => item.id === 'group-footer'));
    expect(footerPageIndex).toBeGreaterThan(0);
  });

  it('honors breakIfLessThan by starting a data row on the next page', () => {
    const template = makeTemplate([
      band('data', 'data', { height: 18, behavior: behavior({ breakIfLessThan: 20 }), dataBand: { dataSourceId: 'employees' } }),
    ]);
    template.pages[0].height = 60;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReportcurrent model(template, {
      employees: Array.from({ length: 3 }, (_, index) => ({ Name: `N${index}` })),
    });

    expect(document.pages).toHaveLength(2);
    expect(document.pages[1].items[0].bandType).toBe('data');
  });

  it('prints a printAtBottom footer at the bottom printable edge', () => {
    const template = makeTemplate([
      band('data', 'data', { height: 10, dataBand: { dataSourceId: 'employees' } }),
      band('footer', 'footer', { height: 10, behavior: behavior({ printAtBottom: true }) }),
    ]);
    template.pages[0].height = 80;
    template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

    const document = renderReportcurrent model(template, { employees: [{ Name: 'A' }] });
    const footer = document.pages[0].items.find(item => item.id === 'footer');

    expect(footer?.y).toBe(65);
  });
});
```

- [ ] **Step 2: Run break-behavior tests and capture failures**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-7-band-break-contract
```

Expected before implementation: at least one test fails because `breakIfLessThan` and `printAtBottom` are not fully enforced.

- [ ] **Step 3: Implement pre-placement break checks**

In `placeBand()` inside `packages/core/src/pagination/paginate.ts`, before computing final box, add:

```ts
const remaining = pageBottomY - cursorY;
const breakIfLessThan = band.behavior.breakIfLessThan ?? 0;
if (!force && breakIfLessThan > 0 && remaining < breakIfLessThan && currentPage!.items.length > 0) {
  newPage();
}
```

Keep the existing overflow check after this.

- [ ] **Step 4: Implement printAtBottom placement**

In `placeBand()`, when `band.behavior.printAtBottom` is true, place it at the bottom printable edge:

```ts
const targetY = band.behavior.printAtBottom
  ? pageBottomY - preview.height
  : cursorY;
const box = layoutBand(band, { x: printableX, y: targetY, width: printableWidth, context, rowsByBand });
currentPage!.items.push(box);
cursorY = band.behavior.printAtBottom ? pageBottomY : cursorY + box.height;
```

- [ ] **Step 5: Re-run break contract**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-7-band-break-contract
```

Expected: PASS.

### Task 5: Validator Guardrails for Band Ownership

**Files:**
- Create or modify: `packages/core/__tests__/phase-7-band-rendering-contract.test.ts`
- Modify: `packages/core/src/template-model/schema.ts`

- [ ] **Step 1: Add validation tests**

Append:

```ts
import { validateTemplatecurrent model } from '../src';

it('rejects orphan HeaderBand without a following DataBand', () => {
  const template = makeTemplate([
    band('header', 'header'),
    band('page-footer', 'pageFooter'),
  ]);

  const result = validateTemplatecurrent model(template);

  expect(result.valid).toBe(false);
  expect(result.errors.some(error => error.message.includes('HeaderBand requires a following DataBand'))).toBe(true);
});

it('rejects DataBand without a data source id', () => {
  const template = makeTemplate([
    band('data', 'data'),
  ]);

  const result = validateTemplatecurrent model(template);

  expect(result.valid).toBe(false);
  expect(result.errors.some(error => error.message.includes('DataBand requires dataBand.dataSourceId'))).toBe(true);
});
```

- [ ] **Step 2: Run validation portion**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-7-band-rendering-contract
```

Expected before implementation: FAIL because validator does not enforce these two ownership rules.

- [ ] **Step 3: Implement validator checks**

In `validatePage()` in `packages/core/src/template-model/schema.ts`, track pending section bands:

```ts
const pendingSectionBands: ReportBandcurrent model[] = [];
```

Inside the band loop:

```ts
if (['header', 'columnHeader', 'groupHeader'].includes(band.type)) {
  pendingSectionBands.push(band);
}

if ((band.type === 'data' || band.type === 'hierarchicalData') && !band.dataBand?.dataSourceId) {
  errors.push({ path: `${path}.dataBand.dataSourceId`, message: 'DataBand requires dataBand.dataSourceId' });
}

if (band.type === 'data' || band.type === 'hierarchicalData') {
  pendingSectionBands.length = 0;
}
```

After the band loop:

```ts
pendingSectionBands
  .filter((band) => band.type === 'header' || band.type === 'columnHeader' || band.type === 'groupHeader')
  .forEach((band) => {
    errors.push({ path: `pages[${pageIndex}].bands`, message: `${band.type === 'header' ? 'HeaderBand' : band.type} requires a following DataBand` });
  });
```

- [ ] **Step 4: Re-run validator tests**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-7-band-rendering-contract
```

Expected: PASS.

### Task 6: Designer Band UX After Core Contract Passes

**Files:**
- Create: `packages/designer/src/__tests__/phase-7-band-designer-contract.test.tsx`
- Modify: `packages/designer/src/components/dialogs/BandWizardDialog.tsx`
- Modify: `packages/designer/src/components/Canvas.tsx`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`

- [ ] **Step 1: Write designer Band tests**

Create `packages/designer/src/__tests__/phase-7-band-designer-contract.test.tsx`:

```tsx
/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createDefaultTemplate } from '@report-designer/core';
import { BandWizardDialog } from '../components/dialogs/BandWizardDialog';
import { useDesignerStore } from '../store/designer-store';

describe('Phase 7 designer band contract', () => {
  it('creates a reference-style HeaderBand + DataBand + FooterBand section from the wizard', () => {
    const template = createDefaultTemplate('Band Contract');
    template.dataSources = [{ id: 'employees', name: 'employees', type: 'json', schema: [{ name: 'name', type: 'string' }] }];
    useDesignerStore.getState().loadTemplate(template);

    render(<BandWizardDialog open onClose={() => {}} />);
    fireEvent.click(screen.getByLabelText('HeaderBand + DataBand + FooterBand'));
    fireEvent.click(screen.getByRole('button', { name: 'Create bands' }));

    const bandTypes = useDesignerStore.getState().template.pages[0].bands.map(band => band.type);
    expect(bandTypes).toEqual(expect.arrayContaining(['header', 'data', 'footer']));
  });
});
```

- [ ] **Step 2: Run designer Band test and verify failure**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-7-band-designer-contract
```

Expected before UI wording update: FAIL if the accessible label does not exist.

- [ ] **Step 3: Update Band Wizard labels and presets**

In `BandWizardDialog.tsx`, use the reference designer names in visible controls:

```tsx
<Radio value="header-data-footer" aria-label="HeaderBand + DataBand + FooterBand">
  HeaderBand + DataBand + FooterBand
</Radio>
<Radio value="data-only" aria-label="DataBand only">
  DataBand only
</Radio>
```

- [ ] **Step 4: Add Band section hints on Canvas**

In `Canvas.tsx`, band badges should display the reference designer names:

```ts
const BAND_LABELS: Record<string, string> = {
  reportTitle: 'ReportTitleBand',
  reportSummary: 'ReportSummaryBand',
  pageHeader: 'PageHeaderBand',
  pageFooter: 'PageFooterBand',
  header: 'HeaderBand',
  footer: 'FooterBand',
  columnHeader: 'ColumnHeaderBand',
  columnFooter: 'ColumnFooterBand',
  groupHeader: 'GroupHeaderBand',
  groupFooter: 'GroupFooterBand',
  data: 'DataBand',
  child: 'ChildBand',
  emptyData: 'EmptyDataBand',
  overlay: 'OverlayBand',
};
```

Render `BAND_LABELS[band.type] ?? band.type` instead of raw `band.type`.

- [ ] **Step 5: Add Band behavior properties**

In `PropertyEditor.tsx`, when a single band is selected, expose:

```ts
printOn
printIfEmpty
printOnAllPages
keepTogether
canBreak
breakIfLessThan
printAtBottom
dataBand.dataSourceId
dataBand.filterExpression
dataBand.sort
```

Use Ant Design 6 `Select`, `Input`, `InputNumber`, and `Switch` without deprecated props.

- [ ] **Step 6: Re-run designer Band test**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-7-band-designer-contract
```

Expected: PASS.

### Task 7: Designer Shortcuts and Table Context Menu

**Files:**
- Create: `packages/designer/src/__tests__/phase-7-shortcuts-table-context.test.tsx`
- Modify: `packages/core/src/template-model/types.ts`
- Create or modify: `packages/designer/src/table/table-structure.ts`
- Modify: `packages/designer/src/store/designer-store.ts`
- Modify: `packages/designer/src/components/Canvas.tsx`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`

- [ ] **Step 1: Write shortcut and table-context tests**

Create `packages/designer/src/__tests__/phase-7-shortcuts-table-context.test.tsx`:

```tsx
/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import type { ReportComponent } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Canvas } from '../components/Canvas';
import { PropertyEditor } from '../components/PropertyEditor';
import { useDesignerStore } from '../store/designer-store';

function loadWith(component: ReportComponent) {
  const template = createDefaultTemplate('Shortcut Contract');
  template.pages[0].bands.find(band => band.type === 'data')!.components.push(component);
  useDesignerStore.getState().loadTemplate(template);
  useDesignerStore.getState().selectComponents([component.id]);
}

describe('Phase 7 designer shortcuts and table context menu', () => {
  it('toggles text font style with Ctrl+B, Ctrl+I, and Ctrl+U', () => {
    loadWith({
      id: 'text-1',
      type: 'text',
      x: 10,
      y: 10,
      width: 40,
      height: 10,
      text: 'Name',
      font: { family: 'Arial', size: 12, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'left',
      verticalAlign: 'top',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: false,
      canShrink: false,
    } as ReportComponent);

    render(<Canvas />);
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'i', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'u', ctrlKey: true });

    const component = useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as any;
    expect(component.font.bold).toBe(true);
    expect(component.font.italic).toBe(true);
    expect(component.font.underline).toBe(true);
  });

  it('shows table row and column actions from the component context menu', () => {
    loadWith({
      id: 'table-1',
      type: 'table',
      x: 10,
      y: 10,
      width: 80,
      height: 30,
      dataSource: 'employees',
      columns: [{ id: 'col-1', header: 'Name', field: 'name', width: 40, cellType: 'text' }],
      rowCount: 2,
      columnCount: 1,
      headerRowsCount: 1,
      footerRowsCount: 0,
      canBreak: true,
      headerHeight: 8,
      rowHeight: 8,
      showBorder: true,
    } as ReportComponent);

    render(<Canvas />);
    fireEvent.mouseDown(screen.getByTestId('designer-table-grid'), { button: 2, clientX: 20, clientY: 20 });
    fireEvent.click(screen.getByText('插入列到右侧'));

    const table = useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components)[0] as any;
    expect(table.columnCount).toBe(2);
    expect(table.columns).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run designer shortcut/table test**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-7-shortcuts-table-context
```

Expected before implementation: FAIL for missing shortcut APIs, missing table grid test id, or missing context-menu action.

- [ ] **Step 3: Implement the smallest designer changes**

Finish the interrupted WIP by implementing:

- `toggleSelectedFontStyle()`
- `moveSelectedBy()`
- `resizeSelectedBy()`
- `cutSelected()`
- `duplicateSelected()`
- table row/column helpers
- table grid preview
- table context-menu row/column entries
- table property panel fields for row count, column count, header rows, footer rows, CanBreak, data source, and border.

- [ ] **Step 4: Re-run designer shortcut/table test**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-7-shortcuts-table-context
```

Expected: PASS.

### Task 8: Full Verification and Commit

**Files:**
- All modified files from Tasks 1 through 7

- [ ] **Step 1: Run focused core Phase 7 tests**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-7
```

Expected: PASS.

- [ ] **Step 2: Run full core verification**

Run:

```bash
pnpm --filter @report-designer/core build
pnpm --filter @report-designer/core test
```

Expected: PASS.

- [ ] **Step 3: Run focused designer Phase 7 tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-7
```

Expected: PASS.

- [ ] **Step 4: Run full designer verification**

Run:

```bash
pnpm --filter @report-designer/designer build
pnpm --filter @report-designer/designer test
```

Expected: PASS.

- [ ] **Step 5: Run viewer/example build guard**

Run:

```bash
pnpm --filter @report-designer/viewer build
pnpm --filter @report-designer/viewer test
pnpm --filter @report-designer/example build
```

Expected: PASS. The example build may emit the existing Vite large chunk warning; that warning is acceptable if build exits 0.

- [ ] **Step 6: Commit**

Run:

```bash
git add docs/superpowers/plans/2026-05-06-phase-7-band-rendering-core-and-designer-actions.md packages/core packages/designer
git commit -m "feat(report): 锁定band渲染语义并增强设计器操作"
```

Expected: commit succeeds after all tests pass.

## Self-Review

- Spec coverage: Band taxonomy, DataBand/HeaderBand ownership, logical execution order, empty data, grouping, nested grouping, page chrome, HeaderBand repetition, ColumnHeader repetition, KeepTogether, CanBreak, BreakIfLessThan, PrintAtBottom, designer Band UX, shortcuts, and table context-menu work are covered by tasks.
- Placeholder scan: no `TBD`, `TODO`, `implement later`, or open-ended “write tests” steps remain.
- Type consistency: plan uses existing `ReportBandcurrent model`, `ReportTemplatecurrent model`, `BandBehaviorcurrent model`, `LogicalBandItem`, `RenderContextcurrent model`, `renderReportcurrent model`, `buildBandPlan`, `executeBandPlan`, and `validateTemplatecurrent model` names from the current core package.
