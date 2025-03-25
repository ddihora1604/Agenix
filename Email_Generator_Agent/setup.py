import subprocess
import sys
import os
import platform

def install_dependencies():
    """Install required dependencies for the email generator."""
    print("Checking and installing dependencies...")
    
    # Required packages
    required_packages = [
        "langchain==0.1.9",
        "langchain-google-genai==0.0.6",
        "python-dotenv==1.0.1",
        "colorama==0.4.6",
        "google-generativeai>=0.3.0"
    ]
    
    # Install each package
    for package in required_packages:
        try:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        except subprocess.CalledProcessError as e:
            print(f"Error installing {package}: {e}")
            return False
    
    print("All dependencies installed successfully!")
    return True

if __name__ == "__main__":
    # Install dependencies
    success = install_dependencies()
    
    if success:
        print("Setup completed successfully. You can now use the email generator.")
    else:
        print("Setup failed. Please try installing the dependencies manually.")
        print("Run: pip install -r requirements.txt") 