# Event Script Dynamic Size Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add script-driven component mutation APIs for all current components and a clothing order print example whose size columns/header rows are generated from runtime data.

**Architecture:** Move reusable table-structure operations into core, expose safe `ctx.component(name)` and type-specific component handles, and teach the Monaco event editor to suggest unique component names plus type-specific helper snippets. The clothing order example uses report `beforeData` to mutate header/detail tables before pagination.

**Tech Stack:** TypeScript, React, Monaco, Vitest, `@report-designer/core`, `@report-designer/designer`.

---

## File Structure

- Create `packages/core/src/table/table-structure.ts`: core table normalization and mutation helpers shared by event runtime and designer.
- Modify `packages/core/src/index.ts`: export core table helpers.
- Modify `packages/designer/src/table/table-structure.ts`: re-export core helpers or delegate to core helpers while preserving designer-specific layout helpers.
- Create `packages/core/src/event-engine/event-component-handles.ts`: base component handle plus type-specific handles for text, image, table, barcode, QR code, checkbox, rich text, chart, line, shape, page number, date/time, and panel components.
- Modify `packages/core/src/event-engine/types.ts`: add `component`, `text`, `image`, `table`, `barcode`, `qrcode`, `checkbox`, `richtext`, `chart`, `line`, `shape`, `pageNumber`, `dateTime`, and `panel` helper signatures.
- Modify `packages/core/src/event-engine/event-context.ts`: attach the component helper family.
- Modify `packages/core/src/event-engine/event-editor-contract.ts`: add component handle declarations, type-specific helper signatures, `TableComponent`, `TableCell`, and `EventTableHandle`.
- Modify `packages/designer/src/components/events/event-script-monaco.ts`: add component-aware completions for `ctx.getComponent`, `ctx.component`, and each type-specific helper.
- Modify `packages/designer/src/components/events/EventScriptEditor.tsx`: pass richer component completion metadata to Monaco.
- Modify `packages/designer/src/components/events/EventEditorDialog.tsx`, `DesignerPropertyPanel.tsx`, and `BandPropertyGrid.tsx`: build component completion items with name and type, and group them by component type.
- Modify `packages/designer/src/report-structure.ts`: expose component-name collection and uniqueness helpers.
- Modify `packages/designer/src/store/designer-store.ts`: enforce unique component names during manual rename updates.
- Modify `packages/designer/src/components/PropertyEditor.tsx`: show validation state for duplicate component names.
- Create `packages/example/src/templates/clothing-order-dynamic-size.ts`: bundled clothing order dynamic size example.
- Modify `packages/example/src/templates/index.ts`: register the bundled example.
- Test files:
  - `packages/core/__tests__/phase-45-event-component-handles.test.ts`
  - `packages/designer/src/__tests__/phase-45-component-name-uniqueness.test.tsx`
  - `packages/designer/src/__tests__/phase-45-event-component-completions.test.tsx`
  - `packages/example/src/__tests__/phase-45-clothing-order-dynamic-size-example.test.ts`

## Task 0: Enforce Report-Wide Component Name Uniqueness

**Files:**
- Modify: `packages/designer/src/report-structure.ts`
- Modify: `packages/designer/src/store/designer-store.ts`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Test: `packages/designer/src/__tests__/phase-45-component-name-uniqueness.test.tsx`

- [ ] **Step 1: Write the failing uniqueness test**

Create `packages/designer/src/__tests__/phase-45-component-name-uniqueness.test.tsx`:

```tsx
/* @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { createDefaultTemplate, type TextComponent } from '@report-designer/core';
import { DesignerPropertyPanel } from '../components/panels/DesignerPropertyPanel';
import { useDesignerStore } from '../store/designer-store';

function text(id: string, name: string): TextComponent {
  return {
    id,
    name,
    type: 'text',
    x: 0,
    y: 0,
    width: 30,
    height: 8,
    text: name,
    font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
    textAlign: 'left',
    verticalAlign: 'middle',
    border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
    canGrow: false,
    canShrink: false,
  };
}

describe('component name uniqueness', () => {
  it('rejects duplicate component names across the whole report', () => {
    const template = createDefaultTemplate('Name uniqueness');
    const dataBand = template.pages[0].bands.find(band => band.type === 'data')!;
    dataBand.components = [text('text-1', 'OrderTitle'), text('text-2', 'OrderAmount')];

    useDesignerStore.getState().loadTemplate(template);
    useDesignerStore.getState().selectComponents(['text-2']);
    render(<DesignerPropertyPanel />);

    fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'OrderTitle' } });

    const components = useDesignerStore.getState().template.pages[0].bands.flatMap(band => band.components);
    expect(components.find(component => component.id === 'text-2')?.name).toBe('OrderAmount');
    expect(screen.getByText('组件名称不能重复')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing uniqueness test**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-45-component-name-uniqueness.test.tsx
```

