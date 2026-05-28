param(
  [string]$InstallRoot = "$env:LOCALAPPDATA\Programs\ReportDesignerPrint",
  [string]$ProfileDir = "$env:LOCALAPPDATA\ReportDesignerPrintChromeProfile",
  [switch]$RemoveProfile
)

$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  $scriptDir = Split-Path -Parent $PSCommandPath
  return (Resolve-Path (Join-Path $scriptDir "..\..")).Path
}

$repoRoot = Resolve-RepoRoot
$hostUninstallScript = Join-Path $repoRoot "native-hosts\windows-print-host\scripts\uninstall-chrome-native-host.ps1"
$hostInstallDir = Join-Path $InstallRoot "host"

& powershell -NoProfile -ExecutionPolicy Bypass -File $hostUninstallScript -InstallDir $hostInstallDir

$desktopPath = [Environment]::GetFolderPath("DesktopDirectory")
$shortcutPath = Join-Path $desktopPath "Report Designer Print Chrome.lnk"
if (Test-Path -LiteralPath $shortcutPath) {
  Remove-Item -LiteralPath $shortcutPath -Force
}

if (Test-Path -LiteralPath $InstallRoot) {
  Remove-Item -LiteralPath $InstallRoot -Recurse -Force
}

if ($RemoveProfile -and (Test-Path -LiteralPath $ProfileDir)) {
  Remove-Item -LiteralPath $ProfileDir -Recurse -Force
}

Write-Host "Report Designer print integration uninstalled."
