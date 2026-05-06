# Phase 17: Text Style Library Design

## Goal

Bring the current text style workflow closer to Stimulsoft Reports by replacing the single property dropdown with a real text style library. This phase focuses only on text-oriented styles and their management flow.

## Scope

1. Add a dedicated text style library manager for creating, previewing, editing, duplicating, renaming, deleting, and applying text styles.
2. Keep a lightweight style picker in the property panel for fast component-level usage.
3. Expand the current `template.styles` model so text styles can carry typography, alignment, border, background, padding, formatting, and grow/shrink behavior.
4. Make designer preview and print/viewer output resolve text styles through the same merge logic.
5. Seed example templates with a small default A4 text-style set.

## Non-Goals

- Table theme libraries
- Band style libraries
- Cross-report import/export of style packs
- Style inheritance chains
- Conditional format and style-library unification

## Current Gap

The current designer supports only a simple style reference on text components:

- `template.styles` exists but stores a narrow `ReportStyle` structure.
- The property editor exposes only a dropdown to assign a style to the selected text component.
- There is no style manager, no preview, no duplicate/rename flow, no default-style concept, and no shared resolution layer that can be clearly reasoned about across designer preview and printing.

That gap makes the feature feel unlike Stimulsoft Reports, where styles are a reusable report-level asset rather than a loose select box.

## User Experience Design

### Entry Points

The text style library is entered from two places:

1. Ribbon `Home` tab, `Styles` group, primary command: `Style Designer`
2. Text component property editor, `Text Style` field, with:
   - a compact style dropdown
   - a secondary `Manage` button that opens the style designer

This keeps high-frequency assignment quick while moving style maintenance into a dedicated surface.

### Style Designer Layout

The style designer should follow a compact desktop-tool layout inspired by Stimulsoft:

- Left column: searchable style list
- Center column: live style preview
- Right column: grouped property editor
- Top or bottom actions: `New`, `Duplicate`, `Rename`, `Delete`, `Set Default`, `Apply to Selected`

The style list should show style name only. No noisy metadata rows are needed in this phase.

### Default Seed Styles

New templates and example templates should include a small baseline text-style set:

- `Normal`
- `Title`
- `Header`
- `Data`
- `Footer`
- `Group`

These are report-level assets, not hardcoded UI presets. Users can edit or delete them.

## Data Model Design

The existing `ReportStyle` model should be expanded into a text-style-focused report asset while staying compatible with `template.styles`.

### Proposed Structure

```ts
interface ReportStyle {
  id: string;
  name: string;
  category: 'text';
  font: FontConfig;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  border?: BorderConfig;
  backgroundColor?: string;
  padding?: { top: number; right: number; bottom: number; left: number };
  format?: TextFormatConfig;
  canGrow?: boolean;
  canShrink?: boolean;
  isDefault?: boolean;
}
```

### Compatibility Notes

- `template.styles` remains the storage location for this phase.
- Existing styles without `category` should be treated as `text` during migration.
- Existing text components with `style: string` continue referencing style ids.
- The structure remains intentionally narrower than a future cross-component style system.

## Style Resolution Rules

Text rendering must resolve style through one shared merge strategy used by:

- designer canvas preview
- viewer preview
- print iframe generation

### Resolution Order

Final text component appearance resolves in this order:

1. component-local field value
2. referenced text style field value
3. component default value

Expressed differently:

```text
resolvedTextProps = local overrides > style library values > intrinsic defaults
```

This rule is required to prevent designer/preview/print drift and to preserve direct per-component overrides.

## Supported Style Fields

The text style library manages these fields in phase 17:

- `name`
- `font.family`
- `font.size`
- `font.bold`
- `font.italic`
- `font.underline`
- `font.strikethrough`
- `font.color`
- `textAlign`
- `verticalAlign`
- `backgroundColor`
- `border`
- `padding`
- `format`
- `canGrow`
- `canShrink`

Including `format` in the text style scope is intentional because numeric/date/currency display is commonly treated as part of presentation in print reports.

## Interaction Rules

### Property Panel

- Only text-capable components show the `Text Style` selector in this phase.
- Selecting a style updates the component's `style` reference.
- Clearing the selector removes the style reference but keeps explicit local values.
- Clicking `Manage` opens the style designer without losing current selection.

### Style Designer Actions

- `New`: create a fresh text style using either the default text style or a minimal blank baseline.
- `Duplicate`: clone the selected style and append a numeric suffix.
- `Rename`: rename in place.
- `Delete`: remove the style after confirmation.
- `Set Default`: marks one style as the default text style for future inserted text components.
- `Apply to Selected`: writes the selected style id to all currently selected text components.
- `Create From Selected Component`: optional secondary action in this phase if the current selection is a single text component; copies resolved text properties into a new style.

### Delete Safety

If a style is in use, delete behavior should be explicit:

- show usage count
- offer either:
  - remove the style reference from affected components
  - cancel deletion

Silent deletion is not allowed.

## Preview Design

The middle preview surface in the style designer should render a compact report-like sample:

- title line
- label/value line
- numeric line
- date line
- optional bordered cell sample

The preview is not a full page preview. It is a focused style preview that updates live while editing.

## Default Style Behavior

One text style may be marked `isDefault`.

Rules:

- Newly inserted text components start with that style id.
- If no default style exists, newly inserted text components use current intrinsic defaults.
- Changing the default style does not retroactively update existing components.

## Implementation Boundaries

This phase should touch four layers only:

1. core template types and style-resolution helpers
2. designer store actions for style-library CRUD and apply operations
3. designer UI for property-panel picker and style designer modal
4. viewer/print style resolution integration

It should not broaden into a generic asset-management rewrite.

## Testing and Verification

### Automated Tests

- Core tests:
  - style resolution order
  - compatibility migration for old styles
  - default-style selection behavior
- Designer tests:
  - style designer CRUD flow
  - property-panel style assignment
  - `Apply to Selected` updates selected text components
- Viewer tests:
  - preview uses resolved text style fields
  - print output uses the same resolved text style fields

### Browser Verification

- open example designer
- assign `Title` style to a text component
- confirm designer preview reflects the style
- open preview/print path and confirm the same alignment, font weight, colors, and formatting appear

## Acceptance Criteria

- Users can create, duplicate, rename, delete, and edit report-level text styles.
- Text components can quickly select a text style from the property panel.
- Style changes update all referencing text components in designer preview.
- Preview and print resolve the same text-style values.
- One default text style can be configured for new text components.
- Example templates ship with a basic A4-oriented text style set.
