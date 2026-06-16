# Chrome Silent Print Bridge

This extension receives PDF print jobs from the web viewer and submits them through Chrome's `chrome.printing` API.

## Flow

1. The viewer builds a PDF print job and posts it to the page bridge.
2. The content script forwards the job to the service worker.
3. The service worker validates the page origin and submits the PDF with `chrome.printing.submitJob`.
4. Chrome returns the print job result to the web page.

## Settings

- `allowedOrigins`: one origin per line. An empty list allows localhost, `127.0.0.1`, `::1`, and `file://` during development.
- fixed development extension id: `ehppgngdhfmokcmjihddljjfjmcponik`.

Printer access is controlled by Chrome extension permissions and Chrome printer policy. Deployments that require zero-click printing should be installed in a managed Chrome environment where the target printers and extension permissions are configured by policy.

## Viewer Usage

```ts
await printReport(renderDocument, {
  adapter: 'chrome-extension',
  chromeExtension: {
    jobName: 'Warehouse Order',
    printerId: 'printer-01',
    copies: 2,
    silent: true,
    offset: { xMm: 0, yMm: 0 },
    backend: 'chromePrinting',
  },
});
```

The `Viewer` component accepts the same print options:

```tsx
<Viewer
  template={template}
  data={data}
  printOptions={{
    adapter: 'chrome-extension',
    chromeExtension: {
      backend: 'chromePrinting',
      printerId: 'printer-01',
      silent: true,
    },
  }}
/>
```

## Development Setup

1. Open `chrome://extensions/`.
2. Enable developer mode.
3. Load `extensions/chrome-silent-print` as an unpacked extension.
4. Open the extension options page and add the web app origin if it is not a localhost or file URL.
5. Use the printer id exposed by Chrome's printing API or your managed Chrome printer configuration.

## Notes

- The extension uses Chrome's printing API directly.
- The old Windows print helper and installer have been removed from the project.
- Standard browser printing and PDF export remain available for environments that do not need extension-based printing.
