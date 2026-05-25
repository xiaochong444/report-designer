# Product Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver five sequential product hardening stages: page watermark/border, component property matrix, table design operations, Band contract coverage, and event productization.

**Architecture:** Preserve the existing template -> RenderDocument -> designer canvas -> DOM preview -> print HTML -> PDF pipeline. Each new property starts with failing tests, then flows through core normalization, render output, designer controls, viewer renderers, and verification.

**Tech Stack:** TypeScript, React 19, Ant Design 6, Vite, Vitest, Testing Library, pdf-lib, Playwright smoke tests.

## Progress Summary

- [x] Stage 1 页面外观闭环：页面水印、页面边框、设计器入口、DOM 预览、打印 HTML、PDF 输出和测试均已落地。
- [x] Stage 2 组件属性矩阵补齐：属性矩阵文档、组件属性分组、常用组件属性和渲染一致性测试均已落地。
- [x] Stage 3 表格设计能力增强：单元格选择、右键菜单、单元格属性、跨页重复表头、PDF 表格输出和撤销测试均已落地。
- [x] Stage 4 Band 核心严测：Band 合同测试、DataBand 排序、Band 属性入口和分页行为测试均已落地。
- [x] Stage 5 事件系统产品化：统一事件入口、脚本模板、事件日志、错误定位和动态脚本模板均已落地。
- [x] Stage 5 事件日志操作面：Viewer 事件日志支持级别筛选、清空当前日志和导出当前筛选结果。
- [x] Stage 5 页面事件入口：页面支持 `beforePrint` / `afterPrint` 脚本，页面属性面板可编辑页面事件。
- [x] Final Verification：核心、设计器、查看器相关阶段测试已通过；全量测试、构建、命名扫描和浏览器烟测需在每个后续功能提交前继续执行。

---

## File Map

- `packages/core/src/template-model/types.ts`: page, component, table, Band, and event-facing type definitions.
- `packages/core/src/template-model/template.ts`: default template and normalization defaults.
- `packages/core/src/pagination/paginate.ts`: page-level render fields and Band pagination behavior.
- `packages/core/src/render-document/types.ts`: viewer-facing page/component contracts.
- `packages/core/src/layout-engine/layout-band.ts`: component layout and Band event integration.
- `packages/designer/src/components/Canvas.tsx`: design-time page, Band, component, and table visual rendering.
- `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`: page and Band property entry.
- `packages/designer/src/components/PropertyEditor.tsx`: component property editor.
- `packages/designer/src/components/dialogs/PageSetupDialog.tsx`: page setup dialog.
- `packages/designer/src/components/table/*`: table selection, context menu, and cell editing helpers if split files are introduced.
- `packages/designer/src/components/events/*`: event editor, event log panel, and script templates.
- `packages/designer/src/store/designer-store.ts`: template update actions and selection state.
- `packages/designer/src/i18n/messages.ts`: Chinese and English messages.
- `packages/viewer/src/renderers/dom/RenderDocumentView.tsx`: page-level DOM rendering.
- `packages/viewer/src/renderers/dom/renderComponent.tsx`: component DOM rendering.
- `packages/viewer/src/print/print-frame.ts`: print HTML rendering.
- `packages/viewer/src/export/pdf/export-render-document.ts`: page-level PDF rendering.
- `packages/viewer/src/export/pdf/pdf-draw-component.ts`: component PDF rendering.
- `packages/*/src/__tests__/*`: focused package tests.

## Stage 1: 页面外观闭环

### Task 1: Core Page Appearance Contract

**Files:**
- Modify: `packages/core/src/template-model/types.ts`
- Modify: `packages/core/src/template-model/template.ts`
- Modify: `packages/core/src/render-document/types.ts`
- Modify: `packages/core/src/pagination/paginate.ts`
- Test: `packages/core/__tests__/phase-32-page-appearance.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/core/__tests__/phase-32-page-appearance.test.ts`:

