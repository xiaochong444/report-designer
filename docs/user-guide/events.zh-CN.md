# 事件脚本

事件允许你在报表渲染生命周期的特定点执行自定义 JavaScript 逻辑。本指南涵盖事件系统、事件类型、事件上下文以及如何编写事件脚本。

## 事件生命周期

事件在报表渲染的特定时机触发。事件系统以三种模式运行：

- **preview** —— 事件在浏览器预览时触发。
- **print** —— 事件在浏览器打印时触发。
- **pdf** —— 事件在 PDF 导出时触发。

## 按所有者分类的事件类型

### 报表级事件

| 事件 | 触发时机 |
| --- | --- |
| `beforePreview` | 报表预览开始渲染之前。 |
| `beforePrint` | 报表打印任务开始之前。 |
| `beforeRender` | 报表渲染开始之前（预览和打印均适用）。 |
| `afterRender` | 报表渲染完成后。 |
| `beforeData` | 数据处理开始之前。 |
| `afterData` | 数据处理完成后。 |

### 页面级事件

| 事件 | 触发时机 |
| --- | --- |
| `beforePrint` | 特定页面打印之前。 |
| `afterPrint` | 特定页面打印之后。 |

### 带级事件

| 事件 | 触发时机 |
| --- | --- |
| `beforePrint` | 带在页面上渲染之前。 |
| `afterPrint` | 带在页面上渲染之后。 |
| `beforeRow` | 数据带中处理数据行之前。 |
| `afterRow` | 数据带中处理数据行之后。 |

### 组件事件

| 事件 | 触发时机 |
| --- | --- |
| `getValue` | 组件的值被求值时。 |
| `beforePrint` | 组件渲染之前。 |
| `afterPrint` | 组件渲染之后。 |

## 事件脚本

事件脚本是在事件上下文中执行的 JavaScript 字符串：

```ts
interface EventScript {
  enabled: boolean;
  script: string;
}
```

### 在模板中设置事件

事件存储在每个层级模板的 `events` 属性中：

```ts
// 报表级事件
template.events = {
  beforeRender: {
    enabled: true,
    script: 'log("报表渲染开始");',
  },
  afterRender: {
    enabled: true,
    script: 'log("报表渲染完成。总页数：" + TOTALPAGES());',
  },
};

// 带级事件
band.events = {
  beforePrint: {
    enabled: true,
    script: 'if (rowIndex % 2 === 0) { band.backgroundColor = "#f5f5f5"; }',
  },
  afterRow: {
    enabled: true,
    script: 'log("第 " + rowIndex + " 行已处理");',
  },
};

// 组件事件
textComponent.events = {
  getValue: {
    enabled: true,
    script: 'value = row.amount > 1000 ? "VIP客户" : "普通客户";',
  },
};
```

## 事件上下文

事件脚本在 `EventContext` 对象中运行，该对象提供对报表状态的访问：

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `mode` | `'preview' \| 'print' \| 'pdf'` | 当前渲染模式。 |
| `report` | `ReportTemplate` | 完整的报表模板。 |
| `page` | `Page` | 当前正在渲染的页面。 |
| `band` | `Band` | 当前正在渲染的带。 |
| `component` | `EventComponentAccessor` | 对当前组件的访问。 |
| `currentComponent` | `ReportComponent` | 正在处理的组件。 |
| `row` | `Record<string, unknown>` | 当前数据行（在数据带中）。 |
| `rowIndex` | `number` | 当前行索引（从 0 开始）。 |
| `dataSourceId` | `string` | 活动数据源的 ID。 |
| `data` | `Record<string, unknown>` | 当前数据上下文。 |
| `parameters` | `Record<string, unknown>` | 报表参数。 |
| `variables` | `Record<string, unknown>` | 你可以读写的自定义变量。 |
| `state` | `Record<string, unknown>` | 跨事件的持久状态。 |
| `target` | `EventTargetState` | 事件目标元数据。 |
| `log` | `EventLogCollector` | 事件日志接口。 |

## 事件上下文方法

| 方法 | 说明 |
| --- | --- |
| `cancel()` | 取消当前渲染操作。 |
| `hide()` | 隐藏当前元素（带/组件）。 |
| `setValue(value)` | 设置当前组件的值。 |
| `getComponent(name)` | 按名称获取组件。 |
| `setComponentProperty(name, path, value)` | 动态修改组件属性。 |
| `bindText(name, expression)` | 绑定组件的文本内容。 |

## 动态组件创建

事件可以在渲染期间动态创建组件：

```ts
// 在 beforePrint 事件脚本中：
createText({
  x: 10,
  y: 5,
  width: 100,
  height: 10,
  text: '通过事件添加的动态文本',
  font: { size: 12, bold: true },
});

createImage({
  x: 10,
  y: 20,
  width: 50,
  height: 50,
  src: 'https://example.com/logo.png',
});

createBarcode({
  x: 10,
  y: 80,
  width: 60,
  height: 20,
  value: row.orderNumber,
  format: 'CODE128',
  showText: true,
});
```

## 事件日志

使用 `log` 对象在事件执行期间记录信息：

```ts
log.info("正在处理第 " + rowIndex + " 行");
log.warning("第 " + rowIndex + " 行缺少 'discount' 字段");
log.error("无效的金额值：" + row.amount);
```

日志条目会出现在查看器的 `EventLogPanel` 中，帮助调试事件脚本。

## 事件编辑器

设计器提供基于 Monaco 的完整事件脚本编辑器：

- JavaScript 语法高亮。
- 访问事件目录和可用属性。
- 事件脚本验证。
- 从错误导航回事件源。

### 打开事件编辑器

1. 在设计器中选择一个带或组件。
2. 在属性面板中找到**事件**部分。
3. 点击要编辑的事件。
4. 编辑器会打开并显示当前脚本内容。

## 常见事件模式

### 交替行颜色

```ts
// 带 beforeRow 事件
band.backgroundColor = (rowIndex % 2 === 0) ? '#ffffff' : '#f5f5f5';
```

### 条件可见性

```ts
// 组件 beforePrint 事件
if (row.status !== 'completed') {
  hide();
}
```

### 动态值计算

```ts
// 文本组件 getValue 事件
value = row.discount > 0
  ? FORMAT(row.amount * (1 - row.discount), '0.00')
  : FORMAT(row.amount, '0.00');
```

### 数据验证

```ts
// 带 beforeRow 事件
if (!row.orderNumber) {
  log.error("第 " + rowIndex + " 行缺少订单号");
  cancel();
}
```

### 带动态内容的页眉

```ts
// 页面 beforePrint 事件
setComponentProperty('pageTitle', 'text', '报表：' + parameters.reportName);
```

## 事件执行限制

事件系统内置了防止无限循环的保护：

- `maxEventCount` 限制单次渲染期间可触发的事件总数。
- `dynamicCounters` 跟踪每种事件类型的触发次数。
- 超出限制会在事件日志中触发错误。
