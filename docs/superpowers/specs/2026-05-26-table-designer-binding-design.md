# Table Designer Binding Design

## Goal

Make table components useful for real printed reports by separating two table modes:

- Detail-bound table: binds to a JSON array and automatically expands body rows.
- Fixed template table: keeps the designed row count and never expands automatically.

This round focuses on the model, render contract, and first designer entry points. It deliberately keeps chart output, non-JSON data sources, and large visual shell redesign out of scope.

## Current State

The project already has a table component with columns, row count, header/footer counts, cell overrides, right-click structure commands, and output rendering. Recent work also aligned table cell styles across preview, print, and PDF.

The missing product concept is binding mode. Today `TableComponent.dataSource` exists, but it does not clearly say whether the table should:

- repeat rows from an array,
- render against the current DataBand row,
- or remain a fixed template table.

That ambiguity is dangerous for nested tables and printed output parity.

## Table Modes

### Fixed Template Table

Fixed mode is the default for existing templates.

Behavior:

- Render exactly `rowCount` by `columnCount`.
- Use `cells` overrides and column definitions.
- Resolve expressions against the current render context, including the current DataBand row if the table sits inside a DataBand.
- Never add rows because a field happens to contain an array.

Use cases:

- Suite printing forms.
- Signature blocks.
- Approval grids.
- Small manually designed summary tables.
- Nested layout tables.

### Detail-Bound Table

Detail-bound mode expands body rows from a JSON array.

Behavior:

- `binding.mode = "detail"` enables automatic row expansion.
- `binding.dataSourceId` may point to a top-level JSON data source.
- `binding.arrayPath` may point to an array on the current row, for example `Items` or `Customer.Orders`.
- Header rows are copied once before generated body rows.
- Footer rows are copied once after generated body rows.
- Body rows are generated from the designed body template rows. If two body template rows are designed, every data item expands into two rendered rows.
- Cell expressions inside generated rows resolve against the array item first, then the outer DataBand row.

Use cases:

- Invoice item lines bound to `Invoice.Items`.
- Order packages bound to `Orders.Packages`.
- A top-level detail table outside a DataBand bound to `orders`.

## Binding Resolution

Resolution priority for a detail-bound table:

1. `binding.arrayPath` on the current row.
2. `binding.dataSourceId` from report data.
3. Empty array.

If `binding.mode = "fixed"`, array settings are ignored.

Expression resolution inside detail rows:

- `{Items.Name}` and `{Name}` both work when the array item has `Name`.
- `{orders.OrderNo}` still resolves against the outer current row when the table is inside an `orders` DataBand.
- Aggregate functions stay report-level and are not changed in this round.

## Render Contract

`layoutBand()` remains responsible for turning `TableComponent` into `RenderTable`.

For detail-bound mode:

- The render output contains one `RenderTableCell[][]` matrix with generated rows.
- Row indexes are normalized from `0`.
- Header/footer flags are preserved.
- Cell style, format, spans, and content are preserved per generated row.
- `height` becomes the sum of generated row heights when it exceeds the designed component height.

For fixed mode:

- Existing table rendering behavior is preserved.
- Existing templates without `binding` remain fixed.

## Designer Contract

The designer must expose mode explicitly:

- Table properties show a binding section with:
  - Mode: fixed or detail-bound.
  - Data source.
  - Array path.
  - Body row template count is explained through existing header/footer row settings, not extra in-app help text.

Cell properties should keep moving toward complete style control:

- Text content/expression.
- Font family, size, color.
- Bold, italic, underline, strikethrough.
- Alignment, background, border, padding, format.

Right-click menu should remain focused:

- Insert/delete rows and columns.
- Merge/split cells.
- Clear content.
- Clear style.
- Copy style.
- Paste style.
- Set header/footer rows.

## Pagination Contract

Detail-bound tables can grow taller than their design-time height. Existing table splitting rules remain the mechanism for cross-page output:

- Header rows repeat on split chunks.
- Footer rows appear only on the last chunk.
- Table top offset inside its Band remains stable.

Fixed tables should not grow because of data, so suite printing remains stable.

## Migration

Existing tables get:

```ts
binding: { mode: "fixed" }
```

This is a logical default in normalization; files do not need to be rewritten immediately.

## Testing Strategy

Core tests:

- Existing table without binding remains fixed even if the current row has an array field.
- Detail-bound table expands from a current-row array path.
- Detail-bound table expands from a top-level data source.
- Detail-bound table keeps header/footer rows and repeats body template rows per item.
- Detail-bound table can still split across pages with header rows on chunks and footer only on the final chunk.

Designer tests:

- Table property panel exposes fixed/detail mode and binding fields.
- Switching to fixed mode preserves designed row count.
- Switching to detail mode stores binding metadata.
- Cell properties can edit table-cell font and text decoration.
- Right-click menu can clear/copy/paste style.

## Acceptance Criteria

- Existing table samples render unchanged.
- A table bound to `Items` on the current row generates one body row per item.
- A fixed table inside a DataBand does not auto-expand when the current row contains arrays.
- Designer users can choose table binding mode and configure data source/array path.
- Core, designer, and viewer targeted tests pass.
- Full `pnpm test` and `pnpm build` pass before final handoff.
