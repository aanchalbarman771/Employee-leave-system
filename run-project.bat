@echo off
title Employee Leave Management System Launcher
echo ========================================================
echo   Starting Employee Leave Management System
echo ========================================================
echo.
echo [1/2] Starting Backend Server (Port 5000)...
start "Backend Server (Port 5000)" cmd /k "cd backend && npm start"

timeout /t 2 >nul

echo [2/2] Starting Frontend React App (Port 3000)...
start "Frontend React App (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   Both Servers Started Successfully!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo ========================================================
pause

