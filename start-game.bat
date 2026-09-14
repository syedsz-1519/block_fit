@echo off
REM Block Fit Game Launcher
REM This batch file bypasses PowerShell execution policy issues

echo.
echo ========================================
echo   BLOCK FIT GAME LAUNCHER
echo ========================================
echo.

cd /d "c:\Users\admin\Desktop\block\block_fit"

echo Installing dependencies...
call npm install

if errorlevel 1 (
    echo.
    echo ERROR: npm install failed!
    echo Make sure Node.js and npm are installed.
    pause
    exit /b 1
)

echo.
echo Starting dev server...
echo.
call npm run dev

if errorlevel 1 (
    echo.
    echo ERROR: npm run dev failed!
    pause
    exit /b 1
)

pause
