@echo off
echo ========================================
echo    AI Video Thuyet Minh Streamlit App
echo ========================================
echo.

REM Kiểm tra xem Python có được cài đặt không
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo Python version:
python --version

REM Kiểm tra FFmpeg
echo.
echo Checking FFmpeg...
python check_ffmpeg.py
if errorlevel 1 (
    echo.
    echo ERROR: FFmpeg is required but not properly installed
    echo Please follow the instructions above to install FFmpeg
    pause
    exit /b 1
)

REM Kiểm tra xem có file requirements không
if not exist "requirements_streamlit.txt" (
    echo ERROR: requirements_streamlit.txt not found
    pause
    exit /b 1
)

REM Cài đặt dependencies nếu cần
echo.
echo Installing dependencies...
pip install -r requirements_streamlit.txt

REM Chạy Streamlit app
echo.
echo ========================================
echo Starting Streamlit app...
echo The app will open in your browser at:
echo http://localhost:8501
echo.
echo Press Ctrl+C to stop the app
echo ========================================
echo.

streamlit run streamlit_app.py --server.port 8501 --server.address localhost

pause 