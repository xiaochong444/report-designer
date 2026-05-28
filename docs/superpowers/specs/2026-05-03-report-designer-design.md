# 报表设计器系统设计文档

> 对标 the reference report designer，基于 React + Ant Design 6 的商业级报表打印组件系统。

## 决策记录

| 决策项 | 选择 |
|--------|------|
| 数据引擎 | 简化表达式 + JSON Schema 注入 |
| 画布实现 | 从零自建（拖拽、缩放、选框、resize、网格） |
| 导出方案 | PDF（pdf-lib）+ 浏览器打印（@media print） |
| 项目结构 | 多包 Monorepo（core / designer / viewer / example） |
| 组件范围 | 文本、图片、表格、条码、复选框、富文本、子报表、面板、数据带 |
| 数据绑定 | 树形字典 + 拖拽绑定 |
| 模板格式 | 纯 JSON |
| 高级功能 | 分组 + 条件格式都做 |
| 架构模式 | 分层渲染管道（Template + Data → RenderTree → UI） |
| UI 框架 | Ant Design 6 |

---

## 1. 模板数据模型（JSON Schema）

### 1.1 报表模板根结构

```typescript
interface ReportTemplate {
  id: string;
  name: string;
  version: "1.0";
  pages: Page[];
  dataSources: DataSource[];
  styles: ReportStyle[];
  conditionalFormats: ConditionalFormat[];
}
```

### 1.2 页面

```typescript
interface Page {
  id: string;
  width: number;       // mm
  height: number;      // mm
  margins: Margins;
  orientation: "portrait" | "landscape";
  bands: Band[];
}

interface Margins {
  top: number; right: number; bottom: number; left: number;
}
```

### 1.3 数据源

```typescript
interface DataSource {
  id: string;
  name: string;
  type: "json" | "static";
  schema: DataField[];
  data?: Record<string, any>[];  // static 模式下的内联数据
}

interface DataField {
  name: string;
  type: "string" | "number" | "boolean" | "date";
  label?: string;
}
```

### 1.4 带系统

```typescript
interface Band {
  id: string;
  type: "reportTitle" | "reportSummary" | "pageHeader" | "pageFooter"
      | "groupHeader" | "groupFooter" | "data" | "child";
  height: number;
  components: ReportComponent[];
  dataSource?: string;       // 绑定的数据源 ID
  groupField?: string;       // 分组字段（仅 groupHeader/groupFooter）
  visible?: Expression;      // 条件可见性
}
```

### 1.5 组件

```typescript
interface ReportComponent {
  id: string;
  type: "text" | "image" | "table" | "barcode" | "checkbox" | "richtext"
      | "subreport" | "panel";
  x: number;      // mm，相对父容器
  y: number;
  width: number;
  height: number;
  style?: string;       // 引用 styles 中的样式 ID
  conditions?: ConditionRule[];
  anchor?: string;      // 组件锚点，用于子报表引用
}
```

### 1.6 组件特有属性

```typescript
interface TextComponent extends ReportComponent {
  type: "text";
  text: Expression;
  font: FontConfig;
  textAlign: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  border: BorderConfig;
  canGrow: boolean;     // 内容溢出时自动扩展高度
  canShrink: boolean;   // 内容不足时缩小
}

interface TableComponent extends ReportComponent {
  type: "table";
  dataSource: string;
  columns: TableColumn[];
  headerHeight: number;
  rowHeight: number;
  showBorder: boolean;
}

interface TableColumn {
  id: string;
  header: string;        // 列头文本（支持表达式）
  field: string;         // 绑定字段
  width: number;         // mm
  cellType: "text" | "image" | "barcode" | "checkbox";
}
```

### 1.7 辅助类型定义

