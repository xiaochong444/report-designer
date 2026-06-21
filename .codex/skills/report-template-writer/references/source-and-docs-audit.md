# Source And Docs Audit

Use this reference before every template generation task. The skill must not rely only on examples. For each requested feature, read the matching repository docs and source files first, then generate JSON using the current codebase behavior.

## Always Check

For every template:

- `docs/user-guide/templates.zh-CN.md`: root template shape, page setup, serialization, validation.
- `docs/user-guide/data-binding.zh-CN.md`: automatic `root` data source, array paths, data bands, table/chart binding.
- `docs/user-guide/expressions.zh-CN.md`: expression syntax and built-in functions.
- `packages/core/src/template-model/types.ts`: authoritative TypeScript interfaces.
- `packages/core/src/template-model/schema.ts`: validation behavior and strict printable-area rules.
- `packages/core/src/template-model/normalize-template.ts`: defaults and normalization behavior.
- `packages/core/src/template-model/template.ts`: default page, styles, fonts, band behavior, watermark, page border.

## By Feature

### Designer-like defaults and required component fields

Read:

- `packages/designer/src/component-factory.ts`
- `docs/component-property-matrix.md`
- `docs/user-guide/designer.zh-CN.md`

Use these to avoid omitting required fields such as `font`, `border`, `format`, `showBorder`, `shapeType`, `templateUrl`, or `parameters`.

### Detail lists, tables, merged cells, dynamic columns

Read:

- `packages/core/src/table/table-structure.ts`
- `docs/user-guide/data-binding.zh-CN.md`
- `packages/example/src/templates/sales-order-print.ts`
- `packages/example/src/templates/clothing-order-dynamic-size.ts`
- `packages/example/src/templates/clothing-order-grouped-size.ts`

Use table source rules: normalized tables have at least one row/column, row height defaults to `8`, `rowCount` and `columnCount` are normalized, `binding` and legacy `columns/cells` are cleared by normalization. Prefer explicit `rows`.

### Events and dynamic runtime mutation

Read:

- `docs/user-guide/events.zh-CN.md`
- `packages/core/src/event-engine/types.ts`
- `packages/core/src/event-engine/event-context.ts`
- `packages/core/src/event-engine/event-component-handles.ts`
- `docs/superpowers/specs/2026-06-10-event-script-dynamic-size-order-design.md`

Use report `beforeData` for structural changes before measurement and pagination. Use component `name`, not `id`, for lookup.

### Charts

Read:

- `packages/core/src/template-model/types.ts` chart interfaces.
- `packages/core/src/chart/chart-capabilities.ts`
- `docs/user-guide/api-reference.zh-CN.md` chart section.
- Chart examples in `packages/example/src/templates/business-dashboard.ts` or other chart templates.

Match chart bindings to capabilities:

- Pie/donut/rose/funnel: one dimension and one measure, no axes.
- Column/bar/line/area/radar: one dimension, one or more measures, optional series.
- Scatter/heatmap/sankey: two dimensions.
- Dual axis: one dimension and two measures with left/right axes.
- Hierarchical charts: ordered hierarchical dimensions and one measure.

### Conditional formats and text formats

Read:

- `docs/user-guide/designer.zh-CN.md` conditional format library.
- `packages/core/src/conditional-format/index.ts`
- `packages/core/src/text-format/index.ts`
- `packages/core/src/template-model/types.ts` `ConditionRule` and `TextFormatConfig`.

Use `conditions` on components for local rules or `conditionalFormats` plus `component.conditionalFormat`/`applyTo` for reusable formats.

### Custom variables/functions

Read:

- `docs/user-guide/custom-expressions.zh-CN.md`
- `packages/core/src/expression-engine/report-functions.ts`

Only use custom functions such as `MASKPHONE` or `DISCOUNT` when the user says the host app provides runtime `expressionFunctions`, or when the example app already registers them for the scenario. Otherwise use built-in expressions.

### Page appearance, printing, page numbers

Read:

- `docs/user-guide/templates.zh-CN.md` page watermark/page border.
- `docs/user-guide/preview-and-print.zh-CN.md` render pipeline.
- `packages/core/src/pagination/page-number-pass.ts` if page-number behavior is ambiguous.

Use `pageFooter` for repeated page number components or text expressions like `{PageNumber}/{TotalPages}` when matching existing examples.

### Rich text, subreport, panel, image, codes

Read:

- `packages/core/src/template-model/types.ts`
- `packages/designer/src/component-factory.ts`
- `docs/component-property-matrix.md`

Use `richtext.html` or `document` for rich text, `subreport.templateUrl` and `parameters` for subreports, and `panel.components` for nested children. Barcode formats are `CODE128`, `EAN13`, `EAN8`, `UPC`, `CODE39`, `ITF14`; QR code format is `QR_CODE`.

## Source Precedence

When examples, docs, and source differ:

1. Prefer `types.ts` for allowed shape.
2. Prefer `normalize-template.ts`, `schema.ts`, and runtime source for actual behavior.
3. Use docs for intended user workflow.
4. Use examples for idiomatic layout and business document style.

If still ambiguous, state the assumption before returning JSON.
