#Requires -Version 5.1
<#
.SYNOPSIS
    Iriscord installer and manager for Discord (Windows).

.PARAMETER Uninstall
    Skip menu and uninstall immediately.

.PARAMETER Install
    Skip menu and install immediately.

.PARAMETER Repair
    Skip menu and repair the installation.

.PARAMETER SkipBuild
    Skip build step during install.

.PARAMETER Rebuild
    Force rebuild before install.

.PARAMETER NoKill
    Do not close Discord before patching.

.PARAMETER Launch
    Start Discord after install.

.PARAMETER Branch
    Discord branch: auto, stable, canary, or ptb.

.PARAMETER NoMenu
    Non-interactive; requires -Install, -Uninstall, or -Repair.

.PARAMETER Production
    Install to %AppData%\\Iriscord (not dev mode from repo). Used by the web bootstrap script.
#>

[CmdletBinding(DefaultParameterSetName = "Menu")]
param(
    [Parameter(ParameterSetName = "Direct")]
    [switch]$Install,
    [Parameter(ParameterSetName = "Direct")]
    [switch]$Uninstall,
    [Parameter(ParameterSetName = "Direct")]
    [switch]$Repair,
    [switch]$SkipBuild,
    [switch]$Rebuild,
    [switch]$NoKill,
    [switch]$Launch,
    [switch]$NoMenu,
    [switch]$Production,
    [ValidateSet("auto", "stable", "canary", "ptb", "")]
    [string]$Branch = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Brand palette ---
$Brand = @{
    Iris    = @(168, 85, 247)
    Glow    = @(192, 132, 252)
    Deep    = @(124, 58, 237)
    Accent  = @(232, 121, 249)
    Muted   = @(140, 140, 160)
    Success = @(87, 242, 135)
    Warning = @(250, 179, 135)
    Error   = @(237, 66, 69)
    Info    = @(88, 166, 255)
}

$RepoRoot = $PSScriptRoot

# Old bootstrap only copied install scripts (no package.json). Fetch full repo into Iriscord-Setup.
if (-not (Test-Path (Join-Path $RepoRoot "package.json"))) {
    $sourceDir = Join-Path $env:TEMP "Iriscord-Setup"
    $repo = if ($env:IRISCORD_GITHUB_REPO) { $env:IRISCORD_GITHUB_REPO } else { "Iriscord/Iriscord" }
    $branch = if ($env:IRISCORD_GITHUB_BRANCH) { $env:IRISCORD_GITHUB_BRANCH } else { "main" }
    $zipUrl = "https://github.com/$repo/archive/refs/heads/$branch.zip"

    if (-not (Test-Path (Join-Path $sourceDir "package.json"))) {
        Write-Host ""
        Write-Host "  No package.json here - downloading full Iriscord source..." -ForegroundColor DarkGray
        if (Test-Path $sourceDir) { Remove-Item -Path $sourceDir -Recurse -Force }
        if (Get-Command git -ErrorAction SilentlyContinue) {
            $parent = Split-Path $sourceDir -Parent
            if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
            $prevEap = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            try {
                $null = & git clone --depth 1 --branch $branch "https://github.com/$repo.git" $sourceDir 2>&1
            } finally {
                $ErrorActionPreference = $prevEap
            }
            if ($LASTEXITCODE -ne 0) { throw "git clone failed (exit $LASTEXITCODE)" }
        } else {
            $tempZip = Join-Path $env:TEMP "Iriscord-src-$branch.zip"
            $tempExtract = Join-Path $env:TEMP "Iriscord-src-extract"
            if (Test-Path $tempExtract) { Remove-Item -Path $tempExtract -Recurse -Force }
            Invoke-WebRequest -Uri $zipUrl -OutFile $tempZip -UseBasicParsing
            Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
            $extracted = Get-ChildItem -Path $tempExtract -Directory | Select-Object -First 1
            if (-not $extracted) { throw "Downloaded archive was empty" }
            $parent = Split-Path $sourceDir -Parent
            if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
            Move-Item -Path $extracted.FullName -Destination $sourceDir
            Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
            Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
        }
        if (-not (Test-Path (Join-Path $sourceDir "package.json"))) {
            throw "Failed to download source - package.json still missing in $sourceDir"
        }
    }

    $current = (Resolve-Path $RepoRoot -ErrorAction SilentlyContinue).Path
    $target = (Resolve-Path $sourceDir).Path
    if ($current -ne $target) {
        Write-Host "  Using source at $sourceDir" -ForegroundColor DarkGray
        Write-Host ""
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $sourceDir "install.ps1") -Production @args
        exit $LASTEXITCODE
    }
    $RepoRoot = $sourceDir
}

