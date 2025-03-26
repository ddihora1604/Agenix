import os
import sys
from dotenv import load_dotenv

print("Python Environment Test for Image Generator")
print("------------------------------------------")
print(f"Current directory: {os.getcwd()}")

# Load environment variables
print("\nTesting .env file loading:")
load_dotenv()
api_key = os.getenv("FAL_API_KEY")

if api_key:
    print(f"✅ API Key found: {api_key[:5]}...{api_key[-5:]}")
else:
    print("❌ API Key not found")
    sys.exit(1)

# Test fal_client import
print("\nTesting fal_client module:")
try:
    import fal_client
    print("✅ fal_client module imported successfully")
except ImportError as e:
    print(f"❌ Failed to import fal_client: {e}")
    sys.exit(1)

print("\nAll tests passed! Your environment is set up correctly.")
print("You can now use the Image Generator Agent.") 