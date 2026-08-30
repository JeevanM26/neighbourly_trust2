@echo off
title Hands of ShramiXs — Admin Cockpit (Port 3009)
echo ========================================================
echo   STARTING SHRAMIXS ADMIN COCKPIT ON PORT 3009
echo ========================================================
echo.
cd /d "%~dp0admin"
echo [1/1] Launching Admin Next.js Server on http://localhost:3009 ...
call npm run dev
pause
