param(
  [string]$ExtensionId = "",

  [string]$InstallDir = "$env:LOCALAPPDATA\Programs\ReportDesignerPrintHost",
  [string]$DataDir = "$env:LOCALAPPDATA\ReportDesignerPrintHost",
  [string]$DefaultPrinter = "",
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

function Install-SumatraPdf {
  param([string]$InstallDir)

  $sumatraVersion = "3.6.1"
  $downloadUrl = "https://www.sumatrapdfreader.org/dl/rel/$sumatraVersion/SumatraPDF-$sumatraVersion-64.zip"
  $toolDir = Join-Path $InstallDir "tools\SumatraPDF"
  $zipPath = Join-Path $env:TEMP "SumatraPDF-$sumatraVersion-64.zip"
  $extractDir = Join-Path $env:TEMP "SumatraPDF-$sumatraVersion-64"

  Remove-Item -LiteralPath $extractDir -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue

  Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -Headers @{ "User-Agent" = "Mozilla/5.0" }
  Expand-Archive -LiteralPath $zipPath -DestinationPath $extractDir -Force

  $exe = Get-ChildItem -LiteralPath $extractDir -Filter "SumatraPDF-*-64.exe" -Recurse | Select-Object -First 1
  if (-not $exe) {
    throw "SumatraPDF package did not contain a 64-bit executable."
  }

  New-Item -ItemType Directory -Force -Path $toolDir | Out-Null
  $targetExe = Join-Path $toolDir "SumatraPDF.exe"
  Copy-Item -LiteralPath $exe.FullName -Destination $targetExe -Force
  return (Resolve-Path -LiteralPath $targetExe).Path
}

function Resolve-SumatraPdf {
  param([string]$InstallDir)

  if (-not [string]::IsNullOrWhiteSpace($PrintCommand)) {
    return $PrintCommand
  }

  $candidates = @(
    (Join-Path $InstallDir "tools\SumatraPDF\SumatraPDF.exe"),
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

  return Install-SumatraPdf -InstallDir $InstallDir
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
$resolvedPrintCommand = Resolve-SumatraPdf -InstallDir $InstallDir
if (-not $DefaultPrinter) {
  try {
    $defaultPrinterInstance = Get-CimInstance Win32_Printer -ErrorAction Stop | Where-Object { $_.Default -eq $true } | Select-Object -First 1
    if ($defaultPrinterInstance) {
      $DefaultPrinter = [string]$defaultPrinterInstance.Name
    }
  } catch {
    $DefaultPrinter = ""
  }
}

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
  defaultPrinterId = $DefaultPrinter
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
  Write-Host "Info: printCommand is empty. The Host will use Windows shell printto with the default PDF application."
}

if (-not $DefaultPrinter) {
  Write-Host ""
  Write-Host "Warning: no default printer detected. The Host will require printerId from the payload until one is configured."
}