Expected: fail because duplicate manual rename is currently accepted or no validation message is shown.

- [ ] **Step 3: Add reusable name uniqueness helpers**

In `packages/designer/src/report-structure.ts`, export helpers:

```ts
export function collectComponentNames(template: ReportTemplate, excludeComponentId?: string): Set<string> {
  const names = new Set<string>();
  for (const page of template.pages) {
    for (const band of page.bands) {
      for (const component of band.components) {
        collectComponentNamesFromList([component], names, excludeComponentId);
      }
    }
  }
  return names;
}

export function isComponentNameAvailable(template: ReportTemplate, name: string, excludeComponentId?: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  return !collectComponentNames(template, excludeComponentId).has(trimmed);
}
```

The helper must recurse into panel children.

- [ ] **Step 4: Enforce uniqueness in store updates**

In `packages/designer/src/store/designer-store.ts`, when `updateComponent` receives `updates.name`, trim the value and reject the update if another component already has the same name. Keep the previous component name unchanged.

- [ ] **Step 5: Show validation in the property editor**

In `packages/designer/src/components/PropertyEditor.tsx`, when the selected component name duplicates another report component, render the validation message:

```text
组件名称不能重复
```

The input should keep showing the attempted value only if the store accepts it. If the store rejects it, the input re-renders from the unchanged selected component.

- [ ] **Step 6: Run uniqueness tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-45-component-name-uniqueness.test.tsx phase-15-report-tree-naming.test.tsx
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add packages/designer/src/report-structure.ts packages/designer/src/store/designer-store.ts packages/designer/src/components/PropertyEditor.tsx packages/designer/src/__tests__/phase-45-component-name-uniqueness.test.tsx
git commit -m "feat(designer): 保证组件名称全局唯一"
```

## Task 1: Move Reusable Table Structure Helpers To Core

**Files:**
- Create: `packages/core/src/table/table-structure.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/designer/src/table/table-structure.ts`
- Test: `packages/core/__tests__/phase-45-table-structure.test.ts`

- [ ] **Step 1: Write the failing core table structure test**

Create `packages/core/__tests__/phase-45-table-structure.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { TableComponent } from '../src/template-model/types';
import {
  insertTableColumn,
  insertTableRow,
  mergeTableCellRange,
  normalizeTable,
  setTableCellText,
  setTableCellWidth,
} from '../src/table/table-structure';

function table(): TableComponent {
  return {
    id: 'table-1',
    name: 'Table1',
    type: 'table',
    x: 0,
    y: 0,
    width: 90,
    height: 16,
    rowCount: 1,
    columnCount: 3,
    rows: [{
      id: 'row_1',
      height: 8,
      cells: [{ text: '款号' }, { text: 'S1' }, { text: '金额' }],
    }],
  };
}

