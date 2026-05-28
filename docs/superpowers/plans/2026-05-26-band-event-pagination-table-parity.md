# Band Event Pagination Table Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make paginated band behavior, event-driven layout, and table output match across preview, print HTML, and PDF export.

**Architecture:** Keep pagination as the source of truth and push every surface through the same rendered document contract. Use contract tests in core to lock band/page behavior, then extend viewer tests to prove style parity for the same table cells across DOM, print HTML, and PDF.

**Tech Stack:** TypeScript, Vitest, React Testing Library, DOM rendering, PDF export primitives.

---

### Task 1: Band print-on matrix and empty-band contract

**Files:**
- Modify: `packages/core/src/pagination/paginate.ts`
- Modify: `packages/core/__tests__/phase-35-band-contracts.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests that prove the current engine is wrong for `lastPage` and `printIfEmpty=false`:

```ts
it('prints lastPage bands only on the final page', () => {
  const template = makeTemplate([
    band('last-page-note', 'footer', {
      height: 8,
      behavior: { enabled: true, printOn: 'lastPage', printIfEmpty: true, printOnAllPages: false, keepTogether: false, canBreak: false, printAtBottom: false },
      components: [{
        id: 'note',
        type: 'text',
        x: 0,
        y: 0,
        width: 50,
        height: 8,
        text: 'Last page only',
        ...textBase,
      }],
    }),
    band('data', 'data', {
      height: 20,
      dataBand: { dataSourceId: 'employees' },
      components: [{
        id: 'detail',
        type: 'text',
        x: 0,
        y: 0,
        width: 50,
        height: 8,
        text: '{employees.Name}',
        ...textBase,
      }],
    }),
  ]);
  template.pages[0].height = 70;
  template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

  const document = renderReport(template, {
    employees: [{ Name: 'A' }, { Name: 'B' }, { Name: 'C' }, { Name: 'D' }],
  });

  expect(document.pages[0].items.map(item => item.bandId)).not.toContain('last-page-note');
  expect(document.pages.at(-1)?.items.map(item => item.bandId)).toContain('last-page-note');
});
```

```ts
it('skips empty bands when printIfEmpty is false', () => {
  const template = makeTemplate([
    band('empty-footer', 'footer', {
      height: 8,
      behavior: { enabled: true, printOn: 'allPages', printIfEmpty: false, printOnAllPages: false, keepTogether: false, canBreak: false, printAtBottom: false },
      components: [{
        id: 'hidden',
        type: 'text',
        x: 0,
        y: 0,
        width: 50,
        height: 8,
        text: 'Hidden',
        visible: '{Orders.ShowFooter}',
        ...textBase,
      }],
    }),
    band('data', 'data', {
      height: 10,
      dataBand: { dataSourceId: 'employees' },
      components: [{
        id: 'detail',
        type: 'text',
        x: 0,
        y: 0,
        width: 50,
        height: 8,
        text: '{employees.Name}',
        ...textBase,
      }],
    }),
  ]);

  const document = renderReport(template, { employees: [{ Name: 'A' }] }, { parameters: { ShowFooter: false } });

  expect(document.pages[0].items.map(item => item.bandId)).not.toContain('empty-footer');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-35-band-contracts.test.ts
```

Expected: fail because `lastPage` currently behaves like `allPages` and empty bands still render.

- [ ] **Step 3: Write minimal implementation**

Update `packages/core/src/pagination/paginate.ts` with two focused helpers:

```ts
function collectLastPageBandIds(page: Page): Set<string> {
  return new Set(page.bands.filter(band => getBandBehavior(band).printOn === 'lastPage').map(band => band.id));
}

function removeNonFinalLastPageBands(pages: RenderPage[], lastPageBandIds: Set<string>): void {
  const finalPage = pages.at(-1);
  pages.forEach(page => {
    if (page === finalPage) return;
    page.items = page.items.filter(item => !lastPageBandIds.has(item.bandId));
  });
}
```

Then call `removeNonFinalLastPageBands()` before the existing page-number pass. Enforce `printIfEmpty=false` immediately after the preview `layoutBand()` call:

```ts
if (behavior.printIfEmpty === false && preview.components.length === 0) {
  finishBandInstance(eventBand, context, options, templatePage);
  return undefined;
}
```

Keep `shouldPrintBand()` responsible for page-number and expression eligibility only.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-35-band-contracts.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/pagination/paginate.ts packages/core/__tests__/phase-35-band-contracts.test.ts
git commit -m "fix(core): 修正Band页规则与空带输出"
```

### Task 2: Event-aware pagination height consistency

**Files:**
- Modify: `packages/core/src/pagination/paginate.ts`
- Modify: `packages/core/src/layout-engine/layout-band.ts`
- Modify: `packages/core/__tests__/phase-23-render-events.test.ts`
- Modify: `packages/core/__tests__/phase-35-band-contracts.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test where a tall component is hidden by `beforePrint` or `getValue`, and the report should no longer spill onto an extra page when preflight and final render share the same event runtime:

```ts
it('uses event-aware layout for page breaking', () => {
  const template = makeTemplate([
    band('data', 'data', {
      height: 40,
      dataBand: { dataSourceId: 'employees' },
      components: [{
        id: 'detail',
        type: 'text',
        x: 0,
        y: 0,
        width: 50,
        height: 30,
        text: '{employees.Name}',
        events: {
          beforePrint: { enabled: true, script: 'ctx.hide();' },
        },
        ...textBase,
      }],
    }),
  ]);
  template.pages[0].height = 60;
  template.pages[0].margins = { top: 5, right: 5, bottom: 5, left: 5 };

  const document = renderReport(template, { employees: [{ Name: 'A' }, { Name: 'B' }] });
  expect(document.pages.length).toBe(1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-23-render-events.test.ts phase-35-band-contracts.test.ts
```

Expected: fail because preflight and final layout still diverge for event-mutated components.

- [ ] **Step 3: Write minimal implementation**

Adjust `placeBand()` so preview and final rendering share event-aware output. The minimal target shape is:

```ts
const eventRuntime = withEventPage(options.eventRuntime, templatePage);
const preview = layoutBand(eventBand, {
  x: printableX,
  y: cursorY,
  width: printableWidth,
  context: layoutContext,
  rowsByBand,
  pageRowsByBand: currentPageRows,
  styles,
  renderSubreport: createSubreportRenderer(rowsByBand, options, true),
  eventRuntime,
});
```

If the band has already been laid out with events for height estimation and the target Y does not change, reuse that box for `currentPage.items.push()`. If `printAtBottom` changes `y`, call `layoutBand()` once more at `targetY` with the same `eventRuntime` and keep the event scripts idempotent through the existing cloned band instance path.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-23-render-events.test.ts phase-35-band-contracts.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/pagination/paginate.ts packages/core/src/layout-engine/layout-band.ts packages/core/__tests__/phase-23-render-events.test.ts packages/core/__tests__/phase-35-band-contracts.test.ts
git commit -m "fix(core): 统一事件布局与分页高度"
```

### Task 3: Table output parity across preview, print, and PDF

**Files:**
- Modify: `packages/viewer/src/renderers/dom/renderComponent.tsx`
- Modify: `packages/viewer/src/print/print-frame.ts`
- Modify: `packages/viewer/src/export/pdf/pdf-draw-component.ts`
- Modify: `packages/viewer/src/__tests__/phase-34-table-rendering.test.tsx`
- Modify: `packages/viewer/src/__tests__/phase-4-print-frame.test.ts`
- Modify: `packages/viewer/src/__tests__/phase-4-pdf-export.test.ts`

- [ ] **Step 1: Write the failing tests**

Extend the table tests so they assert font family, size, weight, style, underline, strikethrough, and color survive all three rendering paths:

```ts
expect(cell).toHaveStyle({
  backgroundColor: '#fffbe6',
  textAlign: 'right',
  borderTopColor: '#1677ff',
  fontFamily: 'Arial',
  fontWeight: '700',
  fontStyle: 'italic',
  textDecoration: 'underline line-through',
});
```

Add print HTML expectations for matching CSS declarations, and add PDF expectations for the table text and decoration drawing calls already exposed by the exporter test harness.

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --filter @report-designer/viewer test -- phase-34-table-rendering.test.tsx phase-4-print-frame.test.ts phase-4-pdf-export.test.ts
```

Expected: fail because the current renderers still hard-code part of the table font behavior.

- [ ] **Step 3: Write minimal implementation**

Update the DOM renderer, print renderer, and PDF renderer so they read table cell style from the same normalized style object and preserve all common text decorations and font metadata. Keep the change scoped to table output only.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm --filter @report-designer/viewer test -- phase-34-table-rendering.test.tsx phase-4-print-frame.test.ts phase-4-pdf-export.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/viewer/src/renderers/dom/renderComponent.tsx packages/viewer/src/print/print-frame.ts packages/viewer/src/export/pdf/pdf-draw-component.ts packages/viewer/src/__tests__/phase-34-table-rendering.test.tsx packages/viewer/src/__tests__/phase-4-print-frame.test.ts packages/viewer/src/__tests__/phase-4-pdf-export.test.ts
git commit -m "fix(viewer): 对齐表格输出样式"
```

### Task 4: Full verification and cleanup

**Files:**
- Modify as needed from previous tasks

- [ ] **Step 1: Run the full suite**

Run:

```bash
pnpm test
```

Expected: all test suites pass.

- [ ] **Step 2: Run the build**

Run:

```bash
pnpm build
```

Expected: build passes. If `packages/example/dist/index.html` changes only because of hashed asset names, restore that file before finalizing.

- [ ] **Step 3: Run the naming scan**

Run:

```bash
$pattern = 'forbidden-product-name|legacy-version-marker|old-toolbar-name'; rg -n -i $pattern packages docs --glob '!**/dist/**' --glob '!**/node_modules/**'
```

Expected: no matches.

- [ ] **Step 4: Final commit if needed**

If the verification step forces any cleanup edits, commit them with a focused message after re-running the affected tests.
