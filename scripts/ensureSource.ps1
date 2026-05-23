#Requires -Version 5.1
# Shared: download full Iriscord source (git clone or zip).

$script:IriscordRepo = if ($env:IRISCORD_GITHUB_REPO) { $env:IRISCORD_GITHUB_REPO } else { "Iriscord/Iriscord" }
$script:IriscordBranch = if ($env:IRISCORD_GITHUB_BRANCH) { $env:IRISCORD_GITHUB_BRANCH } else { "main" }

function Test-IriscordSourceReady([string]$Dir) {
    Test-Path (Join-Path $Dir "package.json")
}

function Update-IriscordGitSource([string]$Dir) {
    Push-Location $Dir
    try {
        Write-Host "  Updating Iriscord source..." -ForegroundColor DarkGray
        & git fetch origin $script:IriscordBranch 2>&1 | Out-Null
        & git reset --hard "origin/$script:IriscordBranch" 2>&1 | Out-Null
    } finally { Pop-Location }
}

function Install-IriscordGitSource([string]$Dir) {
    if (Test-Path $Dir) { Remove-Item -Path $Dir -Recurse -Force }
    $parent = Split-Path $Dir -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    $url = "https://github.com/$script:IriscordRepo.git"
    Write-Host "  Cloning Iriscord from GitHub..." -ForegroundColor DarkGray
    & git clone --depth 1 --branch $script:IriscordBranch $url $Dir
    if ($LASTEXITCODE -ne 0) { throw "git clone failed (exit $LASTEXITCODE)" }
}

function Install-IriscordZipSource([string]$Dir) {
    $zipUrl = "https://github.com/$script:IriscordRepo/archive/refs/heads/$script:IriscordBranch.zip"
    $tempZip = Join-Path $env:TEMP "Iriscord-src-$($script:IriscordBranch).zip"
    $tempExtract = Join-Path $env:TEMP "Iriscord-src-extract"
    if (Test-Path $tempExtract) { Remove-Item -Path $tempExtract -Recurse -Force }
    if (Test-Path $Dir) { Remove-Item -Path $Dir -Recurse -Force }

    Write-Host "  Downloading Iriscord source archive..." -ForegroundColor DarkGray
    Invoke-WebRequest -Uri $zipUrl -OutFile $tempZip -UseBasicParsing
    Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force

    $extracted = Get-ChildItem -Path $tempExtract -Directory | Select-Object -First 1
    if (-not $extracted) { throw "Downloaded archive was empty" }

    $parent = Split-Path $Dir -Parent
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Move-Item -Path $extracted.FullName -Destination $Dir

    Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
}

function Ensure-IriscordSource {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Dir
    )

    if (Test-IriscordSourceReady $Dir) {
        $gitDir = Join-Path $Dir ".git"
        if ((Test-Path $gitDir) -and (Get-Command git -ErrorAction SilentlyContinue)) {
            Update-IriscordGitSource $Dir
        }
        return $Dir
    }

    if (Get-Command git -ErrorAction SilentlyContinue) {
        Install-IriscordGitSource $Dir
    } else {
        Install-IriscordZipSource $Dir
    }

    if (-not (Test-IriscordSourceReady $Dir)) {
        throw "Source install failed: package.json not found in $Dir"
    }
    return $Dir
}
