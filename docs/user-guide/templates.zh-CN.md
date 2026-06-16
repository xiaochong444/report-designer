# 模板管理

模板是报表的 JSON 定义。本指南涵盖模板结构、版本控制、验证、序列化和管理模式。

## 模板结构

`ReportTemplate` 是根对象：

```ts
interface ReportTemplate {
  id: string;                        // 唯一模板标识符
  name: string;                      // 显示名称
  version: '2.0';                    // 模板模式版本
  pages: Page[];                     // 报表中的页面
  dataSources: DataSource[];         // 数据源定义
  styles: ReportStyle[];             // 文本样式库
  conditionalFormats: ConditionalFormat[]; // 条件格式规则
  parameters: ReportParameter[];     // 输入参数
  fonts?: ReportFont[];              // 自定义字体定义
  events?: EventMap<ReportEventName>; // 报表级事件脚本
}
```

## 创建模板

### 使用默认模板工厂

```ts
import { createDefaultTemplate } from '@report-designer/core';

const template = createDefaultTemplate('销售报表');
```

这会创建一个模板，包含：
- 单个 A4 纵向页面。
- 默认带：`reportTitle`、`pageHeader`、`data`、`pageFooter`。
- 默认文本样式（Normal、Title、Header、Data、Footer、Group）。
- 默认字体。

### 从零构建

```ts
import type { ReportTemplate, Page, Band } from '@report-designer/core';

const template: ReportTemplate = {
  id: 'template_001',
  name: '自定义报表',
  version: '2.0',
  pages: [{
    id: 'page_001',
    name: '页面 1',
    width: 210,
    height: 297,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    orientation: 'portrait',
    bands: [],
  }],
  dataSources: [],
  styles: [],
  conditionalFormats: [],
  parameters: [],
};
```

## 模板版本

当前模式版本是 `'2.0'`：

```ts
template.version = '2.0';
```

从存储中读取模板 JSON 后，使用 `normalizeTemplate()` 在编辑或渲染前补齐运行时默认结构：

```ts
import { normalizeTemplate } from '@report-designer/core';

const normalized = normalizeTemplate(loadedTemplate);
```

## 模板验证

在保存或渲染之前验证模板：

```ts
import { validateTemplate } from '@report-designer/core';

const result = validateTemplate(template, { strictPrintableArea: true });

if (!result.valid) {
  for (const error of result.errors) {
    console.error(`${error.path}: ${error.message}`);
  }
}
```

### 验证规则

| 规则 | 说明 |
| --- | --- |
| 至少一个页面 | 模板必须有一个页面。 |
| 唯一 ID | 所有 ID（模板、页面、带、组件、数据源、样式、格式、参数）必须唯一。 |
| 有效尺寸 | 页面宽/高必须为正数。组件尺寸必须非负。 |
| 打印区域 | 组件必须适合页面边距和带高度内（启用 `strictPrintableArea` 时）。 |
| 数据带引用 | 数据带必须引用有效的数据源。 |
| 分组头/尾配对 | 分组尾必须有前面匹配的分组头。 |
| 分组头表达式 | 分组头必须有 `conditionExpression`。 |

## 序列化

### 保存模板

模板是纯 JSON 对象。序列化它们以便存储：

```ts
// 保存到 localStorage
localStorage.setItem('report-template', JSON.stringify(template));

// 保存到服务器
await fetch('/api/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(template),
});
```

### 加载模板

```ts
// 从 localStorage 加载
const saved = localStorage.getItem('report-template');
const template: ReportTemplate = JSON.parse(saved);

// 规范化以确保运行时默认结构被填充
const normalized = normalizeTemplate(template);
```

## 模板管理模式

### 模板目录

维护可用模板的目录：

```ts
interface TemplateCatalog {
  id: string;
  name: string;
  description: string;
  category: string;
  template: ReportTemplate;
  thumbnail?: string;
}
```

### 模板参数

参数允许运行时自定义：

```ts
template.parameters = [
  { id: 'p1', name: 'startDate', type: 'date', defaultValue: '2026-01-01' },
  { id: 'p2', name: 'endDate', type: 'date', defaultValue: '2026-12-31' },
  { id: 'p3', name: 'companyName', type: 'string', defaultValue: 'Acme Corp' },
];
```

参数在表达式中可作为 `parameters.companyName` 访问，并在渲染时传递给 Viewer：

```tsx
<Viewer
  template={template}
  data={runtimeData}
  parameters={{ startDate: '2026-01-01', endDate: '2026-06-30', companyName: 'Acme Corp' }}
/>
```

### 子报表

在一个模板中嵌入另一个模板：

```ts
const subreportComponent: SubreportComponent = {
  id: 'subreport_001',
  type: 'subreport',
  templateUrl: '/api/templates/invoice-detail',
  parameters: {
    invoiceId: 'currentInvoice.id',
  },
  x: 0, y: 0, width: 170, height: 50,
};
```

## 页面设置

### 页面尺寸

常见页面尺寸（单位 mm）：

| 尺寸 | 宽度 | 高度 |
| --- | --- | --- |
| A4 | 210 | 297 |
| A3 | 297 | 420 |
| Letter | 215.9 | 279.4 |
| Legal | 215.9 | 355.6 |
| A5 | 148 | 210 |

### 页面方向

```ts
page.orientation = 'portrait';  // 宽度 < 高度
page.orientation = 'landscape'; // 宽度 > 高度
```

### 水印

```ts
page.watermark = {
  enabled: true,
  text: '机密',
  fontFamily: 'Arial',
  fontSize: 48,
  color: '#8c8c8c',
  opacity: 0.18,
  angle: -35,
  horizontalAlign: 'center',
  verticalAlign: 'middle',
  showBehind: true,
};
```

### 页面边框

```ts
page.pageBorder = {
  enabled: true,
  style: 'solid',
  width: 0.2,
  color: '#000000',
  sides: { top: true, right: true, bottom: true, left: true },
  offset: 0,
};
```

## 多页报表

向模板添加多个页面：

```ts
template.pages = [
  { /* 封面 */ },
  { /* 数据页 */ },
  { /* 汇总页 */ },
];
```

每个页面可以有不同的尺寸、方向和带配置。