```ts
import { createDefaultTemplate } from '../src/template-model/template';
import { renderReport } from '../src/pagination/paginate';

describe('phase 32 page appearance', () => {
  it('normalizes page watermark and page border defaults', () => {
    const template = createDefaultTemplate();

    expect(template.pages[0].watermark).toEqual({
      enabled: false,
      text: '',
      fontSize: 48,
      color: '#8c8c8c',
      opacity: 0.18,
      angle: -35,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      showBehind: true,
    });
    expect(template.pages[0].pageBorder).toEqual({
      enabled: false,
      style: 'solid',
      width: 0.2,
      color: '#000000',
      sides: { top: true, right: true, bottom: true, left: true },
      offset: 0,
    });
  });

  it('copies page appearance into render pages without changing pagination coordinates', () => {
    const template = createDefaultTemplate();
    template.pages[0].watermark = {
      enabled: true,
      text: 'Internal',
      fontFamily: 'SimSun',
      fontSize: 36,
      color: '#ff4d4f',
      opacity: 0.25,
      angle: -30,
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      showBehind: true,
    };
    template.pages[0].pageBorder = {
      enabled: true,
      style: 'dashed',
      width: 0.4,
      color: '#1677ff',
      sides: { top: true, right: true, bottom: true, left: true },
      offset: 5,
    };

    const document = renderReport(template, {});

    expect(document.pages[0].watermark).toEqual(template.pages[0].watermark);
    expect(document.pages[0].pageBorder).toEqual(template.pages[0].pageBorder);
    expect(document.pages[0].items[0]?.x).toBe(template.pages[0].margins.left);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @report-designer/core test -- phase-32-page-appearance.test.ts`

Expected: FAIL because `watermark` and `pageBorder` do not exist on page and render page types.

- [ ] **Step 3: Implement minimal core model**

Add `PageWatermark` and `PageBorder` interfaces to `packages/core/src/template-model/types.ts`, add optional fields to `Page`, add the same optional fields to `RenderPage`, add defaults in `createDefaultTemplate`, and copy fields in `paginate` when creating a render page.

- [ ] **Step 4: Run focused test**

Run: `pnpm --filter @report-designer/core test -- phase-32-page-appearance.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/template-model/types.ts packages/core/src/template-model/template.ts packages/core/src/render-document/types.ts packages/core/src/pagination/paginate.ts packages/core/__tests__/phase-32-page-appearance.test.ts
git commit -m "feat(page): 增加页面外观模型"
```

### Task 2: Viewer Page Appearance Rendering

**Files:**
- Modify: `packages/viewer/src/renderers/dom/RenderDocumentView.tsx`
- Modify: `packages/viewer/src/print/print-frame.ts`
- Modify: `packages/viewer/src/export/pdf/export-render-document.ts`
- Test: `packages/viewer/src/__tests__/phase-32-page-appearance.test.tsx`
- Test: `packages/viewer/src/__tests__/phase-4-print-frame.test.ts`
- Test: `packages/viewer/src/__tests__/phase-4-pdf-export.test.ts`

- [ ] **Step 1: Write failing DOM and print tests**

Create `packages/viewer/src/__tests__/phase-32-page-appearance.test.tsx` with assertions that a render page with watermark and border shows `data-testid="rd-page-watermark"` and `data-testid="rd-page-border"`. Extend print tests to assert `rd-print-watermark`, border CSS, watermark opacity, and rotation.

- [ ] **Step 2: Write failing PDF spy test**

Extend PDF tests by mocking `drawText`, `drawLine`, and `drawRectangle` to assert page background is drawn first, watermark text is drawn, and enabled page border sides are drawn.

- [ ] **Step 3: Run focused viewer tests**

Run: `pnpm --filter @report-designer/viewer test -- phase-32-page-appearance.test.tsx phase-4-print-frame.test.ts phase-4-pdf-export.test.ts`

Expected: FAIL because viewer renderers do not yet consume page appearance fields.

- [ ] **Step 4: Implement DOM and print rendering**

Render page watermark and page border as absolute children of the page container. Use millimeter CSS for print, pixel-scaled CSS for DOM preview, and keep `pointerEvents: 'none'`.

- [ ] **Step 5: Implement PDF rendering**

In `export-render-document.ts`, draw page background, behind-content watermark, page items, foreground watermark, then page border. Use page width/height in points, convert all millimeter values with the existing conversion helper, and respect side switches.

- [ ] **Step 6: Run focused viewer tests**

Run: `pnpm --filter @report-designer/viewer test -- phase-32-page-appearance.test.tsx phase-4-print-frame.test.ts phase-4-pdf-export.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/viewer/src/renderers/dom/RenderDocumentView.tsx packages/viewer/src/print/print-frame.ts packages/viewer/src/export/pdf/export-render-document.ts packages/viewer/src/__tests__/phase-32-page-appearance.test.tsx packages/viewer/src/__tests__/phase-4-print-frame.test.ts packages/viewer/src/__tests__/phase-4-pdf-export.test.ts
git commit -m "feat(viewer): 渲染页面水印和边框"
```

