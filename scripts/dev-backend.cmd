@echo off
cd /d "%~dp0..\backend"
echo [dev-backend.cmd] Changed to directory: %CD%
echo [dev-backend.cmd] Running: npm run dev
call npm run dev
