# Output Checklist

Run this checklist before returning template JSON.

## User Input

- The user supplied representative JSON.
- The user explained property names, labels, units, arrays, optional fields, and calculated values.
- Any ambiguous property name was clarified or explicitly marked as an assumption.

## Source And Docs

- `source-and-docs-audit.md` was consulted.
- Relevant repository docs were read for the requested features.
- Relevant source files were read for component shape, validation, normalization, events, charts, or formatting.
- Any mismatch between examples, docs, and source was resolved by source precedence.

## Template Validity

- Root object has `version: "2.0"`.
- At least one page exists.
- Page size, orientation, margins, and printable width are coherent.
- All ids are unique.
- Bands are in a sensible order.
- `data` bands have `dataBand.dataSourceId` pointing to a real array path from the JSON.
- `groupHeader` bands have `group.conditionExpression`.
- `hierarchicalData` bands have a valid array path and `hierarchical.childrenField`.
- `dataSources` is `[]` unless the user explicitly needs persisted schema metadata.
- `styles`, `conditionalFormats`, and `parameters` arrays exist.

## Component Validity

- Every component fits inside printable width and its band height.
- Required fields for each component type are present.
- Text components include `font`, `textAlign`, `verticalAlign`, `border`, `canGrow`, and `canShrink`.
- Tables have matching `rowCount`, `columnCount`, and `rows`.
- Table cells use valid expressions and align numeric fields to the right.
- Chart components have dimensions/measures compatible with `chart-capabilities.ts`.
- Long text fields use `canGrow: true` or enough height.
- Event-mutated components have unique, readable `name` values.

## Expression Validity

- Field paths exist in the supplied JSON.
- Detail expressions use the correct array path.
- Totals use aggregate functions on array fields.
- Formatting strings use existing project conventions such as `FORMAT("N2", ...)`, `FORMAT("P", ...)`, and `RMBUPPER(...)`.
- Conditional expressions use the project expression syntax, not JavaScript syntax, unless inside event scripts.

## Event Validity

- Structural mutations use report-level `beforeData`.
- Per-group header relabeling uses `groupHeader.beforePrint`.
- Event scripts look up components by `name`, not internal `id`.
- Structural event scripts are idempotent or otherwise safe to run once per render.
- Dynamic table scripts handle missing metadata or missing placeholder cells with `ctx.log.warning`.
- Dynamic table scripts update row/column counts and heights.

## Final Response

- If returning JSON, wrap it in a `json` fenced code block.
- Mention assumptions briefly before the JSON if any were needed.
- Do not include comments inside the JSON.
- If the JSON is too large, ask whether the user wants a compact full JSON or a smaller focused template fragment.
