# Table Designer Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit fixed/detail table binding so tables can either stay as designed or expand from JSON arrays.

**Architecture:** Extend the table model with a normalized binding object, then teach core table layout to generate render rows from either the current row array path or a top-level JSON data source. Designer changes expose the mode and binding fields while preserving existing fixed-table behavior.

**Tech Stack:** TypeScript, Vitest, React Testing Library, Zustand store, Ant Design 6 components, existing report render pipeline.

---

### Task 1: Table Binding Model And Core Normalization

**Files:**
- Modify: `packages/core/src/template-model/types.ts`
- Modify: `packages/core/src/template-model/normalize-template.ts`
- Test: `packages/core/__tests__/phase-40-table-binding.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/__tests__/phase-40-table-binding.test.ts` with a test proving an existing table normalizes to fixed mode:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeTemplate } from '../src/template-model/normalize-template';
import { makeTemplate, band } from './phase-2-helpers';

describe('phase 40 table binding', () => {
  it('normalizes existing tables to fixed binding mode', () => {
    const template = makeTemplate([
      band('data', 'data', {
        components: [{
          id: 'table-1',
          type: 'table',
          x: 0,
          y: 0,
          width: 60,
          height: 16,
          dataSource: 'orders',
          columns: [{ id: 'c1', header: 'Name', field: 'Name', width: 60, cellType: 'text' }],
          rowCount: 2,
          columnCount: 1,
          headerRowsCount: 1,
          footerRowsCount: 0,
          headerHeight: 8,
          rowHeight: 8,
          showBorder: true,
        }],
      }),
    ]);

    const normalized = normalizeTemplate(template);
    const table = normalized.pages[0].bands[0].components[0];

    expect(table).toMatchObject({ type: 'table', binding: { mode: 'fixed' } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-40-table-binding.test.ts
```

Expected: FAIL because `TableComponent.binding` does not exist.

- [ ] **Step 3: Add the model and normalization**

Add:

```ts
export interface TableBinding {
  mode: 'fixed' | 'detail';
  dataSourceId?: string;
  arrayPath?: string;
}
```

Add `binding?: TableBinding` to `TableComponent`. In `normalize-template.ts`, normalize every table to `binding: { mode: component.binding?.mode ?? 'fixed', ... }`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-40-table-binding.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/template-model/types.ts packages/core/src/template-model/normalize-template.ts packages/core/__tests__/phase-40-table-binding.test.ts
git commit -m "feat(core): 增加表格绑定模式"
```

### Task 2: Detail Table Row Generation

**Files:**
- Modify: `packages/core/src/layout-engine/layout-band.ts`
- Test: `packages/core/__tests__/phase-40-table-binding.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that render a fixed table inside a data row with an array and a detail-bound table that expands `Items`:

```ts
it('keeps fixed tables from expanding array fields', () => {
  const template = tableTemplate({ binding: { mode: 'fixed' }, text: '{Items.Name}' });
  const document = renderReport(template, { orders: [{ Items: [{ Name: 'A' }, { Name: 'B' }] }] });
  const table = document.pages[0].items[0].components[0];
  expect(table).toMatchObject({ type: 'table' });
  expect((table as any).rows).toHaveLength(2);
});

it('expands detail tables from a current-row array path', () => {
  const template = tableTemplate({ binding: { mode: 'detail', arrayPath: 'Items' }, text: '{Name}' });
  const document = renderReport(template, { orders: [{ Items: [{ Name: 'A' }, { Name: 'B' }] }] });
  const table = document.pages[0].items[0].components[0];
  expect((table as any).rows.map((row: any[]) => row[0].content)).toEqual(['Name', 'A', 'B']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-40-table-binding.test.ts
```

Expected: FAIL because detail binding does not expand body rows.

- [ ] **Step 3: Implement row generation**

In `layout-band.ts`, update table layout to:

- Read `table.binding?.mode`.
- For `fixed`, keep existing matrix generation.
- For `detail`, split designed rows into header/body/footer by `headerRowsCount` and `footerRowsCount`.
- Resolve array rows from `binding.arrayPath` on `options.context.row` or `binding.dataSourceId` in `options.rowsByBand`.
- For every array item, render each body template row with a table-row context.

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-40-table-binding.test.ts phase-34-table-rendering.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/layout-engine/layout-band.ts packages/core/__tests__/phase-40-table-binding.test.ts
git commit -m "feat(core): 支持明细表格自动扩行"
```

### Task 3: Designer Binding Controls

**Files:**
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Modify: `packages/designer/src/store/designer-store.ts`
- Test: `packages/designer/src/__tests__/phase-40-table-binding-properties.test.tsx`

- [ ] **Step 1: Write failing tests**

Create tests that select a table and verify binding mode controls:

```ts
it('shows fixed and detail binding controls for table components', async () => {
  loadTemplateWithTable();
  render(<DesignerPropertyPanel />);
  expect(screen.getByLabelText('绑定模式')).toBeInTheDocument();
  await userEvent.click(screen.getByLabelText('明细'));
  expect(selectedTable().binding).toMatchObject({ mode: 'detail' });
});
```

Add an English label test if the file already has i18n helpers.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-40-table-binding-properties.test.tsx
```

Expected: FAIL because the property control is absent.

- [ ] **Step 3: Implement controls**

Add a table binding group in the existing table property editor:

- `Segmented` for fixed/detail.
- `Select` for data source.
- `Input` for array path.

Use Ant Design 6 APIs only. Keep labels localized through the existing i18n dictionary.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-40-table-binding-properties.test.tsx phase-33-component-property-matrix.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/designer/src/components/PropertyEditor.tsx packages/designer/src/components/panels/DesignerPropertyPanel.tsx packages/designer/src/store/designer-store.ts packages/designer/src/__tests__/phase-40-table-binding-properties.test.tsx
git commit -m "feat(designer): 增加表格绑定设置"
```

### Task 4: Table Cell Font Properties

**Files:**
- Modify: `packages/core/src/template-model/types.ts`
- Modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Modify: `packages/designer/src/store/designer-store.ts`
- Test: `packages/designer/src/__tests__/phase-34-table-cell-selection.test.tsx`

- [ ] **Step 1: Write failing tests**

Extend the cell property test to edit font size, bold, italic, underline, strikethrough, and color on a selected table cell.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-34-table-cell-selection.test.tsx
```

Expected: FAIL because the cell font controls are absent.

- [ ] **Step 3: Implement cell font controls**

Add `font?: FontConfig` to `TableCell`, then add compact icon controls and font selectors in `TableCellProperties`. Ensure updates apply to every selected cell range through the existing `updateSelectedTableCell()`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-34-table-cell-selection.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/template-model/types.ts packages/designer/src/components/panels/DesignerPropertyPanel.tsx packages/designer/src/store/designer-store.ts packages/designer/src/__tests__/phase-34-table-cell-selection.test.tsx
git commit -m "feat(designer): 补齐表格单元格字体属性"
```

### Task 5: Verification

**Files:**
- No planned file changes.

- [ ] **Step 1: Run targeted tests**

```bash
pnpm --filter @report-designer/core test -- phase-40-table-binding.test.ts phase-34-table-rendering.test.ts
pnpm --filter @report-designer/designer test -- phase-40-table-binding-properties.test.tsx phase-34-table-cell-selection.test.tsx phase-34-table-context-menu.test.tsx phase-39-table-editing-history.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full tests**

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Run build**

```bash
pnpm build
```

Expected: PASS with only the existing chunk-size warning. Restore `packages/example/dist/index.html` if it changes only because of build hashes.

- [ ] **Step 4: Run naming scan**

```bash
$pattern = ('stim' + 'ulsoft|stim' + 'ultsoft|stim' + 'ult|sti' + 'ulsoft|\\b' + 'V' + '1\\b|\\b' + 'V' + '2\\b|v' + '1-|v' + '2-|leg' + 'acy'); rg -n -i $pattern packages docs --glob '!**/dist/**' --glob '!**/node_modules/**'
```

Expected: no matches.
