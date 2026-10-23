@echo off
setlocal enabledelayedexpansion
REM Launches the coinchapp dev server on localhost.
REM Always starts clean: kills any process already listening on port 3000,
REM wipes the Next.js build cache, then relaunches the dev server.
cd /d "%~dp0"

echo Killing any server already listening on port 3000...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo   - stopping PID %%P
    taskkill /F /PID %%P >nul 2>&1
)

echo Cleaning Next.js cache...
if exist ".next" rmdir /s /q ".next"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo Starting dev server at http://localhost:3000 ...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
call npm run dev
pause