### Task 3: Designer Page Appearance Editing

**Files:**
- Modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Modify: `packages/designer/src/components/dialogs/PageSetupDialog.tsx`
- Modify: `packages/designer/src/components/Canvas.tsx`
- Modify: `packages/designer/src/store/designer-store.ts`
- Modify: `packages/designer/src/i18n/messages.ts`
- Test: `packages/designer/src/__tests__/phase-32-page-appearance.test.tsx`
- Test: `packages/designer/src/__tests__/phase-10-page-properties.test.tsx`

- [ ] **Step 1: Write failing designer tests**

Create tests that render the designer, clear selection, enable watermark and page border in the page property panel, assert the canvas shows matching elements, open page setup, change watermark text and border color, apply, and assert state updates. Repeat one key assertion after switching locale to English.

- [ ] **Step 2: Run focused designer tests**

Run: `pnpm --filter @report-designer/designer test -- phase-32-page-appearance.test.tsx phase-10-page-properties.test.tsx`

Expected: FAIL because controls and canvas overlays do not exist.

- [ ] **Step 3: Implement property controls**

Add reusable page appearance form helpers inside the page property panel or a small local component. Use Ant Design 6 `Switch`, `Input`, `InputNumber`, `Select`, `ColorPicker`, `Segmented`, and `Checkbox.Group`. Use icons for horizontal and vertical alignment controls.

- [ ] **Step 4: Implement page setup controls**

Reuse the same field labels and update helpers in `PageSetupDialog`. Keep dialog sections scrollable and avoid grid layouts that clip content.

- [ ] **Step 5: Implement canvas overlays**

Render watermark and border inside the page sheet at the same layer order as viewer DOM. Keep overlays non-selectable and do not affect Band titles, rulers, margins, or grid.

- [ ] **Step 6: Run focused designer tests**

Run: `pnpm --filter @report-designer/designer test -- phase-32-page-appearance.test.tsx phase-10-page-properties.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/designer/src/components/panels/DesignerPropertyPanel.tsx packages/designer/src/components/dialogs/PageSetupDialog.tsx packages/designer/src/components/Canvas.tsx packages/designer/src/store/designer-store.ts packages/designer/src/i18n/messages.ts packages/designer/src/__tests__/phase-32-page-appearance.test.tsx packages/designer/src/__tests__/phase-10-page-properties.test.tsx
git commit -m "feat(designer): 支持页面水印和边框编辑"
```

## Stage 2: 组件属性矩阵补齐

### Task 4: Component Property Matrix Document And Tests

**Files:**
- Create: `docs/component-property-matrix.md`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Modify: `packages/designer/src/i18n/messages.ts`
- Test: `packages/designer/src/__tests__/phase-33-component-property-matrix.test.tsx`

- [ ] **Step 1: Write the matrix document**

Create `docs/component-property-matrix.md` with rows for text, image, table, rich text, barcode, checkbox, line, shape, panel, subreport, page number, and date time. Columns: content, appearance, text, behavior, data, events, render targets.

- [ ] **Step 2: Write failing property visibility tests**

Create tests that select each component type and assert relevant groups are visible while irrelevant groups are hidden. Assert text components expose only “文本内容” / “Text content” as the main expression entry.

- [ ] **Step 3: Run focused tests**

Run: `pnpm --filter @report-designer/designer test -- phase-33-component-property-matrix.test.tsx`

Expected: FAIL because several component types still expose incomplete or mixed property groups.

- [ ] **Step 4: Refactor property group predicates**

Add local predicates in `PropertyEditor.tsx`: `supportsTextStyle`, `supportsBorderStyle`, `supportsDataBinding`, `supportsCellEditing`, `supportsFormat`, and `supportsContainerStyle`. Use them to show only relevant groups.

- [ ] **Step 5: Run focused tests**

