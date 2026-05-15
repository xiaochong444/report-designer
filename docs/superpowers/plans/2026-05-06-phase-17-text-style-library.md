# Text Style Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reference-style report-level text style library with dedicated management UI, default text style seeding, and style-to-component distribution with controlled field sync.

**Architecture:** Extend the current `template.styles` asset model instead of introducing a new asset store. When a style is assigned, copy style-defined values into the component and record which fields remain style-controlled. Style edits then resync those bound fields across referencing components, so designer preview plus viewer/print all consume the same final component values directly.

**Tech Stack:** TypeScript, React, Zustand, Ant Design 6, `@report-designer/core`, `@report-designer/designer`, `@report-designer/viewer`, `pnpm`

---

## File Map

### Core

- Modify: `D:/sources/report-designer/packages/core/src/template-model/types.ts`
- Modify: `D:/sources/report-designer/packages/core/src/template-model/template.ts`
- Modify: `D:/sources/report-designer/packages/core/src/index.ts`
- Create: `D:/sources/report-designer/packages/core/src/text-style/resolve-text-style.ts`
- Create: `D:/sources/report-designer/packages/core/src/text-style/index.ts`
- Modify: `D:/sources/report-designer/packages/core/src/render-engine/index.ts`
- Test: `D:/sources/report-designer/packages/core/__tests__/phase-17-text-style-resolution.test.ts`

### Designer

- Modify: `D:/sources/report-designer/packages/designer/src/store/designer-store.ts`
- Modify: `D:/sources/report-designer/packages/designer/src/components/PropertyEditor.tsx`
- Modify: `D:/sources/report-designer/packages/designer/src/components/ribbon/the reference designerRibbon.tsx`
- Modify: `D:/sources/report-designer/packages/designer/src/components/LeftPanel.tsx`
- Create: `D:/sources/report-designer/packages/designer/src/components/TextStyleLibraryDialog.tsx`
- Test: `D:/sources/report-designer/packages/designer/src/__tests__/phase-17-text-style-library.test.tsx`

### Viewer / Print

- Modify: `D:/sources/report-designer/packages/viewer/src/renderers/dom/renderComponent.tsx`
- Modify: `D:/sources/report-designer/packages/viewer/src/print/print-frame.ts`
- Test: `D:/sources/report-designer/packages/viewer/src/__tests__/phase-17-text-style-parity.test.tsx`

### Example Templates

- Modify: `D:/sources/report-designer/packages/example/src/templates/common.ts`
- Modify: `D:/sources/report-designer/packages/example/src/templates/grouped-employees.ts`
- Modify: `D:/sources/report-designer/packages/example/src/templates/invoice.ts`
- Modify: `D:/sources/report-designer/packages/example/src/templates/master-detail-orders.ts`
- Modify: `D:/sources/report-designer/packages/example/src/templates/long-text-pagination.ts`
- Test: `D:/sources/report-designer/packages/example/src/__tests__/sample-designer-toggle.test.tsx`

---

### Task 1: Core Text Style Model and Resolver

**Files:**
- Modify: `D:/sources/report-designer/packages/core/src/template-model/types.ts`
- Modify: `D:/sources/report-designer/packages/core/src/template-model/template.ts`
- Modify: `D:/sources/report-designer/packages/core/src/index.ts`
- Create: `D:/sources/report-designer/packages/core/src/text-style/resolve-text-style.ts`
- Create: `D:/sources/report-designer/packages/core/src/text-style/index.ts`
- Test: `D:/sources/report-designer/packages/core/__tests__/phase-17-text-style-resolution.test.ts`

- [ ] **Step 1: Write the failing core tests for style resolution and default-style selection**

Cover:
- legacy styles without `category`
- one `isDefault` text style
- local text component overrides winning over style values
- style values winning over intrinsic text defaults

Run:
```bash
pnpm --filter @report-designer/core test -- --runInBand phase-17-text-style-resolution
```

Expected:
- missing module or failing assertions because the resolver and expanded type shape do not exist yet

- [ ] **Step 2: Expand `ReportStyle` into a text-style-focused asset**

