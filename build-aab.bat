@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Hero Hand - Google Play Store AAB Bundle Builder
echo ===================================================
echo.

:: Detect Java JDK
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

echo [1/4] Syncing Customer App Capacitor...
call .\node_modules\.bin\cap.cmd sync android

echo [2/4] Compiling Customer App Google Play Bundle (.aab)...
cd /d "%~dp0android"
call gradlew.bat bundleRelease || call gradlew.bat bundleDebug
if %errorlevel% neq 0 (
    echo [ERROR] Customer AAB compilation failed!
    exit /b %errorlevel%
)

echo [3/4] Syncing Partner App Capacitor...
cd /d "%~dp0worker"
call .\node_modules\.bin\cap.cmd sync android

echo [4/4] Compiling Partner App Google Play Bundle (.aab)...
cd /d "%~dp0worker\android"
call gradlew.bat bundleRelease || call gradlew.bat bundleDebug
if %errorlevel% neq 0 (
    echo [ERROR] Partner AAB compilation failed!
    exit /b %errorlevel%
)

:: Copy AABs to top-level aab folder
cd /d "%~dp0"
if not exist "playstore_bundles" mkdir "playstore_bundles"

if exist "android\app\build\outputs\bundle\release\app-release.aab" (
    copy /Y "android\app\build\outputs\bundle\release\app-release.aab" "playstore_bundles\HeroHand-Customer.aab" >nul
) else if exist "android\app\build\outputs\bundle\debug\app-debug.aab" (
    copy /Y "android\app\build\outputs\bundle\debug\app-debug.aab" "playstore_bundles\HeroHand-Customer.aab" >nul
)

if exist "worker\android\app\build\outputs\bundle\release\app-release.aab" (
    copy /Y "worker\android\app\build\outputs\bundle\release\app-release.aab" "playstore_bundles\HeroHand-Partner.aab" >nul
) else if exist "worker\android\app\build\outputs\bundle\debug\app-debug.aab" (
    copy /Y "worker\android\app\build\outputs\bundle\debug\app-debug.aab" "playstore_bundles\HeroHand-Partner.aab" >nul
)

echo.
echo ===================================================
echo   AAB BUILD SUCCESSFUL! READY FOR PLAY STORE!
echo   Customer Play Store AAB: %~dp0playstore_bundles\HeroHand-Customer.aab
echo   Partner Play Store AAB:  %~dp0playstore_bundles\HeroHand-Partner.aab
echo ===================================================
