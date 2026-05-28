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
powershell -ExecutionPolicy Bypass -File .\native-hosts\windows-print-host\scripts\install-chrome-native-host.ps1 -ExtensionId "your_chrome_extension_id"
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
