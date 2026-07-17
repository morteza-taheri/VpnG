@echo off
title VpnG - React ^& Capacitor Auto Updater
color 0A
echo =======================================================
echo          VpnG Android App Builder ^& Sync Tool
echo =======================================================
echo.
echo [0/4] Checking for remote updates from GitHub...
echo.
call git pull

echo.
echo [1/4] Installing/Updating Node.js dependencies...
echo.
call npm install

echo.
echo [2/4] Building the React Web Application...
echo.
call npm run build

echo.
echo [3/4] Syncing files with Android Studio via Capacitor...
echo.

:: Check if capacitor config exists, if not, initialize it automatically
if not exist "capacitor.config.json" if not exist "capacitor.config.ts" (
    echo [+] Initializing Capacitor...
    call npx @capacitor/cli init VpnG com.vpng.client --web-dir=dist
    call npm install @capacitor/android @capacitor/cli
    call npx @capacitor/cli android add
)

echo.
echo [+] Syncing web assets to Android project...
call npx @capacitor/cli sync

echo.
echo [+] Injecting and configuring native Android VPN files...
call node setup-android.cjs

echo.
echo =======================================================
echo                 SUCCESS
echo =======================================================
echo.
echo [EN] Sync completed! You can now open Android Studio and run your app.
echo.
pause
