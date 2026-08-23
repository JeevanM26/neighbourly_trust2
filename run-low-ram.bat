@echo off
title Neighborly Trust - Low RAM (4GB) Optimizer & Launcher
color 0A
cls
echo ===================================================================
echo     NEIGHBORLY TRUST - 4GB RAM SYSTEM LAUNCHER & OPTIMIZER
echo ===================================================================
echo [!] Memory optimization active: Node Heap capped at 1280MB.
echo.

set NODE_OPTIONS=--max-old-space-size=1280
set NEXT_TELEMETRY_DISABLED=1

echo Select an option:
echo  [1] Start Customer App Dev Server (Port 3000)
echo  [2] Start Worker App Dev Server (Port 3001)
echo  [3] Build Customer App Production Bundle (Static Export)
echo  [4] Build Worker App Production Bundle (Static Export)
echo  [5] Clean All Build Caches (.next) to free up RAM & Disk
echo  [6] Exit
echo.

set /p choice="Enter choice [1-6]: "

if "%choice%"=="1" (
    echo.
    echo Starting Customer App on http://localhost:3000 ...
    call npm run dev
    pause
    goto end
)

if "%choice%"=="2" (
    echo.
    echo Starting Worker App on http://localhost:3001 ...
    cd worker
    call npm run dev
    cd ..
    pause
    goto end
)

if "%choice%"=="3" (
    echo.
    echo Building Customer App (Static Export)...
    call npm run build
    pause
    goto end
)

if "%choice%"=="4" (
    echo.
    echo Building Worker App (Static Export)...
    cd worker
    call npm run build
    cd ..
    pause
    goto end
)

if "%choice%"=="5" (
    echo.
    echo Cleaning .next caches...
    if exist .next rd /s /q .next
    if exist worker\.next rd /s /q worker\.next
    echo Cache cleaned successfully!
    pause
    goto end
)

:end
echo Done.
