# Component Style Unification Design

## Goal

Unify component style selection, style locking, nullable style fields, and render-time style resolution so top-level report components behave consistently in the designer, preview, print, and PDF export.

## Scope

This change covers report components and the style library. Page setup fields such as page margins, page watermark, and page border stay out of scope because they are not part of the component style inheritance system.

Top-level components that expose style-like fields can select a shared style. When a style is selected, all fields owned by that style are read-only in the property panel. Unbinding a style copies the resolved style values to the component and clears the selected style id.

Table row and table cell internals do not get style selectors in this pass. Their fields remain nullable: an unset row or cell field inherits from the table; a set row or cell field overrides the inherited value.

## Style Ownership

Shared styles own these component fields when the target component supports them:

- `font`
- `backgroundColor`
- `border`
- `padding`
- `textAlign`
- `verticalAlign`
- `format`
- `canGrow`
- `canShrink`

Future components should declare style capabilities instead of duplicating selector and lock logic. If a future component supports one of the fields above, the shared property editor should be able to render the field, lock it when style-bound, and route rendering through the common resolver.

## Nullable Property Editing

Common style fields must preserve the difference between "unset" and "set to a concrete value".

- Unset colors show an empty/no-color state, not black or white.
- Background color can be set and then cleared back to unset.
- Border fields show empty values when the border is unset.
- Padding fields show empty values when padding is unset, not `0`.
- Clearing a nullable field writes `undefined` for that field.
- Selecting a style disables style-owned fields but leaves non-style fields editable.

The designer should use shared property editor components for common fields so the style library, top-level component property panel, and table row/cell panel do not drift.

## Table Style Behavior

Table styling resolves through a single inheritance chain:

`table -> row -> cell`

Cell fields default to unset. If a cell has no `backgroundColor`, `font`, `border`, `padding`, `textAlign`, `verticalAlign`, or `format`, it inherits the row value, then the table value. Row fields behave the same way against the table. Table itself can bind to a shared style because it is a top-level component.

The designer canvas and core layout/render output must use equivalent table style resolution. Preview, print, and PDF should consume the resolved `RenderTableCell.style` payload instead of rebuilding table inheritance independently.

## Architecture

Create or consolidate a component-style layer with three responsibilities:

1. Style capabilities: determine which shared style fields apply to each component type.
2. Style resolution: merge selected shared style values with component values in core before render output.
3. Style editing: provide shared React property controls for nullable color, border, padding, typography, alignment, format, and style selection.

The existing text-style terminology can be renamed or wrapped so behavior is no longer limited to text components. No compatibility shim is required for removed internal helper APIs.

## UI Details

The style select row uses a fixed-width select and a fixed-width icon button. Long style names must ellipsize and must not widen the property panel. Conditional format select rows follow the same fixed layout rule.

The icon button beside a selected style means "unbind style". Hover text says "解除绑定". Clicking it copies the resolved style values into the component, clears the selected style id, and unlocks the fields.

When no style is selected, the icon button can be disabled or hidden, but the select row width must remain stable.

## Tests

Tests should cover these cases:

- A top-level component with a selected style renders through the common resolver.
- Style-owned fields are disabled after selecting a style.
- Unbinding copies resolved style values to the component and clears `style`.
- Long style names and conditional format names do not expand select rows.
- Background color can remain unset, be set, and be cleared back to unset.
- Padding fields display blank when unset and write concrete values only after editing.
- Table cells inherit table style when unset.
- Table cells override inherited values when set.
- Designer preview, print HTML, and PDF export consume the same resolved render style payload.

## Non-Goals

- No style selector for table rows or cells in this pass.
- No changes to page setup margin, watermark, or page border editors.
- No separate preview/print/PDF style-resolution logic.
