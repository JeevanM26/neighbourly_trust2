@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Neighborly Trust - Automated Android APK Builder
echo ===================================================
echo.

:: Detect Java JDK (Microsoft OpenJDK 17 or fallback)
if exist "C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot" (
    set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
) else if exist "C:\Program Files\JetBrains\PyCharm 2025.1.2\jbr" (
    set "JAVA_HOME=C:\Program Files\JetBrains\PyCharm 2025.1.2\jbr"
) else if exist "%LOCALAPPDATA%\Programs\Microsoft\jdk-17.0.19.10-hotspot" (
    set "JAVA_HOME=%LOCALAPPDATA%\Programs\Microsoft\jdk-17.0.19.10-hotspot"
)
if not defined ANDROID_HOME (
    set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
)

set CAPACITOR_TELEMETRY=0

echo [1/6] Building Customer App Static Assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Customer Next.js build failed!
    exit /b %errorlevel%
)

echo [2/6] Syncing Customer App Capacitor...
call .\node_modules\.bin\cap.cmd sync android
if %errorlevel% neq 0 (
    echo [ERROR] Customer Capacitor sync failed!
    exit /b %errorlevel%
)

echo [3/6] Compiling Customer App APK (Android 34)...
cd /d "%~dp0android"
call gradlew.bat assembleDebug --no-daemon --max-workers=1
if %errorlevel% neq 0 (
    echo [ERROR] Customer APK compilation failed!
    exit /b %errorlevel%
)

echo [4/6] Building Worker App Static Assets...
cd /d "%~dp0worker"
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Worker Next.js build failed!
    exit /b %errorlevel%
)

echo [5/6] Syncing Worker App Capacitor...
call .\node_modules\.bin\cap.cmd sync android
if %errorlevel% neq 0 (
    echo [ERROR] Worker Capacitor sync failed!
    exit /b %errorlevel%
)

echo [6/6] Compiling Worker App APK (Android 34)...
cd /d "%~dp0worker\android"
call gradlew.bat assembleDebug --no-daemon --max-workers=1
if %errorlevel% neq 0 (
    echo [ERROR] Worker APK compilation failed!
    exit /b %errorlevel%
)

:: Copy APKs to top-level apks folder for easy access
cd /d "%~dp0"
if not exist "apks" mkdir "apks"
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "apks\HeroHand-Customer.apk" >nul
copy /Y "worker\android\app\build\outputs\apk\debug\app-debug.apk" "apks\HeroHand-Partner.apk" >nul

echo.
echo ===================================================
echo   BUILD SUCCESSFUL!
echo   Customer APK: %~dp0apks\HeroHand-Customer.apk
echo   Partner APK:  %~dp0apks\HeroHand-Partner.apk
echo ===================================================
