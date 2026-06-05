# Expression Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand built-in expression functions, system variables, and format snippets, and allow hosts to inject custom functions, variables, and formats without duplicate names.

**Architecture:** Add a focused expression catalog extension module that merges built-ins with host-provided extensions. Expression tree, Monaco completion, validation, and preview execution all receive the same resolved catalog so suggestions and runtime behavior stay aligned.

**Tech Stack:** TypeScript, React, AntD Tree/Input.Search, Monaco editor helpers, Vitest, existing core expression evaluator.

---

### Task 1: Catalog Model And Deduplication

**Files:**
- Create: `packages/designer/src/expression/expression-catalog.ts`
- Modify: `packages/designer/src/expression/function-catalog.ts`
- Test: `packages/designer/src/__tests__/phase-45-expression-extensions.test.ts`

- [ ] Write failing tests for merging custom functions, variables, and formats, including duplicate built-in function/variable/format rejection by keeping the built-in item.
- [ ] Implement `ExpressionCatalogExtensions`, `ResolvedExpressionCatalog`, and `resolveExpressionCatalog`.
- [ ] Add more built-in functions, variables, and formats in catalog form.

### Task 2: Monaco, Validation, Preview Runtime

**Files:**
- Modify: `packages/designer/src/components/expression/expression-monaco.ts`
- Modify: `packages/designer/src/components/expression/ExpressionMonacoEditor.tsx`
- Modify: `packages/designer/src/expression/expression-validation.ts`
- Modify: `packages/designer/src/expression/expression-preview.ts`
- Modify: `packages/core/src/expression-engine/evaluator.ts`
- Test: `packages/designer/src/__tests__/phase-45-expression-extensions.test.ts`

- [ ] Write failing tests proving custom function completions, variable completions, format completions, validation, and preview execution work from one extension object.
- [ ] Pass resolved catalog through Monaco and validation.
- [ ] Extend evaluator with optional custom function registry and variables for preview execution.

### Task 3: Expression Editor And Designer API

**Files:**
- Modify: `packages/designer/src/components/ExpressionEditor.tsx`
- Modify: `packages/designer/src/components/Designer.tsx`
- Modify: `packages/designer/src/index.ts`
- Modify call sites in property panels.
- Test: `packages/designer/src/__tests__/phase-16-dictionary-expression-shell.test.tsx`

- [ ] Write failing tests proving injected custom entries appear in the right-side tree with localized descriptions and duplicates do not appear twice.
- [ ] Add `expressionExtensions` prop to `Designer` and `ExpressionEditor`.
- [ ] Resolve catalog once per editor and use it for tree, Monaco, validation, and preview.

### Task 4: Example And Verification

**Files:**
- Modify: `packages/example/src/App.tsx`

- [ ] Add custom function examples `DISCOUNT` and `MASKPHONE`, custom variable `{TenantName}`, and custom format `FORMAT("CN_DATE", value)`.
- [ ] Run targeted tests, build, diff check, and commit.