$Version = "1.0.0"
$pkgJson = Join-Path $RepoRoot "package.json"
if (Test-Path $pkgJson) {
    try { $Version = (Get-Content $pkgJson -Raw | ConvertFrom-Json).version } catch { }
}

$esc = [char]0x1B
$script:UseColor = $true
$script:MenuBranch = if ($Branch) { $Branch } else { "auto" }

$Sym = @{
    Rule   = [char]0x2500
    Bullet = [char]0x2022
    Step   = [char]0x25C6
    Ok     = [char]0x2714
    Cross  = [char]0x2716
    Run    = [char]0x26A1
    Patch  = [char]0x25B8
    Done   = [char]0x2728
    Branch = [char]0x2514
    Arrow  = [char]0x25B6
}

function Enable-VirtualTerminal {
    if ($env:WT_SESSION) { return }
    try {
        $sig = @'
using System;
using System.Runtime.InteropServices;
public static class VT {
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr GetStdHandle(int n);
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool GetConsoleMode(IntPtr h, out int mode);
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool SetConsoleMode(IntPtr h, int mode);
    public const int STD_OUTPUT_HANDLE = -11;
    public const int ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
}
'@
        Add-Type -TypeDefinition $sig -ErrorAction Stop | Out-Null
        $h = [VT]::GetStdHandle([VT]::STD_OUTPUT_HANDLE)
        $mode = 0
        [void][VT]::GetConsoleMode($h, [ref]$mode)
        [void][VT]::SetConsoleMode($h, $mode -bor [VT]::ENABLE_VIRTUAL_TERMINAL_PROCESSING)
    } catch { $script:UseColor = $false }
}

function Get-RgbEsc([int[]]$Rgb) {
    if (-not $script:UseColor) { return "" }
    "$esc[38;2;$($Rgb[0]);$($Rgb[1]);$($Rgb[2])m"
}

function Get-ResetEsc {
    if (-not $script:UseColor) { return "" }
    "$esc[0m"
}

function Write-RgbLine([string]$Text, [int[]]$Rgb) {
    Write-Host ("$(Get-RgbEsc $Rgb)$Text$(Get-ResetEsc)")
}

function Write-Rgb([string]$Text, [int[]]$Rgb, [switch]$NoNewline) {
    $s = "$(Get-RgbEsc $Rgb)$Text$(Get-ResetEsc)"
    if ($NoNewline) { Write-Host $s -NoNewline } else { Write-Host $s }
}

function Get-BannerLines {
    $bannerFile = Join-Path $RepoRoot "scripts\install-banner.txt"
    if (Test-Path $bannerFile) {
        return Get-Content -Path $bannerFile -Encoding UTF8
    }
    # Fallback if banner file missing (ASCII)
    return @(
        "  IRISCORD"
        ""
    )
}

function Write-Banner {
    $logo = @(Get-BannerLines)
    $n = $logo.Count
    for ($i = 0; $i -lt $n; $i++) {
        $t = $i / [Math]::Max(1, $n - 1)
        $r = [int]($Brand.Deep[0] + ($Brand.Accent[0] - $Brand.Deep[0]) * $t)
        $g = [int]($Brand.Deep[1] + ($Brand.Glow[1] - $Brand.Deep[1]) * $t)
        $b = [int]($Brand.Deep[2] + ($Brand.Iris[2] - $Brand.Deep[2]) * $t)
        Write-RgbLine $logo[$i] @($r, $g, $b)
    }
    Write-Host ""
    Write-Rgb "    A Discord Client Modification  v$Version" $Brand.Muted
    Write-Host ""
}