```typescript
interface FontConfig {
  family: string;      // 字体名称（如 "Arial", "SimSun"）
  size: number;        // pt
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;       // CSS 颜色（如 "#333333"）
}

interface BorderConfig {
  style: "none" | "solid" | "dashed" | "dotted" | "double";
  width: number;       // mm
  color: string;       // CSS 颜色
  sides: {             // 可分别控制四边
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

interface ConditionRule {
  id: string;
  expression: Expression;    // 条件表达式，如 "{Order.Total} > 1000"
  overrides: {               // 满足条件时覆盖的属性
    [key: string]: any;      // 如 { "font.color": "#FF0000", "border.color": "red" }
  };
}

interface ReportStyle {
  id: string;
  name: string;
  font: FontConfig;
  border: BorderConfig;
  backgroundColor: string;
}

interface ConditionalFormat {
  id: string;
  name: string;
  rules: ConditionRule[];
  applyTo: string[];         // 应用到的组件 ID 列表
}
```

### 1.8 关键设计点

- 所有坐标使用 **mm** 而非 px，与打印单位一致，渲染时根据 DPI 转换
- `canGrow` / `canShrink` 控制内容溢出时的行为
- 条件格式独立于组件，通过 ID 引用，支持跨组件复用
- 表达式类型：`type Expression = string;`
  - 示例：`"{Employee.Name}"`、`"{Order.Total} * {Order.Quantity}"`、`"IF({Order.Total} > 1000, 'VIP', 'Normal')"`

---

## 2. 表达式引擎

### 2.1 语法

```
{DataSource.Field}           // 字段引用
{DataSource.Field} + 100     // 算术运算
IF({Order.Total} > 1000, "VIP", "Normal")   // 条件函数
ROUND({Order.Total}, 2)      // 数值函数
FORMAT({Order.Date}, "yyyy-MM-dd")           // 格式化
```

### 2.2 架构

```
ExpressionEngine
  ├── Lexer/Parser    词法分析 → AST（支持字段引用、运算符、函数调用、括号优先级）
  ├── Evaluator       AST + 数据上下文 → 求值结果
  └── FunctionLibrary 内置函数库（白名单模式，20+ 函数）
```

### 2.3 内置函数白名单

| 分类 | 函数 |
|------|------|
| 字符串 | `CONCAT`, `SUBSTRING`, `LENGTH`, `UPPER`, `LOWER`, `TRIM`, `REPLACE` |
| 数值 | `ROUND`, `ABS`, `SUM`, `AVG`, `MIN`, `MAX`, `CEIL`, `FLOOR` |
| 逻辑 | `IF`, `IIF`, `AND`, `OR`, `NOT`, `ISNULL` |
| 日期 | `TODAY`, `NOW`, `DATEADD`, `DATEDIFF`, `FORMAT` |
| 类型转换 | `TONUMBER`, `TOSTRING`, `TODATE` |

### 2.4 求值流程

```
表达式字符串 → Parser.parse() → AST → Evaluator.eval(ast, dataContext) → 结果

dataContext = {
  "Employee": { "Name": "张三", "Salary": 5000 },
  "Order":    { "Total": 1200, "Date": "2026-05-03" }
}
```

### 2.5 关键设计点

- 不解析 JavaScript 代码，不执行 `eval`，纯自定义 AST，安全可控
- 字段引用 `{X.Y}` 在渲染前校验字段是否存在于数据源 schema 中
- 聚合函数（SUM/AVG 等）不在 Evaluator 中直接计算，由 renderer 按分组上下文注入预聚合值

---

## 3. 渲染引擎（Renderer）

### 3.1 渲染管道

```
ReportTemplate + DataContext
    ↓
[1] 数据绑定层 — 将数据注入模板，解析表达式，计算可见性
    ↓
[2] 布局计算层 — 计算分页、canGrow、分组数据展开、行高自适应
    ↓
[3] 渲染树输出 — RenderTree（平台无关的结构化数据）
```

### 3.2 渲染树结构

```typescript
interface RenderTree {
  pages: RenderPage[];
}

interface RenderPage {
  width: number;     // px
  height: number;
  bands: RenderBand[];
}

interface RenderBand {
  type: Band["type"];
  height: number;    // 已处理 canGrow 后的实际高度
  components: RenderComponent[];
}

interface RenderComponent {
  type: string;
  x: number; y: number;
  width: number; height: number;
  props: Record<string, any>;  // 表达式已求值后的最终属性
}
```

