# PDF Export

Report Viewer can export rendered reports to PDF files. This guide covers the PDF export API, font handling, and configuration options.

## Basic Export

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
  /** Custom font bytes for PDF text rendering. Required for CJK characters. */
  fontBytes?: Uint8Array;

  /** Font bytes keyed by font family name. */
  fontBytesByFamily?: Record<string, Uint8Array>;

  /** Page margins in points (default: template margins). */
  margins?: { top: number; right: number; bottom: number; left: number };

  /** PDF title metadata. */
  title?: string;

  /** PDF author metadata. */
  author?: string;

  /** PDF subject metadata. */
  subject?: string;
}
```

## Font Handling for Chinese Text

Chinese characters require embedded fonts in the PDF. Without proper fonts, Chinese text will render as blank spaces or squares.

### Option 1: Single Font

```ts
import { exportToPDF } from '@report-designer/viewer';
import { PDFDocument } from 'pdf-lib';

const fontBytes = await fetch('/fonts/NotoSansSC-Regular.ttf').then(r => r.arrayBuffer()).then(b => new Uint8Array(b));

const pdfBytes = await exportToPDF(document, {
  fontBytes,
});
```

### Option 2: Font by Family

```ts
const pdfBytes = await exportToPDF(document, {
  fontBytesByFamily: {
    'Noto Sans SC': notoSansBytes,
    'SimSun': simsunBytes,
    'Arial': arialBytes,
  },
});
```

### Using pdf-lib fontkit

The PDF export uses `pdf-lib` with `@pdf-lib/fontkit` for font embedding:

```ts
import { exportRenderDocumentToPDF } from '@report-designer/viewer';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const pdfBytes = await exportRenderDocumentToPDF(document, {
  fontBytes: myFontBytes,
  title: 'Custom Report',
  author: 'My App',
});
```

## Export from Viewer

The Viewer component provides a direct export helper:

```tsx
import { Viewer, exportToPDF, downloadPDF } from '@report-designer/viewer';

function MyViewer({ document }) {
  const handleExport = async () => {
    const pdfBytes = await exportToPDF(document);
    await downloadPDF(pdfBytes, 'report.pdf');
  };

  return (
    <div>
      <button onClick={handleExport}>Export PDF</button>
      <RenderDocumentView document={document} />
    </div>
  );
}
```

## Page Orientation

The PDF respects the page orientation defined in the template:

- `portrait` — Standard portrait orientation.
- `landscape` — Landscape orientation (width > height).

## Multi-Page Documents

Multi-page reports are exported as a single PDF with all pages in order. Page breaks are inserted according to the template's pagination settings.

## PDF Metadata

You can set PDF metadata through the export options:

```ts
const pdfBytes = await exportToPDF(document, {
  title: 'Monthly Sales Report',
  author: 'Finance Department',
  subject: 'January 2026',
});
```

## Performance Considerations

- PDF export renders the entire document in memory. Very large reports may consume significant memory.
- Chinese/Japanese/Korean font embedding increases the PDF file size.
- For large reports, consider server-side PDF generation instead of browser-based export.