function Write-Rule([string]$Title = "") {
    $w = 54
    if ($Title) {
        $left = [Math]::Floor([Math]::Max(2, ($w - $Title.Length - 2) / 2))
        $right = $w - $Title.Length - $left - 2
        $line = ($Sym.Rule.ToString() * $left) + " $Title " + ($Sym.Rule.ToString() * $right)
    } else { $line = $Sym.Rule.ToString() * $w }
    Write-Rgb $line $Brand.Deep
}

function Write-Log {
    param(
        [ValidateSet("step", "ok", "info", "warn", "err", "run", "patch", "done")]
        [string]$Level = "info",
        [string]$Message,
        [string]$Detail = ""
    )
    $glyph = switch ($Level) {
        "step"  { $Sym.Step }; "ok" { $Sym.Ok }; "info" { $Sym.Bullet }
        "warn"  { "!" }; "err" { $Sym.Cross }; "run" { $Sym.Run }
        "patch" { $Sym.Patch }; "done" { $Sym.Done }; default { $Sym.Bullet }
    }
    $color = switch ($Level) {
        "step" { $Brand.Iris }; "ok" { $Brand.Success }; "info" { $Brand.Muted }
        "warn" { $Brand.Warning }; "err" { $Brand.Error }; "run" { $Brand.Warning }
        "patch" { $Brand.Info }; "done" { $Brand.Glow }; default { $Brand.Muted }
    }
    $pfx = if ($Level -in "patch", "info") { "  [$glyph]" } else { " $glyph " }
    Write-Rgb $pfx $color -NoNewline
    Write-Host " $Message" -NoNewline
    if ($Detail) { Write-Rgb "  $Detail" $Brand.Success } else { Write-Host "" }
}

function Write-MenuItem([string]$Key, [string]$Label, [string]$Hint = "") {
    Write-Rgb "  [$Key]" $Brand.Iris -NoNewline
    Write-Host " $Label" -NoNewline
    if ($Hint) { Write-Rgb "  $Hint" $Brand.Muted } else { Write-Host "" }
}