### 3.3 分页逻辑

```
遍历 bands → 累加高度 → 超过页面高度时：
  ├── 如果当前 band 支持拆分（data band 的多行数据）
  │   └── 拆分行到下一页，继续渲染
  ├── 如果 band 不可拆分（title/header/footer）
  │   └── 整个 band 放到下一页
  └── 如果单个组件高度超过单页
      └── 多页显示（canGrow 文本分段渲染）
```

### 3.4 分组渲染

```
GroupHeader band → 渲染分组标题
DataBand rows    → 渲染当前分组的所有数据行（可分页）
GroupFooter band → 渲染汇总（SUM/AVG 等已预计算）
```

### 3.5 与导出/打印的衔接

渲染树是平台无关的中间产物：
- **Viewer**：遍历 RenderTree → 生成 React 组件 → DOM → `@media print`
- **Export (PDF)**：遍历 RenderTree → pdf-lib 绘制 → PDF 文件

两种消费方使用同一份 RenderTree，保证预览和导出结果一致。

---

## 4. 设计器（Designer）

### 4.1 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│  Quick Access:  [New] [Open] [Save] [Preview]  [Undo] [Redo] │
├──────────────────────────────────────────────────────────────┤
│  Ribbon Toolbar:  Home | Insert | Page | Layout | View       │
├──────────┬───────────────────────────────┬───────────────────┤
│ Report   │                               │ Properties        │
│ Tree     │                               │ Panel             │
│          │    Canvas (设计画布)           │                   │
│ Data     │    ┌──────────────────────┐    │  [选中组件]      │
│ Dict     │    │   Report Page        │    │  属性编辑表单     │
│ (树形)   │    │   ┌──┐  ┌────┐      │    │                   │
│          │    │   │T │  │Table│     │    │                   │
│          │    │   └──┘  └────┘      │    │                   │
│          │    │                      │    │                   │
│          │    └──────────────────────┘    │                   │
├──────────┴───────────────────────────────┴───────────────────┤
│  Status Bar:  Zoom: 100%  |  Page 1 of 3  |  420×297mm       │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 画布（Canvas）— 自建实现

- **SelectionManager**：选框、多选、单选、Ctrl/Shift 选择
- **DragDropHandler**：组件拖拽移动、从数据字典拖入字段绑定
- **ResizeManager**：8 方向拖拽调整大小（四角+四边）
- **ZoomPan**：鼠标滚轮缩放、拖拽平移（按住空格或中键）
- **GridSystem**：网格显示、Snap to Grid、对齐到辅助线
- **GuideManager**：辅助线（从标尺拖出）

**关键交互**：
- 框选：鼠标按下拖出矩形，与组件边界相交即选中
- 多选：Ctrl+Click / Shift+Click 追加选择
- 移动：选中后拖拽，自动对齐网格
- Resize：选中组件显示 8 个 resize handler
- 快捷键：Delete 删除、Ctrl+C/X/V 复制粘贴、Ctrl+Z/Y 撤销重做、Ctrl+A 全选、方向键微移（1mm，Shift+方向键 0.1mm）
- 撤销/重做：基于命令模式（Command Pattern），每个操作生成 Command 对象推入栈

### 4.3 Ribbon 工具栏

