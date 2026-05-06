# Phase 8 Designer Table Cell Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stimulsoft-style table cell context actions and shortcut regression coverage without changing the already-locked band rendering and pagination contracts.

**Architecture:** Keep table editing pure in `packages/designer/src/table/table-structure.ts`, expose selected-table operations through the zustand designer store, and let `Canvas` pass the row/column hit from the right-click target. The canvas preview renders table cells with row/column metadata and honors `rowSpan`/`colSpan` so designer operations are visible immediately.

**Tech Stack:** React 19, TypeScript, zustand, Vitest, Testing Library, existing Ant Design 6-compatible UI code.

---

### Task 1: Table Cell Structure Helpers

**Files:**
- Modify: `packages/designer/src/table/table-structure.ts`
- Test: `packages/designer/src/__tests__/phase-8-table-structure.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/designer/src/__tests__/phase-8-table-structure.test.ts` with cases for:

```ts
import { describe, expect, it } from 'vitest';
import type { TableComponent } from '@report-designer/core';
import {
  clearTableCell,
  equalizeTableColumns,
  equalizeTableRows,
  mergeTableCellRight,
  splitTableCell,
} from '../table/table-structure';

const baseTable = (): TableComponent => ({
  id: 'table-1',
  type: 'table',
  x: 0,
  y: 0,
  width: 90,
  height: 30,
  dataSource: 'employees',
  columns: [
    { id: 'c1', header: 'Name', field: 'name', width: 10, cellType: 'text' },
    { id: 'c2', header: 'Title', field: 'title', width: 20, cellType: 'text' },
    { id: 'c3', header: 'Team', field: 'team', width: 60, cellType: 'text' },
  ],
  rowCount: 3,
  columnCount: 3,
  headerRowsCount: 1,
  footerRowsCount: 0,
  canBreak: true,
  cells: [{ row: 1, column: 1, text: 'Subtotal' }],
  headerHeight: 8,
  rowHeight: 8,
  showBorder: true,
});

describe('Phase 8 table structure helpers', () => {
  it('merges the active cell with the right neighbor and keeps it inside the table grid', () => {
    const table = mergeTableCellRight(baseTable(), 1, 1);
    expect(table.cells).toContainEqual({ row: 1, column: 1, text: 'Subtotal', rowSpan: 1, colSpan: 2 });
    expect(mergeTableCellRight(baseTable(), 1, 2).cells).not.toContainEqual(expect.objectContaining({ row: 1, column: 2, colSpan: 2 }));
  });

  it('splits a merged cell back to a normal cell', () => {
    const table = splitTableCell(mergeTableCellRight(baseTable(), 1, 1), 1, 1);
    expect(table.cells).toContainEqual({ row: 1, column: 1, text: 'Subtotal', rowSpan: 1, colSpan: 1 });
  });

  it('clears cell text without deleting the cell span metadata', () => {
    const table = clearTableCell(mergeTableCellRight(baseTable(), 1, 1), 1, 1);
    expect(table.cells).toContainEqual({ row: 1, column: 1, rowSpan: 1, colSpan: 2 });
  });

  it('equalizes table column widths and row height from the component bounds', () => {
    expect(equalizeTableColumns(baseTable()).columns.map(column => column.width)).toEqual([30, 30, 30]);
    expect(equalizeTableRows(baseTable()).rowHeight).toBe(10);
  });
});
```

- [ ] **Step 2: Run the red test**

Run: `pnpm --filter @report-designer/designer test -- phase-8-table-structure`

Expected: FAIL because `clearTableCell`, `equalizeTableColumns`, `equalizeTableRows`, `mergeTableCellRight`, and `splitTableCell` are not exported.

- [ ] **Step 3: Implement pure helpers**

Add helper functions to `table-structure.ts`:

```ts
function upsertCell(table: TableComponent, cell: TableCell): TableCell[] {
  const cells = table.cells?.filter(next => !(next.row === cell.row && next.column === cell.column)) ?? [];
  return [...cells, cell].sort((a, b) => a.row - b.row || a.column - b.column);
}
```

Implement:
- `mergeTableCellRight(table, row, column)` clamps to the table width and sets `rowSpan: 1`, `colSpan: 2`.
- `splitTableCell(table, row, column)` sets `rowSpan: 1`, `colSpan: 1`.
- `clearTableCell(table, row, column)` removes `text` while preserving spans.
- `equalizeTableColumns(table)` sets every column width to `table.width / columnCount`, rounded to 0.1mm.
- `equalizeTableRows(table)` sets `rowHeight` to `table.height / rowCount`, rounded to 0.1mm.

- [ ] **Step 4: Run the green test**

Run: `pnpm --filter @report-designer/designer test -- phase-8-table-structure`

Expected: PASS.

### Task 2: Store Operations For Selected Table Cells

**Files:**
- Modify: `packages/designer/src/store/designer-store.ts`
- Test: `packages/designer/src/__tests__/phase-8-table-cell-store.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/designer/src/__tests__/phase-8-table-cell-store.test.ts` with cases that load a template containing one selected table and call:

```ts
useDesignerStore.getState().mergeSelectedTableCellRight(1, 1);
useDesignerStore.getState().splitSelectedTableCell(1, 1);
useDesignerStore.getState().clearSelectedTableCell(1, 1);
useDesignerStore.getState().equalizeSelectedTableColumns();
useDesignerStore.getState().equalizeSelectedTableRows();
```

