#Requires -Version 5.1
<#
.SYNOPSIS
    Bootstrap Iriscord installer from GitHub (one-liner target).

.DESCRIPTION
    Downloads install.ps1 and dependencies, then launches the interactive installer.
    Use via:
      irm https://github.com/iriscord/iriscord/raw/main/scripts/bootstrap.ps1 | iex
#>

$ErrorActionPreference = "Stop"

$Repo = if ($env:IRISCORD_GITHUB_REPO) { $env:IRISCORD_GITHUB_REPO } else { "iriscord/iriscord" }
$Branch = if ($env:IRISCORD_GITHUB_BRANCH) { $env:IRISCORD_GITHUB_BRANCH } else { "main" }
$RawBase = "https://github.com/$Repo/raw/$Branch"

$InstallDir = Join-Path $env:TEMP "Iriscord-Setup"
$null = New-Item -ItemType Directory -Path $InstallDir -Force

$files = @(
    "install.ps1",
    "install.cmd",
    "scripts/install-banner.txt",
    "scripts/installConfig.mjs",
    "scripts/installDiscord.mjs",
    "scripts/checkNodeVersion.js"
)

Write-Host ""
Write-Host "  Downloading Iriscord installer..." -ForegroundColor DarkGray

foreach ($rel in $files) {
    $url = "$RawBase/$rel"
    $dest = Join-Path $InstallDir $rel
    $parent = Split-Path $dest -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
}

# Production install: files live in AppData, not the temp download folder
$env:IRISCORD_USER_DATA_DIR = Join-Path $env:APPDATA "Iriscord"
Remove-Item Env:IRISCORD_DEV_INSTALL -ErrorAction SilentlyContinue
Remove-Item Env:VENCORD_DEV_INSTALL -ErrorAction SilentlyContinue
Remove-Item Env:VENCORD_USER_DATA_DIR -ErrorAction SilentlyContinue

# If user already built in a local clone, they can set IRISCORD_LOCAL_DIST before running
if (-not $env:IRISCORD_LOCAL_DIST) {
    $guess = Join-Path (Get-Location) "dist"
    if (Test-Path (Join-Path $guess "patcher.js")) {
        $env:IRISCORD_USE_LOCAL_DIST = "1"
        $env:IRISCORD_LOCAL_DIST = (Resolve-Path $guess).Path
    }
}

Write-Host "  Launching installer..." -ForegroundColor DarkGray
Write-Host ""

Set-Location $InstallDir
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $InstallDir "install.ps1") @args
