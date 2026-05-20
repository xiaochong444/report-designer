# Component Property Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make common component properties consistent by using expression-based content fields and report-level fonts only where text rendering supports them.

**Architecture:** Keep the existing `PropertyEditor` as the integration point. Generalize its expression-dialog state from text-only editing to any component field, then pass an opener into `ComponentContentProperties`. Use a small predicate to decide whether the shared font panel is relevant for the selected component.

**Tech Stack:** React, TypeScript, Ant Design 6, Vitest, Testing Library, report designer store.

---

### Task 1: Expression Entry For Non-Text Content

**Files:**
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Test: `packages/designer/src/__tests__/phase-27-component-property-model.test.tsx`

- [ ] **Step 1: Write the failing test**

Add tests that load barcode, checkbox, and rich text components, click each expression button, save a new expression, and assert the selected component stores the new field value.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @report-designer/designer test -- phase-27-component-property-model.test.tsx`

Expected: FAIL because non-text fields do not expose expression buttons and rich text still uses the old primary label.

- [ ] **Step 3: Implement generalized expression state**

In `PropertyEditor`, replace `exprModalOpen` with an `expressionTarget` state containing `{ field, value }`. Add `openFieldExpressionEditor(field, value)`, pass it into `ComponentContentProperties`, and update `ExpressionEditor` to read/write `component[field]`.

- [ ] **Step 4: Add field buttons**

Add compact edit buttons next to barcode `value`, checkbox `checked`, checkbox `label`, image `src`, rich text `html`, and subreport parameter JSON where expression editing is useful. Keep labels localized.

- [ ] **Step 5: Run the focused test**

Run: `pnpm --filter @report-designer/designer test -- phase-27-component-property-model.test.tsx`

Expected: PASS.

### Task 2: Font Panel Applicability And Registry Coverage

**Files:**
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Test: `packages/designer/src/__tests__/phase-27-component-property-model.test.tsx`

- [ ] **Step 1: Extend the failing test**

Assert that image and line selections do not render the font family control, while page number and date/time selections do. Open the font selector and assert a custom report font appears.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @report-designer/designer test -- phase-27-component-property-model.test.tsx`

Expected: FAIL because the font panel currently renders for every component.

- [ ] **Step 3: Implement `supportsFontProperties`**

Add a predicate that returns true for `text`, `pagenumber`, and `datetime`. Wrap the font collapse item with this predicate.

- [ ] **Step 4: Run the focused test**

Run: `pnpm --filter @report-designer/designer test -- phase-27-component-property-model.test.tsx`

Expected: PASS.

### Task 3: Regression Verification

**Files:**
- Modify only if failures reveal a real regression.

- [ ] **Step 1: Run designer tests**

Run: `pnpm --filter @report-designer/designer test`

Expected: all designer tests pass.

- [ ] **Step 2: Run build**

Run: `pnpm build`

Expected: build exits 0. Chunk size warnings are acceptable.

- [ ] **Step 3: Scan naming constraints**

Run the established forbidden-name scan over `docs` and `packages`, excluding `dist` and `node_modules`.

Expected: no matches.