function Test-Command([string]$Name) {
    [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Set-IriscordEnv {
    param([switch]$UseProduction)
    if ($UseProduction -or $Production) {
        $data = Get-IriscordDataDir
        $env:IRISCORD_USER_DATA_DIR = $data
        Remove-Item Env:IRISCORD_DEV_INSTALL -ErrorAction SilentlyContinue
        Remove-Item Env:Iriscord_DEV_INSTALL -ErrorAction SilentlyContinue
        Remove-Item Env:Iriscord_USER_DATA_DIR -ErrorAction SilentlyContinue
        if (Test-Path (Join-Path $RepoRoot "dist\patcher.js")) {
            $env:IRISCORD_USE_LOCAL_DIST = "1"
            $env:IRISCORD_LOCAL_DIST = Join-Path $RepoRoot "dist"
        }
    } else {
        $env:IRISCORD_USER_DATA_DIR = $RepoRoot
        $env:IRISCORD_DEV_INSTALL = "1"
        $env:Iriscord_USER_DATA_DIR = $RepoRoot
        $env:Iriscord_DEV_INSTALL = "1"
        Remove-Item Env:IRISCORD_USE_LOCAL_DIST -ErrorAction SilentlyContinue
        Remove-Item Env:IRISCORD_LOCAL_DIST -ErrorAction SilentlyContinue
    }
}

function Get-IriscordDataDir {
    $base = $env:APPDATA
    $candidates = @(
        (Join-Path $base "Iriscord"),
        (Join-Path $base "Iriscord"),
        (Join-Path $base "IriscordData")
    )
    foreach ($d in $candidates) {
        if (Test-Path $d) { return $d }
    }
    return (Join-Path $base "Iriscord")
}

function Get-PluginLocations {
    $devPlugins = Join-Path $RepoRoot "src\userplugins"
    $dataDir = Get-IriscordDataDir
    $appPlugins = Join-Path $dataDir "userplugins"
    $devDataPlugins = Join-Path $dataDir "src\userplugins"
    return [PSCustomObject]@{
        Project = $devPlugins
        AppData = if (Test-Path $devDataPlugins) { $devDataPlugins } else { $appPlugins }
        DataDir = $dataDir
    }
}

function Get-InstalledPlugins([string]$Root) {
    if (-not (Test-Path $Root)) { return @() }
    $list = [System.Collections.Generic.List[object]]::new()
    Get-ChildItem -Path $Root -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $name = $_.Name
        if ($name.StartsWith(".") -or $name.StartsWith("_")) { return }
        $hasEntry = @("index.ts", "index.tsx") | Where-Object {
            Test-Path (Join-Path $_.FullName $_)
        }
        if ($hasEntry) {
            $list.Add([PSCustomObject]@{
                Name = $name
                Path = $_.FullName
            })
        }
    }
    return $list.ToArray()
}

function Open-Explorer([string]$Path) {
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
    Start-Process explorer.exe $Path
    Write-Log ok "Opened in Explorer" $Path
}

function Find-DiscordInstall {
    foreach ($c in @(
        @{ Name = "Discord"; Folder = "Discord" }
        @{ Name = "Discord Canary"; Folder = "DiscordCanary" }
        @{ Name = "Discord PTB"; Folder = "DiscordPTB" }
        @{ Name = "Discord Dev"; Folder = "discorddevelopment" }
    )) {
        $root = Join-Path $env:LOCALAPPDATA $c.Folder
        if (-not (Test-Path $root)) { continue }
        $apps = Get-ChildItem -Path $root -Filter "app-*" -Directory -EA SilentlyContinue |
            Sort-Object Name -Descending
        foreach ($app in $apps) {
            $resources = Join-Path $app.FullName "resources"
            if (-not (Test-Path $resources)) { continue }
            return [PSCustomObject]@{
                DisplayName = $c.Name
                Root = $root
                CorePath = $resources
                Patched = Test-Path (Join-Path $resources "_app.asar")
            }
        }
    }
    return $null
}

function Get-DiscordProcesses {
    Get-Process -EA SilentlyContinue | Where-Object {
        $_.Name -match '^(Discord|DiscordCanary|DiscordPTB|discord)$'
    }
}

function Stop-DiscordGracefully {
    $procs = @(Get-DiscordProcesses)
    if ($procs.Count -eq 0) { return $false }
    Write-Log run "Closing Discord processes..."
    foreach ($p in $procs) {
        try { $p.CloseMainWindow() | Out-Null } catch { }
    }
    Start-Sleep -Seconds 2
    foreach ($p in @(Get-DiscordProcesses)) {
        try { Stop-Process -Id $p.Id -Force -EA SilentlyContinue } catch { }
    }
    Start-Sleep -Milliseconds 600
    return $true
}

function Test-DevRepo {
    Test-Path (Join-Path $RepoRoot "package.json")
}

function Test-BuildArtifacts {
    foreach ($f in @("dist\patcher.js", "dist\renderer.js", "dist\iriscordDesktopRenderer.js")) {
        if (-not (Test-Path (Join-Path $RepoRoot $f))) { return $false }
    }
    return $true
}

function Ensure-PnpmDeps {
    if (-not (Test-DevRepo) -or (Test-Path (Join-Path $RepoRoot "node_modules"))) { return }
    if (-not (Test-Command "pnpm")) {
        if (Test-Command "corepack") { & corepack enable 2>$null }
    }
    if (-not (Test-Command "pnpm")) { throw "pnpm is not installed. Run: npm install -g pnpm" }
    Write-Log step "Installing dependencies..."
    Push-Location $RepoRoot
    try {
        & pnpm install
        if ($LASTEXITCODE -ne 0) { throw "pnpm install failed (exit $LASTEXITCODE)" }
        Write-Log ok "Dependencies installed"
    } finally { Pop-Location }
}

function Invoke-IriscordBuild {
    if (-not (Test-DevRepo)) {
        throw "No package.json in $RepoRoot. Re-run the bootstrap script or clone the repo."
    }
    Write-Log step "Building Iriscord..."
    if (-not (Test-Command "pnpm")) {
        if (Test-Command "corepack") { & corepack enable 2>$null }
    }
    if (-not (Test-Command "pnpm")) { throw "pnpm is not installed. Run: npm install -g pnpm" }
    Ensure-PnpmDeps
    Push-Location $RepoRoot
    try {
        $prev = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        & pnpm build 2>&1 | ForEach-Object {
            $line = "$_"
            if ($line -match "ERROR|error:|failed|ELIFECYCLE") { Write-Rgb "    $line" $Brand.Error }
            elseif ($line -match "Done in|dist\\") { Write-Rgb "    $line" $Brand.Muted }
            else { Write-Host "    $line" }
        }
        if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)" }
        $ErrorActionPreference = $prev
        Write-Log ok "Build completed"
    } finally { Pop-Location }
}

