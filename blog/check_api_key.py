import os
import sys
import json
import http.client
from dotenv import load_dotenv

def check_env_file():
    """Check if .env file exists and has GROQ_API_KEY set"""
    print("\n--- Checking .env file ---")
    
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(current_dir, '.env')
    
    print(f"Looking for .env file at: {env_path}")
    
    if not os.path.exists(env_path):
        print("[ERROR] .env file does not exist at the expected location!")
        print("Create a .env file in the blog directory with your GROQ API key")
        return False
    
    print("[OK] .env file exists")
    
    # Load environment variables from .env file
    load_dotenv()
    
    # Try to get the API key
    api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        print("[ERROR] GROQ_API_KEY not found in .env file!")
        return False
    
    if api_key == "your-groq-api-key-here":
        print("[ERROR] You need to replace 'your-groq-api-key-here' with your actual GROQ API key")
        return False
    
    # Only show a masked version for security
    masked_key = api_key[:4] + "..." + api_key[-4:] if len(api_key) > 8 else "***"
    print(f"[OK] GROQ_API_KEY found: {masked_key} (length: {len(api_key)})")
    return api_key

def test_groq_api(api_key):
    """Test if the GROQ API key is valid by making a simple request"""
    print("\n--- Testing GROQ API key ---")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "user", "content": "Say hello in one word"}
        ],
        "max_tokens": 10
    }
    
    try:
        conn = http.client.HTTPSConnection("api.groq.com")
        conn.request("POST", "/openai/v1/chat/completions", 
                    body=json.dumps(data), 
                    headers=headers)
        response = conn.getresponse()
        
        if response.status == 200:
            print(f"[OK] Success! API key is valid and working")
            return True
        elif response.status == 401:
            print(f"[ERROR] API key is invalid (Unauthorized - 401)")
            print("Please check that you're using a valid GROQ API key")
            return False
        else:
            result = response.read().decode()
            print(f"[ERROR] Unexpected response (Status {response.status}):")
            print(result)
            return False
    except Exception as e:
        print(f"[ERROR] Failed to connect to GROQ API: {e}")
        return False

def main():
    print("==== GROQ API Key Checker ====")
    
    # Check if .env file exists and contains API key
    api_key = check_env_file()
    if not api_key:
        print("\n[FIX] Create a .env file in the blog directory with:")
        print("GROQ_API_KEY=your-actual-api-key-here")
        sys.exit(1)
    
    # Test if the API key is valid
    if test_groq_api(api_key):
        print("\n[OK] All checks passed! Your GROQ API key is valid and working")
        sys.exit(0)
    else:
        print("\n[ERROR] API key validation failed")
        sys.exit(1)

if __name__ == "__main__":
    main() 