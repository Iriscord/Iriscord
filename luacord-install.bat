@echo off
:: Wrapper .bat pour lancer luacord-install.ps1 facilement (double-clic)
title Luacord — Installation
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0luacord-install.ps1"
if %errorlevel% neq 0 pause