| Tab | 分组 | 命令 |
|-----|------|------|
| **Home** | Clipboard | undo, redo, cut, copy, paste, delete, selectAll |
| | Font | bold, italic, underline, fontFamily, fontSize, textColor |
| | Alignment | textAlignLeft/Center/Right, verticalAlignTop/Middle/Bottom |
| | Borders | borderStyle, borderColor, borderAll, borderNone |
| **Insert** | Components | insertText, insertImage, insertTable, insertBarcode, insertCheckbox, insertRichtext, insertPanel, insertSubreport |
| | Bands | insertBand (7种类型) |
| | Page | newPage |
| **Page** | Settings | pageSize, pageOrientation, pageMargins, pageColor |
| | Grid | showGrid, snapToGrid, gridSize, showGuides |
| | Panels | toggleReportTree, toggleProperties, toggleDataDictionary |
| **Layout** | Align | alignLeft/Center/Right, alignTop/Middle/Bottom |
| | Distribute | distributeHorizontal, distributeVertical |
| | Arrange | group, ungroup, bringToFront, sendToBack, bringForward, sendBackward |
| | Size | sameWidth, sameHeight, sameSize |
| | Lock | lock, unlock, toggleVisibility |
| **View** | Zoom | zoomIn, zoomOut, zoomFit, zoom100, zoomWidth |
| | Display | toggleRuler, fullscreen |

### 4.4 数据字典面板

- 树形展示：数据源 → 字段列表，支持多数据源展开
- 拖拽字段到画布上的 Text 组件 → 自动设置 text 属性为 `{DataSource.FieldName}`
- 拖拽字段到 Table 列上 → 自动设置列的 field 绑定
- 右键字段可插入到表达式编辑器

### 4.5 属性面板

- 根据选中组件类型动态渲染属性表单
- 属性分组：外观（尺寸/位置）、内容（文本/数据绑定）、样式（字体/边框/颜色）、条件格式
- 表达式字段带专用输入器（点击 `{...}` 按钮弹出表达式编辑器 + 字段选择器）

### 4.6 撤销/重做（Undo/Redo）

```typescript
interface Command {
  execute(): void;
  undo(): void;
  label: string;  // "Move component", "Set text"
}
```

---

## 5. 查看器（Viewer）与导出

### 5.1 Viewer 组件

```tsx
<ReportViewer
  template={ReportTemplate}    // 模板 JSON
  data={DataContext}           // 运行时数据
  width="100%"
  toolbar={true}               // 是否显示工具栏
  onExport={handleExport}      // 导出回调
/>

// 内部流程：
// ReportTemplate + data → core/renderer → RenderTree → React DOM
```

### 5.2 内部架构

```
<ReportViewer>
  ├── useRenderer(template, data) → RenderTree
  ├── <ViewerToolbar>           缩放、翻页、打印、导出按钮
  ├── <PageRenderer>            单页渲染组件
  │   └── <BandRenderer>        带渲染
  │       └── <ComponentRenderer> 组件类型分发
  │           ├── TextRenderer
  │           ├── ImageRenderer
  │           ├── TableRenderer
  │           ├── BarcodeRenderer
  │           ├── CheckboxRenderer
  │           ├── RichtextRenderer
  │           ├── SubreportRenderer
  │           └── PanelRenderer
  └── <PrintOverlay>            打印预览覆盖层
```

### 5.3 打印实现

```
[1] 用户点击"打印"
[2] 打开隐藏 iframe，写入打印专用的 HTML（无 UI 元素，纯报表内容）
[3] 注入 @media print CSS（精确控制分页、边距、缩放）
[4] 调用 iframe.contentWindow.print()
[5] 浏览器打印对话框弹出，用户可选择"另存为 PDF"
```

`@media print` CSS 关键点：
```css
@media print {
  @page {
    size: A4 portrait;  /* 根据模板页面设置动态生成 */
    margin: 20mm;
  }
  .report-page {
    page-break-after: always;
  }
  .report-page:last-child {
    page-break-after: auto;
  }
  .report-band.no-break {
    page-break-inside: avoid;
  }
}
```

### 5.4 PDF 导出

```
RenderTree → pdf-lib
  ├── 每页 RenderPage → pdfDoc.addPage()
  │   └── 遍历 bands → 遍历 components → 按类型绘制
  │       ├── Text  → drawText()
  │       ├── Image → drawImage()（base64 → PDF 嵌入）
  │       ├── Table → 循环绘制单元格边框 + 文本
  │       ├── Barcode → jsbarcode → SVG → Canvas → PNG → drawImage()
  │       └── ...
  └── pdfDoc.save() → Blob → 下载
```

