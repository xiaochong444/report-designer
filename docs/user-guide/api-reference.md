# API Reference

This page provides a reference for the primary public exports of each package.

## @report-designer/core

### Template Model

| Export | Type | Description |
| --- | --- | --- |
| `ReportTemplate` | `interface` | Root template object. |
| `Page` | `interface` | Page configuration (dimensions, margins, bands). |
| `Band` | `interface` | Band configuration (type, height, components, behavior). |
| `ReportComponent` | `interface` | Base component interface. |
| `TextComponent` | `interface` | Text component with font, alignment, format. |
| `TableComponent` | `interface` | Table component with columns, rows, binding. |
| `ChartComponent` | `interface` | Chart component with type, binding, theme. |
| `ImageComponent` | `interface` | Image component. |
| `BarcodeComponent` | `interface` | Barcode component. |
| `QRCodeComponent` | `interface` | QR code component. |
| `CheckboxComponent` | `interface` | Checkbox component. |
| `RichtextComponent` | `interface` | Rich text component. |
| `SubreportComponent` | `interface` | Subreport component. |
| `PanelComponent` | `interface` | Panel (container) component. |
| `LineComponent` | `interface` | Line component. |
| `ShapeComponent` | `interface` | Shape component. |
| `PageNumberComponent` | `interface` | Page number component. |
| `DateTimeComponent` | `interface` | DateTime component. |
| `DataSource` | `interface` | Data source definition. |
| `DataField` | `interface` | Field definition within a data source. |
| `ReportStyle` | `interface` | Reusable text style definition. |
| `ConditionalFormat` | `interface` | Conditional format rule set. |
| `ReportParameter` | `interface` | Input parameter definition. |
| `ReportFont` | `interface` | Custom font definition. |
| `FontConfig` | `interface` | Font configuration (family, size, bold, etc.). |
| `BorderConfig` | `interface` | Border configuration (style, width, color, sides). |
| `Padding` | `interface` | Padding values (top, right, bottom, left). |
| `Margins` | `interface` | Page margins. |
| `TextFormatConfig` | `interface` | Text formatting (number, date, currency, etc.). |
| `ChartBinding` | `interface` | Chart data binding configuration. |
| `TableBinding` | `interface` | Table data binding configuration. |
| `BandBehavior` | `interface` | Band behavior settings (printOn, keepTogether, etc.). |
| `DataBandOptions` | `interface` | Data band configuration (filter, sort, columns). |
| `GroupBandOptions` | `interface` | Group band configuration. |
| `createDefaultTemplate` | `function` | Create a new template with defaults. |
| `normalizeTemplate` | `function` | Fill in missing fields with defaults. |
| `validateTemplate` | `function` | Validate a template structure. |
| `createDefaultPageWatermark` | `function` | Create default watermark config. |
| `createDefaultPageBorder` | `function` | Create default page border config. |
| `isRepeatOnEveryPageBandType` | `function` | Check if a band type repeats on every page. |
| `STANDARD_BAND_TYPES` | `const` | Array of all standard band type names. |

### Expression Engine

| Export | Type | Description |
| --- | --- | --- |
| `tokenize` | `function` | Tokenize an expression string. |
| `parse` | `function` | Parse tokens into an AST. |
| `evaluate` | `function` | Evaluate an AST node with a context. |
| `evalExpression` | `function` | Evaluate an expression string directly. |
| `builtinFunctions` | `object` | Registry of built-in expression functions. |
| `EvalContext` | `interface` | Evaluation context interface. |
| `BuiltinFunction` | `type` | Built-in function type. |
| AST node types | `interface` | AST node interfaces (Literal, BinaryOp, UnaryOp, FunctionCall, etc.). |

### Event Engine

| Export | Type | Description |
| --- | --- | --- |
| `EventContext` | `interface` | Event execution context. |
| `EventScript` | `interface` | Event script definition. |
| `EventMap` | `type` | Map of event name to script. |
| `EventLogEntry` | `interface` | Event log entry. |
| `EventLogCollector` | `interface` | Event log collector interface. |
| `EventExecutionState` | `interface` | Event execution state (canceled, hidden, value). |
| `EventTargetState` | `interface` | Event target metadata. |
| `EventMode` | `type` | `'preview' \| 'print' \| 'pdf'` |
| `ReportEventName` | `type` | Report-level event names. |
| `BandEventName` | `type` | Band-level event names. |
| `ComponentEventName` | `type` | Component-level event names. |
| `PageEventName` | `type` | Page-level event names. |

