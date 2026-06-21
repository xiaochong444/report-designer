# Tables And Bands

Use this reference for detail tables, grouped reports, and summary sections.

## Fixed Table Shape

A table uses explicit rows and cells:

```json
{
  "id": "detail-table",
  "name": "DetailTable",
  "type": "table",
  "x": 0,
  "y": 0,
  "width": 190,
  "height": 8,
  "rowCount": 1,
  "columnCount": 4,
  "showBorder": true,
  "canBreak": true,
  "rows": [{
    "id": "detail-row",
    "height": 8,
    "verticalAlign": "middle",
    "cells": [
      { "id": "cell-1", "text": "{items.code}", "width": 30 },
      { "id": "cell-2", "text": "{items.name}", "width": 80 },
      { "id": "cell-3", "text": "{items.qty}", "width": 30, "textAlign": "right" },
      { "id": "cell-4", "text": "FORMAT(\"N2\", {items.amount})", "width": 50, "textAlign": "right" }
    ]
  }]
}
```

Rules:

- `rowCount` equals `rows.length`.
- `columnCount` equals the maximum cell count in the row structure.
- Keep table `width` within printable width.
- Use fixed widths for known business columns. Use `undefined`/omitted widths only when an event script or table normalizer should distribute columns.
- `colSpan` cells still keep placeholder sibling cells in the row in existing examples.
- Prefer explicit `rows`; project normalization clears legacy `columns`, `cells`, `binding`, `dataSource`, and `rowHeight`.

## Detail List Pattern

Use two bands:

- `header` band with a table of column labels.
- `data` band bound to the array path, with one detail table row.

For arrays such as `items`, set:

```json
"dataBand": { "dataSourceId": "items" }
```

## Summary Pattern

Use `footer` or `reportSummary` for totals:

```text
FORMAT("N2", SUM({items.amount}))
RMBUPPER(SUM({items.amount}))
```

Use `reportSummary` for once-at-end content such as grand totals and remarks. Use `footer` when a detail block needs a footer related to a repeated section.

## Grouped Detail Pattern

Use a `groupHeader` before the `data` band:

```json
{
  "id": "group-header",
  "type": "groupHeader",
  "height": 14,
  "group": {
    "conditionExpression": "{items.sizeGroupName}",
    "sortDirection": "asc"
  }
}
```

Then sort the data band:

```json
"dataBand": {
  "dataSourceId": "items",
  "sort": [{ "field": "sizeGroupName", "direction": "asc" }]
}
```

Use this pattern when the user wants sections by customer, warehouse, category, size group, department, or date.

## Hierarchical Data Pattern

Use `hierarchicalData` when the user JSON is a tree:

```json
{
  "id": "org-tree-band",
  "type": "hierarchicalData",
  "height": 8,
  "dataBand": {
    "dataSourceId": "departments",
    "hierarchical": { "childrenField": "children", "indentChars": 2 }
  }
}
```

Use text expressions for the current row fields. Add indentation text or event logic only if the user wants visible hierarchy indicators.

## Band Height

Band height should fit its components:

- Header field rows often use `6-8` mm text components.
- Table rows often use `7-8` mm.
- `reportTitle` may be `30-60` mm depending on metadata rows.
- `data` band height should usually match the detail table height.
- If an event script changes a table height, make the containing band `autoGrow: true`.
