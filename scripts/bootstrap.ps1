#Requires -Version 5.1
<#
.SYNOPSIS
    Bootstrap Iriscord installer from GitHub (one-liner target).

.DESCRIPTION
    Downloads the full Iriscord source to a persistent folder, then launches the installer.
    Use via:
      irm https://github.com/Iriscord/Iriscord/raw/main/scripts/bootstrap.ps1 | iex
#>

$ErrorActionPreference = "Stop"

$Repo = if ($env:IRISCORD_GITHUB_REPO) { $env:IRISCORD_GITHUB_REPO } else { "Iriscord/Iriscord" }
$Branch = if ($env:IRISCORD_GITHUB_BRANCH) { $env:IRISCORD_GITHUB_BRANCH } else { "main" }
$env:IRISCORD_GITHUB_REPO = $Repo

$SourceDir = Join-Path $env:LOCALAPPDATA "Iriscord\source"
$RepoUrl = "https://github.com/$Repo.git"
$ZipUrl = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"

function Test-SourceReady([string]$Dir) {
    Test-Path (Join-Path $Dir "package.json")
}

function Update-GitSource([string]$Dir) {
    Push-Location $Dir
    try {
        Write-Host "  Updating Iriscord source..." -ForegroundColor DarkGray
        & git fetch origin $Branch 2>&1 | Out-Null
        & git reset --hard "origin/$Branch" 2>&1 | Out-Null
    } finally { Pop-Location }
}

function Install-GitSource([string]$Dir) {
    if (Test-Path $Dir) { Remove-Item -Path $Dir -Recurse -Force }
    $parent = Split-Path $Dir -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Write-Host "  Cloning Iriscord from GitHub..." -ForegroundColor DarkGray
    & git clone --depth 1 --branch $Branch $RepoUrl $Dir
    if ($LASTEXITCODE -ne 0) { throw "git clone failed (exit $LASTEXITCODE)" }
}

function Install-ZipSource([string]$Dir) {
    $tempZip = Join-Path $env:TEMP "Iriscord-src-$Branch.zip"
    $tempExtract = Join-Path $env:TEMP "Iriscord-src-extract"
    if (Test-Path $tempExtract) { Remove-Item -Path $tempExtract -Recurse -Force }
    if (Test-Path $Dir) { Remove-Item -Path $Dir -Recurse -Force }

    Write-Host "  Downloading Iriscord source archive..." -ForegroundColor DarkGray
    Invoke-WebRequest -Uri $ZipUrl -OutFile $tempZip -UseBasicParsing
    Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force

    $extracted = Get-ChildItem -Path $tempExtract -Directory | Select-Object -First 1
    if (-not $extracted) { throw "Downloaded archive was empty" }

    $parent = Split-Path $Dir -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Move-Item -Path $extracted.FullName -Destination $Dir

    Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
}

function Ensure-IriscordSource([string]$Dir) {
    if (Test-SourceReady $Dir) {
        $gitDir = Join-Path $Dir ".git"
        if ((Test-Path $gitDir) -and (Get-Command git -ErrorAction SilentlyContinue)) {
            Update-GitSource $Dir
        }
        return
    }

    if (Get-Command git -ErrorAction SilentlyContinue) {
        Install-GitSource $Dir
    } else {
        Install-ZipSource $Dir
    }

    if (-not (Test-SourceReady $Dir)) {
        throw "Source install failed: package.json not found in $Dir"
    }
}

Write-Host ""
Ensure-IriscordSource $SourceDir

# Production install: patch files go to AppData, not the source folder
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

Set-Location $SourceDir
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $SourceDir "install.ps1") -Production @args
