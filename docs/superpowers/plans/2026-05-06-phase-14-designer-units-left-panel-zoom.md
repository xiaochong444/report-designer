# Phase 14 Designer Units Left Panel Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the designer shell closer to the the reference designer workflow by cleaning up the left explorer, adding paper presets and report units, fixing zoom/ruler alignment, and making all examples default to A4.

**Architecture:** Keep all stored coordinates in millimeters and introduce a designer-only unit preference for UI conversion. Derive paper presets from page width and height instead of mutating the template schema. Split raw paper size from scaled paper size in the canvas so the page shell, printable grid, and rulers stay aligned at any zoom level.

**Tech Stack:** React, TypeScript, Zustand, Ant Design 6 API, Vitest, Testing Library.

---

### Task 1: Lock the new page settings and zoom behavior with tests

**Files:**
- Modify: `packages/designer/src/__tests__/phase-10-page-properties.test.tsx`
- Create: `packages/designer/src/__tests__/phase-14-canvas-zoom-layout.test.tsx`

- [x] **Step 1: Write the failing tests**

Expect page properties to expose `Paper type` and `Report unit`, default to `A4` and `Millimeter`, and stop showing `(mm)`. Add a zoom regression test asserting that at `200%` zoom the paper shell scales once, the printable area keeps raw coordinates, and the zoom bar is not `position: fixed`.

- [x] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-10-page-properties phase-14-canvas-zoom-layout
```

Expected: FAIL because the UI does not yet expose paper type or report unit, and the zoom bar is still fixed with double-scaled paper metrics.

### Task 2: Add shared page measurement helpers and designer UI preferences

**Files:**
- Create: `packages/designer/src/page-settings.ts`
- Modify: `packages/designer/src/store/designer-store.ts`

- [ ] **Step 1: Add page-setting helpers**

Create helpers for:

- report unit conversion (`mm` / `cm`)
- step sizes and rounding for display
- common paper presets
- preset detection from width and height
- preset sizing by orientation

- [ ] **Step 2: Add designer-only preferences to the store**

Add `reportUnit`, `setReportUnit`, `zoom`, and `setZoom` to the Zustand store. Reset `zoom` to `1` and `reportUnit` to `mm` when a new template is loaded.

- [ ] **Step 3: Run the focused designer tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-10-page-properties phase-14-canvas-zoom-layout
```

Expected: still FAIL, but now only on the missing UI and canvas implementation details.

### Task 3: Rebuild page settings and property editors around paper presets and units

**Files:**
- Modify: `packages/designer/src/components/panels/the reference designerPropertyGrid.tsx`
- Modify: `packages/designer/src/components/dialogs/PageSetupDialog.tsx`
- Modify: `packages/designer/src/components/properties/PropertyGridcurrent model.tsx`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Modify: `packages/designer/src/components/shell/DesignerStatusBar.tsx`

- [ ] **Step 1: Update page properties**

Add `Paper type` and `Report unit` controls. Use preset detection to populate the current paper type. Disable width and height editing unless the current paper type is `Custom`. Keep orientation changes preset-aware.

- [ ] **Step 2: Remove `(mm)` label suffixes**

Rename property labels such as `Width (mm)` to `Width`, `X (mm)` to `X`, and `Height (mm)` to `Height`.

- [ ] **Step 3: Convert numeric property inputs through the selected report unit**

Use the shared helpers so page settings, band height, component coordinates, border width, line endpoints, and padding display and edit through the selected unit while saving back to millimeters.

- [ ] **Step 4: Update the status bar**

Show page size, margins, grid hint, and zoom using the selected report unit and current zoom.

- [ ] **Step 5: Run the property-focused tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-10-page-properties
```

Expected: PASS.

### Task 4: Simplify the left explorer and fix canvas zoom geometry

**Files:**
- Modify: `packages/designer/src/components/panels/the reference designerLeftPanel.tsx`
- Modify: `packages/designer/src/components/LeftPanel.tsx`
- Modify: `packages/designer/src/styles/designer-shell.css`
- Modify: `packages/designer/src/components/Canvas.tsx`

- [ ] **Step 1: Remove the duplicated report-tree strip**

Keep one left explorer surface and let the `Report` tab own page/band structure actions.

- [ ] **Step 2: Refresh the left-panel layout**

Tune tab labels, spacing, and internal layout so the palette, dictionary, and report tree read as one organized column.

- [ ] **Step 3: Fix zoom math**

Split raw page dimensions from scaled page dimensions. The page sheet should keep raw width and height while the page-stack wrapper and rulers use scaled width and height. Keep printable area offsets in raw pixels inside the scaled page.

- [ ] **Step 4: Move the zoom bar into the canvas**

Replace the fixed-position zoom bar with a canvas-local overlay and add `data-testid="designer-zoom-bar"`.

- [ ] **Step 5: Run the zoom regression tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-14-canvas-zoom-layout phase-11-page-margin-ruler-band-chrome phase-10-canvas-reference-designer-layout
```

Expected: PASS.

### Task 5: Make sample templates default to A4

**Files:**
- Modify: `packages/example/src/templates/common.ts`
- Modify: `packages/example/src/templates/grouped-employees.ts`
- Modify: `packages/example/src/templates/invoice.ts`
- Modify: `packages/example/src/templates/long-text-pagination.ts`
- Modify: `packages/example/src/templates/master-detail-orders.ts`
- Create or modify: `packages/example/src/__tests__/sample-designer-toggle.test.tsx` or a new sample paper test

- [ ] **Step 1: Remove short custom page heights**

Change the shared template helper to default to `297` height and stop overriding sample pages with short paper heights.

- [ ] **Step 2: Add an A4 regression check**

Assert that every shipped sample template uses page size `210 x 297`.

- [ ] **Step 3: Run example tests**

Run:

```bash
pnpm --filter @report-designer/example test
```

Expected: PASS.

### Task 6: Final verification and commit

**Files:**
- Modify: `docs/superpowers/specs/2026-05-06-phase-14-designer-surface-units-zoom-design.md`
- Modify: `docs/superpowers/plans/2026-05-06-phase-14-designer-units-left-panel-zoom.md`

- [ ] **Step 1: Run package verification**

Run:

```bash
pnpm --filter @report-designer/designer test
pnpm --filter @report-designer/designer build
pnpm --filter @report-designer/example test
pnpm --filter @report-designer/example build
```

Expected: PASS.

- [ ] **Step 2: Start or refresh the example dev server**

Run the example app on an available localhost port and verify the URL loads.

- [ ] **Step 3: Browser verification**

Check the example app in a browser:

- the grouped-employees sample opens with an A4 page
- opening the designer shows the new page properties
- zooming to `200%` keeps ruler offsets aligned with page margins
- the zoom bar no longer covers the property panel

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-05-06-phase-14-designer-surface-units-zoom-design.md docs/superpowers/plans/2026-05-06-phase-14-designer-units-left-panel-zoom.md packages/designer/src packages/example/src
git commit -m "feat(designer): 完善页面单位与缩放布局"
```