function Invoke-InstallerCli {
    param([string[]]$ExtraArgs)
    if (-not (Test-Command "node")) { throw "Node.js is not installed or not on PATH." }
    $runner = Join-Path $RepoRoot "scripts\installDiscord.mjs"
    if (-not (Test-Path $runner)) { throw "Missing scripts\installDiscord.mjs" }
    Set-IriscordEnv -UseProduction:$Production
    $args = @($runner) + $ExtraArgs
    Write-Log step "Patching Discord..."
    Push-Location $RepoRoot
    try {
        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        & node @args 2>&1 | ForEach-Object {
            $l = if ($_ -is [System.Management.Automation.ErrorRecord]) {
                "$($_.Exception.Message)".Trim()
            } else { "$_".Trim() }
            if ([string]::IsNullOrWhiteSpace($l)) { return }
            if ($l -match "Success!|Successfully|^OK") {
                Write-Log ok ($l -replace "^(INFO|OK)\s+", "")
            } elseif ($l -match "^INFO\s+") {
                $msg = $l -replace "^INFO\s+", ""
                if ($msg -match "Patching|patch|Unpatching|Downloading|Copied|Using") { Write-Log patch $msg }
                else { Write-Log info $msg }
            } elseif ($l -match "^FATAL|^ERROR") {
                Write-Log err ($l -replace "^(FATAL|ERROR)\s+", "")
            } elseif ($l -match "error|failed") {
                Write-Log err $l
            } else {
                Write-Rgb "    $l" $Brand.Muted
            }
        }
        $ErrorActionPreference = $prevEap
        if ($LASTEXITCODE -ne 0) { throw "Installer exited with code $LASTEXITCODE" }
    } finally { Pop-Location }
}

function Start-DiscordApp {
    $discord = Find-DiscordInstall
    if (-not $discord) {
        Write-Log warn "Could not locate Discord."
        return
    }
    $update = Join-Path $discord.Root "Update.exe"
    if (Test-Path $update) {
        Write-Log info "Launching Discord..."
        Start-Process $update -ArgumentList "--processStart", "Discord.exe" -EA SilentlyContinue
    } else { Write-Log warn "Update.exe not found." }
}

function Invoke-PreparePatch {
    if (-not (Test-Command "node")) { throw "Node.js required: https://nodejs.org/" }
    $running = @(Get-DiscordProcesses)
    if ($running.Count -gt 0) {
        Write-Log warn "Discord is running" "$($running.Count) process(es)"
        if (-not $NoKill) {
            Stop-DiscordGracefully | Out-Null
            Write-Log ok "Discord closed"
        } else {
            Write-Log warn "Close Discord manually or re-run without -NoKill"
        }
    } else {
        Write-Log ok "Discord is not running"
    }
}

function Invoke-InstallFlow {
    param([switch]$ForceRebuild, [switch]$DoLaunch)
    Write-Host ""
    Write-Rule "Install Iriscord"
    Write-Host ""
    Invoke-PreparePatch
    $needsBuild = -not (Test-BuildArtifacts)
    $wantBuild = $ForceRebuild -or $Rebuild -or ($needsBuild -and -not $SkipBuild)
    if ($wantBuild) {
        if (Test-DevRepo) {
            Invoke-IriscordBuild
            Write-Host ""
        } elseif ($Production) {
            Write-Log info "No local source - will fetch build from GitHub release"
        } else {
            throw "dist/ is missing and this folder is not a full Iriscord checkout (no package.json)."
        }
    } elseif ($needsBuild -and $SkipBuild) {
        Write-Log warn "dist/ incomplete - build recommended"
    } else {
        Write-Log ok "Using existing build" "dist/"
    }
    Invoke-InstallerCli -ExtraArgs @("--install", "-branch", $script:MenuBranch)
    Write-Host ""
    Write-Log done "[Iriscord] Successfully injected!"
    Write-Log info "Settings > Iriscord in Discord to configure plugins."
    if ($DoLaunch -or $Launch) { Start-DiscordApp }
    else { Write-Rgb "  $($Sym.Branch) Launch Discord when ready." $Brand.Muted }
}

