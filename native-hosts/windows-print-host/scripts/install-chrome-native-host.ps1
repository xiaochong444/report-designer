param(
  [string]$ExtensionId = "",

  [string]$InstallDir = "$env:LOCALAPPDATA\Programs\ReportDesignerPrintHost",
  [string]$DataDir = "$env:LOCALAPPDATA\ReportDesignerPrintHost",
  [string]$PrintCommand = "",
  [string[]]$PrintArgs = @("-print-to", "{printerId}", "-print-settings", "{copies}x", "-silent", "{file}"),
  [switch]$SelfContained,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Resolve-RepoRoot {
  $scriptDir = Split-Path -Parent $PSCommandPath
  return (Resolve-Path (Join-Path $scriptDir "..\..\..")).Path
}

function Resolve-HostProject {
  param([string]$RepoRoot)
  return Join-Path $RepoRoot "native-hosts\windows-print-host\WindowsPrintHost.csproj"
}

function Resolve-FixedExtensionId {
  param([string]$RepoRoot)
  $configPath = Join-Path $RepoRoot "extensions\chrome-silent-print\fixed-extension.json"
  if (-not (Test-Path -LiteralPath $configPath)) {
    return ""
  }
  $config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
  return [string]$config.extensionId
}

function Resolve-SumatraPdf {
  $candidates = @(
    $PrintCommand,
    "$env:LOCALAPPDATA\SumatraPDF\SumatraPDF.exe",
    "$env:ProgramFiles\SumatraPDF\SumatraPDF.exe",
    "${env:ProgramFiles(x86)}\SumatraPDF\SumatraPDF.exe"
  ) | Where-Object { $_ -and $_.Trim().Length -gt 0 }

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  $fromPath = Get-Command "SumatraPDF.exe" -ErrorAction SilentlyContinue
  if ($fromPath) {
    return $fromPath.Source
  }

  return $PrintCommand
}

function Write-Utf8Json {
  param(
    [string]$Path,
    [object]$Value
  )
  $json = $Value | ConvertTo-Json -Depth 10
  [System.IO.File]::WriteAllText($Path, $json + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
}

$repoRoot = Resolve-RepoRoot
$projectPath = Resolve-HostProject -RepoRoot $repoRoot
$exePath = Join-Path $InstallDir "ReportDesignerPrintHost.exe"
$manifestDir = Join-Path $DataDir "native-host"
$manifestPath = Join-Path $manifestDir "com.report_designer.print_host.json"
$configPath = Join-Path $DataDir "config.json"
$nativeHostName = "com.report_designer.print_host"
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$nativeHostName"
$resolvedPrintCommand = Resolve-SumatraPdf

if (-not $ExtensionId) {
  $ExtensionId = Resolve-FixedExtensionId -RepoRoot $repoRoot
}

if (-not $ExtensionId) {
  throw "ExtensionId is required and fixed-extension.json was not found."
}

New-Item -ItemType Directory -Force -Path $InstallDir, $DataDir, $manifestDir | Out-Null

if (-not $SkipBuild) {
  $selfContainedValue = if ($SelfContained) { "true" } else { "false" }
  dotnet publish $projectPath -c Release -r win-x64 --self-contained $selfContainedValue -o $InstallDir
}

if (-not (Test-Path -LiteralPath $exePath)) {
  throw "Host executable not found: $exePath"
}

Write-Utf8Json -Path $configPath -Value @{
  rootDir = $DataDir
  printCommand = $resolvedPrintCommand
  printArgs = $PrintArgs
}

Write-Utf8Json -Path $manifestPath -Value @{
  name = $nativeHostName
  description = "Report Designer native silent print host"
  path = $exePath
  type = "stdio"
  allowed_origins = @("chrome-extension://$ExtensionId/")
}

New-Item -Path $registryPath -Force | Out-Null
Set-Item -Path $registryPath -Value $manifestPath

Write-Host ""
Write-Host "Windows print host deployed."
Write-Host "Host:      $exePath"
Write-Host "Config:    $configPath"
Write-Host "Manifest:  $manifestPath"
Write-Host "Registry:  HKCU\Software\Google\Chrome\NativeMessagingHosts\$nativeHostName"

if (-not $resolvedPrintCommand) {
  Write-Host ""
  Write-Host "Warning: printCommand is empty. Install SumatraPDF or rerun with -PrintCommand before real silent printing."
}
