# 数据绑定

数据绑定用于把报表模板连接到运行时 JSON。当前模型下，不需要手动维护多个模板数据源。把 JSON 传给 `Designer`、`Viewer` 或 `renderReport` 后，Report Designer 会自动推断单个 `root` 数据源，并把嵌套数组路径暴露给数据带、表格和图表使用。

## 自动数据源

```tsx
const data = {
  orderNo: 'SO-202606-001',
  customer: { name: '华东客户', phone: '13812345678' },
  items: [
    { product: { name: '云服务年包' }, qty: 2, amount: 1000 },
    { product: { name: '实施服务' }, qty: 1, amount: 500 },
  ],
};

<Designer template={template} data={data} />
<Viewer template={template} data={data} />
```

运行时会自动推断：

- `root` 作为模板数据源。
- `orderNo`、`customer.name`、`customer.phone`、`items.product.name`、`items.qty`、`items.amount` 等字段。
- `items` 这样的数组行集，可用于数据带、表格和图表。

如果传入顶层数组，系统会包装为 `{ items: [...] }`，因此数组路径仍然是 `items`。

## DataSource 结构

模板中保存的是自动推断出的单个 `root` 数据源：

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

字段名是相对于运行时 JSON 的点路径：

```ts
interface DataField {
  id?: string;
  name: string; // 例如 "customer.name" 或 "items.amount"
  path?: string;
  type: 'null' | 'boolean' | 'number' | 'date' | 'string';
  label?: string;
  nullable?: boolean;
}
```

## 字段表达式

字段引用使用花括号：

```ts
textComponent.text = '{orderNo}';
textComponent.text = '{customer.name}';
textComponent.text = 'FORMAT("N2", {items.amount})';
textComponent.text = 'SUM({items.amount})';
```

在绑定到 `items` 的数据带内，`{product.name}` 和 `{items.product.name}` 都可以从当前明细行解析。通过可视化设计器编写模板时，建议使用表达式编辑器插入的完整路径。

## 数据带

数据带遍历一个行集。使用 `root` 可以遍历根对象单行，使用 `items` 这样的嵌套数组路径可以遍历明细行：

```ts
band.type = 'data';
band.dataBand = {
  dataSourceId: 'items',
  filterExpression: '{items.amount} > 0',
  sort: [{ field: 'amount', direction: 'asc' }],
};
```

| 属性 | 说明 |
| --- | --- |
| `dataSourceId` | `root` 或 JSON 数组路径，例如 `items`、`orders`、`orders.items`。 |
| `filterExpression` | 可选的行过滤表达式。 |
| `sort` | 可选的排序配置。字段名相对于当前行集。 |
| `oddRowBackgroundColor` / `evenRowBackgroundColor` | 奇偶行背景色。 |
| `columns` | 多列布局设置。 |
| `hierarchical.childrenField` | 树形行数据的子数组字段名。 |

## 表格

表格可以是固定结构，也可以绑定明细行。明细表格绑定到对应的数组路径：

```ts
tableComponent.binding = {
  mode: 'detail',
  dataSourceId: 'items',
};

tableComponent.columns = [
  { id: 'col1', header: '品名', field: 'product.name', width: 100, cellType: 'text' },
  { id: 'col2', header: '数量', field: 'qty', width: 40, cellType: 'text' },
  { id: 'col3', header: '金额', field: 'amount', width: 60, cellType: 'text' },
];
```

## 图表

图表使用同样的行集概念：

```ts
chartComponent.binding = {
  dataSourceId: 'items',
  dimensions: [{ field: 'product.name' }],
  measures: [{ field: 'amount', aggregation: 'sum' }],
};
```

## JSON 数据字典对话框

设计器中的 JSON 数据字典对话框用于推断字段，不用于手工建模多个数据源：

1. 粘贴有代表性的 JSON。
2. 对话框自动推断 `root` 字段树。
3. 确认后把推断字段保存到模板，并刷新设计时行集。

不要手动创建父子数据源。嵌套数组通过 JSON 路径处理，例如 `items` 或 `orders.items`。

