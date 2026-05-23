#Requires -Version 5.1
<#
.SYNOPSIS
    Bootstrap Iriscord installer from GitHub (one-liner target).

.DESCRIPTION
    Downloads the full Iriscord source into %TEMP%\Iriscord-Setup, then launches the installer.
    Works with: irm https://github.com/Iriscord/Iriscord/raw/main/scripts/bootstrap.ps1 | iex

    NOTE: When run via "irm | iex", $PSScriptRoot is empty — all download logic is inlined here.
#>

$ErrorActionPreference = "Stop"

$Repo = if ($env:IRISCORD_GITHUB_REPO) { $env:IRISCORD_GITHUB_REPO } else { "Iriscord/Iriscord" }
$Branch = if ($env:IRISCORD_GITHUB_BRANCH) { $env:IRISCORD_GITHUB_BRANCH } else { "main" }
$env:IRISCORD_GITHUB_REPO = $Repo
$env:IRISCORD_GITHUB_BRANCH = $Branch

$SourceDir = Join-Path $env:TEMP "Iriscord-Setup"
$RepoUrl = "https://github.com/$Repo.git"
$ZipUrl = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"

function Test-SourceReady([string]$Dir) {
    Test-Path (Join-Path $Dir "package.json")
}

# Git writes progress to stderr; with $ErrorActionPreference Stop that aborts the script.
function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $null = & git @Args 2>&1
    } finally {
        $ErrorActionPreference = $prev
    }
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Args -join ' ') failed (exit $LASTEXITCODE)"
    }
}

function Update-GitSource([string]$Dir) {
    Push-Location $Dir
    try {
        Write-Host "  Updating Iriscord source..." -ForegroundColor DarkGray
        Invoke-Git fetch origin $Branch
        Invoke-Git reset --hard "origin/$Branch"
    } finally { Pop-Location }
}

function Install-GitSource([string]$Dir) {
    if (Test-Path $Dir) { Remove-Item -Path $Dir -Recurse -Force }
    $parent = Split-Path $Dir -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Write-Host "  Cloning Iriscord (full repo with package.json)..." -ForegroundColor DarkGray
    Invoke-Git clone --depth 1 --branch $Branch $RepoUrl $Dir
}

function Install-ZipSource([string]$Dir) {
    $tempZip = Join-Path $env:TEMP "Iriscord-src-$Branch.zip"
    $tempExtract = Join-Path $env:TEMP "Iriscord-src-extract"
    if (Test-Path $tempExtract) { Remove-Item -Path $tempExtract -Recurse -Force }
    if (Test-Path $Dir) { Remove-Item -Path $Dir -Recurse -Force }

    Write-Host "  Downloading Iriscord source zip (full repo with package.json)..." -ForegroundColor DarkGray
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
        # Source already present — skip git pull unless user opts in (avoids stderr noise / failures)
        if ($env:IRISCORD_GIT_UPDATE -eq "1") {
            $gitDir = Join-Path $Dir ".git"
            if ((Test-Path $gitDir) -and (Get-Command git -ErrorAction SilentlyContinue)) {
                Update-GitSource $Dir
            }
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

Write-Host "  Source ready: $SourceDir" -ForegroundColor DarkGray
Write-Host "  Launching installer..." -ForegroundColor DarkGray
Write-Host ""

Set-Location $SourceDir
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $SourceDir "install.ps1") -Production @args
