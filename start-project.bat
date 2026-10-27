@echo off
title Scholarship Eligibility Portal Launcher
echo ============================================================
echo   Starting Scholarship Eligibility Portal (College Project)
echo ============================================================
echo.

echo [1/2] Starting Express.js Backend Server (Port 5000)...
start "Scholarship Backend Server (Port 5000)" cmd /k "cd /d %~dp0backend && node app.js"

echo [2/2] Starting Angular Frontend Server (Port 4200)...
start "Scholarship Frontend Server (Port 4200)" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ============================================================
echo   Both servers are starting in separate windows!
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:4200
echo ============================================================
echo.
echo Waiting 5 seconds for servers to initialize before opening browser...
timeout /t 5 /nobreak >nul

echo Opening browser at http://localhost:4200...
start http://localhost:4200

echo Done! Keep the backend and frontend terminal windows open.
pause

