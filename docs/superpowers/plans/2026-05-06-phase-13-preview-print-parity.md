# Phase 13 Preview Print Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make browser preview and browser print render the exact same report content, positions, text alignment, and page item set whenever they use the same paper size.

**Architecture:** Treat `RenderDocument` as the only print/preview source of truth. `RenderDocumentView` renders bands at page absolute coordinates and renders components relative to their containing band. `buildPrintHtml` must use the same semantics: band is absolute on the page, component is relative inside the band, and text alignment must be applied to a full-width inner text node just like the DOM preview renderer.

**Tech Stack:** TypeScript, Vitest, viewer DOM renderer, iframe print HTML.

---

### Task 1: Reproduce Print Coordinate Drift

**Files:**
- Modify: `packages/viewer/src/__tests__/phase-4-print-frame.test.ts`

- [x] **Step 1: Write failing coordinate test**

Add a test using `makeRenderDocument()`:

```ts
const html = buildPrintHtml(makeRenderDocument());

expect(html).toContain('class="rd-print-band" style="left:20mm;top:20mm;width:170mm;height:20mm;"');
expect(html).toContain('class="rd-print-component" style="left:5mm;top:5mm;');
expect(html).not.toContain('class="rd-print-component" style="left:25mm;top:25mm;');
```

This locks the rule: print components are relative to the band, because preview subtracts `band.x` and `band.y` before rendering a component inside the band node.

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/viewer test -- phase-4-print-frame
```

Expected: FAIL because print currently double-adds band offsets.

### Task 2: Reproduce Print Text Alignment Drift

**Files:**
- Modify: `packages/viewer/src/__tests__/phase-4-print-frame.test.ts`
- Modify: `packages/viewer/src/print/print-frame.ts`

- [x] **Step 1: Write failing text alignment test**

Create a centered text component in `makeRenderDocument()` and assert that print HTML contains a full-width inner content element:

```ts
expect(html).toContain('class="rd-print-text-content"');
expect(html).toContain('style="width:100%;text-align:center;white-space:inherit;"');
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/viewer test -- phase-4-print-frame
```

Expected: FAIL because print currently puts escaped text directly in the flex container.

### Task 3: Implement Print/Preview Parity

**Files:**
- Modify: `packages/viewer/src/print/print-frame.ts`

- [x] **Step 1: Pass band context while rendering print components**

Change:

```ts
band.components.map(renderComponentHtml)
```

to:

```ts
band.components.map(component => renderComponentHtml(component, band.x, band.y))
```

Then subtract band coordinates in the component style:

```ts
left:${roundCss(component.x - bandX)}mm
top:${roundCss(component.y - bandY)}mm
```

- [x] **Step 2: Add print text content wrapper**

Render text as:

```html
<div class="rd-print-component rd-print-text" style="...">
  <div class="rd-print-text-content" style="width:100%;text-align:center;white-space:inherit;">...</div>
</div>
```

Keep font, padding, borders, vertical alignment, overflow, and white-space on the outer text box so it mirrors `RenderComponent`.

- [x] **Step 3: Run viewer tests**

Run:

```bash
pnpm --filter @report-designer/viewer test -- phase-4-print-frame phase-4-viewer-renderdocument
```

Expected: PASS.

### Task 4: Verification

**Files:**
- No further source changes expected.

- [x] **Step 1: Browser/HTML parity measurement**

Use Playwright or DOM parsing to confirm:

```text
preview title component and print title component have the same page-relative left/top
preview title text and print title text both use text-align:center
first data row page-relative left/top matches between preview and print
print HTML has the same page count and first-page band/component count as RenderDocument
```

- [x] **Step 2: Full package checks**

Run:

```bash
pnpm --filter @report-designer/viewer test
pnpm --filter @report-designer/viewer build
pnpm --filter @report-designer/example test
pnpm --filter @report-designer/example build
```

Expected: PASS. Vite chunk-size warnings are acceptable if build exits 0.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-05-06-phase-13-preview-print-parity.md packages/viewer/src/print/print-frame.ts packages/viewer/src/__tests__/phase-4-print-frame.test.ts
git commit -m "fix(viewer): 保持预览与打印渲染一致"
```
