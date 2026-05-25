# Designer Editing Productivity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Productize common designer editing operations except snapping: selection, clipboard, keyboard nudging, align/distribute/size/layer commands, Ribbon entrypoints, localization, and regression tests.

**Architecture:** Reuse the existing canvas selection model and designer store actions. Fix store actions so template-changing operations are dispatched through `CommandDispatcher`, then expose the operations through Home Ribbon icon buttons and focused tests.

**Tech Stack:** React 19, TypeScript, Zustand, Ant Design 6, Vitest, Testing Library.

---

## File Map

- `packages/designer/src/store/designer-store.ts`: editing actions, command-backed template changes, distribute algorithm, layer ordering.
- `packages/designer/src/components/ribbon/DesignerRibbon.tsx`: Home Ribbon buttons for clipboard, arrangement, align, distribute, and size.
- `packages/designer/src/components/Canvas.tsx`: shortcut behavior and selection-box regression coverage only if needed.
- `packages/designer/src/i18n/messages.ts`: Chinese and English labels/tooltips.
- `packages/designer/src/__tests__/phase-38-editing-productivity-store.test.ts`: store behavior and Undo/Redo.
- `packages/designer/src/__tests__/phase-38-editing-productivity-ribbon.test.tsx`: Ribbon entrypoints and localization.
- `packages/designer/src/__tests__/phase-38-editing-productivity-canvas.test.tsx`: keyboard and selection regression tests.
- `docs/superpowers/specs/2026-05-25-designer-editing-productivity-design.md`: approved design.
- `docs/superpowers/plans/2026-05-25-designer-editing-productivity.md`: this implementation plan.

## Task 1: Store Editing Commands And Undo/Redo

**Files:**
- Modify: `packages/designer/src/store/designer-store.ts`
- Test: `packages/designer/src/__tests__/phase-38-editing-productivity-store.test.ts`

- [x] **Step 1: Write failing store tests**

Create tests that load a template with three text components in one Data Band and assert:

- `deleteSelected()` removes all selected components and `undo()` restores them.
- `pasteClipboard()` creates new ids, offsets by 5mm, selects pasted components, and `undo()` removes pasted components.
- `moveSelectedBy()` and `resizeSelectedBy()` update selected components and support undo.
- `alignComponents('distribute-h')` creates equal gaps between objects with different widths.
- `bringToFront()` and `sendToBack()` assign ordered `zOrder` values and support undo.

- [x] **Step 2: Run failing store test**

Run: `pnpm --filter @report-designer/designer test -- phase-38-editing-productivity-store.test.ts`

Expected: FAIL because delete/paste/move/resize currently bypass command history and horizontal distribution uses point spacing instead of equal gaps.

- [x] **Step 3: Implement command-backed actions**

Update `deleteSelected`, `pasteClipboard`, `moveSelectedBy`, and `resizeSelectedBy` to use existing command types instead of direct `set({ template })` updates. Keep `copySelected` as state-only. Make `pasteClipboard` fall back to the first Band when no Data Band exists.

- [x] **Step 4: Fix distribution and layer ordering**

Update `alignComponents('distribute-h')` and `alignComponents('distribute-v')` to equalize gaps between object edges while preserving first and last objects. Update layer methods so multi-selection gets stable ordered `zOrder` values rather than assigning the same value to each selected item.

- [x] **Step 5: Run store test**

Run: `pnpm --filter @report-designer/designer test -- phase-38-editing-productivity-store.test.ts`

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add packages/designer/src/store/designer-store.ts packages/designer/src/__tests__/phase-38-editing-productivity-store.test.ts
git commit -m "feat(designer): 完善编辑操作撤销重做"
```

## Task 2: Ribbon Editing Entrypoints

**Files:**
- Modify: `packages/designer/src/components/ribbon/DesignerRibbon.tsx`
- Modify: `packages/designer/src/i18n/messages.ts`
- Test: `packages/designer/src/__tests__/phase-38-editing-productivity-ribbon.test.tsx`

- [x] **Step 1: Write failing Ribbon tests**

Create tests that render `DesignerRibbon` with selected components and assert visible icon buttons or accessible labels exist for:

- copy, cut, paste, duplicate, delete
- bring to front, send to back
- align left, align center, align right, align top, align middle, align bottom
- distribute horizontal, distribute vertical
- same width, same height, same size

Also assert English locale renders English labels/tooltips.

- [x] **Step 2: Run failing Ribbon test**

Run: `pnpm --filter @report-designer/designer test -- phase-38-editing-productivity-ribbon.test.tsx`

Expected: FAIL because several buttons and message keys are missing.

- [x] **Step 3: Add localized message keys**

Add `ribbon.cut`, `ribbon.duplicate`, `ribbon.arrange`, `ribbon.bringToFront`, `ribbon.sendToBack`, `ribbon.alignLeft`, `ribbon.alignCenter`, `ribbon.alignRight`, `ribbon.alignTop`, `ribbon.alignMiddle`, `ribbon.alignBottom`, `ribbon.distribute`, `ribbon.distributeHorizontal`, `ribbon.distributeVertical`, `ribbon.sameWidth`, `ribbon.sameHeight`, and `ribbon.sameSize` to Chinese and English messages.

- [x] **Step 4: Implement Ribbon groups**

Use Ant Design 6 `Button` and `Tooltip` with Ant Design icons. Add Home Ribbon groups for arrangement, align, distribute, and size. Wire buttons to `cutSelected`, `duplicateSelected`, `bringToFront`, `sendToBack`, `alignComponents`, and `sizeComponents`.

- [x] **Step 5: Run Ribbon test**

Run: `pnpm --filter @report-designer/designer test -- phase-38-editing-productivity-ribbon.test.tsx`

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add packages/designer/src/components/ribbon/DesignerRibbon.tsx packages/designer/src/i18n/messages.ts packages/designer/src/__tests__/phase-38-editing-productivity-ribbon.test.tsx
git commit -m "feat(designer): 增加编辑工具栏入口"
```

