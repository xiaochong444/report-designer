# PDF 导出

Report Viewer 可以将渲染后的报表导出为 PDF 文件。本指南涵盖 PDF 导出 API、字体处理和配置选项。

## 基本导出

```tsx
import { exportToPDF, downloadPDF } from '@report-designer/viewer';
import type { RenderDocument } from '@report-designer/core';

async function handleExport(document: RenderDocument) {
  const pdfBytes = await exportToPDF(document);
  await downloadPDF(pdfBytes, 'my-report.pdf');
}
```

## PdfExportOptions

```ts
interface PdfExportOptions {
  /** 用于 PDF 文本渲染的自定义字体字节。中文需要此项。 */
  fontBytes?: Uint8Array;

  /** 按字体族名索引的字体字节。 */
  fontBytesByFamily?: Record<string, Uint8Array>;

  /** 页面边距（点），默认为模板边距。 */
  margins?: { top: number; right: number; bottom: number; left: number };

  /** PDF 标题元数据。 */
  title?: string;

  /** PDF 作者元数据。 */
  author?: string;

  /** PDF 主题元数据。 */
  subject?: string;
}
```

## 中文字体处理

中文字符需要在 PDF 中嵌入字体。没有正确的字体，中文会显示为空白或方块。

### 方案 1：单一字体

```ts
import { exportToPDF } from '@report-designer/viewer';

const fontBytes = await fetch('/fonts/NotoSansSC-Regular.ttf').then(r => r.arrayBuffer()).then(b => new Uint8Array(b));

const pdfBytes = await exportToPDF(document, {
  fontBytes,
});
```

### 方案 2：按字体族名

```ts
const pdfBytes = await exportToPDF(document, {
  fontBytesByFamily: {
    'Noto Sans SC': notoSansBytes,
    'SimSun': simsunBytes,
    'Arial': arialBytes,
  },
});
```

### 使用 pdf-lib fontkit

PDF 导出使用 `pdf-lib` 配合 `@pdf-lib/fontkit` 进行字体嵌入：

```ts
import { exportRenderDocumentToPDF } from '@report-designer/viewer';

const pdfBytes = await exportRenderDocumentToPDF(document, {
  fontBytes: myFontBytes,
  title: '自定义报表',
  author: '我的应用',
});
```

## 从 Viewer 导出

Viewer 组件提供直接的导出辅助函数：

```tsx
import { Viewer, exportToPDF, downloadPDF } from '@report-designer/viewer';

function MyViewer({ document }) {
  const handleExport = async () => {
    const pdfBytes = await exportToPDF(document);
    await downloadPDF(pdfBytes, 'report.pdf');
  };

  return (
    <div>
      <button onClick={handleExport}>导出 PDF</button>
      <RenderDocumentView document={document} />
    </div>
  );
}
```

## 页面方向

PDF 遵循模板中定义的页面方向：

- `portrait` —— 标准纵向。
- `landscape` —— 横向（宽度 > 高度）。

## 多页文档

多页报表导出为单个 PDF，所有页面按顺序排列。分页符根据模板的分页设置插入。

## PDF 元数据

你可以通过导出选项设置 PDF 元数据：

```ts
const pdfBytes = await exportToPDF(document, {
  title: '月度销售报表',
  author: '财务部',
  subject: '2026年1月',
});
```

## 性能注意事项

- PDF 导出在内存中渲染整个文档。非常大的报表可能消耗大量内存。
- 中/日/韩文字体嵌入会增加 PDF 文件大小。
- 对于大型报表，考虑在服务端生成 PDF 而不是基于浏览器的导出。
