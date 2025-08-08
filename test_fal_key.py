import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from project root
env_file = Path(__file__).parent / ".env"

if env_file.exists():
    print(f"Loading .env from: {env_file}")
    load_dotenv(env_file)
    
    fal_key = os.getenv("FAL_API_KEY")
    if fal_key:
        print("✅ FAL API Key found in .env file")
        print(f"Key starts with: {fal_key[:10]}...")
        
        # Set the environment variable that fal_client expects
        os.environ["FAL_KEY"] = fal_key
        
        try:
            import fal_client
            
            # Test a simple request to check if key is valid and account status
            print("\n🔄 Testing FAL API connection...")
            
            # Try to get account info or make a minimal request
            result = fal_client.run(
                "fal-ai/flux/dev",
                arguments={
                    "prompt": "test",
                    "image_size": "landscape_4_3",
                    "num_images": 1
                }
            )
            
            print("✅ API key is working! Your account has sufficient balance.")
            
        except ImportError:
            print("❌ fal_client not installed. Run: pip install fal_client")
        except Exception as e:
            error_msg = str(e)
            print(f"❌ API Error: {error_msg}")
            
            if "Exhausted balance" in error_msg or "User is locked" in error_msg:
                print("\n💰 Your FAL account has insufficient balance.")
                print("Please top up at: https://www.fal.ai/dashboard/billing")
            elif "Forbidden" in error_msg or "403" in error_msg:
                print("\n🔑 API key might be invalid or expired.")
                print("Please check your API key at: https://www.fal.ai/dashboard/keys")
            elif "401" in error_msg:
                print("\n🔑 Authentication failed. Please verify your API key.")
    else:
        print("❌ FAL_API_KEY not found in .env file")
else:
    print(f"❌ .env file not found at: {env_file}")
