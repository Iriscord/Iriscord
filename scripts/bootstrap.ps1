#Requires -Version 5.1
<#
.SYNOPSIS
    Bootstrap Iriscord installer from GitHub (one-liner target).

.DESCRIPTION
    Downloads the full Iriscord source, then launches the interactive installer.
    Use via:
      irm https://github.com/Iriscord/Iriscord/raw/main/scripts/bootstrap.ps1 | iex
#>

$ErrorActionPreference = "Stop"

$Repo = if ($env:IRISCORD_GITHUB_REPO) { $env:IRISCORD_GITHUB_REPO } else { "Iriscord/Iriscord" }
$Branch = if ($env:IRISCORD_GITHUB_BRANCH) { $env:IRISCORD_GITHUB_BRANCH } else { "main" }
$env:IRISCORD_GITHUB_REPO = $Repo
$env:IRISCORD_GITHUB_BRANCH = $Branch

# Full source (package.json, src, etc.) — same folder the one-liner has always used
$SourceDir = Join-Path $env:TEMP "Iriscord-Setup"

. (Join-Path $PSScriptRoot "ensureSource.ps1")

Write-Host ""
Ensure-IriscordSource -Dir $SourceDir | Out-Null

# Production install: patch files go to AppData, not the source folder
$env:IRISCORD_USER_DATA_DIR = Join-Path $env:APPDATA "Iriscord"
Remove-Item Env:IRISCORD_DEV_INSTALL -ErrorAction SilentlyContinue
Remove-Item Env:VENCORD_DEV_INSTALL -ErrorAction SilentlyContinue
Remove-Item Env:VENCORD_USER_DATA_DIR -ErrorAction SilentlyContinue

if (-not $env:IRISCORD_LOCAL_DIST) {
    $guess = Join-Path (Get-Location) "dist"
    if (Test-Path (Join-Path $guess "patcher.js")) {
        $env:IRISCORD_USE_LOCAL_DIST = "1"
        $env:IRISCORD_LOCAL_DIST = (Resolve-Path $guess).Path
    }
}

Write-Host "  Launching installer..." -ForegroundColor DarkGray
Write-Host ""

Set-Location $SourceDir
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $SourceDir "install.ps1") -Production @args
