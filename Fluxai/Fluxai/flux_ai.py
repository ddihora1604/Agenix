import fal_client
import os
import webbrowser
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variables
fal_api_key = os.getenv("FAL_API_KEY")
if not fal_api_key:
    raise ValueError("FAL_API_KEY environment variable not set. Please add it to your .env file.")

# Set the FAL_KEY environment variable for the client to use
os.environ["FAL_KEY"] = fal_api_key

# Note: No need to set fal_client.api_key directly as it will use the environment variable

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