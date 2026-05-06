# Phase 10 Stimulsoft Surface And Print Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the example app open the designer for each sample template, and close the largest Stimulsoft parity gaps visible in the user's screenshot: preview/print consistency, rulers, clickable ribbon tabs, readable band headers, and page property editing.

**Architecture:** Keep report rendering single-source by making print HTML reuse the same render-box style semantics as the DOM preview. Keep designer chrome changes in the existing shell/canvas/property files instead of introducing a second designer surface. Adapt the example's V2 sample templates into the designer's current V1 store shape at the app boundary so the sample can be inspected without changing the viewer pipeline.

**Tech Stack:** React 19, Ant Design 6, Vitest/jsdom, Vite, Playwright smoke checks.

---

### Task 1: Example Designer Entry

**Files:**
- Modify: `packages/example/src/App.tsx`
- Modify: `packages/example/package.json`
- Test: `packages/example/src/__tests__/sample-designer-toggle.test.tsx`

- [x] Write a failing jsdom test that renders the example app, clicks `打开设计器`, and expects `designer-quick-access` and `designer-canvas-frame`.
- [x] Implement a preview/designer mode toggle in the example header.
- [x] Convert sample `ReportTemplateV2` templates into the current designer `ReportTemplate` shape at the app boundary.
- [x] Add `pnpm --filter @report-designer/example test`.
- [x] Verify with `pnpm --filter @report-designer/example test -- src/__tests__/sample-designer-toggle.test.tsx`.

### Task 2: Print And Preview Parity

**Files:**
- Modify: `packages/viewer/src/print/print-frame.ts`
- Test: `packages/viewer/src/__tests__/phase-4-print-frame.test.ts`

- [x] Add a regression assertion that print HTML includes the same text font, alignment, background, border, padding, and whitespace semantics used by `RenderComponent`.
- [x] Implement print style generation from `RenderComponentBox.style` instead of outputting only position and text.
- [x] Keep print dimensions in millimeters and browser page margins at zero.
- [x] Verify with `pnpm --filter @report-designer/viewer test -- phase-4-print-frame`.

### Task 3: Stimulsoft-Like Canvas Rulers And Band Headers

**Files:**
- Modify: `packages/designer/src/components/Canvas.tsx`
- Test: `packages/designer/src/__tests__/phase-10-canvas-stimulsoft-layout.test.tsx`

- [x] Add a jsdom test that renders `Designer`, opens a sample-like template, and asserts horizontal ruler labels include `0`, `100`, `200`, `300`, and a band label such as `PageHeaderBand1` appears in a horizontal strip.
- [x] Rework the canvas ruler to use screenshot-like 100-unit labels and major/minor ticks, instead of compact mm labels.
- [x] Move band labels from the unreadable left vertical strip into a 7mm horizontal band header strip spanning the band width.
- [x] Tint the band body/header subtly by band type while keeping component coordinates inside the band body.
- [x] Verify with `pnpm --filter @report-designer/designer test -- phase-10-canvas-stimulsoft-layout`.

### Task 4: Ribbon Tabs

**Files:**
- Modify: `packages/designer/src/components/ribbon/StimulsoftRibbon.tsx`
- Test: `packages/designer/src/__tests__/phase-10-ribbon-tabs.test.tsx`

- [x] Add a jsdom test that clicks Home, Insert, Page Layout, and Preview and expects a different active ribbon tab and visible group set.
- [x] Replace the static one-panel ribbon with tab-specific group rendering.
- [x] Treat Home, Insert, Page Layout, and Preview as clickable tabs; keep Preview switching the canvas to preview mode.
- [x] Verify with `pnpm --filter @report-designer/designer test -- phase-10-ribbon-tabs`.

### Task 5: Page Settings In Property Grid

**Files:**
- Modify: `packages/designer/src/components/panels/StimulsoftPropertyGrid.tsx`
- Modify: `packages/designer/src/components/dialogs/PageSetupDialog.tsx`
- Test: `packages/designer/src/__tests__/phase-10-page-properties.test.tsx`

- [x] Add a jsdom test that clears component/band selection and expects the right property panel to show page width, height, orientation, and all margins.
- [x] Render page properties when no component and no band is selected.
- [x] Update page settings with separate margin controls and page size fields.
- [x] Expand `PageSetupDialog` to edit width, height, orientation, and separate top/right/bottom/left margins.
- [x] Verify with `pnpm --filter @report-designer/designer test -- phase-10-page-properties`.

### Task 6: Full Verification

**Files:**
- All files touched above.

- [x] Run `pnpm --filter @report-designer/viewer test`.
- [x] Run `pnpm --filter @report-designer/designer test`.
- [x] Run `pnpm --filter @report-designer/example test`.
- [x] Run `pnpm --filter @report-designer/viewer build`.
- [x] Run `pnpm --filter @report-designer/designer build`.
- [x] Run `pnpm --filter @report-designer/example build`.
- [x] Restore `packages/example/dist/index.html` after Vite build if only the build asset hash changed.
- [x] Run Playwright against `http://127.0.0.1:5180/`: click `打开设计器`, verify the designer shell appears, then click `返回预览`.
- [x] Run `git diff --check`.
- [ ] Commit with `feat(designer): 对齐示例设计器和打印预览`.

---

## Notes

- The print/preview mismatch root cause is currently visible in `packages/viewer/src/print/print-frame.ts`: printed text components only receive position/size while preview text receives font, alignment, background, border, overflow, padding, and whitespace behavior through `RenderComponent`.
- The band title readability root cause is in `packages/designer/src/components/Canvas.tsx`: labels are rendered as a 14px vertical strip with vertical writing mode, unlike Stimulsoft's horizontal band header strip.
- The page property gap root cause is in `StimulsoftPropertyGrid`: no selection falls back to `PropertyEditor`, which reports no component selected instead of showing page properties.
