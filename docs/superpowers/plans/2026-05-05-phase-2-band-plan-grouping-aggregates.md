# Phase 2 Band Plan Grouping And Aggregates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the semantic layer that makes bands, groups, child bands, and totals behave like a print report engine instead of static page sections.

**Architecture:** Build a `BandPlan` from Template V2, then execute it against JSON rows. Aggregates are computed through a runtime context with report, group, page, and running scopes.

**Tech Stack:** TypeScript, Vitest, existing `@report-designer/core` expression engine.

---

## File Structure

- Create: `packages/core/src/band-planner/band-plan.ts`
- Create: `packages/core/src/band-planner/build-band-plan.ts`
- Create: `packages/core/src/band-planner/execute-band-plan.ts`
- Create: `packages/core/src/aggregate-engine/aggregate-types.ts`
- Create: `packages/core/src/aggregate-engine/aggregate-runtime.ts`
- Create: `packages/core/src/expression-engine/report-functions.ts`
- Modify: `packages/core/src/expression-engine/evaluator.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/__tests__/phase-2-band-plan.test.ts`
- Test: `packages/core/__tests__/phase-2-grouping.test.ts`
- Test: `packages/core/__tests__/phase-2-aggregates.test.ts`

## Tasks

### Task 1: Build DataBand-Owned Band Plans

- [ ] **Step 1: Write tests for band association**

Template sequence:

```text
pageHeader, reportTitle, header, groupHeader, data, groupFooter, footer, reportSummary, pageFooter
```

Expected:

- `pageHeader` is a page band.
- `reportTitle` and `reportSummary` are report bands.
- `header/groupHeader/groupFooter/footer` are associated with the nearest `data` band according to Stimulsoft-style order.

- [ ] **Step 2: Implement `buildBandPlan(template)`**

Return:

```ts
interface BandPlan {
  pageBands: { pageHeader: ReportBandV2[]; pageFooter: ReportBandV2[]; overlay: ReportBandV2[] };
  reportBands: { reportTitle: ReportBandV2[]; reportSummary: ReportBandV2[] };
  dataSections: DataSectionPlan[];
}

interface DataSectionPlan {
  dataBand: ReportBandV2;
  headers: ReportBandV2[];
  groupPairs: Array<{ header: ReportBandV2; footer?: ReportBandV2 }>;
  columnHeaders: ReportBandV2[];
  columnFooters: ReportBandV2[];
  childBands: ReportBandV2[];
  footers: ReportBandV2[];
  emptyDataBands: ReportBandV2[];
}
```

### Task 2: Execute Data Rows And Groups

- [ ] **Step 1: Write grouping tests**

Given rows sorted by `department`, a GroupHeader with `{employees.Department}` should emit:

```text
groupHeader Engineering
data Alice
data Bob
groupFooter Engineering
groupHeader Sales
data Cara
groupFooter Sales
```

- [ ] **Step 2: Implement `executeBandPlan(plan, data, expressionRuntime)`**

Output logical items:

```ts
type LogicalBandItem =
  | { kind: 'band'; band: ReportBandV2; context: RenderContextV2 }
  | { kind: 'pageBreak'; reason: string };
```

Each data row receives context:

```ts
{
  row,
  rowIndex,
  dataSourceId,
  groupValues,
  parentRow
}
```

### Task 3: Add Aggregate Runtime

- [ ] **Step 1: Write aggregate tests**

Cover:

- `Sum(dataBandName, "{employees.Salary}")`
- `Avg(dataBandName, "{employees.Salary}")`
- `Count(dataBandName)`
- `CountDistinct(dataBandName, "{employees.Department}")`
- `SumIf(dataBandName, "{employees.Salary}", "{employees.Department} = \"Engineering\"")`
- `Totals.Sum("{employees.Salary}")`
- running total by data row.

- [ ] **Step 2: Implement `AggregateRuntime`**

The runtime should support these scopes:

- `report`
- `group`
- `page`
- `running`

Use deterministic keys:

```ts
`${scope}:${bandName}:${functionName}:${expression}:${condition ?? ''}`
```

### Task 4: Wire Aggregate Functions Into Expressions

- [ ] **Step 1: Add report function registry**

Create `report-functions.ts` with functions:

- `SUM`
- `AVG`
- `MIN`
- `MAX`
- `COUNT`
- `COUNTDISTINCT`
- `SUMIF`
- `COUNTIF`
- `RUNNINGSUM`
- `PAGE`
- `TOTALPAGES`

- [ ] **Step 2: Modify evaluator context**

Extend `EvalContext` with optional `reportRuntime`.

Scalar calls such as `SUM(1, 2, 3)` should keep current behavior. Band calls such as `SUM("DataBand1", "{Orders.Total}")` should delegate to the aggregate runtime.

### Task 5: Verify

- [ ] **Step 1: Run core phase tests**

Run:

```bash
pnpm --filter @report-designer/core test -- phase-2
pnpm --filter @report-designer/core build
```

Expected: PASS.

- [ ] **Step 2: Commit**

```bash
git add packages/core/src packages/core/__tests__
git commit -m "feat(core): 增加band计划分组和聚合运行时"
```
