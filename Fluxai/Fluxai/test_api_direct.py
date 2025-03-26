import os
import sys

print("Testing FAL.ai API using fal_client")
print("---------------------------------")

# Set the API key directly in the environment variable
API_KEY = "2d2b231c-4c34-45c3-a032-91e8ce74dab3:634d0793cb3b509444227c1f6bddaa2d"
os.environ["FAL_KEY"] = API_KEY

print(f"Using API key: {API_KEY[:5]}...{API_KEY[-5:]}")
print(f"FAL_KEY environment variable set to: {os.environ.get('FAL_KEY')[:5]}...{os.environ.get('FAL_KEY')[-5:]}")

# Try to import fal_client
try:
    import fal_client
    print("✅ Successfully imported fal_client")
except ImportError as e:
    print(f"❌ Error importing fal_client: {e}")
    sys.exit(1)

# Try to use the client
try:
    print("\nTesting connection to FAL.ai...")
    print("This may take a moment, please wait...")
    
    result = fal_client.subscribe(
        "fal-ai/flux/dev",
        arguments={
            "prompt": "test image of a colorful cat, cartoon style"
        },
    )
    
    print("\n✅ API request successful!")
    print(f"Response received in {result.get('timings', {}).get('inference', 0):.2f} seconds")
    print(f"Image URL: {result.get('images', [{}])[0].get('url', 'No URL found')[:50]}...")
    
except Exception as e:
    print(f"\n❌ Error making API request: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
    
print("\nAll tests passed! Your environment is set up correctly.")
print("You can now use the Image Generator Agent.") 