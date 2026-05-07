# Phase 18 Designer I18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Chinese/English language support to the designer and remove mixed-language text from the main designer shell and text style library.

**Architecture:** Add a designer-local i18n provider and dictionary, then pass `locale` from `Designer` into the shell. Components call `useDesignerI18n().t(key)` for display labels while report template content remains unchanged.

**Tech Stack:** TypeScript, React context, Ant Design 6, Vitest, Testing Library, Vite example app.

---

## File Map

- Create: `D:/sources/report-designer/packages/designer/src/i18n/messages.ts`
- Create: `D:/sources/report-designer/packages/designer/src/i18n/DesignerI18nProvider.tsx`
- Create: `D:/sources/report-designer/packages/designer/src/i18n/index.ts`
- Modify: `D:/sources/report-designer/packages/designer/src/components/Designer.tsx`
- Modify: `D:/sources/report-designer/packages/designer/src/components/shell/DesignerShell.tsx`
- Modify: `D:/sources/report-designer/packages/designer/src/components/ribbon/DesignerRibbon.tsx`
- Modify: `D:/sources/report-designer/packages/designer/src/components/TextStyleLibraryDialog.tsx`
- Modify: `D:/sources/report-designer/packages/designer/src/index.ts`
- Modify: `D:/sources/report-designer/packages/designer/src/__tests__/phase-17-text-style-library.test.tsx`
- Modify: `D:/sources/report-designer/packages/example/src/App.tsx`
- Modify: `D:/sources/report-designer/packages/example/src/__tests__/sample-designer-toggle.test.tsx`

---

### Task 1: I18n Infrastructure

- [ ] **Step 1: Write a failing test for Chinese and English style library labels**

Add tests to `D:/sources/report-designer/packages/designer/src/__tests__/phase-17-text-style-library.test.tsx`:

```tsx
it('renders the text style library in Chinese by default', async () => {
  const template = createDefaultTemplate('Style Designer Chinese');
  await renderDesignerWithSelection(template);
  const dialog = await openTextStyleLibraryFromRibbon();
  expect(within(dialog).getByText('文本样式库')).toBeInTheDocument();
  expect(within(dialog).queryByText('Text Style Library')).not.toBeInTheDocument();
});

it('renders the text style library in English when requested', async () => {
  const template = createDefaultTemplate('Style Designer English');
  render(<Designer template={template} locale="en-US" />);
  fireEvent.click(await screen.findByText('Style Designer'));
  const dialog = await findTextStyleLibraryDialog();
  expect(within(dialog).getByText('Text Style Library')).toBeInTheDocument();
  expect(within(dialog).queryByText('文本样式库')).not.toBeInTheDocument();
});
```

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-17-text-style-library.test.tsx -t "text style library in"
```

Expected: fails because `locale` and translated labels do not exist yet.

- [ ] **Step 2: Add i18n files**

Create `messages.ts` with `zh-CN` and `en-US` maps. Create `DesignerI18nProvider.tsx` with `DesignerLocale`, `useDesignerI18n`, and interpolation support.

- [ ] **Step 3: Wrap the designer**

Modify `Designer.tsx` so `Designer` accepts `locale?: DesignerLocale` and wraps `DesignerShell` in `DesignerI18nProvider`.

- [ ] **Step 4: Export i18n types**

Modify `index.ts` to export `DesignerLocale`, `DesignerI18nProvider`, and `useDesignerI18n`.

### Task 2: Text Style Library Localization

- [ ] **Step 1: Replace hardcoded style library labels**

Modify `TextStyleLibraryDialog.tsx` so modal title, search placeholder, action labels, group titles, border labels, padding direction labels, delete confirmation, empty states, and buttons use `t(key)`.

- [ ] **Step 2: Run the focused tests**

Run:

```bash
pnpm --filter @report-designer/designer test -- phase-17-text-style-library.test.tsx
```

Expected: all style library tests pass.

### Task 3: Shell, Ribbon, and Example Switch

- [ ] **Step 1: Localize designer shell and Ribbon**

Modify `DesignerShell.tsx` and `DesignerRibbon.tsx` to use `t(key)` for visible labels and tooltips.

- [ ] **Step 2: Add example locale selector**

Modify `packages/example/src/App.tsx` to store `locale`, show a compact selector with `中文` and `English`, and pass it into `Designer`.

- [ ] **Step 3: Update example tests**

Modify `sample-designer-toggle.test.tsx` to verify the designer still opens and that changing language to English passes `locale="en-US"` behavior through visible UI text.

### Task 4: Verification

- [ ] **Step 1: Run designer tests**

```bash
pnpm --filter @report-designer/designer test -- phase-17-text-style-library.test.tsx
```

- [ ] **Step 2: Run designer build**

```bash
pnpm --filter @report-designer/designer build
```

- [ ] **Step 3: Run example tests and build**

```bash
pnpm --filter @report-designer/example test
pnpm --filter @report-designer/example build
```

- [ ] **Step 4: Browser check**

Open the example, enter the designer, switch languages, and verify the style library title changes between `文本样式库` and `Text Style Library`.
