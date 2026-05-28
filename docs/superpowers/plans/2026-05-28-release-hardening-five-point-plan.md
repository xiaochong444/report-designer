# 0.0.1 Release Hardening Five-Point Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 0.0.1 发布前剩余的页面外观、组件属性、表格、Band 合同和事件系统五个闭环做完，保证设计器、预览、打印和 PDF 的行为一致。

**Architecture:** 以现有 `core -> designer -> viewer -> example` 分层为边界推进，不重写渲染主链路。所有可见属性都必须从模板模型进入设计器属性面板，再进入 RenderDocument，并在 DOM 预览、打印 HTML、PDF 导出中保持一致；所有 UI 入口同步中英文。

**Tech Stack:** React 19, TypeScript, Ant Design 6, Vitest, Testing Library, Playwright, PDF export helpers. 图表后续统一选型为 `@visactor/react-vchart`，本轮只固定选型，不把图表打印纳入 0.0.1 发布范围。

---

## 图表选型结论

结论：后续图表组件使用 `@visactor/react-vchart`。

选择理由：

- `@visactor/react-vchart` 是 VChart 的 React 封装，支持统一 `spec` 方式，适合报表设计器把图表配置存入模板模型。
- VChart 支持柱状、折线、饼图、组合图等常见报表图表，后续扩展空间比轻量自绘更稳。
- 与 Chart.js 相比，VChart 的声明式 spec 更适合“设计器保存配置 -> 预览渲染 -> 打印导出”的产品链路。
- 与 ECharts 相比，VChart 的 React 包和按需组件写法更贴合当前 React 设计器，避免 0.0.1 阶段引入过重生态。

边界：

- 0.0.1 不承诺图表打印。
- 图表模板字段可以在后续阶段预留，但本轮不安装依赖、不暴露图表入口。
- 等当前五个发布闭环完成后，再单独做图表模型、图表属性面板、预览、打印/PDF 位图化方案。

## Task 1: 页面外观闭环

**Files:**
- Inspect/modify: `packages/core/src/template-model/types.ts`
- Inspect/modify: `packages/core/src/template-model/template.ts`
- Inspect/modify: `packages/core/src/template-model/normalize-template.ts`
- Inspect/modify: `packages/core/src/pagination/paginate.ts`
- Inspect/modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Inspect/modify: `packages/designer/src/components/dialogs/PageSetupDialog.tsx`
- Inspect/modify: `packages/viewer/src/renderers/dom/RenderDocumentView.tsx`
- Inspect/modify: `packages/viewer/src/print/print-frame.ts`
- Inspect/modify: `packages/viewer/src/export/pdf/export-render-document.ts`
- Inspect/modify: `packages/viewer/src/export/pdf/pdf-draw-component.ts`
- Test: `packages/core/__tests__/phase-32-page-appearance.test.ts`
- Test: `packages/designer/src/__tests__/phase-32-page-appearance.test.tsx`
- Test: `packages/viewer/src/__tests__/phase-32-page-appearance.test.tsx`
- Test: `packages/viewer/src/__tests__/phase-4-print-frame.test.ts`
- Test: `packages/viewer/src/__tests__/phase-4-pdf-export.test.ts`

- [ ] **Step 1: Verify current page appearance contract**

Run:

```powershell
pnpm --filter @report-designer/core test -- phase-32-page-appearance.test.ts
pnpm --filter @report-designer/designer test -- phase-32-page-appearance.test.tsx
pnpm --filter @report-designer/viewer test -- phase-32-page-appearance.test.tsx phase-4-print-frame.test.ts phase-4-pdf-export.test.ts
```

Expected: all tests pass or expose the exact parity gap to fix.

- [ ] **Step 2: Close visible page setting gaps**

Ensure page name, paper, unit, background color, watermark text/color/font/size/opacity/angle/alignment/layer, and page border style/color/width/offset/sides are editable from both the right page property panel and the page setup dialog where relevant.

- [ ] **Step 3: Validate render parity**

Confirm `RenderPage` carries page background, watermark and page border into preview, print iframe and PDF export without changing band layout coordinates.

- [ ] **Step 4: Commit page closure**

Commit message:

```text
feat(page): 完成页面外观发布闭环
```

## Task 2: 组件属性矩阵补齐

