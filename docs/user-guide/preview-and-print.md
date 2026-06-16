# Preview and Print

The Viewer package handles report rendering, pagination display, browser printing, and PDF export. This guide covers the Viewer component, rendering pipeline, and print workflows.

## Viewer Component

The `Viewer` component is the top-level entry point for report preview:

```tsx
import { Viewer } from '@report-designer/viewer';
import type { ReportTemplate } from '@report-designer/core';

function App({ template, data }: { template: ReportTemplate; data: unknown }) {
  return (
    <Viewer
      template={template}
      data={data}
      expressionVariables={{ reportName: 'Monthly Report' }}
    />
  );
}
```

### Props

| Prop | Type | Description |
| --- | --- | --- |
| `template` | `ReportTemplate` | The report template to render. |
| `data` | `unknown` | Runtime JSON object or array. Fields and array row sets are inferred automatically. |
| `expressionVariables` | `Record<string, unknown>` | Optional expression variables. |
| `printOptions` | `PrintReportOptions` | Print configuration (browser vs. Chrome extension). |
| `onEventLog` | `(entries: EventLogEntry[]) => void` | Event log callback. |
| `onPageChange` | `(page: number) => void` | Page navigation callback. |
| `onRenderComplete` | `(document: RenderDocument) => void` | Called when rendering finishes. |

## Viewer Toolbar

The `ViewerToolbar` component provides standard toolbar actions:

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

Toolbar actions include:

- **Page navigation** — first, previous, next, last, and direct page input.
- **Print** — triggers browser print dialog.
- **Export PDF** — generates and downloads a PDF file.
- **Zoom** — zoom in/out controls.

## RenderDocument

The `RenderDocument` is the core runtime representation of a rendered report:

```ts
interface RenderDocument {
  pages: RenderedPage[];
  totalPages: number;
  // ... internal rendering state
}
```

It is produced by the `renderReport` function from `@report-designer/core` and consumed by the Viewer for DOM rendering, PDF export, and printing.

## Rendering Pipeline

1. **Template normalization** — `normalizeTemplate()` fills in defaults.
2. **Data processing** — the `root` field tree and array row sets are inferred, then filters and sorting are applied.
3. **Event: beforeData** — host event scripts run.
4. **Band planning** — bands are sequenced and grouped into pages.
5. **Pagination** — content is distributed across pages, respecting `keepTogether`, `canBreak`, and `printOn` settings.
6. **Event: beforeRender** — host event scripts run.
7. **Component rendering** — each component is rendered with its data and formatting.
8. **Event: beforePrint/afterPrint** — per-band/component events run.
9. **Page number pass** — a second pass resolves `PAGE()` and `TOTALPAGES()` expressions.
10. **Event: afterRender** — host event scripts run.

## Browser Printing

The simplest print option uses the browser's native print dialog:

```tsx
import { printReport } from '@report-designer/viewer';

// Print the rendered document
await printReport(renderDocument);

// Or trigger browser print without a document
await printReport(); // calls window.print()
```

## Print Options

```ts
interface PrintReportOptions {
  adapter?: 'browser' | 'chrome-extension';
  chromeExtension?: ChromeExtensionPrintOptions;
}
```

- `adapter: 'browser'` (default) — Uses the browser's print dialog.
- `adapter: 'chrome-extension'` — Sends the PDF to a Chrome extension for silent printing.

## Print Frame

The viewer renders reports in a dedicated print frame (iframe) to isolate styles and ensure print-ready output:

```tsx
import { RenderDocumentView } from '@report-designer/viewer';

<RenderDocumentView document={renderDocument} />
```

The print frame handles:

- CSS print media queries.
- Page break markers.
- Margin and padding matching the template settings.
- Font embedding for correct rendering.

## Event Log Panel

The `EventLogPanel` displays event execution logs:

```tsx
import { EventLogPanel } from '@report-designer/viewer';

<EventLogPanel entries={eventLogEntries} />
```

Useful for debugging event scripts — shows info, warning, and error entries with timestamps and source locations.

## Page Navigation

The viewer supports page-by-page navigation:

- Click page numbers in the toolbar.
- Use keyboard shortcuts (arrow keys).
- Direct page number input.

## Zoom Controls

The viewer includes zoom controls for detailed inspection:

- Zoom in/out buttons.
- Fit-to-width and fit-to-page options.
- Mouse wheel zoom (with Ctrl/Cmd modifier).

## Composable Viewer

For advanced layouts, compose the viewer parts individually:

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
