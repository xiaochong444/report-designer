# 预览与打印

Viewer 包负责报表渲染、分页显示、浏览器打印和 PDF 导出。本指南涵盖 Viewer 组件、渲染管线和打印工作流。

## Viewer 组件

`Viewer` 组件是报表预览的顶层入口：

```tsx
import { Viewer } from '@report-designer/viewer';
import type { ReportTemplate } from '@report-designer/core';

function App({ template, data }: { template: ReportTemplate; data: unknown }) {
  return (
    <Viewer
      template={template}
      data={data}
      expressionVariables={{ reportName: '月度报表' }}
    />
  );
}
```

### Props

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `template` | `ReportTemplate` | 要渲染的报表模板。 |
| `data` | `unknown` | 运行时 JSON 对象或数组。字段和数组行集会自动推断。 |
| `expressionVariables` | `Record<string, unknown>` | 可选的表达式变量。 |
| `printOptions` | `PrintReportOptions` | 打印配置（浏览器 vs Chrome 扩展）。 |
| `onEventLog` | `(entries: EventLogEntry[]) => void` | 事件日志回调。 |
| `onPageChange` | `(page: number) => void` | 页面导航回调。 |
| `onRenderComplete` | `(document: RenderDocument) => void` | 渲染完成时调用。 |

## Viewer 工具栏

`ViewerToolbar` 组件提供标准工具栏操作：

```tsx
import { ViewerToolbar } from '@report-designer/viewer';

<ViewerToolbar
  onPrint={() => printReport(renderDocument)}
  onExportPDF={() => exportToPDF(renderDocument)}
  currentPage={1}
  totalPages={5}
  onPageChange={(page) => setCurrentPage(page)}
/>
```

工具栏操作包括：

- **页面导航** —— 首页、上一页、下一页、末页和直接页码输入。
- **打印** —— 触发浏览器打印对话框。
- **导出 PDF** —— 生成并下载 PDF 文件。
- **缩放** —— 放大/缩小控制。

## RenderDocument

`RenderDocument` 是渲染后报表的核心运行时表示：

```ts
interface RenderDocument {
  pages: RenderedPage[];
  totalPages: number;
  // ... 内部渲染状态
}
```

它由 `@report-designer/core` 的 `renderReport` 函数生成，被 Viewer 用于 DOM 渲染、PDF 导出和打印。

## 渲染管线

1. **模板规范化** —— `normalizeTemplate()` 填充默认值。
2. **数据处理** —— 自动推断 `root` 字段树和数组行集，然后应用过滤和排序。
3. **事件：beforeData** —— 宿主事件脚本运行。
4. **带规划** —— 带被排序并分组到页面中。
5. **分页** —— 内容分配到各个页面，遵循 `keepTogether`、`canBreak` 和 `printOn` 设置。
6. **事件：beforeRender** —— 宿主事件脚本运行。
7. **组件渲染** —— 每个组件以其数据和格式渲染。
8. **事件：beforePrint/afterPrint** —— 每个带/组件事件运行。
9. **页码传递** —— 第二轮传递解析 `PAGE()` 和 `TOTALPAGES()` 表达式。
10. **事件：afterRender** —— 宿主事件脚本运行。

## 浏览器打印

最简单的打印选项使用浏览器的原生打印对话框：

```tsx
import { printReport } from '@report-designer/viewer';

// 打印渲染后的文档
await printReport(renderDocument);

// 或不带文档触发浏览器打印
await printReport(); // 调用 window.print()
```

## 打印选项

```ts
interface PrintReportOptions {
  adapter?: 'browser' | 'chrome-extension';
  chromeExtension?: ChromeExtensionPrintOptions;
}
```

- `adapter: 'browser'`（默认）—— 使用浏览器的打印对话框。
- `adapter: 'chrome-extension'` —— 将 PDF 发送到 Chrome 扩展进行静默打印。

## 打印框架

Viewer 在专用的打印框架（iframe）中渲染报表，以隔离样式并确保打印就绪的输出：

```tsx
import { RenderDocumentView } from '@report-designer/viewer';

<RenderDocumentView document={renderDocument} />
```

打印框架处理：

- CSS 打印媒体查询。
- 分页符标记。
- 边距和内边距与模板设置匹配。
- 字体嵌入以确保正确渲染。

## 事件日志面板

`EventLogPanel` 显示事件执行日志：

```tsx
import { EventLogPanel } from '@report-designer/viewer';

<EventLogPanel entries={eventLogEntries} />
```

对调试事件脚本很有用 —— 显示带时间戳和源位置的信息、警告和错误条目。

## 页面导航

Viewer 支持逐页导航：

- 点击工具栏中的页码。
- 使用键盘快捷键（方向键）。
- 直接输入页码。

## 缩放控制

Viewer 包含缩放控制以便详细检查：

- 放大/缩小按钮。
- 适应宽度和适应页面选项。
- 鼠标滚轮缩放（配合 Ctrl/Cmd 修饰键）。

## 可组合的 Viewer

对于高级布局，可以单独组合 Viewer 的各部分：

```tsx
import { ViewerToolbar, RenderDocumentView, EventLogPanel } from '@report-designer/viewer';

function CustomViewer({ document }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <ViewerToolbar
        onPrint={() => printReport(document)}
        onExportPDF={() => exportToPDF(document)}
        currentPage={currentPage}
        totalPages={document.totalPages}
        onPageChange={setCurrentPage}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <RenderDocumentView document={document} />
        </div>
        <div style={{ width: 300, borderLeft: '1px solid #eee', overflow: 'auto' }}>
          <EventLogPanel entries={eventLogEntries} />
        </div>
      </div>
    </div>
  );
}
```
