import requests
import os
import webbrowser
import json
import sys
import traceback
from pathlib import Path
from urllib.parse import quote
import time

# Enhanced error logging
def log_error(message):
    print(f"ERROR: {message}", file=sys.stderr)

# Debug helper
def debug(message):
    print(f"DEBUG: {message}")

def generate_image(prompt, model="flux", width=1024, height=1024, enhance=True, nologo=True, private=True):
    """
    Generate image using Pollinations AI API
    
    Args:
        prompt (str): Text description of the image to generate
        model (str): Model to use (flux, flux-realism, flux-cablyai, flux-anime, flux-3d, turbo, etc.)
        width (int): Image width (default: 1024)
        height (int): Image height (default: 1024) 
        enhance (bool): Whether to enhance the prompt (default: True)
        nologo (bool): Remove Pollinations logo (default: True)
        private (bool): Make generation private (default: True)
    
    Returns:
        dict: Contains image URL and generation info
    """
    
    debug(f"Generating image for prompt: '{prompt}'")
    debug(f"Using model: {model}, size: {width}x{height}")
    
    try:
        # Encode the prompt for URL
        encoded_prompt = quote(prompt)
        
        # Build the API URL with parameters
        base_url = "https://image.pollinations.ai/prompt"
        params = []
        
        # Add model parameter
        if model and model != "flux":
            params.append(f"model={model}")
        
        # Add dimensions
        if width != 1024:
            params.append(f"width={width}")
        if height != 1024:
            params.append(f"height={height}")
            
        # Add enhancement
        if enhance:
            params.append("enhance=true")
            
        # Add no logo
        if nologo:
            params.append("nologo=true")
            
        # Add private flag
        if private:
            params.append("private=true")
        
        # Construct full URL
        if params:
            url = f"{base_url}/{encoded_prompt}?{'&'.join(params)}"
        else:
            url = f"{base_url}/{encoded_prompt}"
        
        debug(f"Making request to: {url}")
        
        # Record start time
        start_time = time.time()
        
        # Make the request
        response = requests.get(url, timeout=60)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        if response.status_code == 200:
            # The response should be the image itself
            # For Pollinations, the URL we constructed IS the final image URL
            debug("Image generated successfully")
            
            return {
                'images': [{
                    'url': url,
                    'width': width,
                    'height': height
                }],
                'timings': {
                    'inference': processing_time
                }
            }
        else:
            error_msg = f"API request failed with status code: {response.status_code}"
            debug(error_msg)
            raise Exception(error_msg)
            
    except requests.exceptions.Timeout:
        error_msg = "Request timed out. Please try again."
        log_error(error_msg)
        raise Exception(error_msg)
    except requests.exceptions.RequestException as e:
        error_msg = f"Network error: {str(e)}"
        log_error(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        log_error(error_msg)
        raise Exception(error_msg)

def main():
    """Interactive mode for testing"""
    print("\n===== Pollinations AI Image Generator =====")
    print("This tool generates images from text descriptions using Pollinations AI (Free)")
    print("Available models: flux, flux-realism, flux-cablyai, flux-anime, flux-3d, turbo")
    
    while True:
        # Get the prompt from the user
        prompt = input("\nEnter your image prompt (or 'quit' to exit): ")
        
        if prompt.lower() == 'quit':
            print("\nThank you for using Pollinations AI Image Generator!")
            break
            
        if not prompt.strip():
            print("Error: Empty prompt. Please provide a description.")
            continue
            
        try:
            # Ask for model preference
            print("\nAvailable models:")
            print("1. flux (default) - High quality, balanced")
            print("2. flux-realism - Photorealistic images")
            print("3. flux-anime - Anime/manga style")
            print("4. flux-3d - 3D rendered style")
            print("5. turbo - Faster generation")
            
            model_choice = input("Choose model (1-5, or press Enter for default): ").strip()
            
            model_map = {
                '1': 'flux',
                '2': 'flux-realism', 
                '3': 'flux-anime',
                '4': 'flux-3d',
                '5': 'turbo',
                '': 'flux'
            }
            
            model = model_map.get(model_choice, 'flux')
            
            # Generate the image
            result = generate_image(prompt, model=model)
            
            # Display the result
            print("\nImage generated successfully!")
            print(f"Resolution: {result['images'][0]['width']}x{result['images'][0]['height']}")
            print(f"Processing time: {result['timings']['inference']:.2f} seconds")
            print(f"Model used: {model}")
            
            # Show the image URL
            image_url = result['images'][0]['url']
            print(f"\nImage URL: {image_url}")
            
            # Ask if user wants to open the image in a browser
            open_browser = input("\nOpen the image in your browser? (y/n): ")
            if open_browser.lower() == 'y':
                webbrowser.open(image_url)
                
        except Exception as e:
            print(f"\nError generating image: {str(e)}")

# Script execution for API integration
if __name__ == "__main__":
    # Check if this is being run in API mode (with command line arguments)
    if len(sys.argv) == 2:
        try:
            debug("Script started in API mode")
            
            # Read the prompt from the file
            prompt_file = sys.argv[1]
            debug(f"Reading prompt from file: {prompt_file}")
            
            with open(prompt_file, 'r', encoding='utf-8') as f:
                prompt = f.read().strip()
                
            if not prompt:
                log_error("Empty prompt in file.")
                sys.exit(1)
            
            debug(f"Starting image generation for prompt: {prompt}")
            
            # Generate the image using Pollinations AI
            result = generate_image(prompt)
            
            # Display the result as JSON for the API
            output = {
                "imageUrl": result['images'][0]['url'],
                "width": result['images'][0]['width'],
                "height": result['images'][0]['height'],
                "processingTime": result['timings']['inference']
            }
            
            print("\nIMAGE_GENERATION_RESULT:")
            print(json.dumps(output))
            debug("Generation completed successfully")
            
        except Exception as e:
            log_error(f"Error in pollinations.py: {str(e)}")
            traceback.print_exc(file=sys.stderr)
            sys.exit(1)
    else:
        # Run in interactive mode
        main()
