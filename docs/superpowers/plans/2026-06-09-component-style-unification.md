# Component Style Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify shared component styles, nullable style property editors, and render-time style resolution across designer, preview, print, and PDF output.

**Architecture:** Core owns style capability and resolution functions. Designer property panels reuse shared nullable field editors and call the same style application helpers. Table row/cell internals remain nullable and inherit from table, while table itself participates as a top-level styled component.

**Tech Stack:** TypeScript, React, Ant Design, Zustand, Vitest, Testing Library, Vite example app.

---

## File Structure

- Modify `packages/core/src/text-style/resolve-text-style.ts`: evolve text-only resolver into component-style capability and resolution helpers while keeping existing exports where tests still import them.
- Modify `packages/core/src/text-style/index.ts`: export the new style helper names.
- Modify `packages/core/src/layout-engine/layout-band.ts`: use the common resolver for top-level render styles and table cell inheritance; remove unused local table style helper.
- Modify `packages/core/src/render-engine/index.ts`: route rendered style conversion through the same resolved component style.
- Modify `packages/designer/src/text-style-application.ts`: generalize style apply/unbind helpers for any top-level component with supported fields.
- Modify `packages/designer/src/store/designer-store.ts`: update style usage/apply/delete logic to top-level components.
- Modify `packages/designer/src/components/properties/BoxStyleEditors.tsx`: make border and padding editors preserve nullable values and support clear-to-undefined behavior.
- Create `packages/designer/src/components/properties/CommonStyleFields.tsx`: shared nullable background, typography, alignment, and style select controls.
- Modify `packages/designer/src/components/PropertyEditor.tsx`: use common style capabilities and shared field controls.
- Modify `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`: reuse shared border/padding/background editors for table row/cell nullable styling.
- Modify `packages/designer/src/components/TextStyleLibraryDialog.tsx`: reuse shared nullable border/padding/background behavior and no-background semantics.
- Modify tests in `packages/core/__tests__`, `packages/designer/src/__tests__`, and `packages/viewer/src/__tests__` to cover component styles, nullable editors, table inheritance, and output parity.

---

### Task 1: Core Style Capability And Resolution

**Files:**
- Modify: `packages/core/src/text-style/resolve-text-style.ts`
- Modify: `packages/core/src/text-style/index.ts`
- Test: `packages/core/__tests__/phase-17-text-style-resolution.test.ts`

- [ ] **Step 1: Add failing core tests**

Add tests that prove a table and a non-text component resolve selected shared style values authoritatively:

```ts
it('resolves a referenced component style for top-level non-text components', () => {
  const resolved = resolveComponentStyle(
    { type: 'table', style: 'style-a', backgroundColor: '#ffffff', padding: { top: 9, right: 9, bottom: 9, left: 9 } } as TableComponent,
    [{ id: 'style-a', name: 'Shared', backgroundColor: '#ffeecc', padding: { top: 1, right: 2, bottom: 3, left: 4 } } as ReportStyle],
  );

  expect(resolved.backgroundColor).toBe('#ffeecc');
  expect(resolved.padding).toEqual({ top: 1, right: 2, bottom: 3, left: 4 });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `pnpm --filter @report-designer/core test -- phase-17-text-style-resolution.test.ts`

Expected: FAIL because `resolveComponentStyle` is not exported or does not support non-text components.

- [ ] **Step 3: Implement capability-based resolution**

Add a `STYLE_FIELD_CAPABILITIES` map and `resolveComponentStyle(component, styles)` that returns selected style fields when `component.style` is set, otherwise local component values. Keep `resolveTextStyle` as a wrapper for text tests and existing callers.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run: `pnpm --filter @report-designer/core test -- phase-17-text-style-resolution.test.ts`

Expected: PASS.

### Task 2: Core Render Path Uses One Resolver

**Files:**
- Modify: `packages/core/src/layout-engine/layout-band.ts`
- Modify: `packages/core/src/render-engine/index.ts`
- Test: `packages/core/__tests__/phase-17-text-style-resolution.test.ts`
- Test: `packages/core/__tests__/phase-34-table-rendering.test.ts`

- [ ] **Step 1: Add failing render tests**

Assert that table render output uses selected shared style values and that cell values inherit table values unless overridden.

- [ ] **Step 2: Run focused core tests**

Run: `pnpm --filter @report-designer/core test -- phase-17-text-style-resolution.test.ts phase-34-table-rendering.test.ts`

Expected: FAIL for table style selection before implementation.

- [ ] **Step 3: Replace duplicated style assembly**

Use `resolveComponentStyle` in base render style, table render style, and text component resolution. Replace duplicated table cell style inheritance with a small helper that resolves `table -> row -> cell` from the already resolved table component. Remove the unused `tableCellStyle(cell?)`.

- [ ] **Step 4: Run focused core tests**

Run: `pnpm --filter @report-designer/core test -- phase-17-text-style-resolution.test.ts phase-34-table-rendering.test.ts`

Expected: PASS.

### Task 3: Shared Nullable Property Editors

**Files:**
- Modify: `packages/designer/src/components/properties/BoxStyleEditors.tsx`
- Create: `packages/designer/src/components/properties/CommonStyleFields.tsx`
- Test: `packages/designer/src/__tests__/phase-34-table-cell-selection.test.tsx`
- Test: `packages/designer/src/__tests__/phase-17-text-style-library.test.tsx`

- [ ] **Step 1: Add failing editor tests**

Assert unset padding inputs render blank in the style library and table row/cell panels, and clearing background writes `undefined` instead of `'#ffffff'` or `'transparent'`.

- [ ] **Step 2: Run focused designer tests**

Run: `pnpm --filter @report-designer/designer test -- phase-34-table-cell-selection.test.tsx phase-17-text-style-library.test.tsx`

Expected: FAIL for style-library padding and background clearing behavior.

- [ ] **Step 3: Update shared editors**

Make `PaddingEditor` and `BorderEditor` show blank values for unset fields, build partial objects only for edited fields, and call `onChange(undefined)` when all fields are cleared. Add shared color and style select field wrappers with stable widths.

- [ ] **Step 4: Run focused designer tests**

Run: `pnpm --filter @report-designer/designer test -- phase-34-table-cell-selection.test.tsx phase-17-text-style-library.test.tsx`

Expected: PASS.

### Task 4: Designer Component Style Application

**Files:**
- Modify: `packages/designer/src/text-style-application.ts`
- Modify: `packages/designer/src/store/designer-store.ts`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Test: `packages/designer/src/__tests__/phase-17-text-style-library.test.tsx`
- Test: `packages/designer/src/__tests__/phase-33-component-property-matrix.test.tsx`

- [ ] **Step 1: Add failing designer tests**

Assert table can select a shared style, style-owned fields are disabled, unbind copies resolved values, and long style or conditional-format names do not widen select rows.

- [ ] **Step 2: Run focused designer tests**

Run: `pnpm --filter @report-designer/designer test -- phase-17-text-style-library.test.tsx phase-33-component-property-matrix.test.tsx`

Expected: FAIL for non-text style selection.

- [ ] **Step 3: Generalize style application**

Rename or wrap text-style application helpers as component-style helpers. PropertyEditor should use capabilities instead of `isTextComponent` checks. The style select button should show an icon tooltip "解除绑定" and unbind by copying resolved values.

- [ ] **Step 4: Run focused designer tests**

Run: `pnpm --filter @report-designer/designer test -- phase-17-text-style-library.test.tsx phase-33-component-property-matrix.test.tsx`

Expected: PASS.

### Task 5: Output Parity And Browser Verification

**Files:**
- Modify tests as needed in `packages/viewer/src/__tests__`
- Verify example app at `http://localhost:4173/`

- [ ] **Step 1: Add or update parity tests**

Ensure DOM preview, print HTML, and PDF consume resolved style payloads and do not duplicate selected-style resolution.

- [ ] **Step 2: Run full focused suites**

Run:

```powershell
pnpm --filter @report-designer/core test
pnpm --filter @report-designer/designer test -- phase-17-text-style-library.test.tsx phase-34-table-cell-selection.test.tsx phase-33-component-property-matrix.test.tsx phase-20-conditional-format-library.test.tsx
pnpm --filter @report-designer/viewer test -- phase-17-text-style-parity.test.tsx phase-34-table-rendering.test.tsx phase-4-print-frame.test.ts phase-4-pdf-export.test.ts
pnpm build
```

Expected: PASS.

- [ ] **Step 3: Run preview and inspect**

Start or reuse the Vite preview server, open `http://localhost:4173/` in the in-app browser, and verify the designer has visible content, stable property panel widths, style unbind behavior, nullable background, nullable padding, and table cell inheritance.

- [ ] **Step 4: Final cleanup**

Search for unused text-style-only helpers and duplicate padding/border editors. Remove dead code introduced by earlier behavior and rerun the focused tests.
