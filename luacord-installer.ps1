# Luacord Installer v1.0.0
# A Discord Client Modification

$Host.UI.RawUI.WindowTitle = "Luacord Installer"
$ErrorActionPreference = "Continue"

# Colors
function Write-Title {
    param([string]$Text)
    Write-Host $Text -ForegroundColor Magenta
}

function Write-Info {
    param([string]$Text)
    Write-Host $Text -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host $Text -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Text)
    Write-Host $Text -ForegroundColor Red
}

function Write-WarningMsg {
    param([string]$Text)
    Write-Host $Text -ForegroundColor Yellow
}

# ASCII Art Banner
function Show-Banner {
    Clear-Host
    Write-Title @"
    
    ██╗     ██╗   ██╗ █████╗  ██████╗ ██████╗ ██████╗ ██████╗ 
    ██║     ██║   ██║██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔══██╗
    ██║     ██║   ██║███████║██║     ██║   ██║██████╔╝██║  ██║
    ██║     ██║   ██║██╔══██║██║     ██║   ██║██╔══██╗██║  ██║
    ███████╗╚██████╔╝██║  ██║╚██████╗╚██████╔╝██║  ██║██████╔╝
    ╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ 
    
"@
    Write-Info "    A Discord Client Modification - v1.0.0"
    Write-Info "    Created by luanaticc"
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
}

# Check if Discord is running
function Test-DiscordRunning {
    $discordProcesses = Get-Process -Name "Discord" -ErrorAction SilentlyContinue
    return $discordProcesses.Count -gt 0
}

# Get Discord installation path
function Get-DiscordPath {
    $localAppData = $env:LOCALAPPDATA
    $discordPath = Join-Path $localAppData "Discord"
    
    if (Test-Path $discordPath) {
        return $discordPath
    }
    
    return $null
}

# Check Discord installation status
function Get-DiscordStatus {
    $discordPath = Get-DiscordPath
    
    if (-not $discordPath) {
        return "not_installed"
    }
    
    # Check if Luacord is already installed
    $appDirs = Get-ChildItem -Path $discordPath -Filter "app-*" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
    
    foreach ($appDir in $appDirs) {
        $resourcesPath = Join-Path $appDir.FullName "resources"
        $luacordMarker = Join-Path $resourcesPath ".luacord"
        
        if (Test-Path $luacordMarker) {
            return "patched"
        }
    }
    
    return "not_patched"
}

# Install Luacord
function Install-Luacord {
    Write-Info "[1/5] Checking Discord installation..."
    
    $discordPath = Get-DiscordPath
    if (-not $discordPath) {
        Write-ErrorMsg "Discord is not installed!"
        Write-WarningMsg "Please install Discord from https://discord.com/download"
        return $false
    }
    
    Write-Success "✓ Discord found at: $discordPath"
    Write-Host ""
    
    Write-Info "[2/5] Checking if Discord is running..."
    if (Test-DiscordRunning) {
        Write-WarningMsg "Discord is currently running!"
        Write-WarningMsg "Please close Discord completely before continuing."
        Write-Host ""
        Write-Host "Press any key to retry or Ctrl+C to cancel..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return Install-Luacord
    }
    
    Write-Success "✓ Discord is not running"
    Write-Host ""
    
    Write-Info "[3/5] Installing dependencies..."
    try {
        & pnpm install 2>&1 | Out-Null
        Write-Success "✓ Dependencies installed"
    } catch {
        Write-ErrorMsg "Failed to install dependencies: $_"
        return $false
    }
    Write-Host ""
    
    Write-Info "[4/5] Building Luacord..."
    try {
        & pnpm build 2>&1 | Out-Null
        Write-Success "✓ Luacord built successfully"
    } catch {
        Write-ErrorMsg "Failed to build Luacord: $_"
        return $false
    }
    Write-Host ""
    
    Write-Info "[5/5] Injecting into Discord..."
    try {
        & pnpm inject 2>&1 | Out-Null
        Write-Success "✓ Luacord injected successfully!"
    } catch {
        Write-ErrorMsg "Failed to inject Luacord: $_"
        return $false
    }
    Write-Host ""
    
    Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Success "✓ Luacord has been installed successfully!"
    Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    Write-Info "You can now launch Discord to use Luacord."
    Write-Host ""
    
    return $true
}

# Uninstall Luacord
function Uninstall-Luacord {
    Write-Info "[1/3] Checking Discord installation..."
    
    $discordPath = Get-DiscordPath
    if (-not $discordPath) {
        Write-ErrorMsg "Discord is not installed!"
        return $false
    }
    
    Write-Success "✓ Discord found"
    Write-Host ""
    
    Write-Info "[2/3] Checking if Discord is running..."
    if (Test-DiscordRunning) {
        Write-WarningMsg "Discord is currently running!"
        Write-WarningMsg "Please close Discord completely before continuing."
        Write-Host ""
        Write-Host "Press any key to retry or Ctrl+C to cancel..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return Uninstall-Luacord
    }
    
    Write-Success "✓ Discord is not running"
    Write-Host ""
    
    Write-Info "[3/3] Removing Luacord..."
    try {
        & pnpm uninject 2>&1 | Out-Null
        Write-Success "✓ Luacord removed successfully!"
    } catch {
        Write-ErrorMsg "Failed to remove Luacord: $_"
        return $false
    }
    Write-Host ""
    
    Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Success "✓ Luacord has been uninstalled successfully!"
    Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    
    return $true
}

