param(
  [string]$InstallRoot = "$env:LOCALAPPDATA\Programs\ReportDesignerPrint",
  [string]$ProfileDir = "$env:LOCALAPPDATA\ReportDesignerPrintChromeProfile",
  [string]$DefaultPrinter = "",
  [string]$PrintCommand = "",
  [switch]$SelfContained,
  [switch]$NoShortcut,
  [switch]$Launch
)

$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  $scriptDir = Split-Path -Parent $PSCommandPath
  return (Resolve-Path (Join-Path $scriptDir "..\..")).Path
}

function Resolve-ChromePath {
  $registryCandidates = @(
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe",
    "HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"
  )

  foreach ($registryPath in $registryCandidates) {
    if (Test-Path -LiteralPath $registryPath) {
      $value = (Get-Item -LiteralPath $registryPath).GetValue("")
      if ($value -and (Test-Path -LiteralPath $value)) {
        return $value
      }
    }
  }

  $pathCandidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  )

  foreach ($candidate in $pathCandidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  $fromPath = Get-Command "chrome.exe" -ErrorAction SilentlyContinue
  if ($fromPath) {
    return $fromPath.Source
  }

  return ""
}

function Copy-Extension {
  param(
    [string]$SourceDir,
    [string]$TargetDir
  )
  New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
  Get-ChildItem -LiteralPath $TargetDir -Force | Remove-Item -Recurse -Force
  Copy-Item -Path (Join-Path $SourceDir "*") -Destination $TargetDir -Recurse -Force
}

function New-ChromeShortcut {
  param(
    [string]$ChromePath,
    [string]$ExtensionDir,
    [string]$ShortcutPath,
    [string]$ProfileDir
  )

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($ShortcutPath)
  $shortcut.TargetPath = $ChromePath
  $shortcut.Arguments = "--user-data-dir=`"$ProfileDir`" --load-extension=`"$ExtensionDir`" --no-first-run about:blank"
  $shortcut.WorkingDirectory = Split-Path -Parent $ChromePath
  $shortcut.Description = "Open Chrome with the Report Designer silent print bridge loaded"
  $shortcut.Save()
}

$repoRoot = Resolve-RepoRoot
$hostInstallScript = Join-Path $repoRoot "native-hosts\windows-print-host\scripts\install-chrome-native-host.ps1"
$sourceExtensionDir = Join-Path $repoRoot "extensions\chrome-silent-print"
$extensionDir = Join-Path $InstallRoot "extension"
$hostInstallDir = Join-Path $InstallRoot "host"
$chromePath = Resolve-ChromePath

if (-not $chromePath) {
  throw "Chrome was not found. Install Chrome first, or add chrome.exe to PATH."
}

New-Item -ItemType Directory -Force -Path $InstallRoot, $ProfileDir | Out-Null
Copy-Extension -SourceDir $sourceExtensionDir -TargetDir $extensionDir

$hostArgs = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $hostInstallScript,
  "-InstallDir",
  $hostInstallDir
)

if ($PrintCommand) {
  $hostArgs += @("-PrintCommand", $PrintCommand)
}

if ($DefaultPrinter) {
  $hostArgs += @("-DefaultPrinter", $DefaultPrinter)
}

if ($SelfContained) {
  $hostArgs += "-SelfContained"
}

& powershell @hostArgs

if (-not $NoShortcut) {
  $desktopPath = [Environment]::GetFolderPath("DesktopDirectory")
  $shortcutPath = Join-Path $desktopPath "Report Designer Print Chrome.lnk"
  New-ChromeShortcut -ChromePath $chromePath -ExtensionDir $extensionDir -ShortcutPath $shortcutPath -ProfileDir $ProfileDir
  Write-Host "Shortcut: $shortcutPath"
}

Write-Host ""
Write-Host "Report Designer print integration installed."
Write-Host "Chrome:    $chromePath"
Write-Host "Extension: $extensionDir"
Write-Host "Host:      $hostInstallDir"
Write-Host "Profile:   $ProfileDir"
if ($DefaultPrinter) {
  Write-Host "Printer:   $DefaultPrinter"
}

if ($Launch) {
  Start-Process -FilePath $chromePath -ArgumentList "--user-data-dir=`"$ProfileDir`" --load-extension=`"$extensionDir`" --no-first-run about:blank"
}
