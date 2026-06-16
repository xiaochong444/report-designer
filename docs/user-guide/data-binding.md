# Data Binding

Data binding connects report templates to runtime JSON. In the current model, you do not manually maintain multiple template data sources. Pass JSON to `Designer`, `Viewer`, or `renderReport`; Report Designer infers a single `root` data source and exposes nested array paths for data bands, tables, and charts.

## Automatic Data Sources

```tsx
const data = {
  orderNo: 'SO-202606-001',
  customer: { name: 'Acme', phone: '13812345678' },
  items: [
    { product: { name: 'Cloud Service' }, qty: 2, amount: 1000 },
    { product: { name: 'Implementation' }, qty: 1, amount: 500 },
  ],
};

<Designer template={template} data={data} />
<Viewer template={template} data={data} />
```

The runtime infers:

- `root` as the template data source.
- Fields such as `orderNo`, `customer.name`, `customer.phone`, `items.product.name`, `items.qty`, and `items.amount`.
- Array row sets such as `items`, which can be selected by a data band, table, or chart.

If you pass a top-level array, it is wrapped as `{ items: [...] }`, so the array path is still `items`.

## DataSource Structure

The template stores the inferred dictionary as a single `root` source:

```ts
interface DataSource {
  id: 'root';
  name: 'root';
  type: 'json';
  path?: 'root';
  fields?: DataField[];
  schema?: DataField[];
}
```

Field names are dot paths relative to the runtime JSON:

```ts
interface DataField {
  id?: string;
  name: string; // e.g. "customer.name" or "items.amount"
  path?: string;
  type: 'null' | 'boolean' | 'number' | 'date' | 'string';
  label?: string;
  nullable?: boolean;
}
```

## Field Expressions

Use braces for field references:

```ts
textComponent.text = '{orderNo}';
textComponent.text = '{customer.name}';
textComponent.text = 'FORMAT("N2", {items.amount})';
textComponent.text = 'SUM({items.amount})';
```

Inside a data band bound to `items`, both `{product.name}` and `{items.product.name}` can resolve from the current item row. Prefer the fully qualified form inserted by the expression editor when authoring templates visually.

## Data Bands

A data band iterates one row set. Use `root` for a single root object row, or a nested array path such as `items` for detail rows:

```ts
band.type = 'data';
band.dataBand = {
  dataSourceId: 'items',
  filterExpression: '{items.amount} > 0',
  sort: [{ field: 'amount', direction: 'asc' }],
};
```

| Property | Description |
| --- | --- |
| `dataSourceId` | `root` or a JSON array path such as `items`, `orders`, or `orders.items`. |
| `filterExpression` | Optional expression evaluated for each row. |
| `sort` | Optional row sort configuration. Field names are relative to the selected row set. |
| `oddRowBackgroundColor` / `evenRowBackgroundColor` | Alternating row colors. |
| `columns` | Multi-column layout settings. |
| `hierarchical.childrenField` | Child array property for tree-like rows. |

## Tables

Tables can be fixed-layout or detail-bound. For detail rows, bind the table to the relevant array path:

```ts
tableComponent.binding = {
  mode: 'detail',
  dataSourceId: 'items',
};

tableComponent.columns = [
  { id: 'col1', header: 'Product', field: 'product.name', width: 100, cellType: 'text' },
  { id: 'col2', header: 'Qty', field: 'qty', width: 40, cellType: 'text' },
  { id: 'col3', header: 'Amount', field: 'amount', width: 60, cellType: 'text' },
];
```

## Charts

Charts use the same row-set concept:

```ts
chartComponent.binding = {
  dataSourceId: 'items',
  dimensions: [{ field: 'product.name' }],
  measures: [{ field: 'amount', aggregation: 'sum' }],
};
```

## JSON Data Dictionary Dialog

The designer's JSON data dictionary dialog is for inference, not manual multi-source modeling:

1. Paste representative JSON.
2. The dialog infers the `root` field tree.
3. Confirm to store the inferred fields in the template and refresh design-time row sets.

Do not create separate data sources for nested arrays. Nested arrays are handled by their JSON path, for example `items` or `orders.items`.
