#!/bin/bash

# Pollinations AI Image Generator Setup Script
echo "Setting up Pollinations AI Image Generator..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "Error: Python is not installed. Please install Python 3.8 or higher."
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

echo "Using Python: $PYTHON_CMD"

# Check Python version
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "Error: Python $PYTHON_VERSION is installed, but Python $REQUIRED_VERSION or higher is required."
    exit 1
fi

echo "Python version check passed: $PYTHON_VERSION"

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv "$VENV_DIR"
    
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment. Make sure python3-venv is installed."
        echo "On Ubuntu/Debian: sudo apt install python3-venv"
        echo "On CentOS/RHEL: sudo yum install python3-venv"
        exit 1
    fi
    
    echo "Virtual environment created successfully."
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing Python dependencies..."
if [ -f "$SCRIPT_DIR/requirements.txt" ]; then
    pip install -r "$SCRIPT_DIR/requirements.txt"
else
    pip install requests>=2.25.1 fal_client python-dotenv
fi

if [ $? -eq 0 ]; then
    echo "Dependencies installed successfully!"
else
    echo "Error: Failed to install dependencies."
    exit 1
fi

# Test the installation
echo "Testing the installation..."
python -c "import requests; print('✓ requests module imported successfully')"

if [ $? -eq 0 ]; then
    echo "✓ Setup completed successfully!"
    echo ""
    echo "To use the virtual environment manually:"
    echo "  source $VENV_DIR/bin/activate"
    echo ""
    echo "To test the image generator:"
    echo "  python $SCRIPT_DIR/pollinations.py"
else
    echo "✗ Setup failed. Please check the error messages above."
    exit 1
fi
