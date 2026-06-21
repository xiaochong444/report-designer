# Template Model

Use this reference for every Report Designer template.

## Root Object

Generate a complete `ReportTemplate`:

```json
{
  "id": "sales-order-print",
  "name": "销售订单打印",
  "version": "2.0",
  "pages": [],
  "dataSources": [],
  "styles": [],
  "conditionalFormats": [],
  "parameters": []
}
```

Core rules:

- `version` is always `"2.0"`.
- `pages` must contain at least one page.
- `dataSources` should usually be `[]`; runtime data source inference creates `root` and array rowsets automatically.
- If `dataSources` is non-empty, `validateTemplate` requires `data` and `hierarchicalData` bands to reference a valid `dataBand.dataSourceId`.
- All ids should be unique across template, pages, bands, components, styles, conditional formats, and parameters.
- Component `name` is the human-readable event lookup key. Use stable names on any component that an event script will mutate.

## Page

Use A4 portrait unless the user asks otherwise:

```json
{
  "id": "sales-order-page",
  "name": "页面 1",
  "width": 210,
  "height": 297,
  "margins": { "top": 8, "right": 10, "bottom": 8, "left": 10 },
  "orientation": "portrait",
  "bands": []
}
```

Printable content width is `page.width - margins.left - margins.right`. With the common margins above, use `190` mm wide content.

## Bands

Common band order:

1. `reportTitle`: title and document header fields.
2. `pageHeader` or `header`: repeated labels or table header.
3. `groupHeader`: grouping label/header for grouped lists.
4. `data`: one rendered instance per row of an array rowset.
5. `footer` or `groupFooter`: detail/group totals.
6. `reportSummary`: final totals and remarks.
7. `pageFooter`: page numbers and print metadata.

Recommended behavior defaults:

```json
{
  "enabled": true,
  "printOn": "allPages",
  "printIfEmpty": true,
  "printOnAllPages": false,
  "keepTogether": false,
  "canBreak": false,
  "printAtBottom": false,
  "autoGrow": true,
  "autoShrink": false
}
```

For `data` bands, set `canBreak: true`. For `pageFooter`, set `printAtBottom: true`. For repeating headers, set `printOnAllPages: true`.

`normalizeTemplate` fills missing band behavior using project defaults. Still generate explicit behavior for important bands so the result is inspectable and stable.

## Components

All components require:

```json
{
  "id": "component-id",
  "name": "ReadableName",
  "type": "text",
  "x": 0,
  "y": 0,
  "width": 40,
  "height": 6
}
```

Common component types:

- `text`: `text`, `font`, `textAlign`, `verticalAlign`, `border`, `canGrow`, `canShrink`.
- `table`: `rows`, `rowCount`, `columnCount`, `showBorder`, `canBreak`.
- `barcode`: `value`, `format: "CODE128"`, `showText`.
- `qrcode`: `value`, `format: "QR_CODE"`.
- `image`: `src`, `fitMode`.
- `pagenumber`: `format`, `font`, `textAlign`.
- `datetime`: `format`, `font`, `textAlign`.

For a complete component capability table, read `component-capabilities.md` and the current source files listed in `source-and-docs-audit.md`.

## Page Appearance

Pages may include:

```json
"backgroundColor": "#ffffff",
"watermark": {
  "enabled": false,
  "text": "",
  "fontSize": 48,
  "color": "#8c8c8c",
  "opacity": 0.18,
  "angle": -35,
  "horizontalAlign": "center",
  "verticalAlign": "middle",
  "showBehind": true
},
"pageBorder": {
  "enabled": false,
  "style": "solid",
  "width": 0.2,
  "color": "#000000",
  "sides": { "top": true, "right": true, "bottom": true, "left": true },
  "offset": 0
}
```

Use these only when requested or when matching a business form that needs watermark, page frame, or background.
- `chart`: `chartType`, `binding`, optional title/legend/axes/labels/theme.

## Minimal Text Component

```json
{
  "id": "order-no",
  "name": "OrderNoText",
  "type": "text",
  "x": 20,
  "y": 14,
  "width": 42,
  "height": 6,
  "text": "{orderNo}",
  "font": { "family": "Arial", "size": 9, "bold": false, "italic": false, "underline": false, "strikethrough": false, "color": "#1f2937" },
  "textAlign": "left",
  "verticalAlign": "middle",
  "border": { "style": "none", "width": 0, "color": "#cfd6df", "sides": { "top": false, "right": false, "bottom": false, "left": false } },
  "canGrow": false,
  "canShrink": false
}
```

Use `canGrow: true` for long addresses, remarks, contract terms, and multiline descriptions.
