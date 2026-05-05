# Phase 4 Viewer Print And PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make preview, browser print, and PDF export consume the same RenderDocument and support common print components.

**Architecture:** Viewer becomes a RenderDocument consumer. DOM preview, print iframe, and PDF exporter use shared component renderer mappings so page breaks and component positions match.

**Tech Stack:** React 19, Ant Design 6, pdf-lib, jsbarcode, TypeScript, Vitest, Testing Library.

---

## File Structure

- Create: `packages/viewer/src/renderers/dom/RenderDocumentView.tsx`
- Create: `packages/viewer/src/renderers/dom/renderComponent.tsx`
- Create: `packages/viewer/src/print/print-frame.ts`
- Create: `packages/viewer/src/export/pdf/export-render-document.ts`
- Create: `packages/viewer/src/export/pdf/pdf-draw-component.ts`
- Modify: `packages/viewer/src/components/Viewer.tsx`
- Modify: `packages/viewer/src/export/index.ts`
- Modify: `packages/viewer/src/index.ts`
- Test: `packages/viewer/src/__tests__/phase-4-viewer-renderdocument.test.tsx`
- Test: `packages/viewer/src/__tests__/phase-4-print-frame.test.ts`
- Test: `packages/viewer/src/__tests__/phase-4-pdf-export.test.ts`

## Tasks

### Task 1: Switch Viewer To RenderDocument

- [ ] **Step 1: Write viewer test**

Render a template with two data rows and assert the viewer renders `data-testid="render-document-page"` for each page.

- [ ] **Step 2: Modify `Viewer.tsx`**

Replace `paginate(template, data)` with `renderReportV2(template, data)` after Phase 3 exports it. Keep toolbar page navigation.

### Task 2: Implement DOM Component Renderers

- [ ] **Step 1: Write component renderer tests**

Cover:

- text content, font, background, borders, alignment
- image fit modes
- line and shape via SVG
- checkbox checked/unchecked
- barcode rendered from `barcodeValue` through `jsbarcode` into SVG or canvas-backed image output
- page number/date time text

- [ ] **Step 2: Implement `renderComponent.tsx`**

Map RenderDocument component types to DOM elements with absolute mm-to-px positioning. Use consistent conversion:

```ts
const MM_TO_PX = 96 / 25.4;
```

### Task 3: Implement Print Iframe

- [ ] **Step 1: Write print frame test**

Given RenderDocument with A4 portrait pages, generated HTML must include:

- `@page { size: 210mm 297mm; margin: 0; }`
- `.rd-print-page`
- one page div per RenderPage.

- [ ] **Step 2: Implement `printRenderDocument(document)`**

Generate a hidden iframe, write static HTML/CSS, wait for images/fonts, call `contentWindow.print()`, then cleanup.

### Task 4: Implement PDF Export From RenderDocument

- [ ] **Step 1: Write PDF smoke test**

Export a RenderDocument with text and assert returned byte length is greater than 500.

- [ ] **Step 2: Implement text, borders, backgrounds, lines, shapes**

Use pdf-lib primitives:

- `drawText`
- `drawRectangle`
- `drawLine`
- embedded images for image components and barcode images generated from `jsbarcode`.

- [ ] **Step 3: Add Chinese font path option**

Expose:

```ts
export interface PdfExportOptions {
  fontBytes?: Uint8Array;
  fallbackFontName?: string;
}
```

If no font bytes are provided, keep Helvetica and document that Chinese PDF requires font bytes.

### Task 5: Verify

- [ ] **Step 1: Run viewer tests**

Run:

```bash
pnpm --filter @report-designer/viewer test -- phase-4
pnpm --filter @report-designer/viewer build
```

Expected: PASS.

- [ ] **Step 2: Browser print/PDF smoke check**

Run example app, open preview, export PDF, and print to browser dialog. Confirm page count and page breaks match viewer.

- [ ] **Step 3: Commit**

```bash
git add packages/viewer/src
git commit -m "feat(viewer): 使用renderdocument统一预览打印和pdf"
```
