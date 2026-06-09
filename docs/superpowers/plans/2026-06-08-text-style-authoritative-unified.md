# Text Style Authoritative + Unified Rendering Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make text styles authoritative, lock style-managed fields in the editor, add a true unbind action, and ensure preview/print/export all consume one resolved text-style path.

**Architecture:** Treat `template.styles` as the single source of text-style truth. When a style is applied, copy its resolved values into the component and keep the style id as the reference; when unbound, copy the current style payload onto the component and clear the reference. The core layout resolver becomes the only place that decides final text-style values, and viewer/print/PDF only render that resolved payload.

**Tech Stack:** TypeScript, React, Zustand, Ant Design 6, Vitest, pnpm

---

### Task 1: Core text-style resolution

**Files:**
- Modify: `D:/sources/report-designer/packages/core/src/template-model/types.ts`
- Modify: `D:/sources/report-designer/packages/core/src/template-model/template.ts`
- Modify: `D:/sources/report-designer/packages/core/src/text-style/resolve-text-style.ts`
- Modify: `D:/sources/report-designer/packages/core/src/layout-engine/layout-band.ts`
- Test: `D:/sources/report-designer/packages/core/__tests__/phase-17-text-style-resolution.test.ts`

- [ ] Remove style-binding behavior from the text-style resolver.
- [ ] Make selected styles authoritative over component-local style fields.
- [ ] Keep default text-style seeding for new templates.
- [ ] Verify core rendering uses the same resolved style path for preview and downstream render output.

### Task 2: Designer store and editor locking

**Files:**
- Modify: `D:/sources/report-designer/packages/designer/src/store/designer-store.ts`
- Modify: `D:/sources/report-designer/packages/designer/src/text-style-bindings.ts`
- Modify: `D:/sources/report-designer/packages/designer/src/components/PropertyEditor.tsx`
- Modify: `D:/sources/report-designer/packages/designer/src/components/ribbon/DesignerRibbon.tsx`
- Modify: `D:/sources/report-designer/packages/designer/src/components/TextStyleLibraryDialog.tsx`
- Test: `D:/sources/report-designer/packages/designer/src/__tests__/phase-17-text-style-library.test.tsx`

- [ ] Replace the manage button with a tooltip icon that unbinds the current style.
- [ ] Copy resolved style values to the component when unbinding, then clear `style`.
- [ ] Disable all style-owned fields whenever a text style is selected.
- [ ] Fix select widths so long style names and conditional formats never resize the row.
- [ ] Add a clearable background color control that supports true transparent/no-background state.

### Task 3: Viewer, print, and PDF parity

**Files:**
- Modify: `D:/sources/report-designer/packages/viewer/src/renderers/dom/renderComponent.tsx`
- Modify: `D:/sources/report-designer/packages/viewer/src/print/print-frame.ts`
- Modify: `D:/sources/report-designer/packages/viewer/src/export/pdf/pdf-draw-component.ts`
- Test: `D:/sources/report-designer/packages/viewer/src/__tests__/phase-17-text-style-parity.test.tsx`

- [ ] Keep viewer and print/pdf renderers on the resolved component payload only.
- [ ] Remove any duplicate style-merge path from the renderers.
- [ ] Verify preview, print, and PDF all match for font, alignment, background, border, padding, and grow/shrink.

### Task 4: Verification

**Files:**
- Test: `D:/sources/report-designer/packages/core/__tests__/phase-17-text-style-resolution.test.ts`
- Test: `D:/sources/report-designer/packages/designer/src/__tests__/phase-17-text-style-library.test.tsx`
- Test: `D:/sources/report-designer/packages/viewer/src/__tests__/phase-17-text-style-parity.test.tsx`

- [ ] Run targeted package tests until green.
- [ ] Run browser verification in the local app for select, unbind, transparent background, preview, print, and export.
- [ ] Keep the codebase free of dead style-binding logic.

---

## Self-Review

- The plan covers the user-facing lock/unbind flow, the no-background control, fixed-width selects, and the single render path.
- No separate compatibility layer is planned.
- The viewer/print/PDF requirement is addressed as a single shared payload contract.
