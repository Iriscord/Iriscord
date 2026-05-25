@echo off
:: Wrapper .bat pour lancer luacord-uninstall.ps1 facilement (double-clic)
title Luacord — Désinstallation
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0luacord-uninstall.ps1"
if %errorlevel% neq 0 pause
