@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo Email Generator - Setup and Run
echo ===================================================

:: Check if Python is installed
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

:: Set the directory to the script location
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: Check for argument - prompt file
set "PROMPT_FILE=%~1"

:: Run setup to ensure dependencies are installed
echo Installing dependencies...
python setup.py
if %errorlevel% neq 0 (
    echo Error installing dependencies
    echo Trying to continue anyway...
)

:: Run the email generator
if not "%PROMPT_FILE%"=="" (
    echo Running email generator with prompt file: %PROMPT_FILE%
    python email_generator.py "%PROMPT_FILE%"
) else (
    echo Running email generator in interactive mode...
    python email_generator.py
)

if %errorlevel% neq 0 (
    echo Error running email generator. Error code: %errorlevel%
    pause
    exit /b %errorlevel%
)

echo Email generator completed successfully
exit /b 0 