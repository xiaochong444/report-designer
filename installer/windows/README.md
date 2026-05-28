# Windows one-click installer

This folder contains the local one-click installer for the print bridge.

## Install

Double-click `install.cmd`, or run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\installer\windows\install.ps1
```

The installer:

- publishes the .NET print host
- registers Chrome Native Messaging for the fixed extension id
- copies the extension to a stable local folder
- creates a desktop shortcut that launches Chrome with the extension loaded

## Why a launcher is used

Unmanaged Chrome does not allow a local installer to silently install an arbitrary local extension into the user's main browser profile. The local installer therefore creates a dedicated Chrome launcher using `--load-extension`.

For a true commercial installer that installs into the normal Chrome profile without user interaction, publish the extension to Chrome Web Store or deploy it through Chrome enterprise policy, then keep using the same native host registration flow.

## Fixed extension id

The development extension id is:

```text
ehppgngdhfmokcmjihddljjfjmcponik
```
