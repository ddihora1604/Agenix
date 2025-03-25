@echo off
echo Starting Email Generator AI...

:: Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Check if virtual environment exists, if not create it
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Check if dependencies are installed
if not exist venv\Lib\site-packages\langchain (
    echo Installing dependencies...
    pip install -r requirements.txt
)

:: Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found.
    echo Please create a .env file with your Google API key for Gemini.
    echo You can rename .env.sample to .env and add your key.
    echo Get your API key from https://makersuite.google.com/app/apikey
    timeout /t 5
)

:: Run the email generator
python email_generator.py

:: Deactivate virtual environment
call venv\Scripts\deactivate.bat

pause