describe('core table structure helpers', () => {
  it('normalizes and mutates table rows and columns', () => {
    const withColumn = insertTableColumn(table(), 1);
    const withRow = insertTableRow(withColumn, 0);
    const withText = setTableCellText(withRow, 1, 2, '{S2}');
    const withWidth = setTableCellWidth(withText, 0, 0, 18);
    const merged = mergeTableCellRange(withWidth, 0, 0, 1, 0);
    const normalized = normalizeTable(merged);

    expect(normalized.rows).toHaveLength(2);
    expect(normalized.rows?.[0].cells).toHaveLength(4);
    expect(normalized.rows?.[1].cells[2].text).toBe('{S2}');
    expect(normalized.rows?.[0].cells[0].width).toBe(18);
    expect(normalized.rows?.[0].cells[0]).toMatchObject({ rowSpan: 2, colSpan: 1 });
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-45-table-structure.test.ts
```

Expected: fail because `../table/table-structure` does not exist in core.

- [ ] **Step 3: Implement core table helpers**

Move the generic parts of `packages/designer/src/table/table-structure.ts` into `packages/core/src/table/table-structure.ts`, including:

```ts
export function normalizeTable(table: TableComponent): TableComponent;
export function insertTableColumn(table: TableComponent, afterColumn?: number): TableComponent;
export function insertTableRow(table: TableComponent, afterRow?: number): TableComponent;
export function mergeTableCellRange(table: TableComponent, startRow: number, startColumn: number, endRow: number, endColumn: number): TableComponent;
export function setTableCellText(table: TableComponent, row: number, column: number, text: string): TableComponent;
export function setTableCellWidth(table: TableComponent, row: number, column: number, width: number | undefined): TableComponent;
export function equalizeTableColumns(table: TableComponent): TableComponent;
export function resolveTableRowCellWidths(row: TableRow, rowWidth: number): number[];
```

Add `setTableCellText` using the existing internal `updateTableCell` pattern:

```ts
export function setTableCellText(table: TableComponent, row: number, column: number, text: string): TableComponent {
  return updateTableCell(table, row, column, cell => ({ ...cell, text }));
}
```

Export from `packages/core/src/index.ts`:

```ts
export * from './table/table-structure';
```

Update designer imports to use `@report-designer/core` for shared helpers and keep designer-only helpers in the existing file.

- [ ] **Step 4: Run table tests**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-45-table-structure.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/table/table-structure.ts packages/core/src/index.ts packages/core/__tests__/phase-45-table-structure.test.ts packages/designer/src/table/table-structure.ts
git commit -m "feat(core): 抽取表格结构操作"
```

## Task 2: Add Component Handles And ctx Helper Family

**Files:**
- Create: `packages/core/src/event-engine/event-component-handles.ts`
- Modify: `packages/core/src/event-engine/event-context.ts`
- Modify: `packages/core/src/event-engine/types.ts`
- Modify: `packages/core/src/event-engine/index.ts`
- Test: `packages/core/__tests__/phase-45-event-component-handles.test.ts`

- [ ] **Step 1: Write the failing component handle test**

Create `packages/core/__tests__/phase-45-event-component-handles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createEventLogCollector, createEventContext } from '../src/event-engine';
import type { ReportTemplate } from '../src/template-model/types';

function template(): ReportTemplate {
  return {
    id: 'report-1',
    name: 'Report',
    version: '1',
    dataSources: [],
    parameters: [],
    styles: [],
    pages: [{
      id: 'page-1',
      name: 'Page1',
      width: 210,
      height: 297,
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      bands: [{
        id: 'band-1',
        type: 'dataHeader',
        height: 20,
        components: [{
          id: 'table-internal-id',
          name: 'OrderSizeHeaderTable',
          type: 'table',
          x: 0,
          y: 0,
          width: 120,
          height: 8,
          rowCount: 1,
          columnCount: 3,
          rows: [{ id: 'row_1', cells: [{ text: '款号' }, { text: 'S1' }, { text: '金额' }] }],
        }],
      }],
    }],
  } as ReportTemplate;
}

describe('event component handles', () => {
  it('finds components by name and exposes type-specific handles', () => {
    const report = template();
    report.pages[0].bands[0].components.push({
      id: 'text-internal-id',
      name: 'OrderTitleText',
      type: 'text',
      x: 0,
      y: 10,
      width: 50,
      height: 8,
      text: 'old',
      font: { family: 'Arial', size: 10, bold: false, italic: false, underline: false, strikethrough: false, color: '#000000' },
      textAlign: 'left',
      border: { style: 'none', width: 0, color: '#000000', sides: { top: false, right: false, bottom: false, left: false } },
      canGrow: false,
      canShrink: false,
    } as any);
    const ctx = createEventContext({
      report,
      log: createEventLogCollector({ ownerType: 'report', ownerId: report.id, eventName: 'beforeData' }),
      target: { ownerType: 'report', ownerId: report.id, eventName: 'beforeData' },
    });

    ctx.text?.('OrderTitleText').setText('服装订单').setBounds({ width: 80 });
    const text = ctx.getComponent?.('OrderTitleText') as any;
    expect(text.text).toBe('服装订单');
    expect(text.width).toBe(80);

    const table = ctx.table?.('OrderSizeHeaderTable');
    expect(table?.findCellText('S1')).toEqual({ row: 0, column: 1 });

    table?.insertColumnsAfter(1, 2)
      .insertRowsAfter(0, 1)
      .setCellText(0, 1, '80')
      .setCellText(0, 2, '90')
      .setCellText(1, 2, '100')
      .mergeCells(0, 0, 2, 1)
      .setColumnWidth(0, 18)
      .distributeColumns(1, 3);

    const component = ctx.getComponent?.('OrderSizeHeaderTable') as any;
    expect(component.rows).toHaveLength(2);
    expect(component.rows[0].cells).toHaveLength(5);
    expect(component.rows[0].cells[0]).toMatchObject({ rowSpan: 2, colSpan: 1, width: 18 });
    expect(component.rows[1].cells[2].text).toBe('100');
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-45-event-component-handles.test.ts
```

Expected: fail because `ctx.text`, `ctx.table`, and component handles are missing.

- [ ] **Step 3: Implement base and type-specific handles**

Create `packages/core/src/event-engine/event-component-handles.ts` with:

```ts
import type {
  BarcodeComponent,
  CheckboxComponent,
  ImageComponent,
  QRCodeComponent,
  ReportComponent,
  RichtextComponent,
  TableCell,
  TableComponent,
  TextComponent,
} from '../template-model/types';
import { setComponentProperty } from './event-template';
import {
  equalizeTableColumns,
  insertTableColumn,
  insertTableRow,
  mergeTableCellRange,
  normalizeTable,
  setTableCellText,
  setTableCellWidth,
} from '../table/table-structure';

export interface EventComponentHandle<TComponent extends ReportComponent = ReportComponent> {
  readonly component: TComponent;
  readonly id: string;
  readonly name?: string;
  readonly type: string;
  setProperty(path: string, value: unknown): this;
  getProperty(path: string): unknown;
  setBounds(bounds: Partial<Pick<ReportComponent, 'x' | 'y' | 'width' | 'height'>>): this;
  show(): this;
  hide(): this;
}

export interface EventTextHandle extends EventComponentHandle<TextComponent> {
  setText(text: string): this;
  bindText(expression: string): this;
}

export interface EventImageHandle extends EventComponentHandle<ImageComponent> {
  setSource(src: string): this;
}

export interface EventBarcodeHandle extends EventComponentHandle<BarcodeComponent> {
  setValue(value: string): this;
  setFormat(format: string): this;
}

export interface EventQRCodeHandle extends EventComponentHandle<QRCodeComponent> {
  setValue(value: string): this;
}

export interface EventCheckboxHandle extends EventComponentHandle<CheckboxComponent> {
  setChecked(value: string | boolean): this;
  setLabel(label: string): this;
}

export interface EventRichTextHandle extends EventComponentHandle<RichtextComponent> {
  setHtml(html: string): this;
}

export interface EventTableHandle extends EventComponentHandle<TableComponent> {
  readonly rowCount: number;
  readonly columnCount: number;
  findCellText(text: string): { row: number; column: number } | undefined;
  ensureColumnCount(count: number): EventTableHandle;
  ensureRowCount(count: number): EventTableHandle;
  insertColumnsAfter(column: number, count: number): EventTableHandle;
  insertRowsAfter(row: number, count: number): EventTableHandle;
  setCellText(row: number, column: number, text: string): EventTableHandle;
  setCell(row: number, column: number, updates: Partial<TableCell>): EventTableHandle;
  mergeCells(row: number, column: number, rowSpan: number, colSpan: number): EventTableHandle;
  setColumnWidth(column: number, width: number | undefined): EventTableHandle;
  distributeColumns(startColumn: number, count: number): EventTableHandle;
}

export function createEventComponentHandle(component: ReportComponent): EventComponentHandle {
  const handle: EventComponentHandle = {
    get component() { return component; },
    get id() { return component.id; },
    get name() { return component.name; },
    get type() { return component.type; },
    setProperty(path, value) { setComponentProperty(component, path, value); return this; },
    getProperty(path) {
      return path.split('.').filter(Boolean).reduce<unknown>((target, segment) => {
        if (target && typeof target === 'object') return (target as Record<string, unknown>)[segment];
        return undefined;
      }, component);
    },
    setBounds(bounds) { Object.assign(component, bounds); return this; },
    show() { (component as ReportComponent & { visible?: unknown }).visible = true; return this; },
    hide() { (component as ReportComponent & { visible?: unknown }).visible = false; return this; },
  };
  return handle;
}

export function createEventTextHandle(component: TextComponent): EventTextHandle {
  return Object.assign(createEventComponentHandle(component), {
    setText(text: string) { component.text = text; return this; },
    bindText(expression: string) { component.text = expression; return this; },
  }) as EventTextHandle;
}

export function createEventImageHandle(component: ImageComponent): EventImageHandle {
  return Object.assign(createEventComponentHandle(component), {
    setSource(src: string) { component.src = src; return this; },
  }) as EventImageHandle;
}

export function createEventBarcodeHandle(component: BarcodeComponent): EventBarcodeHandle {
  return Object.assign(createEventComponentHandle(component), {
    setValue(value: string) { component.value = value; return this; },
    setFormat(format: string) { component.format = format as BarcodeComponent['format']; return this; },
  }) as EventBarcodeHandle;
}

export function createEventQRCodeHandle(component: QRCodeComponent): EventQRCodeHandle {
  return Object.assign(createEventComponentHandle(component), {
    setValue(value: string) { component.value = value; return this; },
  }) as EventQRCodeHandle;
}

export function createEventCheckboxHandle(component: CheckboxComponent): EventCheckboxHandle {
  return Object.assign(createEventComponentHandle(component), {
    setChecked(value: string | boolean) { component.checked = value; return this; },
    setLabel(label: string) { component.label = label; return this; },
  }) as EventCheckboxHandle;
}

export function createEventRichTextHandle(component: RichtextComponent): EventRichTextHandle {
  return Object.assign(createEventComponentHandle(component), {
    setHtml(html: string) { component.html = html; return this; },
  }) as EventRichTextHandle;
}

export function createEventTableHandle(component: TableComponent): EventTableHandle {
  let table = normalizeTable(component);
  Object.assign(component, table);

  const refresh = (next: TableComponent) => {
    table = normalizeTable(next);
    Object.assign(component, table);
    return handle;
  };

  const handle: EventTableHandle = {
    ...createEventComponentHandle(component),
    get rowCount() { return normalizeTable(component).rows?.length ?? 0; },
    get columnCount() { return normalizeTable(component).rows?.[0]?.cells.length ?? 0; },
    findCellText(text) {
      const current = normalizeTable(component);
      for (let row = 0; row < (current.rows?.length ?? 0); row += 1) {
        const cells = current.rows?.[row].cells ?? [];
        for (let column = 0; column < cells.length; column += 1) {
          if (cells[column].text === text) return { row, column };
        }
      }
      return undefined;
    },
    ensureColumnCount(count) {
      let next = normalizeTable(component);
      while ((next.rows?.[0]?.cells.length ?? 0) < count) {
        next = insertTableColumn(next, (next.rows?.[0]?.cells.length ?? 1) - 1);
      }
      return refresh(next);
    },
    ensureRowCount(count) {
      let next = normalizeTable(component);
      while ((next.rows?.length ?? 0) < count) {
        next = insertTableRow(next, (next.rows?.length ?? 1) - 1);
      }
      return refresh(next);
    },
    insertColumnsAfter(column, count) {
      let next = normalizeTable(component);
      for (let index = 0; index < count; index += 1) next = insertTableColumn(next, column + index);
      return refresh(next);
    },
    insertRowsAfter(row, count) {
      let next = normalizeTable(component);
      for (let index = 0; index < count; index += 1) next = insertTableRow(next, row + index);
      return refresh(next);
    },
    setCellText(row, column, text) {
      return refresh(setTableCellText(component, row, column, text));
    },
    setCell(row, column, updates) {
      const current = normalizeTable(component);
      const rows = current.rows?.map((nextRow, rowIndex) => rowIndex !== row
        ? nextRow
        : {
            ...nextRow,
            cells: nextRow.cells.map((cell, columnIndex) => columnIndex === column ? { ...cell, ...updates } : cell),
          }) ?? [];
      return refresh({ ...current, rows });
    },
    mergeCells(row, column, rowSpan, colSpan) {
      return refresh(mergeTableCellRange(component, row, column, row + rowSpan - 1, column + colSpan - 1));
    },
    setColumnWidth(column, width) {
      let next = normalizeTable(component);
      for (let row = 0; row < (next.rows?.length ?? 0); row += 1) next = setTableCellWidth(next, row, column, width);
      return refresh(next);
    },
    distributeColumns(startColumn, count) {
      const current = normalizeTable(component);
      const rows = current.rows?.map(row => ({
        ...row,
        cells: row.cells.map((cell, column) => (
          column >= startColumn && column < startColumn + count ? { ...cell, width: undefined } : cell
        )),
      })) ?? [];
      return refresh(equalizeTableColumns({ ...current, rows }));
    },
  };

  return handle;
}
```

- [ ] **Step 4: Attach the ctx helper family**

In `packages/core/src/event-engine/types.ts`, import handle types and make script-facing lookup parameters use component `name`:

```ts
component?: (name: string) => EventComponentHandle;
text?: (name: string) => EventTextHandle;
image?: (name: string) => EventImageHandle;
table?: (name: string) => EventTableHandle;
barcode?: (name: string) => EventBarcodeHandle;
qrcode?: (name: string) => EventQRCodeHandle;
checkbox?: (name: string) => EventCheckboxHandle;
richtext?: (name: string) => EventRichTextHandle;
chart?: (name: string) => EventComponentHandle<ChartComponent>;
line?: (name: string) => EventComponentHandle<LineComponent>;
shape?: (name: string) => EventComponentHandle<ShapeComponent>;
pageNumber?: (name: string) => EventComponentHandle<PageNumberComponent>;
dateTime?: (name: string) => EventComponentHandle<DateTimeComponent>;
panel?: (name: string) => EventComponentHandle<PanelComponent>;
```

In `packages/core/src/event-engine/event-context.ts`, make `ctx.getComponent(name)` resolve by component `name` only. Do not match generated internal component ids in script-facing lookup. Add a typed lookup helper:

```ts
const getComponentByName = (name: string): ReportComponent | undefined => (
  findComponentByNameInComponents(options.band?.components ?? [], name)
  ?? findComponentByNameInTemplate(requireReport(), name)
);

const getTypedComponent = <T extends ReportComponent>(name: string, type: string): T => {
  const found = getComponentByName(name);
  if (!found) throw new Error(`Component "${name}" was not found.`);
  if (found.type !== type) throw new Error(`Component "${name}" is a ${found.type} component, not a ${type} component.`);
  return found as T;
};
```

Attach `component`, `text`, `image`, `table`, `barcode`, `qrcode`, `checkbox`, `richtext`, `chart`, `line`, `shape`, `pageNumber`, `dateTime`, and `panel` to `ctx`. Keep internal rendering code free to use component ids where it already does; only the event script lookup surface changes to names. Export handle types and factories from `packages/core/src/event-engine/index.ts`.

- [ ] **Step 5: Run event handle tests**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-45-event-component-handles.test.ts phase-45-table-structure.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/event-engine/event-component-handles.ts packages/core/src/event-engine/event-context.ts packages/core/src/event-engine/types.ts packages/core/src/event-engine/index.ts packages/core/__tests__/phase-45-event-component-handles.test.ts
git commit -m "feat(events): 增加组件脚本操作句柄"
```

## Task 3: Improve Event Editor Types And Component Completions

**Files:**
- Modify: `packages/core/src/event-engine/event-editor-contract.ts`
- Modify: `packages/designer/src/components/events/event-script-monaco.ts`
- Modify: `packages/designer/src/components/events/EventEditorDialog.tsx`
- Modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Modify: `packages/designer/src/components/properties/BandPropertyGrid.tsx`
- Test: `packages/designer/src/__tests__/phase-45-event-component-completions.test.tsx`

- [ ] **Step 1: Write completion tests**

Create `packages/designer/src/__tests__/phase-45-event-component-completions.test.tsx`:

```ts
import { describe, expect, it } from 'vitest';
import { buildEventScriptCompletions } from '../components/events/event-script-monaco';

const monaco = {
  CompletionItemKind: { Function: 1, Field: 2, Variable: 3, Snippet: 4 },
  CompletionItemInsertTextRule: { InsertAsSnippet: 1 },
};

describe('event component completions', () => {
  it('suggests component names and type-specific snippets', () => {
    const completions = buildEventScriptCompletions({
      componentItems: [
        { key: 'comp_table_abc', title: 'OrderSizeHeaderTable', insertable: true, children: [] },
        { key: 'comp_text_abc', title: 'OrderTitleText', insertable: true, children: [] },
      ],
      tableItems: [
        { key: 'comp_table_abc', title: 'OrderSizeHeaderTable', insertable: true, children: [] },
      ],
      textItems: [
        { key: 'comp_text_abc', title: 'OrderTitleText', insertable: true, children: [] },
      ],
    } as any, monaco);

    expect(completions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'OrderSizeHeaderTable',
        insertText: 'ctx.getComponent?.("OrderSizeHeaderTable")',
      }),
      expect.objectContaining({
        label: 'ctx.table("OrderSizeHeaderTable")',
        insertText: 'ctx.table?.("OrderSizeHeaderTable")',
      }),
      expect.objectContaining({
        label: 'ctx.text("OrderTitleText")',
        insertText: 'ctx.text?.("OrderTitleText")',
      }),
    ]));
  });
});
```

- [ ] **Step 2: Run the failing completion test**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-45-event-component-completions.test.tsx
```

