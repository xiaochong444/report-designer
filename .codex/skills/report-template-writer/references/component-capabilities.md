# Component Capabilities

Use this reference when selecting components or writing component JSON.

## Common Base Fields

All components have:

- `id`, unique across the template.
- `name`, optional but required for event lookup.
- `type`.
- `x`, `y`, `width`, `height` in millimeters.
- Optional `backgroundColor`, `border`, `padding`, `style`, `conditionalFormat`, `visible`, `printableExpression`, `enabledExpression`, `conditions`, `events`, `anchor`.

## Text

Required:

- `text`
- `font`
- `textAlign`
- `verticalAlign`
- `border`
- `canGrow`
- `canShrink`

Use `format` for structured output when a single field should be formatted by type. Use expression functions such as `FORMAT("N2", ...)` for formulas/totals or when matching examples.

## Table

Prefer explicit `rows`:

- `rowCount`
- `columnCount`
- `rows`
- `showBorder`
- `canBreak`
- optional `border`, `padding`, `font`, `textAlign`, `verticalAlign`, `format`

Normalization clears legacy `binding`, `dataSource`, `columns`, `cells`, and `rowHeight` in favor of normalized `rows`. For generated templates, use `rows` directly.

## Chart

Required:

- `chartType`
- `binding`

Common binding:

```json
{
  "dataSourceId": "items",
  "dimensions": [{ "field": "category" }],
  "measures": [{ "field": "amount", "aggregation": "sum" }],
  "sort": []
}
```

Use `theme: { "baseTheme": "light" }` unless the user asks for dark charts. Add `title`, `legend`, `axes`, and `labels` only when useful. Check `chart-capabilities.ts` before choosing dimensions/measures.

Supported chart types:

- Stable: `column`, `columnParallel`, `columnPercent`, `bar`, `barParallel`, `barPercent`, `line`, `area`, `areaPercent`, `pie`, `donut`, `rose`, `scatter`, `radar`, `funnel`, `dualAxis`, `heatmap`.
- Advanced: `histogram`, `boxPlot`, `sankey`, `treeMap`, `sunburst`, `circlePacking`.

## Image

Required:

- `src`: expression or URL/base64 string.
- `fitMode`: `fill`, `contain`, `cover`, or `stretch`.

Ask the user for image source fields or static URLs; do not invent remote assets.

## Barcode And QR Code

Barcode:

- `value`
- `format`: `CODE128`, `EAN13`, `EAN8`, `UPC`, `CODE39`, `ITF14`
- `showText`

QR code:

- `value`
- `format`: `QR_CODE`

Use order numbers, SKU codes, shipment numbers, URLs, or other explicit fields from JSON.

## Checkbox

Required:

- `checked`: expression string or boolean.
- optional `label`, `foregroundColor`, `font`.

Use for boolean JSON fields.

## Rich Text

Required:

- `html`
- optional `document` for Tiptap JSON.

Use only when the user wants formatted paragraphs, contract clauses, or HTML content.

## Subreport

Required:

- `templateUrl`
- `parameters`

Ask for the nested template key/URL before generating. Parameter values are expressions.

## Panel

Required:

- `components`
- `border`

Use panel for grouping nested components or event-mutated nested areas. Component names inside panels still participate in report-wide event lookup.

## Line And Shape

Line:

- `startX`, `startY`, `endX`, `endY`
- `lineColor`, `lineWidth`, `lineStyle`

Shape:

- `shapeType`: `rectangle`, `ellipse`, `roundRect`, `triangle`
- `fillColor`, `borderColor`, `borderWidth`, `borderStyle`

Use these for separators, stamps, boxes, and backgrounds.

## Page Number And Date Time

Page number:

- `format`: `1`, `1/N`, `Page 1 of N`, or `Page 1`
- `font`, `textAlign`, optional `verticalAlign`

Date time:

- `format`, such as `yyyy-MM-dd` or `yyyy-MM-dd HH:mm:ss`
- `font`, `textAlign`, optional `verticalAlign`

Existing examples often use text expressions like `{PageNumber}/{TotalPages}` in page footers; use whichever matches the requested style and current project behavior.

## Conditional Formats

Use `ConditionRule` with either:

- `conditionType: "expression"` and `expression`, or
- `conditionType: "value"` with `field`, `operator`, `dataType`, `value`, and optional `valueTo`.

Supported value operators include `equalTo`, `notEqualTo`, `between`, `notBetween`, `greaterThan`, `greaterThanOrEqualTo`, `lessThan`, `lessThanOrEqualTo`, `containing`, `notContaining`, `beginningWith`, and `endingWith`.

Overrides may include `font`, `fontWeight`, `bold`, `fontStyle`, `italic`, `underline`, `strikethrough`, `fontColor`, `fontSize`, `backgroundColor`, `border`, `textAlign`, `verticalAlign`, and `enabled`.

## Text Format Config

Supported `format.type` values:

- `none`
- `text`
- `number`
- `currency`
- `date`
- `time`
- `dateTime`
- `percent`
- `boolean`
- `custom`

Use structured `format` for field formatting in components or table cells. Use expression functions when combining multiple fields or aggregating totals.