## Task 3: Canvas Shortcut And Selection Regression

**Files:**
- Modify: `packages/designer/src/components/Canvas.tsx`
- Test: `packages/designer/src/__tests__/phase-38-editing-productivity-canvas.test.tsx`
- Test: `packages/designer/src/__tests__/phase-7-shortcuts-table-context.test.tsx`

- [x] **Step 1: Write failing canvas tests**

Create tests that render `Canvas` and assert:

- Ctrl+A selects all components on the current page.
- Arrow keys move all selected components and Undo restores their previous coordinates.
- Shift + Arrow keys resizes selected components and Undo restores their previous dimensions.
- Ctrl+D duplicates selected components and Undo removes the duplicates.

- [x] **Step 2: Run failing canvas test**

Run: `pnpm --filter @report-designer/designer test -- phase-38-editing-productivity-canvas.test.tsx phase-7-shortcuts-table-context.test.tsx`

Expected: FAIL only for missing command-history support or shortcut regressions.

- [x] **Step 3: Adjust Canvas only if needed**

Focused tests passed after store fixes; no Canvas production changes were needed. Snapping and new drag behaviors were not added.

- [x] **Step 4: Run focused canvas tests**

Run: `pnpm --filter @report-designer/designer test -- phase-38-editing-productivity-canvas.test.tsx phase-7-shortcuts-table-context.test.tsx`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add packages/designer/src/components/Canvas.tsx packages/designer/src/__tests__/phase-38-editing-productivity-canvas.test.tsx packages/designer/src/__tests__/phase-7-shortcuts-table-context.test.tsx
git commit -m "test(designer): 加固画布编辑快捷键"
```

## Task 4: Final Verification

**Files:**
- Modify only if verification reveals a real regression.

- [x] **Step 1: Run designer focused tests**

Run: `pnpm --filter @report-designer/designer test -- phase-38-editing-productivity-store.test.ts phase-38-editing-productivity-ribbon.test.tsx phase-38-editing-productivity-canvas.test.tsx phase-7-shortcuts-table-context.test.tsx`

Expected: PASS.

- [x] **Step 2: Run designer build**

Run: `pnpm --filter @report-designer/designer build`

Expected: PASS.

- [x] **Step 3: Run naming scan**

Run:

```powershell
$blockedProductName = -join ([char[]](83,116,105,109,117,108,108,101,100,80,114,111,100,117,99,116))
$blockedOldMarker = -join ([char[]](111,108,100,45,109,97,114,107,101,114))
rg -n -i ($blockedProductName + '|' + $blockedOldMarker) packages docs --glob '!**/dist/**' --glob '!**/node_modules/**'
```

Expected: no matches.

- [x] **Step 4: Run git status**

Run: `git status --short`

Expected: only intended source, tests, spec, and plan files changed.

- [ ] **Step 5: Commit verification docs if needed**

If plan status checkboxes or docs changed after implementation, commit them:

```bash
git add docs/superpowers/specs/2026-05-25-designer-editing-productivity-design.md docs/superpowers/plans/2026-05-25-designer-editing-productivity.md
git commit -m "docs(designer): 记录编辑生产力方案"
```

## Plan Self-Review

- Spec coverage: all scoped features map to Tasks 1-3; snapping is explicitly excluded.
- Placeholder scan: no TBD, TODO, or deferred unnamed implementation remains.
- Type consistency: action names match existing `DesignerState` methods and command names match registered command types.
- Scope: this is one focused designer productivity stage and does not alter render, print, PDF, or Band pagination behavior.