Expected: fail because type-specific component item groups and snippet insertions are missing.

- [ ] **Step 3: Update DTS for table APIs**

In `packages/core/src/event-engine/event-editor-contract.ts`, add handle declarations matching runtime component handles. Add to `EventContext`:

```ts
component?: (name: string) => EventComponentHandle;
text?: (name: string) => EventTextHandle;
table?: (name: string) => EventTableHandle;
```

- [ ] **Step 4: Add type-specific completion input**

In `packages/designer/src/components/events/event-script-monaco.ts`, extend `EventCompletionInput`:

```ts
textItems?: EventCompletionTreeItem[];
imageItems?: EventCompletionTreeItem[];
tableItems?: EventCompletionTreeItem[];
barcodeItems?: EventCompletionTreeItem[];
qrcodeItems?: EventCompletionTreeItem[];
checkboxItems?: EventCompletionTreeItem[];
richtextItems?: EventCompletionTreeItem[];
chartItems?: EventCompletionTreeItem[];
lineItems?: EventCompletionTreeItem[];
shapeItems?: EventCompletionTreeItem[];
pageNumberItems?: EventCompletionTreeItem[];
dateTimeItems?: EventCompletionTreeItem[];
panelItems?: EventCompletionTreeItem[];
```

Map component items to `ctx.component?.("name")` snippets, preserve `ctx.getComponent?.("name")` as a raw-object snippet, and map each type-specific group to `ctx.text?.("name")`, `ctx.table?.("name")`, and equivalent helper snippets.

