# Silent Printing

Silent printing lets a controlled Chrome environment submit report PDFs to configured printers without opening the normal browser print dialog. It is useful for retail counters, warehouses, production lines, and other workstations managed by an organization.

## Architecture Overview

Report Designer uses a Chrome extension bridge:

1. **Viewer** renders the report and creates a PDF print payload.
2. **Chrome Extension** receives the payload from the web page.
3. **Chrome Printing API** submits the PDF to the configured printer.

This replaces the earlier Windows helper approach. The project now relies on the Chrome extension and Chrome printing API.

## Viewer Configuration

```tsx
<Viewer
  template={template}
  data={data}
  printOptions={{
    adapter: 'chrome-extension',
    chromeExtension: {
      backend: 'chromePrinting',
      printerId: 'receipt-printer-01',
      copies: 1,
      silent: true,
    },
  }}
/>
```

`printerId` should match the printer id available to Chrome. In enterprise deployments, configure printers and extension installation through Chrome policy so the workstation can submit print jobs consistently.

## Print Flow

1. User clicks print in the Viewer, or your app triggers printing programmatically.
2. Viewer renders the report into a PDF payload.
3. The page sends a base64 PDF message to the Chrome extension.
4. The extension validates the origin and calls `chrome.printing.submitJob`.
5. Chrome returns a job id/status or an error.
6. The extension sends the result back to the web page.

## Error Handling

The bridge returns `ChromePrintResponse`:

```ts
interface ChromePrintResponse {
  channel: 'report-designer.chrome-print';
  direction: 'extension-to-page';
  requestId: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}
```

Common causes:

| Problem | What to check |
| --- | --- |
| Extension unavailable | The extension is installed, enabled, and allowed on the web app origin. |
| `chrome.printing` unavailable | The current Chrome environment supports the printing API and grants the extension permission. |
| Printer not found | `printerId` matches a configured Chrome printer or managed printer policy entry. |
| PDF generation failed | The report can be rendered and exported to PDF before the print request is sent. |

## Alternatives

For environments that do not need extension-based printing, keep using browser print or PDF export:

```tsx
<Viewer
  template={template}
  data={data}
  printOptions={{
    adapter: 'browser',
  }}
/>
```

Browser print opens the normal print dialog and lets the user choose a printer.