**Files:**
- Inspect/modify: `docs/component-property-matrix.md`
- Inspect/modify: `packages/core/src/template-model/types.ts`
- Inspect/modify: `packages/core/src/layout-engine/layout-band.ts`
- Inspect/modify: `packages/designer/src/components/PropertyEditor.tsx`
- Inspect/modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Inspect/modify: `packages/designer/src/i18n/messages.ts`
- Inspect/modify: `packages/viewer/src/renderers/dom/renderComponent.tsx`
- Inspect/modify: `packages/viewer/src/export/pdf/pdf-draw-component.ts`
- Test: `packages/core/__tests__/phase-33-component-properties.test.ts`
- Test: `packages/designer/src/__tests__/phase-33-component-property-matrix.test.tsx`
- Test: `packages/viewer/src/__tests__/phase-33-component-properties.test.tsx`

- [ ] **Step 1: Audit component-property matrix**

Check every common component: text, image, table, richtext, barcode, checkbox, line, shape, panel, subreport, pagenumber, datetime. Mark unsupported properties explicitly in `docs/component-property-matrix.md` instead of leaving UI controls that do nothing.

- [ ] **Step 2: Remove or complete invalid property controls**

For every property exposed in `PropertyEditor.tsx`, confirm one of these is true:

```text
template model field exists
designer store update exists
canvas/render document output uses it
viewer DOM uses it
print/PDF either uses it or explicitly documents it as preview-only
i18n has zh-CN and en-US labels
```

- [ ] **Step 3: Close high-value gaps first**

Prioritize shape fill/border, line style/thickness, image fit, barcode display text, checkbox style, page number/date time appearance, subreport appearance parity, and panel clipping/background/border.

- [ ] **Step 4: Commit component matrix closure**

Commit message:

```text
feat(properties): 补齐发布前组件属性矩阵
```

## Task 3: 表格设计能力增强

**Files:**
- Inspect/modify: `packages/core/src/template-model/types.ts`
- Inspect/modify: `packages/core/src/layout-engine/layout-band.ts`
- Inspect/modify: `packages/designer/src/table/table-structure.ts`
- Inspect/modify: `packages/designer/src/store/designer-store.ts`
- Inspect/modify: `packages/designer/src/components/Canvas.tsx`
- Inspect/modify: `packages/designer/src/components/PropertyEditor.tsx`
- Inspect/modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Inspect/modify: `packages/designer/src/i18n/messages.ts`
- Inspect/modify: `packages/example/src/templates/table-detail.ts`
- Test: `packages/core/__tests__/phase-40-table-binding.test.ts`
- Test: `packages/core/__tests__/phase-34-table-rendering.test.ts`
- Test: `packages/designer/src/__tests__/phase-34-table-context-menu.test.tsx`
- Test: `packages/designer/src/__tests__/phase-34-table-cell-selection.test.tsx`
- Test: `packages/designer/src/__tests__/phase-39-table-editing-history.test.ts`
- Test: `packages/designer/src/__tests__/phase-40-table-binding-properties.test.tsx`
- Test: `packages/viewer/src/__tests__/phase-34-table-rendering.test.tsx`

- [ ] **Step 1: Verify table binding contract**

A table in detail mode binds to an array path such as `Orders.items`; each detail row evaluates cell expressions against the item row context, while fixed mode keeps the designed row count and does not auto-expand.

- [ ] **Step 2: Verify table editing contract**

Right-click and keyboard operations must cover insert/delete row, insert/delete column, merge selected cells, split cell, clear content, clear/copy/paste style, equalize rows/columns, set header/footer row, and toggle border.

- [ ] **Step 3: Verify cell property contract**

Single or range-selected cells must support text, font, alignment, background, border, padding and format. Unsupported non-text cell types remain hidden until rendering supports them.

- [ ] **Step 4: Commit table closure**

Commit message:

```text
feat(table): 完成表格设计发布闭环
```

## Task 4: Band 核心合同严测

**Files:**
- Inspect/modify: `packages/core/src/band-planner/build-band-plan.ts`
- Inspect/modify: `packages/core/src/band-planner/execute-band-plan.ts`
- Inspect/modify: `packages/core/src/pagination/paginate.ts`
- Inspect/modify: `packages/core/src/layout-engine/layout-band.ts`
- Inspect/modify: `packages/designer/src/components/properties/BandPropertyGrid.tsx`
- Inspect/modify: `packages/designer/src/store/designer-store.ts`
- Test: `packages/core/__tests__/phase-7-band-rendering-contract.test.ts`
- Test: `packages/core/__tests__/phase-7-band-pagination-contract.test.ts`
- Test: `packages/core/__tests__/phase-7-band-break-contract.test.ts`
- Test: `packages/core/__tests__/phase-35-band-contracts.test.ts`
- Test: `packages/designer/src/__tests__/phase-35-band-properties.test.tsx`