function Invoke-UninstallFlow {
    Write-Host ""
    Write-Rule "Uninstall Iriscord"
    Write-Host ""
    Invoke-PreparePatch
    Invoke-InstallerCli -ExtraArgs @("--uninstall", "-branch", $script:MenuBranch)
    Write-Host ""
    Write-Log done "[Iriscord] Removed from Discord."
}

function Invoke-RepairFlow {
    Write-Host ""
    Write-Rule "Repair Iriscord"
    Write-Host ""
    Invoke-PreparePatch
    if (-not (Test-BuildArtifacts)) {
        if (Test-DevRepo) {
            Invoke-IriscordBuild
            Write-Host ""
        } elseif (-not $Production) {
            throw "dist/ is missing and this folder is not a full Iriscord checkout (no package.json)."
        } else {
            Write-Log info "No local source - will fetch build from GitHub release"
        }
    }
    Invoke-InstallerCli -ExtraArgs @("--repair", "-branch", $script:MenuBranch)
    Write-Host ""
    Write-Log done "[Iriscord] Repair finished."
}

function Show-StatusPanel {
    Write-Host ""
    Write-Rule "System status"
    Write-Host ""
    $nodeVer = (node -v 2>$null) -replace "^v", ""
    Write-Log ok "Node.js" $nodeVer
    Write-Log $(if (Test-Command "pnpm") { "ok" } else { "warn" }) "pnpm" $(if (Test-Command "pnpm") { "ready" } else { "not found" })
    Write-Log $(if (Test-BuildArtifacts) { "ok" } else { "warn" }) "Build" $(if (Test-BuildArtifacts) { "dist/ ready" } else { "needs pnpm build" })
    $d = Find-DiscordInstall
    if ($d) {
        $st = if ($d.Patched) { "patched" } else { "not patched" }
        Write-Log $(if ($d.Patched) { "ok" } else { "info" }) $d.DisplayName $st
    } else { Write-Log warn "Discord" "not found" }
    Write-Log info "Patch branch" $script:MenuBranch
    $loc = Get-PluginLocations
    $n = (Get-InstalledPlugins $loc.Project).Count + (Get-InstalledPlugins $loc.AppData).Count
    Write-Log info "User plugins" "~$n folder(s) with index.ts(x)"
    Write-Host ""
    Pause-ForMenu
}

function Show-BranchMenu {
    Write-Host ""
    Write-Rule "Discord branch"
    Write-Host ""
    Write-MenuItem "1" "auto" "detect install (recommended)"
    Write-MenuItem "2" "stable"
    Write-MenuItem "3" "canary"
    Write-MenuItem "4" "ptb"
    Write-MenuItem "0" "Back"
    Write-Host ""
    $c = Read-Host "  Choice"
    switch ($c) {
        "1" { $script:MenuBranch = "auto"; Write-Log ok "Branch set to auto" }
        "2" { $script:MenuBranch = "stable" }
        "3" { $script:MenuBranch = "canary" }
        "4" { $script:MenuBranch = "ptb" }
        "0" { return }
        default { Write-Log warn "Invalid choice" }
    }
    if ($c -in "2", "3", "4") { Write-Log ok "Branch set to $script:MenuBranch" }
    Pause-ForMenu
}

