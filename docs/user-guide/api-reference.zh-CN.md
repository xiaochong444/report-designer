# API 参考

本页面提供每个包的主要公共导出参考。

## @report-designer/core

### 模板模型

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `ReportTemplate` | `interface` | 根模板对象。 |
| `Page` | `interface` | 页面配置（尺寸、边距、带）。 |
| `Band` | `interface` | 带配置（类型、高度、组件、行为）。 |
| `ReportComponent` | `interface` | 基础组件接口。 |
| `TextComponent` | `interface` | 带字体、对齐、格式的文本组件。 |
| `TableComponent` | `interface` | 带列、行、绑定的表格组件。 |
| `ChartComponent` | `interface` | 带类型、绑定、主题的图表组件。 |
| `ImageComponent` | `interface` | 图片组件。 |
| `BarcodeComponent` | `interface` | 条码组件。 |
| `QRCodeComponent` | `interface` | 二维码组件。 |
| `CheckboxComponent` | `interface` | 复选框组件。 |
| `RichtextComponent` | `interface` | 富文本组件。 |
| `SubreportComponent` | `interface` | 子报表组件。 |
| `PanelComponent` | `interface` | 面板（容器）组件。 |
| `LineComponent` | `interface` | 线条组件。 |
| `ShapeComponent` | `interface` | 形状组件。 |
| `PageNumberComponent` | `interface` | 页码组件。 |
| `DateTimeComponent` | `interface` | 日期时间组件。 |
| `DataSource` | `interface` | 数据源定义。 |
| `DataField` | `interface` | 数据源内的字段定义。 |
| `ReportStyle` | `interface` | 可复用的文本样式定义。 |
| `ConditionalFormat` | `interface` | 条件格式规则集。 |
| `ReportParameter` | `interface` | 输入参数定义。 |
| `ReportFont` | `interface` | 自定义字体定义。 |
| `FontConfig` | `interface` | 字体配置（字体族、字号、加粗等）。 |
| `BorderConfig` | `interface` | 边框配置（样式、宽度、颜色、边）。 |
| `Padding` | `interface` | 内边距值（上、右、下、左）。 |
| `Margins` | `interface` | 页面边距。 |
| `TextFormatConfig` | `interface` | 文本格式化（数字、日期、货币等）。 |
| `ChartBinding` | `interface` | 图表数据绑定配置。 |
| `TableBinding` | `interface` | 表格数据绑定配置。 |
| `BandBehavior` | `interface` | 带行为设置（printOn、keepTogether 等）。 |
| `DataBandOptions` | `interface` | 数据带配置（过滤、排序、列）。 |
| `GroupBandOptions` | `interface` | 分组带配置。 |
| `createDefaultTemplate` | `function` | 创建带默认值的新模板。 |
| `normalizeTemplate` | `function` | 用默认值填充缺失字段。 |
| `validateTemplate` | `function` | 验证模板结构。 |
| `createDefaultPageWatermark` | `function` | 创建默认水印配置。 |
| `createDefaultPageBorder` | `function` | 创建默认页面边框配置。 |
| `isRepeatOnEveryPageBandType` | `function` | 检查带类型是否在每页重复。 |
| `STANDARD_BAND_TYPES` | `const` | 所有标准带类型名称数组。 |

### 表达式引擎

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `tokenize` | `function` | 将表达式字符串分词。 |
| `parse` | `function` | 将词元解析为 AST。 |
| `evaluate` | `function` | 使用上下文求值 AST 节点。 |
| `evalExpression` | `function` | 直接求值表达式字符串。 |
| `builtinFunctions` | `object` | 内置表达式函数注册表。 |
| `EvalContext` | `interface` | 求值上下文接口。 |
| `BuiltinFunction` | `type` | 内置函数类型。 |
| AST 节点类型 | `interface` | AST 节点接口（Literal、BinaryOp、UnaryOp、FunctionCall 等）。 |

