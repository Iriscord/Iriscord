#Requires -Version 5.1
<#
.SYNOPSIS
    Bootstrap Iriscord installer from GitHub (one-liner target).

.DESCRIPTION
    Clones or updates the full Iriscord source, then launches the interactive installer.

    Run:
      irm https://github.com/Iriscord/Iriscord/raw/main/scripts/bootstrap.ps1 | iex
#>

$ErrorActionPreference = "Stop"

$Repo = if ($env:IRISCORD_GITHUB_REPO) { $env:IRISCORD_GITHUB_REPO } else { "Iriscord/Iriscord" }
$Branch = if ($env:IRISCORD_GITHUB_BRANCH) { $env:IRISCORD_GITHUB_BRANCH } else { "main" }
$env:IRISCORD_GITHUB_REPO = $Repo
$env:IRISCORD_GITHUB_BRANCH = $Branch

$RawScripts = "https://raw.githubusercontent.com/$Repo/$Branch/scripts"

function Get-BootstrapScriptDir {
    if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot "iriscord-pnpm.ps1"))) {
        return $PSScriptRoot
    }

    $cache = Join-Path $env:LOCALAPPDATA "Iriscord\bootstrap-cache"
    $null = New-Item -ItemType Directory -Path $cache -Force

    foreach ($name in @("iriscord-pnpm.ps1", "repair-pnpm-config.mjs")) {
        $dest = Join-Path $cache $name
        $url = "$RawScripts/$name"
        Write-Host "  Downloading $name..." -ForegroundColor DarkGray
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
        if (-not (Test-Path $dest) -or (Get-Item $dest).Length -eq 0) {
            throw "Failed to download $url"
        }
    }

    return $cache
}

$BootstrapScriptDir = Get-BootstrapScriptDir
. (Join-Path $BootstrapScriptDir "iriscord-pnpm.ps1")

$SourceDir = Join-Path $env:LOCALAPPDATA "Iriscord\source"
$RepoUrl = "https://github.com/$Repo.git"
$ZipUrl = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"

function Test-SourceReady([string]$Dir) {
    if (-not (Test-Path (Join-Path $Dir "package.json"))) { return $false }
    if (Test-IriscordSourceNeedsPnpmRepair $Dir) { return $false }
    return $true
}

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)

    $git = (Get-Command git -ErrorAction Stop).Source
    $argLine = ($Args | ForEach-Object {
        if ($_ -match '\s') { '"' + ($_ -replace '"', '\"') + '"' } else { $_ }
    }) -join ' '

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $git
    $psi.Arguments = $argLine
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    $proc = [System.Diagnostics.Process]::Start($psi)
    $null = $proc.StandardOutput.ReadToEnd()
    $null = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()
    if ($proc.ExitCode -ne 0) { throw "git $($Args -join ' ') failed (exit $($proc.ExitCode))" }
}

function Install-GitSource([string]$Dir) {
    # Windows can occasionally lock the source dir while other processes still hold file handles.
    # Retry deletion to avoid failing the whole bootstrap.
    if (Test-Path $Dir) {
        $maxAttempts = 30
        $delaySeconds = 1
        for ($i = 1; $i -le $maxAttempts; $i++) {
            try {
                # Best-effort: also try taking ownership/clearing read-only issues.
                Get-ChildItem -Path $Dir -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
                    try { $_.IsReadOnly = $false } catch {}
                }

                Remove-Item -Path $Dir -Recurse -Force -ErrorAction Stop
                break
            } catch {
                if ($i -eq $maxAttempts) { throw }
                Start-Sleep -Seconds $delaySeconds
            }
        }
    }


    $parent = Split-Path $Dir -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Write-Host "  Cloning $Repo..." -ForegroundColor DarkGray
    Invoke-Git clone --depth 1 --branch $Branch $RepoUrl $Dir
}


function Install-ZipSource([string]$Dir) {
    $tempZip = Join-Path $env:TEMP "Iriscord-src-$Branch.zip"
    $tempExtract = Join-Path $env:TEMP "Iriscord-src-extract"
    if (Test-Path $tempExtract) { Remove-Item -Path $tempExtract -Recurse -Force }
    if (Test-Path $Dir) { Remove-Item -Path $Dir -Recurse -Force }

    Write-Host "  Downloading Iriscord source zip..." -ForegroundColor DarkGray
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

function Update-GitSource([string]$Dir) {
    Push-Location $Dir
    try {
        Invoke-Git fetch origin $Branch --depth 1
        Invoke-Git reset --hard "origin/$Branch"
    } finally { Pop-Location }
}

function Ensure-IriscordSource([string]$Dir) {
    if (Test-SourceReady $Dir) {
        if (Get-Command git -ErrorAction SilentlyContinue) {
            if (Test-Path (Join-Path $Dir ".git")) {
                Write-Host "  Updating existing source..." -ForegroundColor DarkGray
                try {
                    Update-GitSource $Dir
                    Repair-IriscordPnpmConfig -Dir $Dir
                    return
                } catch {
                    Write-Host "  Update failed, re-downloading..." -ForegroundColor DarkGray
                }
            }
        } else {
            Write-Host "  Using existing source at $Dir" -ForegroundColor DarkGray
            Repair-IriscordPnpmConfig -Dir $Dir
            return
        }
    }

    if (Get-Command git -ErrorAction SilentlyContinue) {
        Install-GitSource $Dir
    } else {
        Install-ZipSource $Dir
    }

    if (-not (Test-SourceReady $Dir)) {
        throw "Source install failed in $Dir"
    }
    Repair-IriscordPnpmConfig -Dir $Dir
}

Write-Host ""
Write-Host "  Iriscord bootstrap" -ForegroundColor DarkGray
Ensure-IriscordSource $SourceDir

$env:IRISCORD_USER_DATA_DIR = Join-Path $env:APPDATA "Iriscord"
Remove-Item Env:IRISCORD_DEV_INSTALL -ErrorAction SilentlyContinue
Remove-Item Env:Iriscord_DEV_INSTALL -ErrorAction SilentlyContinue
Remove-Item Env:Iriscord_USER_DATA_DIR -ErrorAction SilentlyContinue

if (Test-Path (Join-Path $SourceDir "dist\patcher.js")) {
    $env:IRISCORD_USE_LOCAL_DIST = "1"
    $env:IRISCORD_LOCAL_DIST = Join-Path $SourceDir "dist"
}

Write-Host "  Source: $SourceDir" -ForegroundColor DarkGray
Write-Host "  Launching installer..." -ForegroundColor DarkGray
Write-Host ""

$installPs1 = Join-Path $SourceDir "install.ps1"
if (-not (Test-Path $installPs1)) {
    throw "install.ps1 not found in $SourceDir"
}

Set-Location $SourceDir
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installPs1 -Production
