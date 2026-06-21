# Data Binding And Expressions

Use this reference when binding fields, filters, totals, conditional visibility, or formatted text.

## Input Analysis

From the user JSON, identify:

- Scalar header fields: `orderNo`, `orderDate`, `customer.name`.
- Detail arrays: `items`, `orders.items`, `payments`.
- Metadata arrays: `sizeGroups`, column definitions, approval logs.
- Calculated or display-only values: totals, amount in words, masked phones.

Ask the user to explain any unclear property name before generating JSON. For example, `S1` might mean size position 1, not literal size S.

## Binding Syntax

Use `{field.path}` inside component text and table cell text:

```text
{orderNo}
{customer.name}
{items.product.name}
```

Inside a `data` band bound to `items`, both `{product.name}` and `{items.product.name}` can resolve, but prefer complete paths when clarity matters.

## Data Bands

Bind a `data` band to an array path:

```json
{
  "type": "data",
  "dataBand": {
    "dataSourceId": "items",
    "filterExpression": "{items.amount} > 0",
    "sort": [{ "field": "amount", "direction": "asc" }]
  }
}
```

Use `root` only for a single root-row report. For top-level runtime arrays, the system wraps them as `{ "items": [...] }`.

For hierarchical arrays, use a `hierarchicalData` band and:

```json
"dataBand": {
  "dataSourceId": "departments",
  "hierarchical": { "childrenField": "children", "indentChars": 2 }
}
```

Only choose this when the JSON rows really have recursive children.

## Expressions

Common expressions:

- Money: `FORMAT("N2", {items.amount})`
- Percent: `FORMAT("P", {items.discount})`
- Date: `FORMAT("CN_DATE", {orderDate})`
- Sum: `FORMAT("N2", SUM({items.amount}))`
- Amount in Chinese uppercase: `RMBUPPER(SUM({items.amount}))`
- Row number: `ROWINDEX()`
- Page number: `PAGE()` and `TOTALPAGES()`
- Conditional: `IF({status} == "已审核", "已审核", "")`
- Null fallback: `COALESCE({remark}, "")`

Use custom functions such as `MASKPHONE` or `DISCOUNT` only after confirming the host app provides them via `expressionFunctions`, or when you are generating for an example app that already registers those functions.

Use the expression syntax documented by the project:

- Field references use braces.
- Operators include `+ - * /`, comparisons, `&&`, `||`, `!`.
- Strings may use single or double quotes.
- Built-ins include `CONCAT`, `FORMAT`, `SUM`, `AVG`, `COUNT`, `COUNTDISTINCT`, `SUMIF`, `COUNTIF`, `RUNNINGSUM`, `RMBUPPER`, `TODAY`, `NOW`, `ISNULL`, `COALESCE`.

## Visibility And Conditions

For simple component visibility:

```json
{ "visible": "{status} == \"已审核\"" }
```

For style overrides, use `conditions` on a component or `conditionalFormats` at template level when the user asks for conditional colors, warnings, or thresholds.
