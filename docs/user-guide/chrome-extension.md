# Chrome Extension

Report Designer includes a Chrome extension for controlled environments that need to send PDF print jobs from the web viewer to Chrome's printing API.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Web App     │────▶│ Chrome Extension │────▶│ Chrome Printing │
│  (Viewer)    │  JS │  (Service Worker)│  PDF│ API / Printer   │
└──────────────┘     └──────────────────┘     └─────────────────┘
```

## Components

Located at `extensions/chrome-silent-print/`:

- **background.js** — receives print requests and calls `chrome.printing.submitJob`.
- **content-script.js** — bridges messages between the web page and extension service worker.
- **manifest.json** — declares `printing`, `storage`, and page access permissions.
- **options.html / options.js** — configure allowed web origins.

## Setup

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `extensions/chrome-silent-print/`.
4. Open the extension options page and add the web app origin if it is not localhost or `file://`.
5. Configure the target printers through Chrome printer settings or managed Chrome policy.

## Usage in Viewer

```tsx
import { Viewer } from '@report-designer/viewer';

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

### ChromeExtensionPrintOptions

| Option | Type | Description |
| --- | --- | --- |
| `backend` | `'chromePrinting'` | Uses the Chrome printing API. This is the default. |
| `printerId` | `string` | Target printer id from Chrome's printing API or managed printer policy. |
| `copies` | `number` | Optional copy count. |
| `silent` | `boolean` | Requests extension-based printing without the app opening a browser print dialog. |
| `offset` | `{ xMm?: number; yMm?: number }` | Optional print alignment metadata. |

## Communication Channel

- **Web page -> Extension**: `window.postMessage` with channel `report-designer.chrome-print`.
- **Extension -> Chrome Printing**: `chrome.printing.submitJob` with a PDF document.
- **Extension -> Web page**: `window.postMessage` response containing the job result or error.

## Deployment Notes

- The old Windows print helper is no longer used.
- For zero-click operational printing, deploy the extension and printer configuration with Chrome enterprise policy.
- For normal desktop use, browser print and PDF export are still available without installing the extension.

## Uninstall

1. Go to `chrome://extensions/`.
2. Click **Remove** on the Report Designer extension.
