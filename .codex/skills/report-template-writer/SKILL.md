---
name: report-template-writer
description: Generate Report Designer template JSON for this repository from user-provided sample JSON, field-name descriptions, and a report/layout request. Use when the user asks Codex to write, draft, convert, design, or repair a Report Designer template, print template, report template, document template, order form, receipt, statement, dashboard report, dynamic-size clothing order, grouped table, event-scripted template, or any `ReportTemplate` JSON for `@report-designer/core`. Require the user to provide the runtime JSON data shape and describe the meaning of its property names before generating a template.
---

# Report Template Writer

## Required Input Gate

Before generating a template, ensure the user has provided both:

- A representative runtime JSON sample.
- A description of the JSON property names, especially business meaning, units, display labels, arrays used as detail rows, and fields that are optional or calculated.

If either is missing, ask for it first. Do not invent business fields. You may infer obvious nested paths from JSON, but ask when labels, meanings, or row-array intent are ambiguous.

## Workflow

1. Read `references/source-and-docs-audit.md` and identify which repository docs/source files apply to the requested template features. Load those files before designing the JSON.
2. Parse the user JSON shape and identify the root object, nested objects, row arrays, summary fields, and dynamic metadata arrays.
3. Map each requested display field to a JSON path using `{field.path}` expression syntax.
4. Choose the report pattern:
   - Simple document: title/header bands, fixed fields, optional footer.
   - Detail list: `header` table plus `data` band bound to an array path.
   - Grouped detail: `groupHeader` with `group.conditionExpression`, sorted `data` band, optional group footer.
   - Hierarchical list: `hierarchicalData` band with `dataBand.hierarchical.childrenField`.
   - Summary/report: `reportSummary` or `footer` bands with `SUM`, `COUNT`, `RMBUPPER`, `FORMAT`.
   - Chart/report dashboard: chart components with bindings that match `chart-capabilities.ts`.
   - Advanced dynamic layout: report-level `beforeData` event mutates named components before measurement.
5. Generate a complete `ReportTemplate` JSON object, not a partial snippet, unless the user explicitly asks for a fragment.
6. Validate consistency against both the references and source-derived rules: unique ids, component names for event lookup, valid band order, printable bounds, table row/column counts, chart binding roles, text formats, conditional formats, and array data bindings.

## References

Load only the reference files needed for the request:

- `references/source-and-docs-audit.md`: required before every template generation task; maps features to source/docs that must be checked.
- `references/template-model.md`: required for every template generation task.
- `references/component-capabilities.md`: required when using any component beyond plain text, or when uncertain about required component fields.
- `references/data-binding-expressions.md`: required when binding JSON fields, formulas, totals, conditions, or formats.
- `references/tables-and-bands.md`: required for detail tables, grouped reports, summaries, or pagination-sensitive layouts.
- `references/events-dynamic-layout.md`: required for event scripts, dynamic columns/rows, dynamic size tables, component mutation, or runtime-created content.
- `references/output-checklist.md`: required before returning final JSON.

## Output Rules

- Output JSON that conforms to `ReportTemplate` version `"2.0"`.
- Prefer `dataSources: []`; the runtime auto-infers `root` and array paths from the JSON passed to `Designer`, `Viewer`, or `renderReport`.
- Use millimeters for coordinates and sizes. A4 portrait defaults are `width: 210`, `height: 297`, margins around `8-10`.
- Use stable, readable ids and component `name` values. Event scripts must look up components by `name`, not `id`.
- Keep generated event scripts idempotent when they mutate structure.
- Include comments only outside JSON. JSON itself must be parseable.