# Build Luacord
function Build-Luacord {
    Write-Info "[1/2] Installing dependencies..."
    try {
        & pnpm install 2>&1 | Out-Null
        Write-Success "✓ Dependencies installed"
    } catch {
        Write-ErrorMsg "Failed to install dependencies: $_"
        return $false
    }
    Write-Host ""
    
    Write-Info "[2/2] Building Luacord..."
    try {
        & pnpm build 2>&1 | Out-Null
        Write-Success "✓ Luacord built successfully!"
    } catch {
        Write-ErrorMsg "Failed to build Luacord: $_"
        return $false
    }
    Write-Host ""
    
    Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Success "✓ Build completed!"
    Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    
    return $true
}

# Launch Discord
function Start-Discord {
    Write-Info "Launching Discord..."
    
    $discordPath = Get-DiscordPath
    if (-not $discordPath) {
        Write-ErrorMsg "Discord is not installed!"
        return
    }
    
    $updateExe = Join-Path $discordPath "Update.exe"
    if (Test-Path $updateExe) {
        Start-Process -FilePath $updateExe -ArgumentList "--processStart Discord.exe"
        Write-Success "✓ Discord launched!"
    } else {
        Write-ErrorMsg "Could not find Discord executable!"
    }
}

# Show system status
function Show-Status {
    Write-Info "System Status:"
    Write-Host ""
    
    # Check Node.js
    try {
        $nodeVersion = & node --version 2>$null
        Write-Success "✓ Node.js: $nodeVersion"
    } catch {
        Write-ErrorMsg "✗ Node.js: Not installed"
    }
    
    # Check pnpm
    try {
        $pnpmVersion = & pnpm --version 2>$null
        Write-Success "✓ pnpm: v$pnpmVersion"
    } catch {
        Write-ErrorMsg "✗ pnpm: Not installed"
    }
    
    # Check Discord
    $discordPath = Get-DiscordPath
    if ($discordPath) {
        $status = Get-DiscordStatus
        if ($status -eq "patched") {
            Write-Success "✓ Discord: Installed (Luacord patched)"
        } else {
            Write-WarningMsg "⚠ Discord: Installed (not patched)"
        }
    } else {
        Write-ErrorMsg "✗ Discord: Not installed"
    }
    
    # Check if Discord is running
    if (Test-DiscordRunning) {
        Write-WarningMsg "⚠ Discord is currently running"
    } else {
        Write-Info "○ Discord is not running"
    }
    
    Write-Host ""
}

# Main menu
function Show-Menu {
    Show-Banner
    
    $status = Get-DiscordStatus
    
    if ($status -eq "not_installed") {
        Write-WarningMsg "Discord: Not installed"
    } elseif ($status -eq "patched") {
        Write-Success "Discord: Luacord is installed ✓"
    } else {
        Write-Info "Discord: Not patched"
    }
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━ Main Menu ━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [1] Install Luacord    " -NoNewline -ForegroundColor Cyan
    Write-Host "inject into Discord" -ForegroundColor DarkGray
    Write-Host "  [2] Uninstall Luacord  " -NoNewline -ForegroundColor Cyan
    Write-Host "remove patch" -ForegroundColor DarkGray
    Write-Host "  [3] Build Luacord      " -NoNewline -ForegroundColor Cyan
    Write-Host "pnpm build" -ForegroundColor DarkGray
    Write-Host "  [4] Launch Discord     " -NoNewline -ForegroundColor Cyan
    Write-Host "start Discord" -ForegroundColor DarkGray
    Write-Host "  [5] System Status      " -NoNewline -ForegroundColor Cyan
    Write-Host "check installation" -ForegroundColor DarkGray
    Write-Host "  [0] Exit" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Select an option: " -NoNewline -ForegroundColor Yellow
}

# Main loop
while ($true) {
    Show-Menu
    $choice = Read-Host
    Write-Host ""
    
    switch ($choice) {
        "1" {
            if (Install-Luacord) {
                Write-Host "Press any key to continue..."
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            } else {
                Write-Host "Press any key to continue..."
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            }
        }
        "2" {
            if (Uninstall-Luacord) {
                Write-Host "Press any key to continue..."
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            } else {
                Write-Host "Press any key to continue..."
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            }
        }
        "3" {
            if (Build-Luacord) {
                Write-Host "Press any key to continue..."
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            } else {
                Write-Host "Press any key to continue..."
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            }
        }
        "4" {
            Start-Discord
            Write-Host ""
            Write-Host "Press any key to continue..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "5" {
            Show-Status
            Write-Host "Press any key to continue..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "0" {
            Write-Host ""
            Write-Success "Thanks for using Luacord!"
            Write-Info "Join our Discord: https://discord.gg/pE3xn59aZC"
            Write-Host ""
            exit
        }
        default {
            Write-WarningMsg "Invalid option. Please try again."
            Start-Sleep -Seconds 1
        }
    }
}
