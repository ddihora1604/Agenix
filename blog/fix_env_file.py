#!/usr/bin/env python3
"""
This script fixes common issues with the .env file format.
It ensures the API key is properly formatted and removes any extra whitespace or blank lines.
"""

import os
import re
import sys

def fix_env_file():
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(current_dir, '.env')
    
    print(f"Looking for .env file at: {env_path}")
    
    if not os.path.exists(env_path):
        print("[ERROR] .env file does not exist!")
        create_new = input("Would you like to create a new .env file? (y/n): ")
        if create_new.lower() == 'y':
            api_key = input("Enter your GROQ API key: ")
            with open(env_path, 'w') as f:
                f.write(f"GROQ_API_KEY={api_key}")
            print("[OK] Created new .env file with your API key")
            return
        else:
            print("No changes made.")
            return
    
    # Read the file
    try:
        with open(env_path, 'r') as f:
            content = f.read()
        
        original_content = content
        print(f"Original file size: {len(content)} bytes")
        
        # Check for API key format
        api_key_match = re.search(r'GROQ_API_KEY\s*=\s*(["\']?)([^"\'\s]+)(["\']?)', content)
        
        if not api_key_match:
            print("[ERROR] No GROQ_API_KEY found in .env file")
            api_key = input("Enter your GROQ API key: ")
            content = f"GROQ_API_KEY={api_key}"
        else:
            # Extract the API key without quotes
            api_key = api_key_match.group(2)
            
            # Remove any quotes or trailing whitespace
            content = f"GROQ_API_KEY={api_key}"
            
        # Remove any blank lines and ensure no trailing newlines
        content = content.strip()
        
        # Only write if content has changed
        if content != original_content:
            with open(env_path, 'w') as f:
                f.write(content)
            print("[OK] Fixed .env file format")
        else:
            print("[OK] .env file is already in the correct format")
        
        # Display masked key for verification
        if api_key:
            masked_key = api_key[:4] + "..." + api_key[-4:] if len(api_key) > 8 else "***"
            print(f"Current API key: {masked_key} (length: {len(api_key)})")
        
    except Exception as e:
        print(f"[ERROR] Error: {e}")

if __name__ == "__main__":
    print("==== .env File Fixer ====")
    fix_env_file()
    print("Done!") 