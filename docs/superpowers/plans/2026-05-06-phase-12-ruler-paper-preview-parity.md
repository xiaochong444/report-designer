# Phase 12 Ruler Paper Preview Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the designer canvas so the ruler, paper, printable grid, band chrome, and preview coordinates match the reference-style layout shown by the user.

**Architecture:** Keep page coordinates in millimeters and treat report components as coordinates relative to the printable area. The designer canvas draws three distinct layers: paper outer box, printable content/grid inside margins, and band chrome inside the printable area but outside band body height. The viewer keeps using current model pagination margins, and this phase adds parity checks to catch any designer/preview title drift.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Playwright against the Vite example app, AntD 6-compatible API usage.

---

### Task 1: Canvas Ruler and Paper Geometry

**Files:**
- Modify: `packages/designer/src/__tests__/phase-11-page-margin-ruler-band-chrome.test.tsx`
- Modify: `packages/designer/src/components/Canvas.tsx`

- [x] **Step 1: Write the failing test**

Update the existing Phase 11 test so it asserts the user-visible the reference designer geometry:

```ts
const pageStack = screen.getByTestId('designer-canvas-page-stack');
const horizontalRuler = screen.getByTestId('designer-ruler-horizontal');
const verticalRuler = screen.getByTestId('designer-ruler-vertical');

expect(pageStack.getAttribute('style')).toContain('margin: 0px');
expect(horizontalRuler.getAttribute('style')).toContain('left: 24px');
expect(horizontalRuler.getAttribute('style')).toContain('width: 794px');
expect(horizontalRuler).toHaveAttribute('data-printable-offset-px', '76');
expect(verticalRuler.getAttribute('style')).toContain('top: 24px');
expect(verticalRuler.getAttribute('style')).toContain('height: 1123px');
expect(verticalRuler).toHaveAttribute('data-printable-offset-px', '76');
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-11-page-margin-ruler-band-chrome
```

Expected: FAIL because the page stack is still centered and rulers still begin at the printable area instead of the paper edge.

- [x] **Step 3: Write minimal implementation**

In `Canvas.tsx`, add `data-testid="designer-canvas-page-stack"` to the page stack wrapper and change it from centered to left aligned:

```tsx
<div
  data-testid="designer-canvas-page-stack"
  style={{ position: 'relative', width: pageWidthPx + RULER_SIZE, margin: 0 }}
>
```

Change the horizontal ruler to span the whole paper width while shifting tick positions by the left margin:

```tsx
<Ruler
  direction="horizontal"
  lengthMm={printableWidthMm}
  lengthPx={pageWidthPx}
  printableOffsetPx={marginLeftPx}
  offsetPx={RULER_SIZE}
  crossOffsetPx={0}
  zoom={zoom}
/>
```

Change the vertical ruler to span the whole paper height while shifting tick positions by the top margin:

```tsx
<Ruler
  direction="vertical"
  lengthMm={printableHeightMm}
  lengthPx={pageHeightPx}
  printableOffsetPx={marginTopPx}
  offsetPx={RULER_SIZE}
  crossOffsetPx={0}
  zoom={zoom}
/>
```

Add `printableOffsetPx` to `Ruler` props, expose it as a data attribute, and add it to every tick position:

```tsx
pos: printableOffsetPx + mmToPx(mm) * zoom,
```

- [x] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-11-page-margin-ruler-band-chrome phase-10-canvas-reference-designer-layout
```

Expected: PASS.

### Task 2: Report Title Designer/Preview Position Parity

**Files:**
- Inspect: `packages/example/src/templates/*.ts`
- Inspect: `packages/example/src/App.tsx`
- Inspect: `packages/core/src/pagination/paginate-v2.ts`
- Inspect: `packages/viewer/src/renderers/dom/RenderDocumentView.tsx`
- Modify only if the parity measurement identifies a real coordinate transform bug.

- [x] **Step 1: Add a focused parity measurement**

Use Playwright against `http://127.0.0.1:5180/` to compare the selected sample title component with the rendered preview page:

```ts
const previewTitle = await page.getByText('Grouped Employees').boundingBox();
const previewPage = await page.getByTestId('render-document-page').first().boundingBox();
await page.getByRole('button', { name: '打开设计器' }).click();
const designerTitle = await page.getByText('Grouped Employees').boundingBox();
const designerPaper = await page.getByTestId('designer-page-sheet').boundingBox();
```

Measure each title's center relative to its paper center. A centered title should have a small delta on both surfaces.

- [x] **Step 2: If parity fails, fix the source coordinate transform**

If the viewer is wrong, keep `paginate-v2.ts` margins as the single source of page offset and ensure `layoutBand` returns components relative to the same printable coordinate system. If the designer is wrong, ensure `toDesignerTemplate` and `Canvas.tsx` do not double-apply or omit margins.

Actual finding: page and component coordinates were aligned, but the viewer text renderer put `textAlign` on a flex container. The component box was centered, while the rendered text stayed visually left-aligned inside that flex box. The fix is to render a full-width inner text content node with `textAlign`.

- [x] **Step 3: Re-run the Playwright parity measurement**

Expected: the design title and preview title have matching horizontal centers relative to their paper.

### Task 3: Verification and Commit

**Files:**
- Modify: `docs/superpowers/plans/2026-05-06-phase-12-ruler-paper-preview-parity.md`

- [x] **Step 1: Run focused and package verification**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-11-page-margin-ruler-band-chrome phase-10-canvas-reference-designer-layout
pnpm --filter @report-designer/designer build
pnpm --filter @report-designer/example test
```

Expected: PASS.

- [x] **Step 2: Run browser verification**

Use Playwright on `http://127.0.0.1:5180/` and verify:

```text
designer-canvas-page-stack margin is 0
horizontal ruler left is 24px and width equals paper width
vertical ruler top is 24px and height equals paper height
printable grid starts at left/top margin
preview and designer title positions match
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-05-06-phase-12-ruler-paper-preview-parity.md packages/designer/src/components/Canvas.tsx packages/designer/src/__tests__/phase-11-page-margin-ruler-band-chrome.test.tsx
git commit -m "fix(designer): 修正标尺纸张与预览坐标"
```
