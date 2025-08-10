@echo off
REM Pollinations AI Image Generator Setup Script for Windows
echo Setting up Pollinations AI Image Generator...

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set VENV_DIR=%SCRIPT_DIR%venv

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in PATH. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

echo Using Python: python

REM Check Python version (simplified check)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo Python version: %PYTHON_VERSION%

REM Create virtual environment if it doesn't exist
if not exist "%VENV_DIR%" (
    echo Creating virtual environment...
    python -m venv "%VENV_DIR%"
    
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to create virtual environment.
        pause
        exit /b 1
    )
    
    echo Virtual environment created successfully.
) else (
    echo Virtual environment already exists.
)

REM Activate virtual environment
echo Activating virtual environment...
call "%VENV_DIR%\Scripts\activate.bat"

REM Upgrade pip
echo Upgrading pip...
pip install --upgrade pip

REM Install requirements
echo Installing Python dependencies...
if exist "%SCRIPT_DIR%requirements.txt" (
    pip install -r "%SCRIPT_DIR%requirements.txt"
) else (
    pip install requests>=2.25.1 fal_client python-dotenv
)

if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install dependencies.
    pause
    exit /b 1
)

REM Test the installation
echo Testing the installation...
python -c "import requests; print('✓ requests module imported successfully')"

if %ERRORLEVEL% EQU 0 (
    echo ✓ Setup completed successfully!
    echo.
    echo To use the virtual environment manually:
    echo   %VENV_DIR%\Scripts\activate.bat
    echo.
    echo To test the image generator:
    echo   python %SCRIPT_DIR%pollinations.py
) else (
    echo ✗ Setup failed. Please check the error messages above.
    pause
    exit /b 1
)

pause
