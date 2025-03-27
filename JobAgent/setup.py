#!/usr/bin/env python3
"""
Setup script for JobAgent

This script installs required dependencies and verifies the installation.
"""

import os
import sys
import subprocess
import platform

def check_python_version():
    """Check if Python version is sufficient."""
    required_version = (3, 8)
    current_version = sys.version_info
    
    if current_version < required_version:
        print(f"Error: Python {required_version[0]}.{required_version[1]} or higher is required.")
        print(f"Current version: {current_version[0]}.{current_version[1]}")
        return False
    
    print(f"Python version check passed: {current_version[0]}.{current_version[1]}")
    return True

def install_dependencies():
    """Install required packages from requirements.txt."""
    requirements_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'requirements.txt')
    
    if not os.path.exists(requirements_path):
        print(f"Error: requirements.txt not found at {requirements_path}")
        return False
    
    print("Installing dependencies from requirements.txt...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', requirements_path])
        print("Dependencies installed successfully.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        return False

def verify_installation():
    """Verify that all dependencies are correctly installed."""
    required_packages = ['python-dotenv', 'requests', 'beautifulsoup4', 'PyPDF2']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✓ {package} installed successfully")
        except ImportError:
            missing_packages.append(package)
            print(f"✗ {package} not found")
    
    if missing_packages:
        print("\nSome packages are missing. Please try installing them manually:")
        for package in missing_packages:
            print(f"  pip install {package}")
        return False
    
    return True

def check_env_file():
    """Check if .env file exists and has the required keys."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    
    if not os.path.exists(env_path):
        print("Warning: .env file not found. Creating a template...")
        with open(env_path, 'w') as f:
            f.write("# JobAgent Configuration\n")
            f.write("GOOGLE_API_KEY=your_google_api_key_here\n\n")
            f.write("# Note: Replace 'your_google_api_key_here' with an actual API key\n")
            f.write("# You can get an API key from https://makersuite.google.com/app/apikey\n")
        print(f".env template created at {env_path}")
        print("Please edit the file and add your Google API key.")
        return False
    
    # Check if the API key is set
    with open(env_path, 'r') as f:
        content = f.read()
        if 'GOOGLE_API_KEY=your_google_api_key_here' in content or 'GOOGLE_API_KEY=' not in content:
            print("Warning: GOOGLE_API_KEY not set in .env file.")
            print("Please edit the .env file and add your Google API key.")
            return False
    
    print("✓ .env file exists")
    return True

def main():
    """Main function to set up the Job Agent."""
    print("=== JobAgent Setup ===")
    
    # System information
    print("\nSystem information:")
    print(f"Platform: {platform.platform()}")
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    
    # Run checks and setup
    print("\nRunning setup...")
    
    python_check = check_python_version()
    dependencies_check = install_dependencies()
    verification_check = verify_installation()
    env_check = check_env_file()
    
    # Summary
    print("\n=== Setup Summary ===")
    print(f"Python version check: {'✓' if python_check else '✗'}")
    print(f"Dependencies installation: {'✓' if dependencies_check else '✗'}")
    print(f"Verification: {'✓' if verification_check else '✗'}")
    print(f"Environment file: {'✓' if env_check else '⚠'}")
    
    if python_check and dependencies_check and verification_check and env_check:
        print("\n✅ Setup completed successfully! The Job Agent is ready to use.")
    else:
        print("\n⚠ Setup completed with warnings. Please address the issues above.")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 