### 事件引擎

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `EventContext` | `interface` | 事件执行上下文。 |
| `EventScript` | `interface` | 事件脚本定义。 |
| `EventMap` | `type` | 事件名到脚本的映射。 |
| `EventLogEntry` | `interface` | 事件日志条目。 |
| `EventLogCollector` | `interface` | 事件日志收集器接口。 |
| `EventExecutionState` | `interface` | 事件执行状态（取消、隐藏、值）。 |
| `EventTargetState` | `interface` | 事件目标元数据。 |
| `EventMode` | `type` | `'preview' \| 'print' \| 'pdf'` |
| `ReportEventName` | `type` | 报表级事件名。 |
| `BandEventName` | `type` | 带级事件名。 |
| `ComponentEventName` | `type` | 组件事件名。 |
| `PageEventName` | `type` | 页面级事件名。 |

### 渲染引擎

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `renderReport` | `function` | 将模板和数据渲染为 RenderDocument。 |
| `RenderDocument` | `interface` | 渲染后的报表文档。 |
| `RenderedPage` | `interface` | 渲染后的页面，包含定位的组件。 |

### 分页

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `paginate` | `function` | 将带分配到各个页面。 |
| `pageNumberPass` | `function` | 第二轮传递解析页码表达式。 |

### 聚合引擎

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| 聚合函数 | `functions` | SUM、AVG、COUNT、MIN、MAX 等。 |
| 聚合运行时 | `module` | 数据带迭代期间的聚合计算。 |

### 命令引擎

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `CommandDispatcher` | `class` | 撤销/重做命令调度器。 |
| `registerCommand` | `function` | 注册带执行/撤销处理器的新命令。 |

### 表格结构

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `TableRow` | `interface` | 表格行定义。 |
| `TableCell` | `interface` | 表格单元格定义。 |
| `TableColumn` | `interface` | 表格列定义。 |
| `TableStyle` | `interface` | 表格样式配置。 |
| 表格操作函数 | `functions` | 插入/删除行/列、合并/拆分单元格等。 |

### 图表类型

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `ChartType` | `type` | 所有支持的图表类型（折线、柱状、饼图、散点等）。 |
| `ChartDimension` | `interface` | 图表维度（分类字段）。 |
| `ChartMeasure` | `interface` | 图表度量（带聚合的值字段）。 |
| `ChartThemeConfig` | `interface` | 图表主题配置。 |
| `ChartTitleConfig` | `interface` | 图表标题配置。 |
| `ChartLegendConfig` | `interface` | 图表图例配置。 |
| `ChartAxesConfig` | `interface` | 图表坐标轴配置。 |
| `ChartLabelConfig` | `interface` | 图表标签配置。 |
| `ChartPlotOptions` | `interface` | 图表类型特定的绘图选项。 |
| `ChartDataPoint` | `interface` | 单个图表数据点。 |

### 数据字典

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `JsonDictionary` | `interface` | JSON 数据结构。 |
| `jsonPath` | `function` | 针对数据解析 JSON 路径。 |

### 文本格式

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `TextFormatType` | `type` | 格式类型：text、number、currency、date、time、percent、boolean、custom。 |
| `formatValue` | `function` | 根据 TextFormatConfig 格式化值。 |

### 文本样式

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `resolveTextStyle` | `function` | 将样式 ID 解析为其配置。 |
| `getDefaultTextStyle` | `function` | 从模板获取默认文本样式。 |

### 条件格式

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `ConditionRule` | `interface` | 单个条件规则。 |
| `evaluateCondition` | `function` | 针对数据求值条件规则。 |

### 字体

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `DEFAULT_REPORT_FONTS` | `const` | 默认字体定义。 |
| `ReportFont` | `interface` | 带源（URL/dataUrl）的字体定义。 |

### 富文本

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `RichTextDocument` | `type` | 富文本结构（Tiptap JSON）。 |
| 富文本渲染 | `functions` | 将富文本渲染为 HTML/DOM。 |

---

## @report-designer/designer

### 组件

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `Designer` | `component` | 顶层设计器组件。 |
| `DesignerShell` | `component` | 外层布局容器。 |
| `DesignerStatusBar` | `component` | 状态栏组件。 |
| `DesignerRibbon` | `component` | 功能区工具栏组件。 |
| `DesignerLeftPanel` | `component` | 左侧面板（报表树 + 面板）。 |
| `DesignerPropertyPanel` | `component` | 属性编辑器面板。 |
| `DesignerCanvasFrame` | `component` | 带标尺和缩放的画布。 |
| `JsonDataSourceDialog` | `component` | 根据粘贴的 JSON 推断 `root` 字段树的对话框。 |
| `PageSetupDialog` | `component` | 页面设置对话框。 |
| `InlineExpressionEditor` | `component` | 内联表达式编辑器。 |
| `BandPropertyGrid` | `component` | 带属性网格。 |
| `ReportTree` | `component` | 报表树组件。 |
| `Canvas` | `component` | 画布组件（旧版）。 |
| `LeftPanel` | `component` | 左侧面板（旧版）。 |
| `PropertyEditor` | `component` | 属性编辑器（旧版）。 |

