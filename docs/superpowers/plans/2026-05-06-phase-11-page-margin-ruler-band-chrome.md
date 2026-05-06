# Phase 11 Page Margin Ruler And Band Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the designer canvas with Stimulsoft's page model: visible paper margins, rulers measuring the printable area, band titles as designer chrome, and grid rendering only inside the printable area.

**Architecture:** Keep report data coordinates in printable-area millimeters. Render the page sheet as paper, render a separate printable content area at `page.margins`, place band chrome inside that content area, and keep band `height` as body height only. Rulers receive printable-area dimensions and offsets so their zero point aligns with the content area's top-left corner.

**Tech Stack:** React 19, Ant Design 6, Vitest/jsdom, Vite, Playwright smoke checks.

---

### Task 1: Canvas Margin Contract

**Files:**
- Modify: `packages/designer/src/components/Canvas.tsx`
- Test: `packages/designer/src/__tests__/phase-11-page-margin-ruler-band-chrome.test.tsx`

- [x] Add a jsdom test that renders a default A4 template and asserts:
  - `designer-page-sheet` exists and has no grid background.
  - `designer-page-content-area` is offset by the default 20mm margins.
  - `designer-page-content-area` width and height equal page size minus margins.
  - `designer-page-content-area` owns the grid background.
- [x] Run `pnpm --filter @report-designer/designer test -- phase-11-page-margin-ruler-band-chrome` and confirm it fails before implementation.
- [x] Move the grid background from the page sheet to the printable content area.
- [x] Render bands inside the printable content area, not across the full paper width.
- [x] Verify the focused test passes.

### Task 2: Ruler Printable-Area Coordinates

**Files:**
- Modify: `packages/designer/src/components/Canvas.tsx`
- Test: `packages/designer/src/__tests__/phase-11-page-margin-ruler-band-chrome.test.tsx`

- [x] Extend the test to assert horizontal ruler left/width and vertical ruler top/height are based on page margins.
- [x] Change `Ruler` props from full page dimensions to printable dimensions and margin offsets.
- [x] Restore Stimulsoft-like millimeter labels (`0`, `10`, `20`, ...), where label `0` starts at the printable area's top-left edge.
- [x] Update the Phase 10 ruler test to match printable-area labels.
- [x] Verify focused canvas tests pass.

### Task 3: Band Title Chrome Does Not Count Toward Band Height

**Files:**
- Modify: `packages/designer/src/components/Canvas.tsx`
- Test: `packages/designer/src/__tests__/phase-11-page-margin-ruler-band-chrome.test.tsx`

- [x] Add a test that asserts a `DataBand` with 20mm height renders:
  - frame height = title chrome height + 20mm body height.
  - body top = title chrome height.
  - body height = 20mm.
- [x] Update visual band stacking to add title chrome between visual bands while preserving content coordinates.
- [x] Update selection hit testing and guide positions to include page margins plus band title chrome.
- [x] Verify focused canvas tests pass.

### Task 4: Full Verification

**Files:**
- All files touched above.

- [x] Run `pnpm --filter @report-designer/designer test`.
- [x] Run `pnpm --filter @report-designer/designer build`.
- [x] Run Playwright against `http://127.0.0.1:5180/`: open the designer and confirm ruler, `PageHeaderBand1`, `DataBand1`, and page settings render with no console errors.
- [x] Run `git diff --check`.
- [x] Commit with `feat(designer): 对齐纸张边距和标尺坐标`.
