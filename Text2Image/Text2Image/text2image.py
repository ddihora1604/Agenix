import base64
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def generate():
    # Check if API key is available
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is not set.")
        print("Please make sure your .env file contains a valid GEMINI_API_KEY.")
        return

    # Get user input for the prompt
    print("\n===== Text to Image Generator =====")
    print("Enter your prompt describing the image you want to generate.")
    print("Example: 'A beautiful sunset over a mountain range with a lake in the foreground'")
    user_prompt = input("\nYour prompt: ")
    
    if not user_prompt.strip():
        print("Error: Empty prompt. Please provide a description for the image.")
        return
    
    print("\nGenerating image based on your prompt...")
    
    client = genai.Client(
        api_key=api_key,
    )

    model = "gemini-2.0-flash"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=user_prompt),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
    )

    print("\nResponse from the model:")
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        print(chunk.text, end="")
    print("\n")

if __name__ == "__main__":
    generate()