### Render Engine

| Export | Type | Description |
| --- | --- | --- |
| `renderReport` | `function` | Render a template with data into a RenderDocument. |
| `RenderDocument` | `interface` | Rendered report document. |
| `RenderedPage` | `interface` | Rendered page with positioned components. |

### Pagination

| Export | Type | Description |
| --- | --- | --- |
| `paginate` | `function` | Distribute bands across pages. |
| `pageNumberPass` | `function` | Second pass to resolve page number expressions. |

### Aggregate Engine

| Export | Type | Description |
| --- | --- | --- |
| Aggregate functions | `functions` | SUM, AVG, COUNT, MIN, MAX, etc. |
| Aggregate runtime | `module` | Aggregate computation during data band iteration. |

### Command Engine

| Export | Type | Description |
| --- | --- | --- |
| `CommandDispatcher` | `class` | Undo/redo command dispatcher. |
| `registerCommand` | `function` | Register a new command with execute/undo handlers. |

### Table Structure

| Export | Type | Description |
| --- | --- | --- |
| `TableRow` | `interface` | Table row definition. |
| `TableCell` | `interface` | Table cell definition. |
| `TableColumn` | `interface` | Table column definition. |
| `TableStyle` | `interface` | Table styling configuration. |
| Table manipulation functions | `functions` | Insert/delete rows/columns, merge/split cells, etc. |

### Chart Types

| Export | Type | Description |
| --- | --- | --- |
| `ChartType` | `type` | All supported chart types (line, bar, pie, scatter, etc.). |
| `ChartDimension` | `interface` | Chart dimension (category field). |
| `ChartMeasure` | `interface` | Chart measure (value field with aggregation). |
| `ChartThemeConfig` | `interface` | Chart theme configuration. |
| `ChartTitleConfig` | `interface` | Chart title configuration. |
| `ChartLegendConfig` | `interface` | Chart legend configuration. |
| `ChartAxesConfig` | `interface` | Chart axes configuration. |
| `ChartLabelConfig` | `interface` | Chart label configuration. |
| `ChartPlotOptions` | `interface` | Chart type-specific plot options. |
| `ChartDataPoint` | `interface` | Single chart data point. |

### Data Dictionary

| Export | Type | Description |
| --- | --- | --- |
| `JsonDictionary` | `interface` | JSON data dictionary structure. |
| `jsonPath` | `function` | Resolve a JSON path against data. |

### Text Format

| Export | Type | Description |
| --- | --- | --- |
| `TextFormatType` | `type` | Format types: text, number, currency, date, time, percent, boolean, custom. |
| `formatValue` | `function` | Format a value according to a TextFormatConfig. |

### Text Style

| Export | Type | Description |
| --- | --- | --- |
| `resolveTextStyle` | `function` | Resolve a style ID to its configuration. |
| `getDefaultTextStyle` | `function` | Get the default text style from a template. |

### Conditional Format

| Export | Type | Description |
| --- | --- | --- |
| `ConditionRule` | `interface` | Single condition rule. |
| `evaluateCondition` | `function` | Evaluate condition rules against data. |

### Fonts

| Export | Type | Description |
| --- | --- | --- |
| `DEFAULT_REPORT_FONTS` | `const` | Default font definitions. |
| `ReportFont` | `interface` | Font definition with source (URL/dataUrl). |

### Rich Text

| Export | Type | Description |
| --- | --- | --- |
| `RichTextDocument` | `type` | Rich text document structure (Tiptap JSON). |
| Rich text rendering | `functions` | Render rich text to HTML/DOM. |

---

## @report-designer/designer

### Components

