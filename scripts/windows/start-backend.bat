@echo off
rem Double-click: builds (if needed) and starts the LaundryFlow backend in Docker.
rem Docker Desktop must be running. See docs\DOCKER.md.
cd /d "%~dp0..\.."
call npm run backend:up
echo.
pause
