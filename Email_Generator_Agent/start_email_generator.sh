#!/bin/bash

echo "Starting Email Generator AI..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed."
    echo "Please install Python 3.8 or higher from https://www.python.org/downloads/ or use your package manager."
    exit 1
fi

# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Check if dependencies are installed
if [ ! -d "venv/lib/python3.*/site-packages/langchain" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found."
    echo "Please create a .env file with your Google API key for Gemini."
    echo "You can rename .env.sample to .env and add your key."
    echo "Get your API key from https://makersuite.google.com/app/apikey"
    sleep 5
fi

# Run the email generator
python email_generator.py

# Deactivate virtual environment
deactivate

read -p "Press Enter to exit..." 