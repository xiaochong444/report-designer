# Events And Dynamic Layout

Use this reference for event scripts, dynamic columns or rows, dynamic-size clothing orders, component mutation, or runtime-created content.

## Event Placement

Use report-level `beforeData` when a script must mutate template structure before measurement, pagination, preview, print, and PDF. This is the right place for dynamic table columns/rows.

Use `groupHeader.beforePrint` when a grouped report must adjust a cloned group header per current group.

Avoid using component `getValue` for structural changes. It is for component values.

The render pipeline runs normalization and data processing before most rendering events. `beforeData` is the earliest project-supported event for changing report structure from runtime data.

## Event Shape

```json
"events": {
  "beforeData": {
    "enabled": true,
    "script": "const table = ctx.table?.(\"DetailTable\");"
  }
}
```

Event scripts are JavaScript strings. Keep them readable and idempotent:

```js
if (!ctx.state.dynamicTableBuilt) {
  // mutate structure
  ctx.state.dynamicTableBuilt = true;
}
```

The dynamic-size examples in this repo use direct table row/cell mutation in `beforeData`; the runtime also exposes safer handles.

## Component Lookup

Lookup by component `name`, not `id`:

```js
const headerTable = ctx.table?.("OrderSizeHeaderTable");
const detailTable = ctx.table?.("OrderSizeDetailTable");
ctx.text?.("OrderTitleText").setText("销售订单");
ctx.component?.("AnyComponent").setBounds({ width: 80 });
```

Name every component that a script will use. Names must be unique across the report, including panel children.

`ctx.getComponent(name)` searches the current band first, then the whole report. Type helpers such as `ctx.table(name)` throw if the component exists but has the wrong type.

## Table Handle Methods

`ctx.table(name)` returns a handle with:

- `component`
- `rowCount`
- `columnCount`
- `findCellText(text)`
- `ensureColumnCount(count)`
- `ensureRowCount(count)`
- `insertColumnsAfter(column, count)`
- `insertRowsAfter(row, count)`
- `setCellText(row, column, text)`
- `setCell(row, column, updates)`
- `mergeCells(row, column, rowSpan, colSpan)`
- `setColumnWidth(column, width)`
- `distributeColumns(startColumn, count)`

If the current project version uses direct mutation, copying rows/cells is also valid, but still look up by `ctx.table?.("Name")`.

## Dynamic Size Table Pattern

Use this when the user's JSON has metadata like:

```json
{
  "sizeGroups": [
    { "name": "常规尺码", "sizes": [{ "field": "S1", "name": "S" }, { "field": "S2", "name": "M" }] },
    { "name": "裤长", "sizes": [{ "field": "S1", "name": "80" }, { "field": "S2", "name": "90" }] }
  ],
  "items": [
    { "styleNo": "KZ-86021", "S1": 12, "S2": 18, "totalQty": 30 }
  ]
}
```

Template setup:

- Header table name: `OrderSizeHeaderTable`.
- Detail table name: `OrderSizeDetailTable`.
- Both tables contain exactly one design-time placeholder size column.
- Header placeholder text is `S1`.
- Detail placeholder text is `{S1}`.
- Fixed columns before the size placeholder might be style number, product name, tag price, color.
- Fixed columns after it might be total quantity, price, amount.

Report-level `beforeData` algorithm:

1. Read `ctx.data.sizeGroups`.
2. Find the placeholder column in both named tables.
3. Compute `sizeCount` as the maximum number of sizes in any group.
4. Expand the header table to one row per size group and `sizeCount` dynamic columns.
5. Vertically merge fixed header columns across group rows using `rowSpan`.
6. Set header dynamic labels from each group size name.
7. Set detail dynamic cells to `{S1}`, `{S2}`, ... `{SN}`.
8. Keep row heights and styles from the design-time seed cells.
9. Update `rowCount`, `columnCount`, and table heights.

For grouped size reports:

- Use `groupHeader` with `group.conditionExpression: "{items.sizeGroupName}"`.
- Use report `beforeData` to expand to max size count.
- Use `groupHeader.beforePrint` to set header labels for the current `ctx.row.sizeGroupName`.

## Dynamic Component Creation

Use sparingly when structure cannot be represented at design time:

```js
ctx.createText?.({
  x: 10,
  y: 5,
  width: 100,
  height: 10,
  text: "动态文本",
  font: { size: 12, bold: true }
});
```

Prefer mutating named placeholder components for business templates, because placeholders are easier to inspect in the designer.

## Logging And Failure Behavior

Use event logs for diagnostics:

```js
ctx.log.warning("Size placeholder S1 was not found.");
ctx.log.info("Dynamic size table built.");
```

When required metadata is absent, do not crash if a reasonable static fallback exists. Log a warning and leave the design-time placeholder structure.
