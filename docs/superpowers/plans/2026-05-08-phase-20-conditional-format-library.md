# Phase 20 Conditional Format Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable conditional format library that lets components select a condition set and applies matching formatting during preview/print rendering.

**Architecture:** Extend the existing `ConditionalFormat` and `ConditionRule` model instead of introducing a parallel system. Components will reference one conditional format by id; the renderer will resolve the referenced library entry, evaluate rules top-to-bottom, apply visual overrides, and stop when `breakIfTrue` is set.

**Tech Stack:** TypeScript, React 19, AntD 6, Zustand store, Vitest, existing expression engine.

---

## Official Behavior Notes

The implementation follows the documented condition editor behavior:

- A component may have several conditions and their order defines processing priority.
- Rules are processed top-to-bottom; `Break if True` stops later rule processing after a match.
- Conditions are either `Value` or `Expression`.
- Value conditions use a column, data type, operator, and one or two values.
- Expression conditions evaluate a boolean expression.
- Formatting includes font, bold/italic/underline, text color, background color, border, style-like visual overrides, and component enabled state.
- Text-specific conditional text replacement is deferred to a later phase because the current text binding model is being simplified around `文本内容`.

Sources:

- https://www.reference-designer.com/documentation/en/user-manual/report_internals_conditional_formatting.htm
- https://www.reference-designer.com/documentation/en/user-manual/report_internals_conditional_formatting_value_condition.htm
- https://www.reference-designer.com/en/documentation/online/user-manual/report_internals_conditional_formatting_expression_condition.htm
- https://www.reference-designer.com/documentation/en/user-manual/report_internals_conditional_formatting_operations.htm
- https://www.reference-designer.com/manuals/en/user-manual/report_internals_conditional_formatting_defining_formatting.htm

---

## File Structure

- Modify `packages/core/src/template-model/types.ts`
  - Expand `ConditionRule`.
  - Add `conditionalFormat?: string` to `ReportComponent`.
- Create `packages/core/src/conditional-format/index.ts`
  - Normalize rule overrides.
  - Evaluate expression and value rules.
  - Resolve component-selected and historical `applyTo` condition formats.
- Modify `packages/core/src/index.ts`
  - Export conditional-format helpers.
- Modify `packages/core/src/render-engine/index.ts`
  - Use the shared conditional-format evaluator.
  - Apply `enabled === false` by skipping a rendered component.
- Create `packages/core/__tests__/phase-20-conditional-format.test.ts`
  - Cover expression, value operators, order, `breakIfTrue`, historical overrides, and component-selected formats.
- Replace/refactor `packages/designer/src/components/ConditionalFormatManager.tsx`
  - Library dialog with search/list, create/duplicate/delete, rule editor, condition type tabs, format preview, and compact icon controls.
- Modify `packages/designer/src/components/PropertyEditor.tsx`
  - Add a `条件格式` select and manage button for components.
- Modify `packages/designer/src/components/shell/DesignerShell.tsx`
  - Mount the conditional format dialog globally like the text style dialog.
- Modify `packages/designer/src/components/ribbon/DesignerRibbon.tsx`
  - Add a Conditions button in the Home/Styles group.
- Modify `packages/designer/src/store/designer-store.ts`
  - Add dialog open/close and CRUD actions.
  - Clear component references when deleting a conditional format.
- Modify `packages/designer/src/i18n/messages.ts`
  - Add Chinese/English labels.
- Create `packages/designer/src/__tests__/phase-20-conditional-format-library.test.tsx`
  - Cover dialog CRUD, component selection, and localization.
- Modify `packages/designer/src/__tests__/task-j-conditional-format.test.ts`
  - Update historical type tests to the expanded model.

---

## Task 1: Core Model and Evaluator