- [ ] **Step 1: Verify band taxonomy**

Confirm ReportTitle, PageHeader, Header, DataBand, Footer, GroupHeader, GroupFooter, EmptyData, ReportSummary and PageFooter render in the intended order and expose the correct designer properties.

- [ ] **Step 2: Verify pagination behavior**

Add or run contract cases for DataBand page breaks, Header/Data/Footer ownership, repeated page headers, repeated group headers, EmptyData, KeepTogether, CanBreak, PrintAtBottom, page totals and report totals.

- [ ] **Step 3: Fix only contract gaps**

Any change to Band behavior must include a failing core test first, and must not change preview/print coordinates outside the failing scenario.

- [ ] **Step 4: Commit band closure**

Commit message:

```text
test(band): 加固带区分页合同
```

## Task 5: 事件系统产品化

**Files:**
- Inspect/modify: `packages/core/src/event-engine/types.ts`
- Inspect/modify: `packages/core/src/event-engine/event-runner.ts`
- Inspect/modify: `packages/core/src/event-engine/event-context.ts`
- Inspect/modify: `packages/core/src/event-engine/event-editor-contract.ts`
- Inspect/modify: `packages/core/src/pagination/paginate.ts`
- Inspect/modify: `packages/designer/src/components/events/EventEditorDialog.tsx`
- Inspect/modify: `packages/designer/src/components/events/EventScriptEditor.tsx`
- Inspect/modify: `packages/designer/src/components/events/event-script-monaco.ts`
- Inspect/modify: `packages/designer/src/components/panels/DesignerPropertyPanel.tsx`
- Inspect/modify: `packages/designer/src/components/properties/BandPropertyGrid.tsx`
- Inspect/modify: `packages/designer/src/components/PropertyEditor.tsx`
- Inspect/modify: `packages/viewer/src/components/EventLogPanel.tsx`
- Inspect/modify: `packages/viewer/src/components/Viewer.tsx`
- Inspect/modify: `packages/example/src/App.tsx`
- Test: `packages/core/__tests__/phase-23-event-engine.test.ts`
- Test: `packages/core/__tests__/phase-23-render-events.test.ts`
- Test: `packages/core/__tests__/phase-36-event-runtime.test.ts`
- Test: `packages/designer/src/__tests__/phase-24-monaco-event-editor.test.tsx`
- Test: `packages/designer/src/__tests__/phase-25-typed-event-context.test.tsx`
- Test: `packages/designer/src/__tests__/phase-36-event-productization.test.tsx`
- Test: `packages/viewer/src/__tests__/phase-36-event-log-panel.test.tsx`

- [ ] **Step 1: Verify event hook coverage**

Report, page, band and component events must expose the intended before/after hooks through one consistent Event Editor entry.

- [ ] **Step 2: Verify typed editor experience**

Monaco must receive `ctx` type declarations, completion helpers, templates and diagnostic locations for common script errors.

- [ ] **Step 3: Verify runtime safety**

Event execution must cap recursion/event count, catch script errors, log severity/object/event/line/column/stack excerpt, and preserve rendering stability.

- [ ] **Step 4: Verify viewer operations**

Viewer event logs must support filter, clear, export, Chinese/English labels, and navigation back into the designer event editor where the host provides it.

- [ ] **Step 5: Commit event closure**

Commit message:

```text
feat(events): 完成事件系统发布闭环
```

## Final Verification

- [ ] Run full unit tests:

```powershell
pnpm test
```

- [ ] Run full build:

```powershell
pnpm build
```

- [ ] Check whitespace:

```powershell
git diff --check
```

- [ ] Browser smoke test example app:

```powershell
pnpm --filter @report-designer/example dev --host 127.0.0.1 --port 5184
```

Open `http://127.0.0.1:5184/`, verify sample preview, open designer, switch preview, table sample, event sample and page appearance sample.

- [ ] Final commit:

```text
chore(release): 完成0.0.1五项发布闭环
```
