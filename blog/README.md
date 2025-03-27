# Blog Writer Agent

This folder contains the Blog Writer Agent which generates well-structured blog posts on various topics.

## Setup Instructions

### 1. Prerequisites

- Python 3.8 or newer
- An API key from GROQ (https://console.groq.com/keys)

### 2. Configuration

1. Ensure your `.env` file is properly set up with your GROQ API key:
   ```
   GROQ_API_KEY=your-actual-api-key-here
   ```
   
   Replace `your-actual-api-key-here` with the API key you obtained from the GROQ console.

2. Install the required Python packages:
   ```bash
   pip install --user langchain==0.1.9 langchain-groq python-dotenv rich pydantic
   ```

### 3. Testing Your Setup

To verify your setup is working correctly, you can run the provided test scripts:

1. Test your API key:
   ```bash
   python test_api_key.py
   ```

2. Test the required package imports:
   ```bash
   python test_imports.py
   ```

## Troubleshooting

### API Key Issues

If you see "API Key Required" errors:
- Make sure you've created a `.env` file in the `blog` directory
- Ensure the API key is correctly formatted as `GROQ_API_KEY=your-api-key-here`
- Verify your API key is valid by testing it with `test_api_key.py`
- Run `fix_env_file.py` to automatically fix common issues with your `.env` file format
- Run `check_api_key.py` for a comprehensive diagnostic of your API key

### Python Installation Issues

If you encounter Python-related errors:
- Verify Python is installed and in your PATH: `python --version`
- Try installing the dependencies with: `python -m pip install --user langchain==0.1.9 langchain-groq python-dotenv rich pydantic`
- If using Windows, try running the commands in an administrator PowerShell
- Make sure no Python processes are running that might lock files

### Processing Errors

If the blog generation seems to run indefinitely:
- Check the browser console for detailed error messages
- Verify the blog.py file exists in the blog directory
- Make sure all dependencies are correctly installed

## Files in this Directory

- `blog.py` - The main blog generation script
- `.env` - Environment file containing your GROQ API key
- `test_api_key.py` - Script to verify your API key is set up correctly
- `check_api_key.py` - Comprehensive script to check API key validity with GROQ
- `fix_env_file.py` - Script to fix common issues with .env file format
- `test_imports.py` - Script to verify required packages are installed
- `direct_test.py` - Script to test the blog generator functionality directly
- `README.md` - This documentation file 