Add to `D:/sources/report-designer/packages/core/src/template-model/types.ts`:
- `category: 'text'`
- `textAlign`
- `verticalAlign`
- `padding`
- `format`
- `canGrow`
- `canShrink`
- `isDefault`

Keep compatibility:
- allow old styles to load without `category`
- avoid widening scope into non-text component styles

- [ ] **Step 3: Seed baseline text styles in the default template**

Update `D:/sources/report-designer/packages/core/src/template-model/template.ts` so new templates include:
- `Normal`
- `Title`
- `Header`
- `Data`
- `Footer`
- `Group`

Mark only one style as `isDefault`.

- [ ] **Step 4: Implement shared resolution helpers**

Create `D:/sources/report-designer/packages/core/src/text-style/resolve-text-style.ts` with helpers for:
- locating a text style by id
- locating the default text style
- resolving final text component display props with precedence:
  - component-local values
  - referenced style values
  - intrinsic defaults

Export from `D:/sources/report-designer/packages/core/src/text-style/index.ts` and `D:/sources/report-designer/packages/core/src/index.ts`.

- [ ] **Step 5: Run core tests and commit**

Run:
```bash
pnpm --filter @report-designer/core test -- --runInBand phase-17-text-style-resolution
```

Expected:
- PASS

Commit:
```bash
git add packages/core/src/template-model/types.ts packages/core/src/template-model/template.ts packages/core/src/text-style packages/core/src/index.ts packages/core/__tests__/phase-17-text-style-resolution.test.ts
git commit -m "feat(core): 增强文本样式模型与解析"
```

### Task 2: Render Engine Support for Style-Controlled Component Values

**Files:**
- Modify: `D:/sources/report-designer/packages/core/src/render-engine/index.ts`
- Test: `D:/sources/report-designer/packages/core/__tests__/phase-17-text-style-resolution.test.ts`

- [ ] **Step 1: Extend tests to assert resolved render-document text style output**

Add coverage for:
- text component with `style: <styleId>`
- text component with style-controlled values already copied onto the component
- resolved font, alignment, background, border, padding, format, and grow/shrink values in render output

Run:
```bash
pnpm --filter @report-designer/core test -- --runInBand phase-17-text-style-resolution
```

Expected:
- FAIL because render-engine still omits part of the text-style payload needed by downstream consumers

- [ ] **Step 2: Keep render-engine aligned with the new style-controlled component model**

In `D:/sources/report-designer/packages/core/src/render-engine/index.ts`:
- treat text components as already carrying their final synced values
- only use shared helper support where needed for backwards-compatible style payload shaping
- carry full text-style payload fields needed downstream, including padding
- avoid changing non-text component behavior

- [ ] **Step 3: Re-run targeted core tests and commit**

Run:
```bash
pnpm --filter @report-designer/core test -- --runInBand phase-17-text-style-resolution
```

Expected:
- PASS

Commit:
```bash
git add packages/core/src/render-engine/index.ts packages/core/__tests__/phase-17-text-style-resolution.test.ts
git commit -m "feat(core): 统一文本样式渲染解析"
```

### Task 3: Designer Store Actions, Style-Controlled Fields, and Default Text Insertion

**Files:**
- Modify: `D:/sources/report-designer/packages/designer/src/store/designer-store.ts`
- Modify: `D:/sources/report-designer/packages/designer/src/components/LeftPanel.tsx`
- Test: `D:/sources/report-designer/packages/designer/src/__tests__/phase-17-text-style-library.test.tsx`

- [ ] **Step 1: Write the failing designer-store tests**

Cover:
- creating a style
- duplicating a style
- renaming a style
- deleting a style with in-use count
- applying a style to selected text components
- recording style-controlled fields on selected text components
- resyncing referencing components when a style changes
- new text insertion using the default text style id

Run:
```bash
pnpm --filter @report-designer/designer test -- --runInBand phase-17-text-style-library
```

Expected:
- FAIL because the store has no style-library CRUD API

- [ ] **Step 2: Add style-library actions to the store**

