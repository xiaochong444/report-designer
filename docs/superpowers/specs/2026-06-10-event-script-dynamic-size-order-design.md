# Event Script Dynamic Size Order Design

## Goal

Build a script-driven clothing order print example where report events expand table columns and header rows from runtime size data. The implementation must also improve the event editor so scripts can discover every current report component by id or name, see component-aware completions, and call safe component mutation helpers from `ctx`.

## Current Context

- Component `id` and `name` are different. `id` is generated internally, for example `comp_table_xxxxxx`; `name` is the user-facing name, for example `Table1`.
- Runtime `ctx.getComponent(idOrName)` already searches both `id` and `name`, but the Monaco event editor only inserts component names as plain text and does not describe available component APIs.
- Runtime `ctx.setComponentProperty(idOrName, path, value)` exists for generic mutation.
- Designer-side table utilities already support normalized table rows, inserting rows/columns, cell merging, cell text, cell widths, and equalized columns in `packages/designer/src/table/table-structure.ts`.
- Core event runtime does not expose a table-specific handle, so scripts cannot safely perform common table mutations without directly editing nested table data.
- Core event runtime also lacks type-specific handles for text, image, barcode, QR code, checkbox, rich text, chart, line, shape, page number, date/time, and panel components. These should be handled as a complete component scripting surface, not as a table-only special case.

## Correct Dynamic Size Interpretation

The size groups are vertical header rows, not horizontal colspan groups.

For two or more size groups:

```text
fixed columns                 dynamic size columns                fixed columns
款号 | 品名 | 颜色 | S1 | S2 | S3 | S4 | S5 | ... | 数量 | 价格 | 金额
                 row 1: 80   90   100  110  120
                 row 2: 90   100  110  120  130
                 row 3: 120  130  140  150  160
```

The runtime must calculate the maximum size count across all size groups. Both the header-band table and the data-band table must expand their single size placeholder column to that maximum count. Fixed columns in the header table must be vertically merged across the number of header rows.

## Data Shape For The Example

The example should use a clothing order data source with:

```ts
interface ClothingSizeGroup {
  name: string;
  sizes: string[];
}

interface ClothingOrderDetail {
  styleNo: string;
  productName: string;
  tagPrice: number;
  color: string;
  totalQty: number;
  price: number;
  amount: number;
  S1?: number;
  S2?: number;
  S3?: number;
  S4?: number;
  S5?: number;
  S6?: number;
  S7?: number;
  S8?: number;
  S9?: number;
  S10?: number;
}

interface ClothingOrderData {
  sizeGroups: ClothingSizeGroup[];
  details: ClothingOrderDetail[];
}
```

The rows use `S1`, `S2`, and subsequent fields as positional quantity fields. The header rows provide the human-readable label for each positional field per size group.

## Event Placement

The dynamic table script belongs in the report-level `beforeData` event.

Reasons:

- It must mutate table structure before measurement, pagination, preview rendering, print rendering, and PDF rendering.
- Component `getValue` is for component values, not table structure.
- Component `beforePrint` and band row events run too often for this use case and could repeatedly insert columns/rows unless heavily guarded.
- `beforePrint` would not show the same result during preview.

The script must be idempotent:

```js
if (!ctx.state.clothingSizeTableBuilt) {
  // mutate header and detail tables
  ctx.state.clothingSizeTableBuilt = true;
}
```

## Runtime API Design

Add a generic component handle plus type-specific handles:

```ts
ctx.component(idOrName: string): EventComponentHandle;
ctx.text(idOrName: string): EventTextHandle;
ctx.image(idOrName: string): EventImageHandle;
ctx.table(idOrName: string): EventTableHandle;
ctx.barcode(idOrName: string): EventBarcodeHandle;
ctx.qrcode(idOrName: string): EventQRCodeHandle;
ctx.checkbox(idOrName: string): EventCheckboxHandle;
ctx.richtext(idOrName: string): EventRichTextHandle;
ctx.chart(idOrName: string): EventChartHandle;
ctx.line(idOrName: string): EventLineHandle;
ctx.shape(idOrName: string): EventShapeHandle;
ctx.pageNumber(idOrName: string): EventPageNumberHandle;
ctx.dateTime(idOrName: string): EventDateTimeHandle;
ctx.panel(idOrName: string): EventPanelHandle;
```

All handles share base operations:

```ts
interface EventComponentHandle<TComponent = ReportComponent> {
  readonly component: TComponent;
  readonly id: string;
  readonly name?: string;
  readonly type: string;
  setProperty(path: string, value: unknown): this;
  getProperty(path: string): unknown;
  setBounds(bounds: Partial<{ x: number; y: number; width: number; height: number }>): this;
  show(): this;
  hide(): this;
}
```

Type-specific handles add clear methods:

```ts
interface EventTextHandle extends EventComponentHandle<TextComponent> {
  setText(text: string): this;
  bindText(expression: string): this;
}

interface EventImageHandle extends EventComponentHandle<ImageComponent> {
  setSource(src: string): this;
}

interface EventBarcodeHandle extends EventComponentHandle<BarcodeComponent> {
  setValue(value: string): this;
  setFormat(format: string): this;
}

interface EventQRCodeHandle extends EventComponentHandle<QRCodeComponent> {
  setValue(value: string): this;
}

interface EventCheckboxHandle extends EventComponentHandle<CheckboxComponent> {
  setChecked(expressionOrValue: string | boolean): this;
  setLabel(label: string): this;
}

interface EventRichTextHandle extends EventComponentHandle<RichtextComponent> {
  setHtml(html: string): this;
}
```

