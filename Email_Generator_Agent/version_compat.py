"""
Compatibility wrapper that redirects to the more advanced pydantic_patch.py module.
This exists for backward compatibility with existing code.
"""

import os
import sys
import importlib.util

# Get the directory of this script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Import the advanced patch module
patch_path = os.path.join(script_dir, 'pydantic_patch.py')

if os.path.exists(patch_path):
    # Add the script directory to Python path if not already there
    if script_dir not in sys.path:
        sys.path.insert(0, script_dir)
    
    try:
        import pydantic_patch
        print("Successfully imported pydantic patch module via version_compat")
    except ImportError as e:
        print(f"Error importing pydantic_patch from version_compat: {e}")
else:
    print(f"Warning: pydantic_patch.py not found at {patch_path}")