- 中文 PDF 需要加载中文字体文件（pdf-lib 支持嵌入 TTF），初期提供精简中文字体包
- 字体映射：浏览器字体名 → PDF 字体文件（初期支持宋体/SimSun、Arial、Times New Roman）

---

## 6. 命令白名单与安全边界

### 6.1 表达式引擎白名单

- 词法分析阶段只识别白名单中的 Token 类型（FIELD_REF, STRING, NUMBER, 运算符等）
- 函数调用严格匹配 ALLOWED_FUNCTIONS 注册表
- 不解析 JavaScript 代码，不执行 eval

### 6.2 设计器命令白名单

设计器中所有操作通过 `CommandDispatcher` 执行，只有白名单中的命令才能被分发。

### 6.3 安全边界总结

| 层级 | 白名单控制 | 实现方式 |
|------|-----------|----------|
| 表达式引擎 | 函数白名单 + Token 白名单 | 词法分析阶段拦截未知标记 |
| 设计器操作 | 命令白名单 | CommandDispatcher 验证 |
| 数据访问 | 只读字段引用 | 数据上下文仅提供 getter |
| 导出安全 | 字体映射白名单 | 仅允许已注册的字体文件 |

---

## 7. Monorepo 项目结构与包接口

### 7.1 目录结构

```
report-designer/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── tsconfig.base.json
├── vitest.config.ts
├── turbo.json
│
├── packages/
│   ├── core/
│   │   ├── package.json         # @report-designer/core
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── template-model/  types.ts, schema.ts
│   │   │   ├── expression-engine/  lexer, parser, evaluator, ast, functions/*
│   │   │   ├── renderer/  render, layout, grouping, conditional, render-tree-types
│   │   │   └── command-dispatcher/  whitelist, dispatcher
│   │   └── __tests__/
│   │
│   ├── designer/
│   │   ├── package.json         # @report-designer/designer
│   │   ├── src/
│   │   │   ├── designer.tsx
│   │   │   ├── ribbon/  tabs/*
│   │   │   ├── canvas/  selection, drag-drop, resize, zoom-pan, grid, guides, ruler
│   │   │   ├── panels/  report-tree, properties, data-dictionary
│   │   │   ├── history/  command, history
│   │   │   ├── expression-editor/
│   │   │   └── styles/
│   │   └── __tests__/
│   │
│   ├── viewer/
│   │   ├── package.json         # @report-designer/viewer
│   │   ├── src/
│   │   │   ├── viewer.tsx
│   │   │   ├── toolbar.tsx
│   │   │   ├── page-renderer.tsx
│   │   │   ├── band-renderer.tsx
│   │   │   ├── components/  text, image, table, barcode, checkbox, richtext, subreport, panel
│   │   │   ├── print/
│   │   │   └── export/
│   │   └── __tests__/
│   │
│   └── example/
│       ├── package.json
│       ├── vite.config.ts
│       └── src/  main, App, templates/, data/
│
└── docs/
    └── superpowers/
        └── specs/
```

### 7.2 包依赖

```
core:        零外部依赖（仅 lodash-es）
designer:    core + react + antd 6 + dnd-kit
viewer:      core + react + antd 6 + pdf-lib + jsbarcode
example:     designer + viewer
```

### 7.3 包间接口

```typescript
// core 暴露
import {
  type ReportTemplate, type Page, type Band, type ReportComponent,
  type DataSource, type DataField, type ConditionalFormat,
  ExpressionEngine, type ExpressionContext,
  renderReport, type RenderTree,
  CommandDispatcher, type Command,
  validateTemplate, createDefaultTemplate,
} from '@report-designer/core';

// designer 暴露
import {
  ReportDesigner,
  type DesignerProps,
  type DesignerOnChange,
} from '@report-designer/designer';

// viewer 暴露
import {
  ReportViewer,
  type ViewerProps,
  exportToPdf,
} from '@report-designer/viewer';
```