The table handle is the richest type-specific handle:

```ts
interface EventTableHandle extends EventComponentHandle<TableComponent> {
  readonly rowCount: number;
  readonly columnCount: number;
  findCellText(text: string): { row: number; column: number } | undefined;
  ensureColumnCount(count: number): EventTableHandle;
  ensureRowCount(count: number): EventTableHandle;
  insertColumnsAfter(column: number, count: number): EventTableHandle;
  insertRowsAfter(row: number, count: number): EventTableHandle;
  setCellText(row: number, column: number, text: string): EventTableHandle;
  setCell(row: number, column: number, updates: Partial<TableCell>): EventTableHandle;
  mergeCells(row: number, column: number, rowSpan: number, colSpan: number): EventTableHandle;
  setColumnWidth(column: number, width: number | undefined): EventTableHandle;
  distributeColumns(startColumn: number, count: number): EventTableHandle;
}
```

Chart, line, shape, page number, date/time, and panel handles can initially provide the base operations plus one or two obvious convenience methods where the component has a primary value. They still need typed declarations and completions so users can discover and safely mutate them. Unsupported component type requests must throw readable errors, for example `ctx.table("Text1")` should say the component exists but is not a table.

Mutator methods update the underlying component in place, then return the same handle to support script chaining.

## Editor Completion Design

The Monaco event editor should understand component ids and names:

- `ctx.getComponent("...")` should offer all component ids and names.
- `ctx.component("...")` should offer all component ids and names and return the generic handle.
- Type-specific helpers such as `ctx.text("...")`, `ctx.image("...")`, `ctx.barcode("...")`, and `ctx.table("...")` should offer only matching component types.
- `ctx.table("...")` should offer only table component ids and names.
- Component completion details should include the component type and whether the insert text is an `id` or `name`.
- `ctx.component`, all type-specific helper methods, and their handle methods should be present in the TypeScript declaration extra lib, so typing `ctx.table("OrderSizeHeaderTable").` or `ctx.text("Title1").` shows useful methods with explanations.

The existing component tree in the event dialog can remain, but completion insertion should be upgraded from raw component key insertion to useful snippets such as:

```js
ctx.getComponent("Text1")
ctx.component("Text1")
ctx.text("Text1")
ctx.table("OrderSizeHeaderTable")
```

## Clothing Order Example Design

The example template should contain:

- A data header band table named `OrderSizeHeaderTable`.
- A data band detail table named `OrderSizeDetailTable`.
- Both tables start with one placeholder size column whose placeholder text is `S1`.
- Fixed columns include style number, product name, tag price, color, total quantity, price, and amount.
- The report `beforeData` event reads `ctx.data.clothingOrder.sizeGroups` and expands both tables.

Example script shape:

```js
if (!ctx.state.clothingSizeTableBuilt) {
  const groups = ctx.data.clothingOrder?.sizeGroups ?? [];
  const maxSizeCount = groups.reduce((count, group) => Math.max(count, group.sizes?.length ?? 0), 1);

  const header = ctx.table("OrderSizeHeaderTable");
  const detail = ctx.table("OrderSizeDetailTable");
  const headerPlaceholder = header.findCellText("S1");
  const detailPlaceholder = detail.findCellText("S1");

  if (!headerPlaceholder || !detailPlaceholder) {
    ctx.log.warning("Size placeholder S1 was not found.");
  } else {
    header.ensureColumnCount(header.columnCount + maxSizeCount - 1);
    detail.ensureColumnCount(detail.columnCount + maxSizeCount - 1);
    header.ensureRowCount(groups.length);

    for (let row = 0; row < groups.length; row += 1) {
      for (let index = 0; index < maxSizeCount; index += 1) {
        header.setCellText(row, headerPlaceholder.column + index, groups[row]?.sizes?.[index] ?? "");
      }
    }

    for (let index = 0; index < maxSizeCount; index += 1) {
      detail.setCellText(detailPlaceholder.row, detailPlaceholder.column + index, `{S${index + 1}}`);
    }

    ctx.state.clothingSizeTableBuilt = true;
  }
}
```

The final implementation can improve this script for width setting and fixed-column merging, but the example must visibly demonstrate the script-driven expansion rather than a built-in dynamic-size configuration.

## Testing Strategy

- Core tests for `ctx.table` lookup by id and name, invalid component handling, column insertion, row insertion, cell text, merges, and column distribution.
- Editor completion tests for component id/name suggestions and `ctx.table(...)` snippets.
- Example tests verifying that the clothing order template includes the `beforeData` script, header/detail table names, placeholder cells, and a data source with multiple size groups.
- Render or pagination tests verifying the expanded output has multiple header rows and aligned dynamic size columns.

## Acceptance Criteria

- A user can type component ids or names in the event editor and receive relevant completions.
- All current component types have a discoverable script entry point and at least base mutation methods.
- A user can call `ctx.table("OrderSizeHeaderTable")` from a report `beforeData` event.
- A script can insert enough size columns and header rows from runtime data.
- Header fixed columns merge vertically across size group rows.
- Data band size cells bind to `{S1}`, `{S2}`, and subsequent positional fields.
- The clothing order print example renders in the screenshot-style structure, with dynamic size header rows and aligned detail columns.
