# 快速上手

本指南将带你完成 Report Designer 的安装、核心概念理解，以及渲染你的第一份报表。

## 什么是 Report Designer？

Report Designer 是一个可嵌入 React 应用的报表设计器、预览器和打印/PDF 工具包，用于业务文档。它由三个 npm 包组成：

| 包名 | 说明 |
| --- | --- |
| `@report-designer/core` | 模板模型、表达式引擎、分页、布局、渲染、事件和共享运行时。框架无关，可在服务端或浏览器中运行。 |
| `@report-designer/designer` | React 可视化设计器 UI —— 画布、功能区工具栏、属性面板、组件面板和报表树。 |
| `@report-designer/viewer` | React 预览组件 —— DOM 渲染、分页显示、浏览器打印、PDF 导出和 Chrome 静默打印桥接。 |

## 前置要求

- Node.js 18+ 和 pnpm
- React 19+（设计器和预览器需要）
- Ant Design 6+（设计器和预览器 UI 需要）
- Zustand 5+（设计器状态管理需要）

### 对等依赖

设计器和预览器将 React、React DOM、Ant Design 和 Zustand 声明为**对等依赖**（peer dependencies），它们**不会被打包**进发布包，需要你在自己的应用中安装：

```bash
pnpm add @report-designer/core @report-designer/designer @report-designer/viewer
pnpm add react react-dom antd zustand
```

如果你只需要 `core` 包（例如在服务端渲染报表），则不需要 Ant Design 和 Zustand。

| 包名 | 必须手动安装的对等依赖 |
| --- | --- |
| `@report-designer/core` | 无 |
| `@report-designer/designer` | `react`、`react-dom`、`antd@^6`、`zustand@^5` |
| `@report-designer/viewer` | `react`、`react-dom`、`antd@^6` |

## 核心概念

### 模板

`ReportTemplate` 是报表的 JSON 表示，包含：

- **页面**（Pages）—— 每个页面有尺寸、边距、方向和带（bands）。
- **带**（Bands）—— 页面的水平区域（页眉、页脚、数据带等）。
- **组件**（Components）—— 放置在带中的可视化元素（文本、表格、图表、条码等）。
- **数据源**（Data Sources）—— 根据 JSON 自动推断出的字段和数组路径。
- **样式**（Styles）—— 可复用的文本样式定义。
- **条件格式**（Conditional Formats）—— 基于规则的外观变化。
- **参数**（Parameters）—— 渲染时可传入的输入值。
- **事件**（Events）—— 在渲染生命周期中运行的脚本。

### 带（Band）系统

带是最基本的布局单元。每个带有一个类型：

| 带类型 | 用途 |
| --- | --- |
| `reportTitle` | 在报表开头出现一次。 |
| `reportSummary` | 在报表末尾出现一次。 |
| `pageHeader` | 在每页顶部重复出现（或根据 `printOn` 设置）。 |
| `pageFooter` | 在每页底部重复出现。 |
| `header` | 区域标题 —— 在数据带之前打印。 |
| `footer` | 区域页脚 —— 在数据带之后打印。 |
| `groupHeader` | 分组标题 —— 分组键变化时打印。 |
| `groupFooter` | 分组页脚 —— 分组结束时打印。 |
| `columnHeader` | 多列布局的列标题。 |
| `columnFooter` | 多列布局的列页脚。 |
| `data` | 遍历数据源的每一行。 |
| `hierarchicalData` | 递归数据带，用于树形/层级数据。 |
| `overlay` | 自由浮动覆盖层。 |

### 组件类型

组件是可视化构建块：

