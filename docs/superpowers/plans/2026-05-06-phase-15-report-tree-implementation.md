# Phase 15 Report Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the report explorer so it reads closer to the reference designer, with automatic component names, per-type icons, and a cleaner structure tree.

**Architecture:** Add a small naming helper layer in the designer package that can normalize unnamed template components and generate the next available name per component type. Keep the tree hierarchy intact, but switch the explorer UI to a compact styled presentation with controlled expansion keys.

**Tech Stack:** React, TypeScript, Zustand, Ant Design 6 API, Vitest, Testing Library.

---

### Task 1: Lock the desired naming behavior with tests

**Files:**
- Create: `packages/designer/src/__tests__/phase-15-report-tree-naming.test.tsx`

- [x] **Step 1: Write the failing tests**

Assert that unnamed template components appear as `Text1` and `Image1`, that per-type icons render, and that inserting another unnamed text component yields `Text2`.

- [x] **Step 2: Run the focused test**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-15-report-tree-naming
```

Expected before implementation: FAIL.

### Task 2: Add reusable report-structure helpers

**Files:**
- Create: `packages/designer/src/report-structure.ts`
- Modify: `packages/designer/src/store/designer-store.ts`

- [x] **Step 1: Implement type-to-name mappings**

Add prefix helpers for report components and reference-style band display names.

- [x] **Step 2: Normalize unnamed components**

Normalize template components on load and generate names for inserted or pasted components that still use auto-name seeds.

- [x] **Step 3: Re-run the focused test**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-15-report-tree-naming
```

Expected: still FAIL or partially pass until the tree UI is updated.

### Task 3: Rebuild the report tree presentation

**Files:**
- Modify: `packages/designer/src/components/LeftPanel.tsx`
- Modify: `packages/designer/src/styles/designer-shell.css`

- [x] **Step 1: Replace raw labels with explorer labels**

Show report name, `Page1`, reference-style band names, and component names only.

- [x] **Step 2: Add per-type icons and compact tree styling**

Render different icons for text, image, barcode, table, checkbox, line, panel, and related component types.

- [x] **Step 3: Make expansion controlled**

Replace `defaultExpandAll` with controlled `expandedKeys` so the loaded template and later insertions stay visible.

- [x] **Step 4: Re-run designer tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-15-report-tree-naming phase-10-canvas-reference-designer-layout
```

Expected: PASS.

### Task 4: Full verification

**Files:**
- Modify if needed: `packages/designer/src/__tests__/phase-10-canvas-reference-designer-layout.test.tsx`

- [x] **Step 1: Run full designer verification**

Run:

```bash
pnpm --filter @report-designer/designer test
pnpm --filter @report-designer/designer build
```

- [x] **Step 2: Run example verification**

Run:

```bash
pnpm --filter @report-designer/example test
pnpm --filter @report-designer/example build
```

### Task 5: Finalize

- [ ] Review visual behavior in the running example app
- [ ] Commit with a Chinese conventional commit message
