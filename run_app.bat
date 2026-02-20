@echo off
set "PATH=%PATH%;C:\Program Files\nodejs"
echo Starting Backend Server...
start "Backend Server" cmd /c "cd backend && npm run dev"

echo Starting Frontend Dev Server...
start "Frontend Dev Server" cmd /c "cd frontend && npm run dev"

echo Both servers started!
pause