| 类型 | 说明 |
| --- | --- |
| `text` | 带格式的单行或多行文本。 |
| `richtext` | 富文本内容（HTML/Tiptap 格式）。 |
| `image` | 从 URL 或 data URI 加载的图片。 |
| `table` | 带有行、列和单元格样式的结构化表格。 |
| `chart` | 数据可视化（折线、柱状、饼图、散点、雷达、漏斗等）。 |
| `barcode` | 条码（CODE128、EAN13、EAN8、UPC、CODE39、ITF14）。 |
| `qrcode` | 二维码。 |
| `checkbox` | 带可选标签的复选框。 |
| `pagenumber` | 页码显示（`1`、`1/N`、`Page 1 of N` 等）。 |
| `datetime` | 当前日期/时间显示。 |
| `subreport` | 嵌入的子报表。 |
| `panel` | 嵌套组件的容器。 |
| `line` | 装饰性线条。 |
| `shape` | 矩形、椭圆、圆角矩形、三角形。 |

### 表达式

表达式是基于字符串的公式，用于动态计算值。支持：

- 字段引用：`{field.path}`
- 算术运算：`+`、`-`、`*`、`/`
- 比较运算：`==`、`!=`、`<`、`>`、`<=`、`>=`
- 逻辑运算：`&&`、`||`、`!`
- 内置函数：`IF()`、`SUM()`、`AVG()`、`COUNT()`、`ROUND()`、`FORMAT()` 等。

完整的表达式参考请查看[表达式](./expressions.md)指南。

## 快速开始

### 1. 安装依赖

```bash
pnpm add @report-designer/core @report-designer/designer @report-designer/viewer
pnpm add react react-dom antd zustand
```

### 2. 创建报表模板

```ts
import { createDefaultTemplate, type ReportTemplate } from '@report-designer/core';

const template: ReportTemplate = createDefaultTemplate('我的第一份报表');

// 数据源会在设计/渲染时根据 data 属性自动推断。
// 新模板可以保持 template.dataSources 为空。
template.dataSources = [];
```

### 3. 使用设计器

```tsx
import { useState } from 'react';
import type { ReportTemplate } from '@report-designer/core';
import { Designer } from '@report-designer/designer';

function MyDesigner({ template, data }: { template: ReportTemplate; data: unknown }) {
  const [currentTemplate, setCurrentTemplate] = useState(template);

  return (
    <Designer
      template={currentTemplate}
      data={data}
      onTemplateChange={setCurrentTemplate}
    />
  );
}
```

### 4. 使用预览器

```tsx
import { Viewer } from '@report-designer/viewer';
import type { ReportTemplate } from '@report-designer/core';

function MyViewer({ template, data }: { template: ReportTemplate; data: unknown }) {
  return <Viewer template={template} data={data} />;
}
```

### 5. 完整工作台

```tsx
import { useState } from 'react';
import { Button } from 'antd';
import type { ReportTemplate } from '@report-designer/core';
import { createDefaultTemplate } from '@report-designer/core';
import { Designer } from '@report-designer/designer';
import { Viewer } from '@report-designer/viewer';

const sampleData = {
  orderNo: 'ORD-001',
  customer: { name: '张三' },
  items: [
    { product: { name: '云服务年包' }, amount: 1200, orderDate: '2026-01-15' },
    { product: { name: '实施服务' }, amount: 850, orderDate: '2026-01-16' },
  ],
};

function ReportWorkspace() {
  const [template, setTemplate] = useState<ReportTemplate>(() => createDefaultTemplate('示例报表'));
  const [mode, setMode] = useState<'preview' | 'designer'>('preview');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px', display: 'flex', gap: '8px' }}>
        <Button onClick={() => setMode('designer')}>设计器</Button>
        <Button onClick={() => setMode('preview')}>预览</Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {mode === 'designer' ? (
          <Designer template={template} data={sampleData} onTemplateChange={setTemplate} />
        ) : (
          <Viewer template={template} data={sampleData} />
        )}
      </div>
    </div>
  );
}
```

## 下一步

- 了解[设计器](./designer.zh-CN.md)界面和工作流程。
- 学习[数据绑定](./data-binding.zh-CN.md)，将报表连接到真实数据。
- 探索[表达式](./expressions.zh-CN.md)用于动态计算。
- 设置[事件脚本](./events.zh-CN.md)实现自定义渲染逻辑。
- 了解[预览与打印](./preview-and-print.zh-CN.md)工作流程。
