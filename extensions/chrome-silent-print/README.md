# Chrome Silent Print Bridge

This extension bridges the web viewer to silent printing.

## Flow

1. The viewer builds a PDF print job and posts it to the page bridge.
2. The content script forwards the job to the service worker.
3. The service worker routes the job to one of two backends:
   - `nativeMessaging` for desktop Chrome silent printing
   - `chromePrinting` for ChromeOS deployments

## Default settings

- `backend`: `nativeMessaging`
- `nativeHostName`: `com.report_designer.print_host`
- `allowedOrigins`: empty list, which allows localhost and file URLs during development

## Viewer usage

```ts
await printReport(renderDocument, {
  adapter: 'chrome-extension',
  chromeExtension: {
    jobName: 'Warehouse Order',
    printerId: 'printer-01',
    copies: 2,
    silent: true,
    offset: { xMm: 0, yMm: 0 },
    backend: 'nativeMessaging',
  },
});
```

The `Viewer` component also accepts the same print options:

```tsx
<Viewer
  template={template}
  data={data}
  printOptions={{
    adapter: 'chrome-extension',
    chromeExtension: { printerId: 'printer-01', silent: true },
  }}
/>
```

## Native host message

```json
{
  "type": "printPdf",
  "payload": {
    "requestId": "job-1",
    "jobName": "Warehouse Order",
    "printerId": "printer-01",
    "copies": 2,
    "silent": true,
    "offset": { "xMm": 0, "yMm": 0 },
    "pdfBase64": "..."
  }
}
```

## Native host response

```json
{
  "ok": true,
  "jobId": "native-1"
}
```

or

```json
{
  "ok": false,
  "error": "Printer is offline"
}
```

## Notes

- Desktop Chrome cannot silently print by extension alone. A native host is required.
- ChromeOS can use `chrome.printing` when printer policy and permissions are available.

## Windows native host

The Windows host lives in `native-hosts/windows-print-host`. It is a .NET `WinExe` Native Messaging host, so Chrome can launch it with redirected stdin/stdout without showing a console window.

Build and publish:

```powershell
dotnet publish native-hosts\windows-print-host\WindowsPrintHost.csproj -c Release -r win-x64 --self-contained false -o "C:\Program Files\ReportDesignerPrintHost"
```

Create `%LOCALAPPDATA%\ReportDesignerPrintHost\config.json`:

```json
{
  "rootDir": "C:\\Users\\you\\AppData\\Local\\ReportDesignerPrintHost",
  "printCommand": "SumatraPDF.exe",
  "printArgs": [
    "-print-to",
    "{printerId}",
    "-print-settings",
    "{copies}x",
    "-silent",
    "{file}"
  ]
}
```

Register the native host manifest under:

```text
HKCU\Software\Google\Chrome\NativeMessagingHosts\com.report_designer.print_host
```

The registry value should point to `extensions\chrome-silent-print\native-host\com.report_designer.print_host.windows.example.json` after replacing the extension id and executable path for the installed machine.
