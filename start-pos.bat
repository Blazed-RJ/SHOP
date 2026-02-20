@echo off
echo ========================================
echo    Starting POS System Servers
echo ========================================
echo.

:: Start Backend Server
echo [1/2] Launching Backend Server (Port 5002)...
start cmd /k "cd /d d:\Software\Create\Shop\backend && title POS-Backend-Server && color 0A && npm run dev"

:: Wait a moment before starting frontend
timeout /t 2 /nobreak > nul

:: Start Frontend Server
echo [2/2] Launching Frontend Server (Port 3000)...
start cmd /k "cd /d d:\Software\Create\Shop\frontend && title POS-Frontend-Server && color 0B && npm run dev"

echo.
echo ========================================
echo    Both servers are starting!
echo ========================================
echo.
echo Backend: http://localhost:5002
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