Assert the selected table component mutates only when `type === 'table'`.

- [ ] **Step 2: Run the red test**

Run: `pnpm --filter @report-designer/designer test -- phase-8-table-cell-store`

Expected: FAIL because the store methods do not exist.

- [ ] **Step 3: Implement store methods**

Import the new table helpers and add methods to `DesignerState` plus the zustand implementation. Each method should use `mapSelectedComponents` and leave non-table components untouched.

- [ ] **Step 4: Run the green test**

Run: `pnpm --filter @report-designer/designer test -- phase-8-table-cell-store`

Expected: PASS.

### Task 3: Canvas Context Menu Cell Targeting

**Files:**
- Modify: `packages/designer/src/components/Canvas.tsx`
- Test: `packages/designer/src/__tests__/phase-8-table-cell-context.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `packages/designer/src/__tests__/phase-8-table-cell-context.test.tsx` with jsdom tests that:

```tsx
render(<Canvas />);
const cell = screen.getByTestId('designer-table-cell-1-1');
Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: vi.fn(() => cell) });
fireEvent.mouseDown(cell, { button: 2, clientX: 20, clientY: 20 });
fireEvent.click(screen.getByText('合并右侧单元格'));
expect(selectedTable().cells).toContainEqual(expect.objectContaining({ row: 1, column: 1, colSpan: 2 }));
```

Add parallel checks for `拆分单元格`, `清空单元格`, `均分列宽`, and `均分行高`. Also assert `插入列到右侧` and `插入行到下方` use the right-clicked cell as the insertion anchor by checking downstream cells shift from `(2, 2)` to `(2, 3)` and then to `(3, 3)`.

- [ ] **Step 2: Run the red test**

Run: `pnpm --filter @report-designer/designer test -- phase-8-table-cell-context`

Expected: FAIL because table cells do not expose test IDs and the menu items are missing.

- [ ] **Step 3: Implement context cell hit testing**

Update `ContextMenuPos` to:

```ts
interface ContextMenuPos {
  x: number;
  y: number;
  compId?: string;
  tableCell?: { row: number; column: number };
}
```

On right-click, find `closest('[data-table-row][data-table-column]')` from `document.elementFromPoint`, store the parsed row/column, and pass callbacks to the context menu. Add menu items:
- `合并右侧单元格`
- `拆分单元格`
- `清空单元格`
- `均分列宽`
- `均分行高`

Pass `tableCell.column` to `insertSelectedTableColumn`/`deleteSelectedTableColumn` and `tableCell.row` to `insertSelectedTableRow`/`deleteSelectedTableRow` so the original row/column context menu actions are anchored to the clicked table cell instead of the table tail.

- [ ] **Step 4: Render spans in `TablePreview`**

Build a covered-cell set from `normalized.cells` spans. Skip covered cells and give the owner cell:

```tsx
data-table-row={row}
data-table-column={column}
data-testid={`designer-table-cell-${row}-${column}`}
style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
```

- [ ] **Step 5: Run the green test**

Run: `pnpm --filter @report-designer/designer test -- phase-8-table-cell-context`

Expected: PASS.

### Task 4: Shortcut Regression Coverage

**Files:**
- Test: `packages/designer/src/__tests__/phase-8-shortcuts-layout.test.tsx`

- [ ] **Step 1: Write regression tests for existing shortcut behavior**

Create tests for `Ctrl+D`, `Ctrl+X`, arrow nudging, and `Shift+ArrowRight` resize. These shortcuts already exist; the test ensures later UI refactors do not regress Stimulsoft-style designer ergonomics.

- [ ] **Step 2: Run the shortcut tests**

Run: `pnpm --filter @report-designer/designer test -- phase-8-shortcuts-layout`

Expected: PASS if existing shortcuts behave correctly.

### Task 5: Verification And Commit

**Files:**
- Verify all modified packages.

- [ ] **Step 1: Run focused Phase 8 tests**

Run: `pnpm --filter @report-designer/designer test -- phase-8`

Expected: PASS.

- [ ] **Step 2: Run designer build and test**

Run:

```bash
pnpm --filter @report-designer/designer build
pnpm --filter @report-designer/designer test
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Run core and example smoke builds**

Run:

```bash
pnpm --filter @report-designer/core build
pnpm --filter @report-designer/core test
pnpm --filter @report-designer/example build
```

Expected: PASS. The example build may print the existing Vite chunk-size warning.

- [ ] **Step 4: Restore generated build artifacts if needed**

Run: `git status --short`

If `packages/example/dist/index.html` changed only from the build, restore that generated file before committing.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-05-06-phase-8-designer-table-cell-operations.md packages/designer/src
git commit -m "feat(designer): 增强表格单元格右键操作"
```

Expected: Commit succeeds.

---

### Self-Review

- Spec coverage: This plan addresses the user's request to first land a superpowers plan, then add another serious Stimulsoft comparison-driven designer operation pass. It leaves band rendering untouched because Phase 7 already locked DataBand/HeaderBand/FooterBand behavior with core contract tests.
- Placeholder scan: No `TBD`, vague later tasks, or unnamed test commands remain.
- Type consistency: Store methods, table helpers, and canvas callbacks consistently pass `(row: number, column: number)` for cell-specific operations.