| Export | Type | Description |
| --- | --- | --- |
| `Designer` | `component` | Top-level designer component. |
| `DesignerShell` | `component` | Outer layout container. |
| `DesignerStatusBar` | `component` | Status bar component. |
| `DesignerRibbon` | `component` | Ribbon toolbar component. |
| `DesignerLeftPanel` | `component` | Left panel (report tree + palette). |
| `DesignerPropertyPanel` | `component` | Property editor panel. |
| `DesignerCanvasFrame` | `component` | Canvas with rulers and zoom. |
| `JsonDataSourceDialog` | `component` | Dialog that infers the `root` field tree from pasted JSON. |
| `PageSetupDialog` | `component` | Page setup dialog. |
| `InlineExpressionEditor` | `component` | Inline expression editor. |
| `BandPropertyGrid` | `component` | Band property grid. |
| `ReportTree` | `component` | Report tree component. |
| `Canvas` | `component` | Canvas component (legacy). |
| `LeftPanel` | `component` | Left panel (legacy). |
| `PropertyEditor` | `component` | Property editor (legacy). |

### Store

| Export | Type | Description |
| --- | --- | --- |
| `useDesignerStore` | `hook` | Zustand store hook. |
| `DesignerState` | `interface` | Full designer state interface. |
| `DesignerEventNavigationTarget` | `interface` | Event navigation target. |
| `PendingEventEditorTarget` | `interface` | Pending event editor target. |
| `TableCellSelection` | `interface` | Table cell selection range. |
| `TableRowSelection` | `interface` | Table row selection. |

### I18n

| Export | Type | Description |
| --- | --- | --- |
| `DesignerI18nProvider` | `component` | i18n provider component. |
| `useDesignerI18n` | `hook` | i18n hook. |
| `DesignerLocale` | `type` | Locale identifier (`'en' \| 'zh'`). |
| `DesignerMessageKey` | `type` | Message key type. |

### Expression Catalog Extensions

| Export | Type | Description |
| --- | --- | --- |
| `ExpressionCatalogExtensions` | `interface` | Custom expression function catalog. |
| `ExpressionRuntimeFunction` | `interface` | Runtime function definition. |
| `ExpressionFormatMeta` | `interface` | Format metadata for expression editor. |
| `ExpressionSystemVariableMeta` | `interface` | System variable metadata. |

---

## @report-designer/viewer

### Components

| Export | Type | Description |
| --- | --- | --- |
| `Viewer` | `component` | Top-level viewer component. |
| `ViewerToolbar` | `component` | Viewer toolbar component. |
| `EventLogPanel` | `component` | Event log panel component. |
| `RenderDocumentView` | `component` | RenderDocument DOM renderer. |
| `RenderComponent` | `component` | Single component DOM renderer. |

### Export

| Export | Type | Description |
| --- | --- | --- |
| `exportToPDF` | `function` | Export a RenderDocument to PDF bytes. |
| `exportRenderDocumentToPDF` | `function` | Low-level PDF export with options. |
| `downloadPDF` | `function` | Trigger PDF download in browser. |
| `printReport` | `function` | Trigger browser print or Chrome extension print. |
| `buildPrintHtml` | `function` | Build HTML for print frame. |
| `printRenderDocument` | `function` | Print a RenderDocument via browser. |
| `PdfExportOptions` | `interface` | PDF export options (fonts, metadata). |

### Print

| Export | Type | Description |
| --- | --- | --- |
| `buildChromePrintRequest` | `function` | Build Chrome extension print request. |
| `printRenderDocumentWithChromeExtension` | `function` | Print via Chrome extension bridge. |
| `sendChromePrintRequest` | `function` | Send print request to Chrome extension. |
| `ChromeExtensionPrintOptions` | `interface` | Chrome extension print options. |
| `ChromePrintBackend` | `type` | Print backend type. |
| `ChromePrintRequest` | `interface` | Chrome print request payload. |
| `ChromePrintResponse` | `interface` | Chrome print response payload. |
| `ChromePrintTransport` | `interface` | Print transport interface. |

### Code Symbols

| Export | Type | Description |
| --- | --- | --- |
| `BARCODE_FORMATS` | `const` | Supported barcode formats. |
| `QR_CODE_FORMATS` | `const` | Supported QR code formats. |
| `renderCodeSymbolSvg` | `function` | Render barcode/QR code as SVG. |

### I18n

| Export | Type | Description |
| --- | --- | --- |
| `getViewerMessages` | `function` | Get viewer message bundle by locale. |
| `viewerMessages` | `object` | Default viewer messages (English). |
| `ViewerLocale` | `type` | Locale identifier. |
| `ViewerMessages` | `interface` | Viewer message bundle interface. |
