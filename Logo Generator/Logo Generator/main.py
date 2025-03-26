import base64
import os
import mimetypes
# from google import genai
# from google.generativeai import types
import google.generativeai as genai
from google.generativeai import types
from dotenv import load_dotenv

# Try to load environment variables from .env file
load_dotenv()

def save_binary_file(file_name, data):
    """Saves binary data as an image file."""
    with open(file_name, "wb") as f:
        f.write(base64.b64decode(data))  

def generate_logo(test_mode=False):
    # Set API key directly and as environment variable for backup
    api_key = "AIzaSyAIxs_LaWk1ACeGIjwjC9hAAXUewKpQfAA"  # Hardcoded for testing
    os.environ["GEMINI_API_KEY"] = api_key
    
    # Configure the Google Generative AI client
    genai.configure(api_key=api_key)

    if test_mode:
        # Use default values for testing
        user_prompt = "a minimalist blue mountain with a river"
        file_name = "test_logo"
        print(f"Using test prompt: '{user_prompt}' and filename: '{file_name}'")
    else:
        # Get input from user
        user_prompt = input("Describe your logo: ")  
        file_name = input("Enter filename (default: 'logo'): ") or "logo"

    prompt = (
        f"A professional logo design. {user_prompt}. "
        "It should be clean, modern, high-resolution, and suitable for branding."
    )

    # Create the generation config
    generation_config = {
        "temperature": 0.6,
        "top_p": 0.9,
        "top_k": 40,
        "response_mime_type": "image/png",
    }

    # Create the model instance
    model = genai.GenerativeModel(model_name="gemini-1.5-pro", generation_config=generation_config)
    
    try:
        print("Generating logo...")
        # Generate the content
        response = model.generate_content(prompt)
        
        # Process the response
        if hasattr(response, "candidates") and response.candidates:
            for candidate in response.candidates:
                if hasattr(candidate, "content") and candidate.content:
                    for part in candidate.content.parts:
                        if hasattr(part, "inline_data") and part.inline_data:
                            inline_data = part.inline_data
                            file_extension = mimetypes.guess_extension(inline_data.mime_type) or ".png"
                            output_path = f"{file_name}{file_extension}"
                            save_binary_file(output_path, inline_data.data)
                            print(f"Logo saved at: {output_path}")
                            return
                        elif hasattr(part, "text") and part.text:
                            print("Response text:", part.text)
        
        print("No logo generated.")
    except Exception as e:
        print(f"Error generating logo: {str(e)}")

if __name__ == "__main__":
    import sys
    test_mode = "--test" in sys.argv
    generate_logo(test_mode=test_mode)
