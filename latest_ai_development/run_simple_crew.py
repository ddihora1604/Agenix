#!/usr/bin/env python
"""
Simple script to run the simplified educational AI crew directly.
This avoids needing to install the package and can be run with:
python run_simple_crew.py
"""

import sys
import os

# Add the src directory to the path so we can import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

# Import the simple main module
from latest_ai_development.simple_main import run

if __name__ == "__main__":
    run() 