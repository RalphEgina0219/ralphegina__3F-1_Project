@echo off
rem Double-click: starts the LaundryFlow frontend at http://localhost:5173 (keep this window open).
rem The first time, run "npm install" in react-frontend. See docs\DOCKER.md.
cd /d "%~dp0..\.."
call npm run dev
pause