- [ ] **Step 5: Build richer component items**

Update the local `buildComponentEventItems` functions in `DesignerPropertyPanel.tsx` and `BandPropertyGrid.tsx` so each component item includes id, name, and type. Components must also be grouped by type and passed to `EventScriptEditor` for type-specific completions.

- [ ] **Step 6: Run completion tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-45-event-component-completions.test.tsx
pnpm --filter @report-designer/designer build
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/event-engine/event-editor-contract.ts packages/designer/src/components/events/event-script-monaco.ts packages/designer/src/components/events/EventEditorDialog.tsx packages/designer/src/components/panels/DesignerPropertyPanel.tsx packages/designer/src/components/properties/BandPropertyGrid.tsx packages/designer/src/__tests__/phase-45-event-component-completions.test.tsx
git commit -m "feat(designer): 增强事件编辑器组件提示"
```

## Task 4: Add Clothing Order Dynamic Size Print Example

**Files:**
- Create: `packages/example/src/templates/clothing-order-dynamic-size.ts`
- Modify: `packages/example/src/templates/index.ts`
- Test: `packages/example/src/__tests__/phase-45-clothing-order-dynamic-size-example.test.ts`

- [ ] **Step 1: Write the failing example test**

Create `packages/example/src/__tests__/phase-45-clothing-order-dynamic-size-example.test.ts` with assertions:

```ts
import { describe, expect, it } from 'vitest';
import { renderReport } from '@report-designer/core';
import { clothingOrderDynamicSizeTemplate, clothingOrderDynamicSizeData, sampleReports } from '../templates';

