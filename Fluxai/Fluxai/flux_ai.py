import fal_client
import os
import webbrowser
import sys
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

# Try multiple locations for .env file
print("Searching for .env file...")
env_files = [
    os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),      # Same directory
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"),  # Parent directory
    str(Path.home() / "Downloads" / "MercadoVista" / "Fluxai" / "Fluxai" / ".env"),
    str(Path.home() / "Downloads" / "MercadoVista" / "Fluxai" / ".env"),
]

# Try to find .env file
api_key = None
for env_file in env_files:
    print(f"Checking for .env at: {env_file}")
    if os.path.exists(env_file):
        print(f"Found .env file at: {env_file}")
        load_dotenv(env_file)
        api_key = os.getenv("FAL_API_KEY")
        if api_key:
            print("API key loaded successfully")
            break

# If no API key found, provide instructions
if not api_key:
    raise ValueError("""
FAL_API_KEY environment variable not set.
Please create a .env file in the Fluxai/Fluxai directory with:
FAL_API_KEY=your-fal-api-key-here
You can get a key from https://www.fal.ai/
""")

# Set the FAL_KEY environment variable for the client to use
os.environ["FAL_KEY"] = api_key

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

def generate_image(prompt):
    print(f"\nGenerating image for prompt: '{prompt}'")
    print("Please wait...")
    
    result = fal_client.subscribe(
        "fal-ai/flux/dev",
        arguments={
            "prompt": prompt
        },
        with_logs=True,
        on_queue_update=on_queue_update,
    )
    
    return result

def main():
    print("\n===== Flux AI Image Generator =====")
    print("This tool generates images from text descriptions using Flux AI")
    
    while True:
        # Get the prompt from the user
        prompt = input("\nEnter your image prompt (or 'quit' to exit): ")
        
        if prompt.lower() == 'quit':
            print("\nThank you for using Flux AI Image Generator!")
            break
            
        if not prompt.strip():
            print("Error: Empty prompt. Please provide a description.")
            continue
            
        try:
            # Generate the image
            result = generate_image(prompt)
            
            # Display the result
            print("\nImage generated successfully!")
            print(f"Resolution: {result['images'][0]['width']}x{result['images'][0]['height']}")
            print(f"Processing time: {result['timings']['inference']:.2f} seconds")
            
            # Show the image URL
            image_url = result['images'][0]['url']
            print(f"\nImage URL: {image_url}")
            
            # Ask if user wants to open the image in a browser
            open_browser = input("\nOpen the image in your browser? (y/n): ")
            if open_browser.lower() == 'y':
                webbrowser.open(image_url)
                
        except Exception as e:
            print(f"\nError generating image: {str(e)}")
    
if __name__ == "__main__":
    main()