- [ ] Write failing tests in `packages/core/__tests__/phase-20-conditional-format.test.ts`.
- [ ] Extend `ConditionRule` with:
  - `conditionType?: 'expression' | 'value'`
  - `enabled?: boolean`
  - `breakIfTrue?: boolean`
  - `dataType?: 'string' | 'number' | 'date' | 'boolean' | 'expression'`
  - `field?: string`
  - `operator?: 'equalTo' | 'notEqualTo' | 'between' | 'notBetween' | 'greaterThan' | 'greaterThanOrEqualTo' | 'lessThan' | 'lessThanOrEqualTo' | 'containing' | 'notContaining' | 'beginningWith' | 'endingWith'`
  - `value?: string | number | boolean`
  - `valueTo?: string | number | boolean`
- [ ] Add `conditionalFormat?: string` to `ReportComponent`.
- [ ] Implement `evaluateConditionRule(rule, ctx)` and `applyConditionalFormatsToStyle(baseStyle, formats, comp, ctx)`.
- [ ] Preserve historical compatibility:
  - Existing `expression` means expression condition.
  - Existing `fontWeight`, `fontStyle`, `textDecoration`, `fontColor`, `fontSize`, `border` overrides map into `font` and `border`.
  - Existing `applyTo` still works.
- [ ] Run:
  - `pnpm --filter @report-designer/core test -- phase-20-conditional-format.test.ts`
  - Expected: pass.

## Task 2: Render Engine Integration

- [ ] Update `renderComponent` to use the shared conditional-format evaluator.
- [ ] If conditional formatting returns `enabled: false`, omit the rendered component.
- [ ] Keep style application deterministic: base component style, then referenced text style, then condition overrides in order.
- [ ] Run:
  - `pnpm --filter @report-designer/core test`
  - Expected: pass.

## Task 3: Store and Component Property Selection

- [ ] Add store fields/actions:
  - `conditionalFormatLibraryOpen`
  - `openConditionalFormatLibrary`
  - `closeConditionalFormatLibrary`
  - `createConditionalFormat`
  - `duplicateConditionalFormat`
  - `updateConditionalFormat`
  - `deleteConditionalFormat`
  - `applySelectedConditionalFormat`
- [ ] Add a component property row:
  - label `条件格式` / `Conditional format`
  - select existing format
  - clear selection
  - manage button opens the library dialog
- [ ] Deleting a format clears matching `component.conditionalFormat`.
- [ ] Write and run designer tests for property selection.

## Task 4: Conditional Format Library Dialog

- [ ] Replace the current manager with a library-style dialog:
  - left list with search, New, Duplicate, Delete
  - center rule list with rule order, enabled state, Break if True, add/delete rule
  - right property editor with General, Condition, Formatting, Preview sections
- [ ] Use compact icon controls for bold/italic/underline and alignment.
- [ ] Value condition editor:
  - field expression input or dictionary-style field text input
  - data type select
  - operator select filtered by data type
  - value input and range second value when needed
- [ ] Expression condition editor:
  - text area for boolean expression
  - validation hint, no runtime crash
- [ ] Formatting editor:
  - font color, background, font size, bold/italic/underline/strike
  - border style/width/color/sides
  - horizontal/vertical alignment
  - enabled switch
- [ ] Run dialog tests.

## Task 5: Ribbon and Shell Integration

- [ ] Mount `ConditionalFormatManager` in `DesignerShell`.
- [ ] Add Conditions button to Home/Styles group in `DesignerRibbon`.
- [ ] Add i18n keys in `messages.ts`.
- [ ] Confirm no external product names appear in UI strings.

## Task 6: Full Verification

- [ ] Run:
  - `pnpm --filter @report-designer/core test`
  - `pnpm --filter @report-designer/designer test`
  - `pnpm --filter @report-designer/designer build`
  - `git diff --check`
- [ ] Browser verify:
  - Open `http://127.0.0.1:5174/`.
  - Open designer.
  - Create a conditional format.
  - Select a text component and apply the conditional format.
  - Preview with sample data and verify the style change appears.

---

## Out of Scope for This Phase

- Chart conditional formatting.
- Data bars and color scales.
- Cross-table-only variables such as `value`, `tag`, `tooltip`, `hyperlink`.
- Conditional text replacement for text components.
