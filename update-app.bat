@echo off
title VpnG - React ^& Capacitor Auto Updater
color 0A
echo =======================================================
echo          VpnG Android App Builder ^& Sync Tool
echo =======================================================
echo.
echo [0/4] Checking for remote updates from GitHub...
echo [0/4] در حال بررسی و دریافت بروزرسانی‌ها از گیت‌هاب (git pull)...
echo.
call git pull

echo.
echo [1/4] Installing/Updating Node.js dependencies...
echo [1/4] در حال نصب و بروزرسانی پیشنیازها (npm install)...
echo.
call npm install

echo.
echo [2/4] Building the React Web Application...
echo [2/4] در حال بیلد کردن کدهای فرانت اند (npm run build)...
echo.
call npm run build

echo.
echo [3/4] Syncing files with Android Studio via Capacitor...
echo [3/4] در حال همگام سازی فایل ها با اندروید استودیو (Capacitor Sync)...
echo.

:: Check if capacitor config exists, if not, initialize it automatically
if not exist "capacitor.config.json" if not exist "capacitor.config.ts" (
    echo [+] Initializing Capacitor...
    echo [+] در حال آماده سازی اولیه کپسیتر...
    call npx cap init VpnG com.vpng.client --web-dir=dist
    call npm install @capacitor/android
    call npx cap add android
)

echo.
echo [+] Syncing web assets to Android project...
call npx cap sync

echo.
echo [+] Injecting and configuring native Android VPN files...
echo [+] در حال کپی و پیکربندی خودکار فایل‌های بومی اندروید...
call node setup-android.cjs

echo.
echo =======================================================
echo                 SUCCESS / عملیات با موفقیت انجام شد
echo =======================================================
echo.
echo [EN] Sync completed! You can now open Android Studio and run your app.
echo [FA] همگام سازی با موفقیت انجام شد!
echo      حالا می توانید دکمه Run (مثلث سبز) را در اندروید استودیو بزنید تا اپ آپدیت شده روی گوشی نصب شود.
echo.
pause
