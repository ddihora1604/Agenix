import os
import sys
import requests

print("Testing FAL.ai API Key")
print("----------------------")

# Get API key directly from environment or hardcoded for test
API_KEY = "2d2b231c-4c34-45c3-a032-91e8ce74dab3:634d0793cb3b509444227c1f6bddaa2d"

print(f"Using API key: {API_KEY[:5]}...{API_KEY[-5:]}")

# Set up the API request
headers = {
    "Authorization": f"Key {API_KEY}",
    "Content-Type": "application/json"
}

url = "https://api.fal.ai/public/models/flux/dev"
data = {
    "prompt": "test image of a colorful cat, cartoon style"
}

# Make the request
print("\nSending test request to FAL.ai API...")
try:
    response = requests.post(url, json=data, headers=headers)
    
    # Check status code
    if response.status_code == 200:
        result = response.json()
        print("✅ API request successful!")
        print(f"Response received in {result.get('timings', {}).get('inference', 0):.2f} seconds")
        print(f"Image URL: {result.get('images', [{}])[0].get('url', 'No URL found')[:50]}...")
    else:
        print(f"❌ API request failed with status code: {response.status_code}")
        print(f"Error message: {response.text}")
        
except Exception as e:
    print(f"❌ Error making API request: {str(e)}")
    sys.exit(1) 