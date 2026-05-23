@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
set ERR=%ERRORLEVEL%
if %ERR% neq 0 (
    echo.
    echo Install failed with exit code %ERR%.
    pause
    exit /b %ERR%
)
if /i "%~1"=="" (
    rem Menu mode: install.ps1 already waits for Enter between steps
)
exit /b 0
