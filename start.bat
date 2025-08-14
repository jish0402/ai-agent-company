@echo off
echo Starting AI Agent Company...
echo.

echo Starting Backend Server...
cd backend
start cmd /k "python main.py"
cd ..

echo Waiting for backend to start...
timeout /t 5

echo Starting Frontend Server...
cd frontend
start cmd /k "npm run dev"
cd ..

echo.
echo Both servers are starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to continue...
pause