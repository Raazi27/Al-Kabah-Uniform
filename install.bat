@echo off
set "PATH=%PATH%;C:\Program Files\nodejs"
echo Check for Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo Recommended: Open PowerShell as Admin and run: winget install OpenJS.NodeJS.LTS
    pause
    exit /b
)

echo Node.js found. Installing Backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b
)

echo Installing Frontend dependencies...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies.
    pause
    exit /b
)

echo All dependencies installed successfully!
echo You can now run the app using 'run_app.bat'
pause