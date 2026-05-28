param(
  [string]$DataDir = "$env:LOCALAPPDATA\ReportDesignerPrintHost",
  [string]$InstallDir = "$env:LOCALAPPDATA\Programs\ReportDesignerPrintHost"
)

$ErrorActionPreference = "Stop"

$nativeHostName = "com.report_designer.print_host"
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$nativeHostName"

if (Test-Path -LiteralPath $registryPath) {
  Remove-Item -LiteralPath $registryPath -Recurse -Force
}

if (Test-Path -LiteralPath $InstallDir) {
  Remove-Item -LiteralPath $InstallDir -Recurse -Force
}

Write-Host "Windows print host unregistered."
Write-Host "Data directory kept: $DataDir"
