import os
from dotenv import load_dotenv
import sys

print("Running API key test script")

# Load environment variables from .env file
load_dotenv()

# Get API key
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("ERROR: GROQ API key not found in .env file")
    print("Please ensure you have a .env file with GROQ_API_KEY=your-key-here")
    sys.exit(1)
elif api_key == "your-groq-api-key-here":
    print("ERROR: You need to replace 'your-groq-api-key-here' with your actual GROQ API key")
    sys.exit(1)
else:
    # Only show first few characters for security
    masked_key = api_key[:4] + "..." + api_key[-4:] if len(api_key) > 8 else "***"
    print(f"SUCCESS: GROQ API key found: {masked_key}")
    print("The API key is properly configured.")
    sys.exit(0) 