Add store actions in `D:/sources/report-designer/packages/designer/src/store/designer-store.ts`:
- `createTextStyle`
- `duplicateTextStyle`
- `renameTextStyle`
- `updateTextStyle`
- `deleteTextStyle`
- `setDefaultTextStyle`
- `applyTextStyleToSelection`
- `getTextStyleUsageCount`
- `releaseTextStyleField`
- `syncTextStyleReferences`

Delete behavior should:
- detect references from report components
- support removing references from affected text components when confirmed

- [ ] **Step 3: Attach default text style to new text components**

Update text insertion in `D:/sources/report-designer/packages/designer/src/components/LeftPanel.tsx` so new text controls:
- receive the default style id when present
- receive style-defined values copied into the component
- receive style-controlled-field markers
- still get component auto-names through existing insert normalization

- [ ] **Step 4: Run targeted designer tests and commit**

Run:
```bash
pnpm --filter @report-designer/designer test -- --runInBand phase-17-text-style-library
```

Expected:
- PASS

Commit:
```bash
git add packages/designer/src/store/designer-store.ts packages/designer/src/components/LeftPanel.tsx packages/designer/src/__tests__/phase-17-text-style-library.test.tsx
git commit -m "feat(designer): 增加文本样式库状态与默认样式插入"
```

### Task 4: Style Designer UI and Property-Panel Fast Apply

**Files:**
- Create: `D:/sources/report-designer/packages/designer/src/components/TextStyleLibraryDialog.tsx`
- Modify: `D:/sources/report-designer/packages/designer/src/components/PropertyEditor.tsx`
- Modify: `D:/sources/report-designer/packages/designer/src/components/ribbon/the reference designerRibbon.tsx`
- Test: `D:/sources/report-designer/packages/designer/src/__tests__/phase-17-text-style-library.test.tsx`

- [ ] **Step 1: Extend designer UI tests for dialog flow**

Cover:
- ribbon command opens the style designer
- property-panel `Manage` opens the same dialog
- selecting a style from the property-panel dropdown updates the current text component
- `Apply to Selected` updates multiple selected text components
- style-controlled fields render disabled state
- field-level release from style control works

Run:
```bash
pnpm --filter @report-designer/designer test -- --runInBand phase-17-text-style-library
```

Expected:
- FAIL because the dialog and commands do not exist

- [ ] **Step 2: Build `TextStyleLibraryDialog`**

Implement a compact three-area shell:
- left searchable style list
- middle live sample preview
- right grouped property editor

Include actions:
- `New`
- `Duplicate`
- `Rename`
- `Delete`
- `Set Default`
- `Apply to Selected`

Use current Ant Design 6 APIs only.

- [ ] **Step 3: Wire entry points**

In `D:/sources/report-designer/packages/designer/src/components/PropertyEditor.tsx`:
- keep the compact `Text Style` dropdown
- add `Manage` action next to it
- show style-controlled fields as disabled
- provide field-level `解除样式控制` where supported

In `D:/sources/report-designer/packages/designer/src/components/ribbon/the reference designerRibbon.tsx`:
- add a `Styles` ribbon group on `Home`
- add `Style Designer` command

- [ ] **Step 4: Run targeted designer tests and commit**

Run:
```bash
pnpm --filter @report-designer/designer test -- --runInBand phase-17-text-style-library
```

Expected:
- PASS

Commit:
```bash
git add packages/designer/src/components/TextStyleLibraryDialog.tsx packages/designer/src/components/PropertyEditor.tsx packages/designer/src/components/ribbon/the reference designerRibbon.tsx packages/designer/src/__tests__/phase-17-text-style-library.test.tsx
git commit -m "feat(designer): 增加文本样式库管理界面"
```

### Task 5: Viewer and Print Parity

**Files:**
- Modify: `D:/sources/report-designer/packages/viewer/src/renderers/dom/renderComponent.tsx`
- Modify: `D:/sources/report-designer/packages/viewer/src/print/print-frame.ts`
- Test: `D:/sources/report-designer/packages/viewer/src/__tests__/phase-17-text-style-parity.test.tsx`

- [ ] **Step 1: Write the failing parity tests**

Cover:
- preview DOM text alignment from final synced component values
- preview DOM explicit released-field overrides beating the style-controlled value
- print HTML carrying the same final font, alignment, background, border, and padding values

