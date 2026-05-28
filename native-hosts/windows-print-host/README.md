# Windows Print Host

This project is the native Windows host for silent PDF printing.

## What it is

- A hidden .NET `WinExe` Native Messaging host process
- A local durable print queue
- A command-based print adapter for the first release

## What it is not

- Not a browser extension
- Not a GUI app
- Not a Windows Service in the first version

## Build

```powershell
dotnet publish .\WindowsPrintHost.csproj -c Release -r win-x64 --self-contained false -o "C:\Program Files\ReportDesignerPrintHost"
```

For local integration, use the one-command installer from the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\installer\windows\install.ps1
```

## Configuration

Create `%LOCALAPPDATA%\\ReportDesignerPrintHost\\config.json`:

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

## Notes

- The host communicates with Chrome through the standard Native Messaging length-prefixed JSON protocol.
- `OutputType=WinExe` keeps the host hidden while still allowing redirected stdin/stdout.
- The one-click installer will look for `SumatraPDF.exe` and download the official portable build if it is missing.
- Silent jobs use the configured default printer when one exists. Interactive jobs with `silent: false` may pass a printer id, which is useful for validating the pipeline with `Microsoft Print to PDF`.
- The Windows `printto` fallback is still available for manual setups, but production silent printing should use a known command-line PDF printer such as SumatraPDF.
