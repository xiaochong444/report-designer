# 常见问题

关于 Report Designer 的常见问题。

## 概述

### Report Designer 是免费的吗？

是的。Report Designer 是开源的，遵循其仓库许可证。

### 支持哪些浏览器？

设计器和预览器在现代浏览器中运行：Chrome、Firefox、Safari 和 Edge。不支持 Internet Explorer。

### 我可以不使用 React 使用 Report Designer 吗？

`@report-designer/core` 包是框架无关的，可以在任何 JavaScript/TypeScript 项目中使用，包括服务端 Node.js。设计器和预览器包需要 React。

### 我可以在服务端使用 Report Designer 吗？

可以。`@report-designer/core` 可以在 Node.js 中运行，用于模板验证、数据处理和服务端渲染。你需要单独处理查看器的 DOM 渲染。

## 数据

### 支持哪些数据源类型？

目前仅支持 **JSON 数据源**。数据在渲染时作为 JavaScript 对象传入。未来版本可能会添加 REST API、SQL 和其他数据源类型。

### 我可以直接连接数据库吗？

不能直接连接。从数据库将数据加载到服务端的 JSON 对象中，然后在渲染时传递给 Viewer。

### 如何处理大数据集？

对于大数据集，考虑：
- 在传递给渲染器之前在服务端过滤数据。
- 在应用中使用分页，一次渲染一页。
- 使用服务端渲染而不是浏览器渲染。

### 我可以使用嵌套/层级数据吗？

可以。使用层级数据带（`hierarchicalData` 带类型）配合 `childrenField` 配置，或者把普通数据带绑定到 `items`、`orders.items` 这样的自动推断数组路径。

## 样式

### 如何添加自定义字体？

在模板的 `fonts` 数组中定义自定义字体：

```ts
template.fonts = [
  {
    id: 'font_001',
    name: 'Noto Sans SC',
    family: 'Noto Sans SC',
    source: {
      url: '/fonts/NotoSansSC-Regular.woff2',
      format: 'woff2',
    },
  },
];
```

### 如何使用自定义 CSS？

设计器和预览器使用 Ant Design 组件。你可以使用 CSS 自定义属性或 Ant Design 的主题配置覆盖样式。

## 打印

### 为什么我的中文在 PDF 中不显示？

中文字符需要在 PDF 中嵌入字体。通过 `PdfExportOptions.fontBytes` 或 `PdfExportOptions.fontBytesByFamily` 选项提供字体字节。

### 我可以不通过浏览器对话框打印吗？

可以，使用 Chrome 扩展静默打印桥接。参见 [Chrome 扩展](./chrome-extension.zh-CN.md) 和 [静默打印](./silent-printing.zh-CN.md) 指南。

### 为什么打印输出和预览不一样？

浏览器打印渲染可能与屏幕渲染略有不同，原因包括：
- 打印机 DPI 与屏幕 DPI 的差异。
- CSS 打印媒体查询处理。
- 打印机驱动程序边距。

确保打印机设置与模板页面尺寸和边距匹配。

## 性能

### Report Designer 可以处理多少页？

性能取决于：
- 每页的组件数量。
- 表达式和事件的复杂度。
- 数据大小。
- 浏览器能力。

对于非常大的报表（数百页），考虑服务端渲染。

### 为什么组件多时设计器很慢？

单个页面上大量组件会减慢渲染速度。考虑：
- 将内容拆分到多个页面。
- 对复杂部分使用子报表。
- 简化事件脚本。

## 集成

### 如何保存模板？

模板是纯 JSON。你可以：
- 保存到数据库（生产环境推荐）。
- 保存到 localStorage（用于开发/测试）。
- 保存为磁盘上的文件。

### 如何从服务器加载模板？

```ts
const response = await fetch('/api/templates/' + templateId);
const template: ReportTemplate = await response.json();
```

### 我可以自定义设计器 UI 吗？

可以。设计器提供可组合的 shell 组件（`DesignerShell`、`DesignerRibbon`、`DesignerLeftPanel`、`DesignerPropertyPanel`、`DesignerCanvasFrame`），你可以在自己的布局中排列它们。

### 我可以添加自定义组件吗？

当前组件类型是固定的。但是你可以：
- 使用 `panel` 组件嵌套组件。
- 使用事件在渲染时动态修改组件属性。
- 用自定义函数扩展表达式引擎。

## 故障排查

### 我的表达式求值不正确

检查：
- 字段引用使用花括号，例如 `{customer.name}` 或 `{items.amount}`。
- 字符串字面量使用单引号或双引号。
- 函数名不区分大小写，但参数区分大小写。
- 使用表达式编辑器的验证来捕获语法错误。

### 我的数据带没有显示行

检查：
- 数据带绑定到 `root` 或 `items` 这样的自动推断数组路径。
- 运行时 JSON 中存在该数组路径。
- 数组不为空。
- 过滤表达式没有排除所有行。

### 我的图表不渲染

检查：
- 图表有有效的 `chartType`。
- 绑定有有效的 `dataSourceId`。
- 绑定至少有一个 `dimension` 和一个 `measure`。
- 自动推断的 `root` 字段树中包含引用字段。

### 设计器加载时崩溃

检查：
- 模板 JSON 有效。
- 所有必填字段都存在（使用 `normalizeTemplate` 填充默认值）。
- 模板中没有重复的 ID。
- 运行 `validateTemplate` 检查结构错误。