describe('clothing order dynamic size example', () => {
  it('defines header/detail tables and a beforeData dynamic size script', () => {
    const template = clothingOrderDynamicSizeTemplate;
    const components = template.pages.flatMap(page => page.bands.flatMap(band => band.components));

    expect(components.some(component => component.name === 'OrderSizeHeaderTable')).toBe(true);
    expect(components.some(component => component.name === 'OrderSizeDetailTable')).toBe(true);
    expect(template.events?.beforeData?.script).toContain('ctx.table?.("OrderSizeHeaderTable")');
    expect(template.events?.beforeData?.script).toContain('ctx.table?.("OrderSizeDetailTable")');
    expect(JSON.stringify(template.dataSources)).toContain('sizeGroups');
    expect(JSON.stringify(template.dataSources)).toContain('S1');
    expect(sampleReports.some(sample => sample.key === 'clothingOrderDynamicSize')).toBe(true);
  });

  it('renders expanded dynamic size header rows and detail size columns', () => {
    const document = renderReport(clothingOrderDynamicSizeTemplate, clothingOrderDynamicSizeData);
    const text = JSON.stringify(document);

    expect(text).toContain('80');
    expect(text).toContain('90');
    expect(text).toContain('特种绣花针织裤');
    expect(text).toContain('1095');
  });
});
```

- [ ] **Step 2: Run the failing example test**

Run:

```bash
pnpm --filter @report-designer/example test -- phase-45-clothing-order-dynamic-size-example.test.ts
```

Expected: fail because the example does not exist.

- [ ] **Step 3: Implement the example template**

Create `packages/example/src/templates/clothing-order-dynamic-size.ts`. The template must:

- Define a `dataHeader` band with `OrderSizeHeaderTable`.
- Define a `data` band with `OrderSizeDetailTable`.
- Use one placeholder size column text `S1` in both tables.
- Include sample `sizeGroups` with at least three rows of size headers.
- Include sample details using `S1` through at least `S6`.
- Attach a report `beforeData` script that:
  - reads `ctx.data.clothingOrder.sizeGroups`,
  - calculates `maxSizeCount`,
  - finds the `S1` placeholder,
  - expands header/detail column counts,
  - expands header rows to `sizeGroups.length`,
  - merges fixed header cells vertically,
  - writes size labels in header rows,
  - writes `{S1}`, `{S2}` expressions in detail cells,
  - sets fixed column widths,
  - distributes dynamic size columns.

- [ ] **Step 4: Register the example**

Add the new example to the existing example list/menu so it is visible in the sample website. Use the display name:

```text
服装订单动态尺码打印
```

- [ ] **Step 5: Run example tests**

Run:

```bash
pnpm --filter @report-designer/example test -- phase-45-clothing-order-dynamic-size-example.test.ts
pnpm --filter @report-designer/example build
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add packages/example/src/templates/clothing-order-dynamic-size.ts packages/example/src/templates/index.ts packages/example/src/__tests__/phase-45-clothing-order-dynamic-size-example.test.ts
git commit -m "feat(examples): 增加服装订单动态尺码打印示例"
```

## Task 5: Verify Rendered Expansion And Alignment

**Files:**
- Modify or create a render/pagination test in the package that owns preview rendering.
- Test: `packages/example/src/__tests__/phase-45-clothing-order-dynamic-size-example.test.ts`

- [ ] **Step 1: Write a failing render test**

Add a test that renders the clothing order example and asserts:

```ts
expect(headerTable.rows).toHaveLength(sizeGroups.length);
expect(headerTable.rows[0].cells).toHaveLength(detailTable.rows[0].cells.length);
expect(headerTable.rows[0].cells[fixedColumnIndex].rowSpan).toBe(sizeGroups.length);
expect(detailTable.rows[0].cells[sizeStartColumn].text).toBe('{S1}');
expect(detailTable.rows[0].cells[sizeStartColumn + 1].text).toBe('{S2}');
```

- [ ] **Step 2: Run the failing render test**

Run:

```bash
pnpm --filter @report-designer/example test -- phase-45-clothing-order-dynamic-size-example.test.ts
```

Expected: fail until events run before layout and mutate both tables.

- [ ] **Step 3: Fix event execution or example script gaps**

If the test reveals that report `beforeData` does not mutate the template used by pagination, update the event runtime path so the report-level event receives the cloned template that layout will use. Preserve the current event flow:

```text
beforePreview/beforePrint -> beforeRender -> beforeData -> layout/pagination -> afterData -> afterRender
```

- [ ] **Step 4: Run render and regression tests**

Run:

```bash
pnpm --filter @report-designer/core test
pnpm --filter @report-designer/designer test -- phase-45-event-component-completions.test.tsx
pnpm --filter @report-designer/example test -- phase-45-clothing-order-dynamic-size-example.test.ts
pnpm --filter @report-designer/designer build
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core packages/designer
git commit -m "test(examples): 覆盖动态尺码打印渲染"
```

## Self-Review Checklist

- Spec coverage: event placement, component lookup by unique name, component-name completions, table operations, clothing order example, and render alignment are each covered by tasks.
- Placeholder scan: the plan uses concrete file paths, commands, API names, and acceptance assertions.
- Type consistency: `ctx.component`, type-specific helpers, `EventComponentHandle`, `EventTableHandle`, `TableComponent`, and `TableCell` are named consistently across runtime, editor DTS, completions, and example script.
