import base64
import os
import mimetypes
from google import genai
# from google.genai import types
import google.generativeai as genai
from google.generativeai import types

def save_binary_file(file_name, data):
    """Saves binary data as an image file."""
    with open(file_name, "wb") as f:
        f.write(base64.b64decode(data))  

def generate_logo():
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    user_prompt = input("Describe your logo: ")  
    file_name = input("Enter filename (default: 'logo'): ") or "logo"

    prompt = (
        f"A professional logo design. {user_prompt}. "
        "It should be clean, modern, high-resolution, and suitable for branding."
    )

    model = "gemini-1.5-pro"  
    contents = [types.Content(role="user", parts=[types.Part.from_text(text=prompt)])]

    generate_content_config = types.GenerateContentConfig(
        temperature=0.6,  
        top_p=0.9,
        top_k=40,
        response_modalities=["image"],  
    )

    for chunk in client.models.generate_content_stream(model=model, contents=contents, config=generate_content_config):
        if chunk.candidates and chunk.candidates[0].content.parts:
            part = chunk.candidates[0].content.parts[0]
            if part.inline_data:
                inline_data = part.inline_data
                file_extension = mimetypes.guess_extension(inline_data.mime_type) or ".png"
                output_path = f"{file_name}{file_extension}"
                save_binary_file(output_path, inline_data.data)
                print(f"Logo saved at: {output_path}")
                return
            elif part.text:
                print("Response text:", part.text)
    
    print("No logo generated.")

if __name__ == "__main__":
    generate_logo()
