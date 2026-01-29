@echo off
echo ========================================
echo    Stopping POS System Servers
echo ========================================
echo.

:: Kill processes on port 5000 (Backend)
echo Stopping Backend Server (Port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /F /PID %%a > nul 2>&1
)

:: Kill processes on port 3000 (Frontend)
echo Stopping Frontend Server (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a > nul 2>&1
)

:: Also try port 5173 (alternative Vite port)
echo Checking Port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /F /PID %%a > nul 2>&1
)

echo.
echo ========================================
echo    All servers stopped!
echo ========================================
echo.
pause
