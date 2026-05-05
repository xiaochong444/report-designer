# Phase 3 Layout Pagination And RenderDocument Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace height-only pagination with Stimulsoft-style page-aware layout and produce a final RenderDocument shared by preview, print, and export.

**Architecture:** Logical band items from Phase 2 are measured and placed by layout passes. Pagination owns page headers, page footers, repeated group/header behavior, bottom footers, and total page calculation.

**Tech Stack:** TypeScript, Vitest, DOM-free measurement approximation in core. Viewer-specific rendering consumes the measured RenderDocument from this phase.

---

## File Structure

- Create: `packages/core/src/render-document/types.ts`
- Create: `packages/core/src/layout-engine/measure.ts`
- Create: `packages/core/src/layout-engine/layout-band.ts`
- Create: `packages/core/src/layout-engine/layout-document.ts`
- Create: `packages/core/src/pagination/paginate-v2.ts`
- Create: `packages/core/src/pagination/page-number-pass.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/__tests__/phase-3-layout.test.ts`
- Test: `packages/core/__tests__/phase-3-pagination.test.ts`
- Test: `packages/core/__tests__/phase-3-page-numbers.test.ts`

## Tasks

### Task 1: Define RenderDocument

- [ ] **Step 1: Write RenderDocument shape tests**

Assert `renderReportV2()` returns:

```ts
{
  pages: [
    {
      pageNumber: 1,
      totalPages: 1,
      width: 210,
      height: 297,
      items: []
    }
  ]
}
```

- [ ] **Step 2: Implement `render-document/types.ts`**

Required entities:

- `RenderDocument`
- `RenderPage`
- `RenderBandBox`
- `RenderComponentBox`
- `RenderStyle`
- `RenderText`
- `RenderImage`
- `RenderLine`
- `RenderShape`
- `RenderCheckbox`
- `RenderBarcode`

All coordinates are millimeters in core.

### Task 2: Measure Components And Bands

- [ ] **Step 1: Write canGrow/canShrink tests**

Given a text component with width 40mm, height 8mm, and long content:

- `canGrow: true` should increase actual height.
- `canShrink: true` should reduce actual height for one-line short content.
- `canGrow: false` should keep declared height and set overflow metadata.

- [ ] **Step 2: Implement `measureTextBox()`**

Use an approximation suitable for deterministic tests:

```ts
const averageCharWidthMm = fontSizePt * 0.3528 * 0.52;
const lineHeightMm = fontSizePt * 0.3528 * 1.2;
```

### Task 3: Implement Page-Aware Pagination

- [ ] **Step 1: Write pagination tests**

Cases:

- PageHeader repeats on each page.
- PageFooter is positioned at `page.height - margin.bottom - footer.height`.
- ReportTitle appears once.
- ReportSummary appears once at the end.
- DataBand rows continue on next page.
- GroupHeader repeats on new page when configured.
- GroupFooter stays with final group row when possible.

- [ ] **Step 2: Implement `paginateV2()`**

Algorithm:

1. Initialize page content area from margins.
2. Place page header at top of printable area.
3. Reserve page footer height before placing content.
4. Place report title once before first data content.
5. Place logical band items sequentially.
6. If the next band cannot fit, start a new page and repeat eligible headers.
7. Place page footer at bottom after content.
8. Place overlay behind all items.

### Task 4: Implement Two-Pass Page Numbers

- [ ] **Step 1: Write page number tests**

Template with a page number component in PageFooter should render:

- `1/3`
- `2/3`
- `3/3`

- [ ] **Step 2: Implement page-number pass**

After pagination creates all pages, walk RenderDocument and resolve page expressions with `{PageNumber}` and `{TotalPages}`.

### Task 5: Verify

- [ ] **Step 1: Run phase tests**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-3
pnpm --filter @report-designer/core build
```

Expected: PASS.

- [ ] **Step 2: Commit**

```bash
git add packages/core/src packages/core/__tests__
git commit -m "feat(core): 实现分页布局和renderdocument"
```