Run:
```bash
pnpm --filter @report-designer/viewer test -- --runInBand phase-17-text-style-parity
```

Expected:
- FAIL because viewer and print still omit part of the final text-style payload or diverge from synced component values

- [ ] **Step 2: Consume resolved text-style fields without duplicating merge logic**

Update:
- `D:/sources/report-designer/packages/viewer/src/renderers/dom/renderComponent.tsx`
- `D:/sources/report-designer/packages/viewer/src/print/print-frame.ts`

Rules:
- do not re-implement style precedence in viewer
- consume the final text style payload already present on rendered components
- preserve existing preview/print alignment fix behavior

- [ ] **Step 3: Run viewer parity tests and commit**

Run:
```bash
pnpm --filter @report-designer/viewer test -- --runInBand phase-17-text-style-parity
```

Expected:
- PASS

Commit:
```bash
git add packages/viewer/src/renderers/dom/renderComponent.tsx packages/viewer/src/print/print-frame.ts packages/viewer/src/__tests__/phase-17-text-style-parity.test.tsx
git commit -m "fix(viewer): 保持文本样式预览与打印一致"
```

### Task 6: Example Style Seeds and Full Verification

**Files:**
- Modify: `D:/sources/report-designer/packages/example/src/templates/common.ts`
- Modify: `D:/sources/report-designer/packages/example/src/templates/grouped-employees.ts`
- Modify: `D:/sources/report-designer/packages/example/src/templates/invoice.ts`
- Modify: `D:/sources/report-designer/packages/example/src/templates/master-detail-orders.ts`
- Modify: `D:/sources/report-designer/packages/example/src/templates/long-text-pagination.ts`
- Modify: `D:/sources/report-designer/packages/example/src/__tests__/sample-designer-toggle.test.tsx`

- [ ] **Step 1: Add example style seeds and make templates consume them**

Update `D:/sources/report-designer/packages/example/src/templates/common.ts` to provide reusable text styles for:
- title
- page header
- header
- data
- footer
- group

Then update the example templates to reference those styles where appropriate instead of repeating local font/alignment declarations everywhere.

- [ ] **Step 2: Extend example tests to assert style-library-backed templates still open in the sample designer**

Run:
```bash
pnpm --filter @report-designer/example test -- --runInBand sample-designer-toggle
```

Expected:
- PASS

- [ ] **Step 3: Run the full verification matrix**

Run:
```bash
pnpm --filter @report-designer/core test
pnpm --filter @report-designer/designer test
pnpm --filter @report-designer/viewer test
pnpm --filter @report-designer/example test
pnpm --filter @report-designer/designer build
pnpm --filter @report-designer/viewer build
pnpm --filter @report-designer/example build
```

Expected:
- all commands exit 0

- [ ] **Step 4: Browser verification**

Verify in the running example app:
- open a sample report
- open designer
- open `Style Designer`
- assign `Title` style to a text component
- confirm designer canvas preview updates
- switch to preview or print path
- confirm text alignment and visual style match the canvas behavior

- [ ] **Step 5: Commit**

```bash
git add packages/example/src/templates/common.ts packages/example/src/templates/grouped-employees.ts packages/example/src/templates/invoice.ts packages/example/src/templates/master-detail-orders.ts packages/example/src/templates/long-text-pagination.ts packages/example/src/__tests__/sample-designer-toggle.test.tsx
git commit -m "feat(example): 接入文本样式库示例模板"
```

---

## Self-Review

### Spec Coverage

- style manager UI: covered by Task 4
- property-panel quick apply: covered by Task 4
- expanded `template.styles` model: covered by Task 1
- style distribution plus preview/print parity: covered by Tasks 2, 3, and 5
- default A4 style seed set: covered by Tasks 1 and 6

### Placeholder Scan

- no `TODO`, `TBD`, or deferred implementation markers remain
- each task names exact files and verification commands

### Type Consistency

- `ReportStyle` remains stored in `template.styles`
- default style is represented by `isDefault`
- component references remain `style: string`
- viewer consumes resolved style output from core rather than inventing a second merge path