### 状态管理

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `useDesignerStore` | `hook` | Zustand store hook。 |
| `DesignerState` | `interface` | 完整的设计器状态接口。 |
| `DesignerEventNavigationTarget` | `interface` | 事件导航目标。 |
| `PendingEventEditorTarget` | `interface` | 待处理的事件编辑器目标。 |
| `TableCellSelection` | `interface` | 表格单元格选择范围。 |
| `TableRowSelection` | `interface` | 表格行选择。 |

### 国际化

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `DesignerI18nProvider` | `component` | i18n 提供者组件。 |
| `useDesignerI18n` | `hook` | i18n hook。 |
| `DesignerLocale` | `type` | 语言环境标识符（`'en' \| 'zh'`）。 |
| `DesignerMessageKey` | `type` | 消息键类型。 |

### 表达式目录扩展

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `ExpressionCatalogExtensions` | `interface` | 自定义表达式函数目录。 |
| `ExpressionRuntimeFunction` | `interface` | 运行时函数定义。 |
| `ExpressionFormatMeta` | `interface` | 表达式编辑器的格式元数据。 |
| `ExpressionSystemVariableMeta` | `interface` | 系统变量元数据。 |

---

## @report-designer/viewer

### 组件

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `Viewer` | `component` | 顶层预览器组件。 |
| `ViewerToolbar` | `component` | 预览器工具栏组件。 |
| `EventLogPanel` | `component` | 事件日志面板组件。 |
| `RenderDocumentView` | `component` | RenderDocument DOM 渲染器。 |
| `RenderComponent` | `component` | 单个组件 DOM 渲染器。 |

### 导出

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `exportToPDF` | `function` | 将 RenderDocument 导出为 PDF 字节。 |
| `exportRenderDocumentToPDF` | `function` | 带选项的底层 PDF 导出。 |
| `downloadPDF` | `function` | 在浏览器中触发 PDF 下载。 |
| `printReport` | `function` | 触发浏览器打印或 Chrome 扩展打印。 |
| `buildPrintHtml` | `function` | 构建打印框架的 HTML。 |
| `printRenderDocument` | `function` | 通过浏览器打印 RenderDocument。 |
| `PdfExportOptions` | `interface` | PDF 导出选项（字体、元数据）。 |

### 打印

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `buildChromePrintRequest` | `function` | 构建 Chrome 扩展打印请求。 |
| `printRenderDocumentWithChromeExtension` | `function` | 通过 Chrome 扩展桥接打印。 |
| `sendChromePrintRequest` | `function` | 向 Chrome 扩展发送打印请求。 |
| `ChromeExtensionPrintOptions` | `interface` | Chrome 扩展打印选项。 |
| `ChromePrintBackend` | `type` | 打印后端类型。 |
| `ChromePrintRequest` | `interface` | Chrome 打印请求负载。 |
| `ChromePrintResponse` | `interface` | Chrome 打印响应负载。 |
| `ChromePrintTransport` | `interface` | 打印传输接口。 |

### 条码/二维码

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `BARCODE_FORMATS` | `const` | 支持的条码格式。 |
| `QR_CODE_FORMATS` | `const` | 支持的二维码格式。 |
| `renderCodeSymbolSvg` | `function` | 将条码/二维码渲染为 SVG。 |

### 国际化

| 导出 | 类型 | 说明 |
| --- | --- | --- |
| `getViewerMessages` | `function` | 按语言环境获取查看器消息包。 |
| `viewerMessages` | `object` | 默认查看器消息（英文）。 |
| `ViewerLocale` | `type` | 语言环境标识符。 |
| `ViewerMessages` | `interface` | 查看器消息包接口。 |