function Show-PluginsMenu {
    $loc = Get-PluginLocations
    while ($true) {
        Clear-Host
        Write-Banner
        Write-Rule "Manage plugins"
        Write-Host ""
        Write-Rgb "  Installed in project (src/userplugins):" $Brand.Muted
        $proj = Get-InstalledPlugins $loc.Project
        if ($proj.Count -eq 0) { Write-Rgb "    (none)" $Brand.Muted }
        else { $proj | ForEach-Object { Write-Rgb "    $($Sym.Bullet) $($_.Name)" $Brand.Glow } }
        Write-Host ""
        Write-Rgb "  Installed in AppData:" $Brand.Muted
        $app = Get-InstalledPlugins $loc.AppData
        if ($app.Count -eq 0) { Write-Rgb "    (none)" $Brand.Muted }
        else { $app | ForEach-Object { Write-Rgb "    $($Sym.Bullet) $($_.Name)" $Brand.Glow } }
        Write-Host ""
        Write-MenuItem "1" "Open project plugins folder" $loc.Project
        Write-MenuItem "2" "Open AppData plugins folder" $loc.AppData
        Write-MenuItem "3" "Create new plugin folder (project)"
        Write-MenuItem "4" "Rebuild after plugin changes" "pnpm build"
        Write-MenuItem "5" "View install guide" "README"
        Write-MenuItem "6" "Open Iriscord data folder" $loc.DataDir
        Write-MenuItem "0" "Back to main menu"
        Write-Host ""
        $c = Read-Host "  Choice"
        switch ($c) {
            "1" { Open-Explorer $loc.Project }
            "2" { Open-Explorer $loc.AppData }
            "3" {
                $name = Read-Host "  Plugin folder name (e.g. MyPlugin)"
                if ($name -match '^[A-Za-z][A-Za-z0-9_-]*$') {
                    $dir = Join-Path $loc.Project $name
                    New-Item -ItemType Directory -Path $dir -Force | Out-Null
                    $sample = Join-Path $dir "index.ts"
                    if (-not (Test-Path $sample)) {
                        @'
import definePlugin from "@utils/types";

export default definePlugin({
    name: "$name",
    description: "My Iriscord plugin",
    authors: [{ name: "You", id: 0n }],
});
'@.Replace('"$name"', "`"$name`"") | Set-Content -Path $sample -Encoding UTF8
                    }
                    Write-Log ok "Created plugin scaffold" $dir
                    Open-Explorer $dir
                } else { Write-Log warn "Invalid name - use letters, numbers, - _" }
                Pause-ForMenu
            }
            "4" {
                try { Invoke-IriscordBuild } catch { Write-Log err $_.Exception.Message }
                Pause-ForMenu
            }
            "5" {
                $readme = Join-Path $RepoRoot "src\userplugins\README.md"
                if (Test-Path $readme) { Start-Process $readme } else { Write-Log warn "README not found" }
                Pause-ForMenu
            }
            "6" { Open-Explorer $loc.DataDir; Pause-ForMenu }
            "0" { return }
            default { Write-Log warn "Invalid choice"; Pause-ForMenu }
        }
    }
}

function Show-DependenciesMenu {
    Write-Host ""
    Write-Rule "Dependencies"
    Write-Host ""
    if (-not (Test-DevRepo)) {
        Write-Log warn "This installer folder has no package.json."
        Write-Rgb "  Re-run the bootstrap one-liner, or clone the repo and run install.ps1 from there." $Brand.Muted
        Pause-ForMenu
        return
    }
    Write-Rgb "  Source: $RepoRoot" $Brand.Muted
    Write-Host ""
    Write-MenuItem "1" "pnpm install" "install node modules"
    Write-MenuItem "2" "pnpm build" "compile Iriscord"
    Write-MenuItem "0" "Back"
    Write-Host ""
    $c = Read-Host "  Choice"
    Push-Location $RepoRoot
    try {
        switch ($c) {
            "1" {
                if (-not (Test-Command "pnpm")) { throw "pnpm not found" }
                Write-Log step "Running pnpm install..."
                & pnpm install
                if ($LASTEXITCODE -ne 0) { throw "pnpm install failed (exit $LASTEXITCODE)" }
                Write-Log ok "pnpm install finished"
            }
            "2" { Invoke-IriscordBuild }
            "0" { return }
            default { Write-Log warn "Invalid choice"; return }
        }
    } catch { Write-Log err $_.Exception.Message }
    finally { Pop-Location }
    Pause-ForMenu
}

