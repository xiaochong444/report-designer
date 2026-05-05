# Phase 5 Designer Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stimulsoft-style report authoring workflows on top of the new engine: JSON data source wizard, band wizard, group wizard, expression editor, property grid, and preview integration.

**Architecture:** Designer workflows edit Template V2 through focused panels/dialogs. The canvas should show band semantics clearly and use RenderDocument preview for accurate page breaks.

**Tech Stack:** React 19, Ant Design 6, Zustand, TypeScript, existing designer package, core Template V2 APIs.

---

## File Structure

- Create: `packages/designer/src/components/dialogs/JsonDataSourceDialog.tsx`
- Create: `packages/designer/src/components/dialogs/BandWizardDialog.tsx`
- Create: `packages/designer/src/components/dialogs/GroupWizardDialog.tsx`
- Create: `packages/designer/src/components/dialogs/PageSetupDialog.tsx`
- Create: `packages/designer/src/components/expression/ExpressionEditorV2.tsx`
- Create: `packages/designer/src/components/properties/PropertyGridV2.tsx`
- Create: `packages/designer/src/components/tree/ReportTreeV2.tsx`
- Modify: `packages/designer/src/store/designer-store.ts`
- Modify: `packages/designer/src/components/ribbon/StimulsoftRibbon.tsx`
- Modify: `packages/designer/src/components/canvas/DesignerCanvasFrame.tsx`
- Test: `packages/designer/src/__tests__/phase-5-json-data-source-dialog.test.tsx`
- Test: `packages/designer/src/__tests__/phase-5-band-wizard.test.tsx`
- Test: `packages/designer/src/__tests__/phase-5-group-wizard.test.tsx`
- Test: `packages/designer/src/__tests__/phase-5-expression-editor-v2.test.tsx`

## Tasks

### Task 1: JSON Data Source Dialog

- [ ] **Step 1: Write dialog tests**

Paste JSON:

```json
{
  "employees": [
    { "name": "Alice", "department": "Engineering", "salary": 100 }
  ]
}
```

Expected:

- Dialog previews `employees`.
- Confirm adds a JSON data source and inferred fields.

- [ ] **Step 2: Implement `JsonDataSourceDialog.tsx`**

Tabs:

- Paste JSON
- Upload JSON
- Sample preview

Use Phase 1 `inferJsonDictionary()`.

### Task 2: Band Wizard

- [ ] **Step 1: Write wizard tests**

Selecting `Header + Data + Footer` for `employees` should create a header band, data band, and footer band associated with the data source.

- [ ] **Step 2: Implement `BandWizardDialog.tsx`**

Common templates:

- Simple list: Header + Data
- Grouped list: Header + GroupHeader + Data + GroupFooter + Footer
- Master-detail: Master Data + Child Detail Data
- Empty data band with a default text component reading `No data`

### Task 3: Group Wizard

- [ ] **Step 1: Write group wizard tests**

Selecting `employees.department` should create:

- GroupHeader with condition `{employees.department}`
- GroupFooter with text components for `Count("DataBandName")` and `Sum("DataBandName", "{employees.salary}")`
- Sort by department asc by default

- [ ] **Step 2: Implement `GroupWizardDialog.tsx`**

Controls:

- DataBand select
- Group field/expression
- Sort direction
- Repeat group header on new page
- Keep group together
- Add group footer totals

### Task 4: Expression Editor V2

- [ ] **Step 1: Write expression editor tests**

Assert field tree insertion, aggregate insertion, and validation result rendering.

- [ ] **Step 2: Implement `ExpressionEditorV2.tsx`**

Panels:

- Fields
- Functions
- Totals
- Variables
- Preview

Supported quick inserts:

- `{DataSource.Field}`
- `{PageNumber}`
- `{TotalPages}`
- `SUM("DataBand1", "{Orders.Total}")`
- `Totals.Sum("{Orders.Total}")`

### Task 5: Property Grid V2

- [ ] **Step 1: Write property grid tests**

Selecting a DataBand shows data source, sort, filter, columns, keep, break, and print options.

Selecting a Text component shows text, expression, format, font, alignment, borders, grow/shrink, print options, and conditions.

- [ ] **Step 2: Implement `PropertyGridV2.tsx`**

Use compact grouped rows, not large forms. Preserve keyboard-friendly inputs.

### Task 6: Preview Mode Integration

- [ ] **Step 1: Write preview integration test**

Clicking Preview tab renders `@report-designer/viewer` with current template and sample data.

- [ ] **Step 2: Modify shell/ribbon state**

Add designer mode:

```ts
type DesignerMode = 'design' | 'preview';
```

Preview tab switches to viewer but keeps ribbon/status shell.

### Task 7: Verify

- [ ] **Step 1: Run designer phase tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-5
pnpm --filter @report-designer/designer build
```

Expected: PASS.

- [ ] **Step 2: Browser workflow check**

In the example app:

1. Add JSON data source.
2. Create grouped list through wizard.
3. Drag fields into DataBand.
4. Add group total.
5. Preview pages.

Expected: Preview matches the banded report structure.

- [ ] **Step 3: Commit**

```bash
git add packages/designer/src
git commit -m "feat(designer): 增加stimulsoft风格报表设计流程"
```
