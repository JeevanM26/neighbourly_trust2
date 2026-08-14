@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Neighborly Trust - Automated Android APK Builder
echo ===================================================
echo.

:: Detect Java JDK (PyCharm JBR or default JAVA_HOME)
if exist "C:\Program Files\JetBrains\PyCharm 2025.1.2\jbr" (
    set "JAVA_HOME=C:\Program Files\JetBrains\PyCharm 2025.1.2\jbr"
)
if not defined ANDROID_HOME (
    set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
)

echo [1/6] Building Customer App Static Assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Customer Next.js build failed!
    exit /b %errorlevel%
)

echo [2/6] Syncing Customer App Capacitor...
call npx cap sync android

echo [3/6] Compiling Customer App APK (Android 34)...
cd /d "%~dp0android"
call gradlew.bat assembleDebug
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
call npx cap sync android

echo [6/6] Compiling Worker App APK (Android 34)...
cd /d "%~dp0worker\android"
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo [ERROR] Worker APK compilation failed!
    exit /b %errorlevel%
)

:: Copy APKs to top-level apks folder for easy access
cd /d "%~dp0"
if not exist "apks" mkdir "apks"
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "apks\Neighborly-Customer.apk" >nul
copy /Y "worker\android\app\build\outputs\apk\debug\app-debug.apk" "apks\Neighborly-Worker.apk" >nul

echo.
echo ===================================================
echo   BUILD SUCCESSFUL!
echo   Customer APK: %~dp0apks\Neighborly-Customer.apk
echo   Worker APK:   %~dp0apks\Neighborly-Worker.apk
echo ===================================================
