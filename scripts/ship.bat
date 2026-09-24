@echo off
REM Commit and push. Pass the message as the remaining arguments.
REM   scripts\ship.bat fix(president): why this change
if "%~1"=="" (
  echo Usage: scripts\ship.bat ^<commit message^>
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ship.ps1" -Message "%*"
exit /b %ERRORLEVEL%
