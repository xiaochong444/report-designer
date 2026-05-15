# Phase 19 Structured Text Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw format-string editing for common text formats with structured, previewable configuration while keeping Custom as the only raw-pattern mode.

**Architecture:** Core owns all formatting semantics through `TextFormatConfig` and `formatValue`, so designer preview, report preview, and print output stay consistent. The designer exposes a shared `TextFormatEditor` used by both component properties and the text style library. Text style binding paths include every style-managed format property so styled components cannot manually change copied style fields.

**Tech Stack:** TypeScript, React, Ant Design 6, Vitest, Vite.

---

### Task 1: Core Formatting Model

**Files:**
- Modify: `packages/core/src/template-model/types.ts`
- Modify: `packages/core/src/text-format/index.ts`
- Test: `packages/core/__tests__/phase-9-text-formatting.test.ts`

- [x] Add structured fields for separators, abbreviation, positive sign, percent symbol placement, and boolean input values.
- [x] Add tests covering custom separators, K/M/B abbreviation, currency positive sign, percent symbol text, and boolean input recognition.
- [x] Keep legacy `pattern` behavior for old templates and reserve raw pattern editing for `custom`.

### Task 2: Shared Designer Editor

**Files:**
- Modify: `packages/designer/src/components/TextFormatEditor.tsx`
- Modify: `packages/designer/src/i18n/messages.ts`
- Test: `packages/designer/src/__tests__/phase-17-text-style-library.test.tsx`

- [x] Add an inline preview panel driven by `formatValue`.
- [x] Show structured controls for common format types.
- [x] Show raw `pattern` only for Custom.
- [x] Add Chinese and English labels for all new controls.

### Task 3: Style Locking

**Files:**
- Modify: `packages/designer/src/text-style-bindings.ts`
- Test: `packages/designer/src/__tests__/phase-9-text-binding-style.test.tsx`
- Test: `packages/designer/src/__tests__/phase-17-text-style-library.test.tsx`

- [x] Add every new `format.*` field to text style bindings.
- [x] Copy these fields from style to component when a style is selected.
- [x] Filter manual component updates for all style-managed fields.

### Task 4: Verification

**Commands:**
- [x] `pnpm --filter @report-designer/core test`
- [x] `pnpm --filter @report-designer/designer test`
- [x] `pnpm build`
- [x] `git diff --check`
- [x] Browser smoke test against the example app.
