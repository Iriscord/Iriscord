#Requires -Version 5.1
<#
.SYNOPSIS
    Bootstrap Iriscord installer from GitHub (one-liner target).

.DESCRIPTION
    Downloads the full Iriscord source into %TEMP%\Iriscord-Setup, then launches the installer.

    Run (use -OutFile if "irm | iex" shows a stale/cached script):
      $b = "$env:TEMP\Iriscord-bootstrap.ps1"
      Invoke-WebRequest "https://github.com/Iriscord/Iriscord/raw/main/scripts/bootstrap.ps1" -OutFile $b -UseBasicParsing
      & $b
#>

$ErrorActionPreference = "Stop"

$Repo = if ($env:IRISCORD_GITHUB_REPO) { $env:IRISCORD_GITHUB_REPO } else { "Iriscord/Iriscord" }
$Branch = if ($env:IRISCORD_GITHUB_BRANCH) { $env:IRISCORD_GITHUB_BRANCH } else { "main" }
$env:IRISCORD_GITHUB_REPO = $Repo
$env:IRISCORD_GITHUB_BRANCH = $Branch

$SourceDir = Join-Path $env:TEMP "Iriscord-Setup"
$RepoUrl = "https://github.com/$Repo.git"
$ZipUrl = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"

function Test-InstallScriptValid([string]$Path) {
    if (-not (Test-Path $Path)) { return $false }
    $parseErrors = $null
    $null = [System.Management.Automation.Language.Parser]::ParseFile($Path, [ref]$null, [ref]$parseErrors)
    return ($null -eq $parseErrors -or $parseErrors.Count -eq 0)
}

function Test-SourceReady([string]$Dir) {
    if (-not (Test-Path (Join-Path $Dir "package.json"))) { return $false }
    Test-InstallScriptValid (Join-Path $Dir "install.ps1")
}

# Run git without PowerShell treating stderr as a fatal error (common with "irm | iex").
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

    if ($proc.ExitCode -ne 0) {
        throw "git $($Args -join ' ') failed (exit $($proc.ExitCode))"
    }
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
        Write-Host "  Using existing source (package.json + install.ps1 OK)." -ForegroundColor DarkGray
        return
    }

    if (Test-Path (Join-Path $Dir "package.json")) {
        Write-Host "  Repairing broken install.ps1 (re-downloading source)..." -ForegroundColor DarkGray
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