Run: `pnpm --filter @report-designer/designer test -- phase-33-component-property-matrix.test.tsx`

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add docs/component-property-matrix.md packages/designer/src/components/PropertyEditor.tsx packages/designer/src/i18n/messages.ts packages/designer/src/__tests__/phase-33-component-property-matrix.test.tsx
git commit -m "feat(properties): 建立组件属性矩阵"
```

### Task 5: Missing Component Properties

**Files:**
- Modify: `packages/core/src/template-model/types.ts`
- Modify: `packages/core/src/template-model/template.ts`
- Modify: `packages/core/src/layout-engine/layout-band.ts`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Modify: `packages/viewer/src/renderers/dom/renderComponent.tsx`
- Modify: `packages/viewer/src/print/print-frame.ts`
- Modify: `packages/viewer/src/export/pdf/pdf-draw-component.ts`
- Test: `packages/core/__tests__/phase-33-component-properties.test.ts`
- Test: `packages/designer/src/__tests__/phase-33-component-property-matrix.test.tsx`
- Test: `packages/viewer/src/__tests__/phase-33-component-properties.test.tsx`

- [ ] **Step 1: Write failing render tests**

Cover line color/width/style, shape fill/border, image fit and border, barcode show text/background, checkbox label/font, panel background/border/padding, page number/date time font, and rich text html output.

- [ ] **Step 2: Run focused tests**

Run: `pnpm --filter @report-designer/core test -- phase-33-component-properties.test.ts; pnpm --filter @report-designer/viewer test -- phase-33-component-properties.test.tsx`

Expected: FAIL for properties not yet modeled or not rendered consistently.

- [ ] **Step 3: Add missing model fields conservatively**

Only add fields needed by tests and visible UI: `opacity`, `foregroundColor`, `boxStyle`, `checkStyle`, `contentPadding`, and component-specific style fields where the renderer already has a natural equivalent.

- [ ] **Step 4: Implement designer controls**

Expose the added fields under the matrix groups. Use icon buttons for alignment and text style controls, and use compact controls for colors and numeric values.

- [ ] **Step 5: Implement render parity**

Pass new fields through layout output and render them in DOM, print HTML, and PDF. For unsupported PDF rich text decoration, keep text content visible and add a focused test for the supported subset.

- [ ] **Step 6: Run focused tests**

Run: `pnpm --filter @report-designer/core test -- phase-33-component-properties.test.ts; pnpm --filter @report-designer/designer test -- phase-33-component-property-matrix.test.tsx; pnpm --filter @report-designer/viewer test -- phase-33-component-properties.test.tsx`

Expected: PASS.

- [x] **Step 7: Commit**

```bash
git add packages/core packages/designer/src/components/PropertyEditor.tsx packages/designer/src/i18n/messages.ts packages/viewer/src/renderers/dom/renderComponent.tsx packages/viewer/src/print/print-frame.ts packages/viewer/src/export/pdf/pdf-draw-component.ts
git commit -m "feat(properties): 补齐常用组件属性"
```

## Stage 3: 表格设计能力增强

### Task 6: Table Cell Model And Selection

**Files:**
- Modify: `packages/core/src/template-model/types.ts`
- Modify: `packages/core/src/template-model/template.ts`
- Modify: `packages/designer/src/components/Canvas.tsx`
- Modify: `packages/designer/src/store/designer-store.ts`
- Test: `packages/designer/src/__tests__/phase-34-table-cell-selection.test.tsx`

- [ ] **Step 1: Write failing selection tests**

Assert clicking a table cell selects `{ tableId, row, column }`, shift-click selects a rectangle, and the property panel switches to cell properties.

- [ ] **Step 2: Run focused test**

Run: `pnpm --filter @report-designer/designer test -- phase-34-table-cell-selection.test.tsx`

Expected: FAIL because cell selection is incomplete.

- [ ] **Step 3: Implement cell selection state**

Add table cell selection to designer store without replacing component selection. Render a clear cell selection outline in canvas.

- [ ] **Step 4: Run focused test**

Run: `pnpm --filter @report-designer/designer test -- phase-34-table-cell-selection.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/template-model/types.ts packages/core/src/template-model/template.ts packages/designer/src/components/Canvas.tsx packages/designer/src/store/designer-store.ts packages/designer/src/__tests__/phase-34-table-cell-selection.test.tsx
git commit -m "feat(table): 支持表格单元格选择"
```

### Task 7: Table Context Menu Operations

**Files:**
- Modify: `packages/designer/src/components/Canvas.tsx`
- Modify: `packages/designer/src/store/designer-store.ts`
- Modify: `packages/designer/src/i18n/messages.ts`
- Test: `packages/designer/src/__tests__/phase-34-table-context-menu.test.tsx`

- [ ] **Step 1: Write failing context menu tests**

Cover insert row above/below, delete row, insert column left/right, delete column, merge cells, split cell, clear content, set header row, and set footer row.

- [ ] **Step 2: Run focused test**

Run: `pnpm --filter @report-designer/designer test -- phase-34-table-context-menu.test.tsx`

Expected: FAIL because menu actions and transformations are missing.

- [ ] **Step 3: Implement pure table transformation helpers**

Add helper functions in the store or a new table helper file to update row count, column count, cell coordinates, spans, header rows, footer rows, and columns. Keep helpers pure and covered through UI tests.

- [ ] **Step 4: Implement compact right-click menu**

Use Ant Design 6 `Dropdown` menu API. Group operations visually with dividers and keep destructive actions last.

- [ ] **Step 5: Run focused test**

Run: `pnpm --filter @report-designer/designer test -- phase-34-table-context-menu.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/designer/src/components/Canvas.tsx packages/designer/src/store/designer-store.ts packages/designer/src/i18n/messages.ts packages/designer/src/__tests__/phase-34-table-context-menu.test.tsx
git commit -m "feat(table): 增强表格右键操作"
```

### Task 8: Table Cell Properties And Repeat Header Rendering

**Files:**
- Modify: `packages/core/src/template-model/types.ts`
- Modify: `packages/core/src/layout-engine/layout-band.ts`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Modify: `packages/viewer/src/renderers/dom/renderComponent.tsx`
- Modify: `packages/viewer/src/print/print-frame.ts`
- Modify: `packages/viewer/src/export/pdf/pdf-draw-component.ts`
- Test: `packages/core/__tests__/phase-34-table-rendering.test.ts`
- Test: `packages/designer/src/__tests__/phase-34-table-cell-properties.test.tsx`
- Test: `packages/viewer/src/__tests__/phase-34-table-rendering.test.tsx`

- [ ] **Step 1: Write failing tests**

Assert cell background, border, padding, alignment, expression, and format flow to rendered rows. Assert header rows repeat when a table crosses pages.

- [ ] **Step 2: Run focused tests**

Run: `pnpm --filter @report-designer/core test -- phase-34-table-rendering.test.ts; pnpm --filter @report-designer/designer test -- phase-34-table-cell-properties.test.tsx; pnpm --filter @report-designer/viewer test -- phase-34-table-rendering.test.tsx`

Expected: FAIL because cell-level style and repeat behavior are incomplete.

- [ ] **Step 3: Extend table cell style model**

Add optional cell style fields: `backgroundColor`, `border`, `padding`, `textAlign`, `verticalAlign`, and `format`.

- [ ] **Step 4: Implement render behavior**

Resolve each cell expression against current row data. When a table breaks to a new page, emit header rows before remaining body rows. Keep row heights stable.

- [ ] **Step 5: Run focused tests**

Run: `pnpm --filter @report-designer/core test -- phase-34-table-rendering.test.ts; pnpm --filter @report-designer/designer test -- phase-34-table-cell-properties.test.tsx; pnpm --filter @report-designer/viewer test -- phase-34-table-rendering.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/designer/src/components/PropertyEditor.tsx packages/viewer/src/renderers/dom/renderComponent.tsx packages/viewer/src/print/print-frame.ts packages/viewer/src/export/pdf/pdf-draw-component.ts
git commit -m "feat(table): 支持单元格属性和表头重复"
```

## Stage 4: Band 核心严测

### Task 9: Band Contract Test Suite

**Files:**
- Create: `packages/core/__tests__/phase-35-band-contracts.test.ts`
- Modify: `packages/core/src/band-planner/*`
- Modify: `packages/core/src/pagination/paginate.ts`
- Modify: `packages/core/src/layout-engine/layout-band.ts`

- [ ] **Step 1: Write failing contract tests**

Cover nested groups, EmptyData, Header/Data/Footer ownership, KeepTogether, CanBreak, PrintAtBottom, repeated page header, repeated group header, and aggregate values after pagination.

- [ ] **Step 2: Run focused core tests**

Run: `pnpm --filter @report-designer/core test -- phase-35-band-contracts.test.ts`

Expected: FAIL for any missing or inconsistent Band behavior.

- [ ] **Step 3: Fix one Band rule at a time**

Implement the minimal rule changes in the band planner, pagination, or layout engine. After each rule, run the focused test until the next failure becomes visible.

- [ ] **Step 4: Add regression cases for fixed failures**

For each fixed behavior, keep the test assertion specific: page count, Band id order, Y coordinate, overflow flag, and aggregate text.

- [ ] **Step 5: Run focused core tests**

Run: `pnpm --filter @report-designer/core test -- phase-35-band-contracts.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/__tests__/phase-35-band-contracts.test.ts packages/core/src/band-planner packages/core/src/pagination/paginate.ts packages/core/src/layout-engine/layout-band.ts
git commit -m "test(band): 补充Band分页合同测试"
```

### Task 10: Band Designer Entrypoints

**Files:**
- Modify: `packages/designer/src/components/Canvas.tsx`
- Modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Modify: `packages/designer/src/i18n/messages.ts`
- Test: `packages/designer/src/__tests__/phase-35-band-properties.test.tsx`

- [ ] **Step 1: Write failing designer tests**

Assert Band can be selected from canvas and tree, and properties expose repeat, keep together, can break, print at bottom, empty data behavior, and ownership relation fields where relevant.

- [ ] **Step 2: Run focused designer test**

Run: `pnpm --filter @report-designer/designer test -- phase-35-band-properties.test.tsx`

Expected: FAIL for missing controls.

- [ ] **Step 3: Implement Band property controls**

Use compact switches and selects. Disable controls that do not apply to the selected Band type.

- [ ] **Step 4: Run focused designer test**

Run: `pnpm --filter @report-designer/designer test -- phase-35-band-properties.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/designer/src/components/Canvas.tsx packages/designer/src/components/panels/DesignerPropertyPanel.tsx packages/designer/src/i18n/messages.ts packages/designer/src/__tests__/phase-35-band-properties.test.tsx
git commit -m "feat(band): 完善Band属性入口"
```

## Stage 5: 事件系统产品化

### Task 11: Unified Event Entrypoints And Templates

**Files:**
- Modify: `packages/core/src/event-engine/types.ts`
- Modify: `packages/designer/src/components/events/EventEditorDialog.tsx`
- Create: `packages/designer/src/components/events/event-script-templates.ts`
- Modify: `packages/designer/src/components/PropertyEditor.tsx`
- Modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Modify: `packages/designer/src/i18n/messages.ts`
- Test: `packages/designer/src/__tests__/phase-36-event-productization.test.tsx`

- [x] **Step 1: Write failing UI tests**

Assert report, page, Band, and component property areas show the same event entry button. Open the dialog, insert a script template, save it, and reopen to confirm persistence.

- [x] **Step 2: Run focused designer test**

Run: `pnpm --filter @report-designer/designer test -- phase-36-event-productization.test.tsx`

Expected: FAIL because entrypoints and templates are not unified.

- [x] **Step 3: Implement event templates**

Create template entries for preview before, print before, render before, data before, Band before render, and component before render. Each template uses the typed `ctx` object and localized display name.

- [x] **Step 4: Implement shared event button**

Use one small component for report, page, Band, and component event entry. Pass owner type, owner id, event map, and update callback.

- [x] **Step 5: Run focused designer test**

Run: `pnpm --filter @report-designer/designer test -- phase-36-event-productization.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/event-engine/types.ts packages/designer/src/components/events/EventEditorDialog.tsx packages/designer/src/components/events/event-script-templates.ts packages/designer/src/components/PropertyEditor.tsx packages/designer/src/components/panels/DesignerPropertyPanel.tsx packages/designer/src/i18n/messages.ts packages/designer/src/__tests__/phase-36-event-productization.test.tsx
git commit -m "feat(events): 统一事件入口和脚本模板"
```

### Task 12: Event Log Panel And Error Location

**Files:**
- Modify: `packages/core/src/event-engine/types.ts`
- Modify: `packages/core/src/event-engine/runtime.ts`
- Modify: `packages/viewer/src/components/Viewer.tsx`
- Create: `packages/viewer/src/components/EventLogPanel.tsx`
- Modify: `packages/designer/src/components/events/EventEditorDialog.tsx`
- Test: `packages/core/__tests__/phase-36-event-runtime.test.ts`
- Test: `packages/viewer/src/__tests__/phase-36-event-log-panel.test.tsx`
- Test: `packages/designer/src/__tests__/phase-36-event-productization.test.tsx`

- [x] **Step 1: Write failing runtime and UI tests**

Assert event logs include owner type, owner id, event name, level, message, timestamp, optional line, optional column, and stack excerpt. Assert viewer can show logs and designer can reopen the failing event.

- [x] **Step 2: Run focused tests**

Run: `pnpm --filter @report-designer/core test -- phase-36-event-runtime.test.ts; pnpm --filter @report-designer/viewer test -- phase-36-event-log-panel.test.tsx; pnpm --filter @report-designer/designer test -- phase-36-event-productization.test.tsx`

Expected: FAIL because error metadata and log panel are incomplete.

- [x] **Step 3: Enrich event log metadata**

Capture error line and column when available. Keep runtime errors isolated to event execution and always append an error log entry.

- [x] **Step 4: Implement viewer event log panel**

Add a compact panel in viewer that lists logs for the last rendered document. Use severity tags, object name, event name, message, and line/column.

- [x] **Step 5: Implement editor error navigation**

Viewer event logs can now call a host navigation callback. The example app switches back to the designer, selects the logged report/Band/component owner, opens the matching event editor, and places Monaco at the logged line and column.

When an event error is opened from the log, open the event editor and place Monaco cursor on the logged line and column.

- [x] **Step 6: Run focused tests**

Run: `pnpm --filter @report-designer/core test -- phase-36-event-runtime.test.ts; pnpm --filter @report-designer/viewer test -- phase-36-event-log-panel.test.tsx; pnpm --filter @report-designer/designer test -- phase-36-event-productization.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/event-engine packages/viewer/src/components/Viewer.tsx packages/viewer/src/components/EventLogPanel.tsx packages/designer/src/components/events/EventEditorDialog.tsx packages/core/__tests__/phase-36-event-runtime.test.ts packages/viewer/src/__tests__/phase-36-event-log-panel.test.tsx packages/designer/src/__tests__/phase-36-event-productization.test.tsx
git commit -m "feat(events): 增加事件日志和错误定位"
```

## Final Verification

### Task 13: Full Regression And Browser Smoke

**Files:**
- Modify only if verification reveals a real regression.

- [x] **Step 1: Run all tests**

Run: `pnpm test`

Expected: PASS.

- [x] **Step 2: Run build**

Run: `pnpm build`

Expected: PASS. Existing chunk size warnings are acceptable.

- [x] **Step 3: Run forbidden naming scan**

Run:

```powershell
$blockedProduct = -join ([char[]](83,116,105,109,117,108,115,111,102,116))
$blockedProductLower = $blockedProduct.ToLowerInvariant()
$blockedTypo = -join ([char[]](83,116,105,109,117,108,116,115,111,102,116))
$blockedTypoLower = $blockedTypo.ToLowerInvariant()
$terms = @($blockedProduct, $blockedProductLower, $blockedTypo, $blockedTypoLower, '\bV' + '1\b', '\bV' + '2\b', 'v' + '1-', 'v' + '2-', 'leg' + 'acy') -join '|'
Get-ChildItem -Recurse docs,packages -File |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\dist\\' } |
  Select-String -Pattern $terms
```

Expected: no forbidden product names or unreleased-version markers in touched source and docs.

- [x] **Step 4: Run example smoke**

Run: `pnpm --filter @report-designer/example dev --host 127.0.0.1 --port 5184`

Open `http://127.0.0.1:5184/`, open the example designer, enable page watermark and border, edit one component property, edit one table cell, preview, print, and export PDF.

Expected: designer, preview, print HTML, and PDF visually match for the edited report.

- [x] **Step 5: Restore generated dist hash if unrelated**

Run: `git status --short`

If only `packages/example/dist/index.html` changed because of a build hash and no source change requires committing it, restore just that generated file with a non-destructive checkout of that file.

- [ ] **Step 6: Commit final fixes if needed**

```bash
git add .
git commit -m "fix(regression): 修复产品完善阶段回归"
```

Use this commit only when verification required source fixes. If no files changed, do not create an empty commit.

## Plan Self-Review

- Spec coverage: Stage 1 maps to Tasks 1-3, Stage 2 maps to Tasks 4-5, Stage 3 maps to Tasks 6-8, Stage 4 maps to Tasks 9-10, Stage 5 maps to Tasks 11-12, final verification maps to Task 13.
- Placeholder scan: no incomplete placeholders or deferred unnamed work remain.
- Type consistency: page fields use `watermark` and `pageBorder`; render fields mirror page fields; table cell style fields are named consistently across model, designer, renderers, and tests.
- Scope: the plan is sequential and each stage can be verified and committed independently.
