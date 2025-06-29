@echo off
echo ========================================
echo    AI Video Thuyet Minh - Demo Test
echo ========================================
echo.

REM Kiểm tra Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo Running demo test...
python demo.py

echo.
echo Press any key to exit...
pause >nul 