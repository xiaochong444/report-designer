# Phase 6 Examples And Regression Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add representative sample reports and regression tests that prove the designer, core engine, viewer, print, and PDF behavior stay aligned.

**Architecture:** Examples live in the example package and are also used as fixtures by core/viewer tests. Regression tests focus on final RenderDocument pages rather than implementation internals.

**Tech Stack:** TypeScript, React 19, Vite, Vitest, Testing Library, pdf-lib.

---

## File Structure

- Create: `packages/example/src/fixtures/json/employees.json`
- Create: `packages/example/src/fixtures/json/orders.json`
- Create: `packages/example/src/templates/grouped-employees.ts`
- Create: `packages/example/src/templates/invoice.ts`
- Create: `packages/example/src/templates/master-detail-orders.ts`
- Create: `packages/example/src/templates/long-text-pagination.ts`
- Create: `packages/core/__tests__/fixtures/templates.ts`
- Create: `packages/core/__tests__/phase-6-regression-renderdocument.test.ts`
- Create: `packages/viewer/src/__tests__/phase-6-regression-viewer.test.tsx`
- Modify: `packages/example/src/App.tsx`

## Tasks

### Task 1: Add JSON Fixtures

- [x] **Step 1: Create employees fixture**

Include at least 40 rows across 4 departments with numeric salaries and dates.

- [x] **Step 2: Create orders fixture**

Include at least 10 orders. Each order should contain nested `lines` with sku, name, qty, unitPrice, and lineTotal.

### Task 2: Add Template Fixtures

- [x] **Step 1: Create grouped employees report**

Bands:

- ReportTitle
- PageHeader
- Header
- GroupHeader by department
- Data
- GroupFooter with count and salary sum
- Footer with report total
- PageFooter with page number

- [x] **Step 2: Create invoice report**

Bands:

- ReportTitle
- Header customer/order metadata
- Data lines
- Footer subtotal/tax/total
- PageFooter

- [x] **Step 3: Create master-detail orders report**

Bands:

- Master DataBand for order
- Child/detail DataBand for order lines
- Group/report totals

- [x] **Step 4: Create long text pagination report**

Include text with `canGrow` that forces page breaks.

### Task 3: Core Regression Tests

- [x] **Step 1: Write RenderDocument tests**

Assert:

- grouped employees has more than one page
- every page has page header and page footer
- group footer totals equal fixture sums
- invoice total equals line totals
- long-text report does not overflow page content area

- [x] **Step 2: Run core regression tests**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-6
```

Expected: PASS.

### Task 4: Viewer Regression Tests

- [x] **Step 1: Write viewer tests**

Render each template and assert page count, key labels, and page number text appear.

- [x] **Step 2: Run viewer regression tests**

Run:

```bash
pnpm --filter @report-designer/viewer test -- phase-6
```

Expected: PASS.

### Task 5: Example App Template Picker

- [x] **Step 1: Modify `App.tsx`**

Add a compact template picker inside the designer shell or example wrapper:

- Grouped Employees
- Invoice
- Master Detail Orders
- Long Text Pagination

- [x] **Step 2: Browser smoke check**

Run:

```bash
pnpm --filter @report-designer/example dev
```

Open the app, switch templates, preview, export PDF for at least one template.

### Task 6: Commit

- [x] **Step 1: Commit**

```bash
git add packages/example/src packages/core/__tests__ packages/viewer/src/__tests__
git commit -m "test(report): 增加典型打印报表回归样例"
```
