# Shared pnpm helpers for bootstrap.ps1 and install.ps1
#Requires -Version 5.1

function Test-IriscordSourceNeedsPnpmRepair {
    param([Parameter(Mandatory = $true)][string]$Dir)
    $pkg = Join-Path $Dir "package.json"
    if (-not (Test-Path $pkg)) { return $true }
    if (-not (Test-Path (Join-Path $Dir "pnpm-workspace.yaml"))) { return $true }
    return (Get-Content $pkg -Raw) -match '"pnpm"\s*:'
}

function Repair-IriscordPnpmConfig {
    param([Parameter(Mandatory = $true)][string]$Dir)
    $repo = if ($env:IRISCORD_GITHUB_REPO) { $env:IRISCORD_GITHUB_REPO } else { "Iriscord/Iriscord" }
    $branch = if ($env:IRISCORD_GITHUB_BRANCH) { $env:IRISCORD_GITHUB_BRANCH } else { "main" }
    $wsPath = Join-Path $Dir "pnpm-workspace.yaml"

    if (-not (Test-Path $wsPath)) {
        $url = "https://raw.githubusercontent.com/$repo/$branch/pnpm-workspace.yaml"
        Write-Host "  Fetching pnpm-workspace.yaml..." -ForegroundColor DarkGray
        Invoke-WebRequest -Uri $url -OutFile $wsPath -UseBasicParsing
    }

    $repair = Join-Path $Dir "scripts\repair-pnpm-config.mjs"
    if (Test-Path $repair) {
        & node $repair $Dir 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
        if ($LASTEXITCODE -ne 0) { throw "repair-pnpm-config.mjs failed (exit $LASTEXITCODE)" }
    }
}

function Invoke-IriscordPnpmInstall {
    param([Parameter(Mandatory = $true)][string]$Dir)
    Repair-IriscordPnpmConfig -Dir $Dir
    Push-Location $Dir
    try {
        & pnpm install 2>&1 | ForEach-Object {
            $line = "$_"
            if ($line -match 'The "pnpm" field in package\.json') { return }
            Write-Host "    $line"
        }
        if ($LASTEXITCODE -ne 0) { throw "pnpm install failed (exit $LASTEXITCODE)" }
    } finally { Pop-Location }
}
