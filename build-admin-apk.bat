@echo off
title Build Private ShramiXs Admin APK
echo ========================================================
echo   BUILDING PRIVATE STANDALONE SHRAMIXS ADMIN APK
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Preparing Next.js static build for Admin Portal...
set NEXT_PUBLIC_IS_ADMIN_APP=true
call npm run build

echo.
echo [2/4] Syncing Capacitor Android Assets...
call npx cap sync android --config capacitor.admin.config.ts

echo.
echo [3/4] Compiling Native Android APK...
cd android
call gradlew.bat assembleDebug
cd ..

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "ShramiXs-Admin.apk"
    echo.
    echo ========================================================
    echo   SUCCESS! Private Admin APK generated:
    echo   File: %~dp0ShramiXs-Admin.apk
    echo ========================================================
) else (
    echo.
    echo [ERROR] Gradle build failed or APK not found.
)

pause