function Pause-ForMenu {
    Write-Host ""
    Write-Rgb "  Press Enter to continue..." $Brand.Muted
    [void](Read-Host)
}

function Show-MainMenu {
    while ($true) {
        Clear-Host
        Write-Banner
        Write-Rule "Main menu"
        Write-Host ""
        $d = Find-DiscordInstall
        $patchHint = if ($d -and $d.Patched) { "(patched)" } elseif ($d) { "(not patched)" } else { "" }
        Write-Rgb "  Discord: $(if ($d) { $d.DisplayName } else { 'not detected' }) $patchHint  |  Branch: $script:MenuBranch" $Brand.Muted
        Write-Host ""
        Write-MenuItem "1" "Install Iriscord" "inject into Discord"
        Write-MenuItem "2" "Uninstall Iriscord" "remove patch"
        Write-MenuItem "3" "Repair installation" "fix broken patch"
        Write-MenuItem "4" "Build Iriscord" "pnpm build"
        Write-MenuItem "5" "Manage installed plugins" "folders, list, scaffold"
        Write-MenuItem "6" "Launch Discord"
        Write-MenuItem "7" "Change Discord branch" "auto / stable / canary / ptb"
        Write-MenuItem "8" "System status"
        Write-MenuItem "9" "Dependencies" "pnpm install / build"
        Write-MenuItem "0" "Exit"
        Write-Host ""
        $choice = Read-Host "  Select an option"
        try {
            switch ($choice) {
                "1" {
                    Invoke-InstallFlow
                    Pause-ForMenu
                }
                "2" {
                    $confirm = Read-Host "  Uninstall Iriscord? (y/N)"
                    if ($confirm -match '^[yY]') {
                        Invoke-UninstallFlow
                    } else { Write-Log info "Cancelled" }
                    Pause-ForMenu
                }
                "3" {
                    Invoke-RepairFlow
                    Pause-ForMenu
                }
                "4" {
                    Invoke-IriscordBuild
                    Pause-ForMenu
                }
                "5" { Show-PluginsMenu }
                "6" {
                    Start-DiscordApp
                    Pause-ForMenu
                }
                "7" { Show-BranchMenu }
                "8" { Show-StatusPanel }
                "9" { Show-DependenciesMenu }
                "0" {
                    Write-Host ""
                    Write-Log done "Goodbye!"
                    return
                }
                default {
                    Write-Log warn "Invalid option - enter 0-9"
                    Start-Sleep -Seconds 1
                }
            }
        } catch {
            Write-Log err $_.Exception.Message
            Pause-ForMenu
        }
    }
}

function Invoke-DirectMode {
    Set-IriscordEnv -UseProduction:$Production
    Clear-Host
    Write-Banner
    if ($Install) { Invoke-InstallFlow -DoLaunch:($Launch) }
    elseif ($Uninstall) { Invoke-UninstallFlow }
    elseif ($Repair) { Invoke-RepairFlow }
    else { throw "Direct mode requires -Install, -Uninstall, or -Repair" }
    Write-Host ""
}

# --- Entry ---
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
    Enable-VirtualTerminal
    if ($Host.Name -eq "ConsoleHost") {
        try { $Host.UI.RawUI.WindowTitle = "Iriscord Installer" } catch { }
    }

    # Bootstrap sets IRISCORD_USER_DATA_DIR; treat as production when not in a dev checkout
    if (-not $Production -and $env:IRISCORD_USER_DATA_DIR -and -not $env:IRISCORD_DEV_INSTALL) {
        $appdataIriscord = Join-Path $env:APPDATA "Iriscord"
        if ((Resolve-Path $env:IRISCORD_USER_DATA_DIR -ErrorAction SilentlyContinue) -eq
            (Resolve-Path $appdataIriscord -ErrorAction SilentlyContinue)) {
            $Production = $true
        }
    }

    $direct = $Install -or $Uninstall -or $Repair -or $NoMenu
    if ($direct) {
        Invoke-DirectMode
    } else {
        Show-MainMenu
    }
} catch {
    Write-Host ""
    Write-Log err $_.Exception.Message
    Write-Host ""
    exit 1
}
