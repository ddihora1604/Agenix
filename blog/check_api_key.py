#!/usr/bin/env python3
"""
API Key validation script for blog generator
Checks if GROQ_API_KEY is properly configured and accessible
"""

import os
import sys
from dotenv import load_dotenv

def main():
    try:
        # Load environment variables from root .env file (or fallback to local)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(script_dir)  # Go up one level to root Agenix directory
        root_env_path = os.path.join(root_dir, '.env')
        
        # Try root .env first, fallback to local for backward compatibility
        if os.path.exists(root_env_path):
            load_dotenv(dotenv_path=root_env_path)
            print(f"Loaded environment from root .env: {root_env_path}")
        else:
            # Fallback to local .env file
            local_env_path = os.path.join(script_dir, '.env')
            if os.path.exists(local_env_path):
                load_dotenv(dotenv_path=local_env_path)
                print(f"Loaded environment from local .env: {local_env_path}")
            else:
                print("Error: No .env file found in root directory or blog folder")
                print("Please create a .env file in the root Agenix directory")
                sys.exit(1)
        
        # Check if GROQ_API_KEY is set
        api_key = os.getenv("GROQ_API_KEY")
        
        if not api_key:
            print("Error: GROQ_API_KEY not found in environment variables")
            print("Please check your .env file contains: GROQ_API_KEY=your_api_key_here")
            sys.exit(1)
        
        # Basic validation - check if it looks like a GROQ API key
        if not api_key.startswith('gsk_'):
            print("Warning: GROQ_API_KEY doesn't appear to follow expected format (should start with 'gsk_')")
            print("Please verify your API key is correct")
            sys.exit(1)
        
        if len(api_key) < 50:  # GROQ API keys are typically longer
            print("Warning: GROQ_API_KEY appears to be too short")
            print("Please verify your API key is complete")
            sys.exit(1)
        
        # Try to import required dependencies
        try:
            from langchain_groq import ChatGroq
            print("Success: langchain_groq dependency is available")
        except ImportError as e:
            print(f"Error: Required dependency not found - {e}")
            print("Please run: pip install langchain-groq")
            sys.exit(1)
        
        # Try to create a ChatGroq instance (this validates the API key format)
        try:
            llm = ChatGroq(groq_api_key=api_key, model_name="gemma2-9b-it")
            print("Success: GROQ API client initialized successfully")
        except Exception as e:
            print(f"Error: Failed to initialize GROQ API client - {e}")
            print("Please verify your API key is valid")
            sys.exit(1)
        
        print("All checks passed! GROQ API key is properly configured.")
        print(f"API key format: {api_key[:12]}...{api_key[-8:]}")  # Show partial key for confirmation
        
    except Exception as e:
        print(f"Unexpected error during validation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
