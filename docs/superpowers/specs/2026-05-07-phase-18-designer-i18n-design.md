# Phase 18: Designer I18n Design

## Goal

Add a lightweight multilingual foundation for the designer and remove the current Chinese/English mix from the most visible designer surfaces. This phase supports Simplified Chinese and English first.

## Scope

1. Add a designer-local i18n module with `zh-CN` and `en-US` dictionaries.
2. Add a `locale` prop to `Designer`, defaulting to `zh-CN`.
3. Provide a small `useDesignerI18n()` hook with `t(key)` and interpolation.
4. Localize the designer shell, quick access tooltips, Ribbon tabs/groups/commands, and text style library dialog.
5. Add an example language selector that passes the selected locale into `Designer`.
6. Add regression tests for Chinese and English text style library rendering.

## Non-Goals

- Translating every historical test fixture name.
- Translating report template data or user-authored report content.
- Translating viewer output in this phase.
- Introducing a full external i18n runtime.
- Browser language auto-detection.

## Current Gap

The designer currently mixes English and Chinese in one surface. For example, the text style library contains `Text Style Library`, `Preview`, `Properties`, `应用边`, and `上/右/下/左` together. The Ribbon and quick access bar also use hardcoded English labels.

This creates two problems:

- Users cannot switch the designer to a consistent language.
- Tests and UI code depend directly on display strings, making later localization harder.

## Design

### Locale Model

Supported locales:

```ts
export type DesignerLocale = 'zh-CN' | 'en-US';
```

`Designer` accepts:

```ts
interface DesignerProps {
  locale?: DesignerLocale;
}
```

If omitted, the designer uses `zh-CN`.

### I18n Provider

Create `DesignerI18nProvider` around the shell. Child components access translations with:

```ts
const { locale, t } = useDesignerI18n();
t('styleLibrary.title');
t('styleLibrary.deleteInUse', { count: 3 });
```

The provider stays inside `@report-designer/designer` so the example app and other hosts do not need extra setup.

### Dictionary Shape

Use a flat key map:

```ts
type DesignerMessages = Record<string, string>;
```

Flat keys keep incremental adoption simple and avoid a large nested typing system before the coverage is complete.

### Initial Coverage

This phase localizes:

- Designer shell quick access: new, open, save, undo, redo, title fallback, designer label.
- Ribbon tabs and groups: home, insert, page layout, preview, file, history, clipboard, font, alignment, borders, styles, data, bands, components, page setup, margins.
- Style library dialog: title, search, actions, preview, properties, groups, border, padding, delete confirmation, empty states, tooltips, format labels, alignment labels.
- Example shell controls: sample title, open designer, return to preview, language selector.

### Testing

Add focused tests that render `Designer locale="zh-CN"` and `Designer locale="en-US"`:

- Chinese mode shows Chinese style library labels and does not show key English labels such as `Text Style Library`.
- English mode shows English style library labels and does not show Chinese control labels such as `应用边`.
- Existing style editing tests continue using accessible labels through the locale-aware strings.

## Rollout

1. Add i18n infrastructure and provider.
2. Localize the text style library first because it has the most visible mixed-language issue.
3. Localize the shell and Ribbon labels.
4. Add example language switch.
5. Run designer tests, designer build, and example build.
