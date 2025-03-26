from diffusers import StableDiffusionPipeline
import torch
from PIL import Image
import os
import logging

class ImageGenerator:
    def __init__(self, huggingface_api_token: str):
        """Initialize the image generation pipeline"""
        self.api_token = huggingface_api_token
        self.model_id = "runwayml/stable-diffusion-v1-5"
        self.setup_pipeline()
        
    def setup_pipeline(self):
        """Setup Stable Diffusion pipeline"""
        self.pipeline = StableDiffusionPipeline.from_pretrained(
            self.model_id,
            torch_dtype=torch.float16,
            use_auth_token=self.api_token
        )
        if torch.cuda.is_available():
            self.pipeline = self.pipeline.to("cuda")
            
    def generate_image(self, prompt: str) -> Image.Image:
        """Generate a single image from prompt"""
        try:
            print("\nGenerating image... Please wait.")
            
            # Generate the image
            image = self.pipeline(
                prompt,
                num_images_per_prompt=1,
                guidance_scale=7.5,
                num_inference_steps=50
            ).images[0]
            
            # Save the image
            os.makedirs("generated_images", exist_ok=True)
            safe_prompt = "".join(x for x in prompt[:30] if x.isalnum())
            image_path = os.path.join("generated_images", f"{safe_prompt}.png")
            image.save(image_path)
            print(f"\nImage generated successfully!")
            print(f"Saved to: {image_path}")
            
            return image
            
        except Exception as e:
            logging.error(f"Error generating image: {str(e)}")
            raise

def main():
    # Setup basic logging
    logging.basicConfig(level=logging.INFO)
    
    # Your HuggingFace API token
    HUGGINGFACE_API_TOKEN = "your_huggingface_api_token_here"
    
    try:
        # Initialize generator
        print("Initializing Image Generator...")
        generator = ImageGenerator(HUGGINGFACE_API_TOKEN)
        print("Ready to generate images!")
        
        # Get user prompt
        prompt = input("\nEnter your image description: ")
        
        # Generate the image
        generator.generate_image(prompt)
        
    except KeyboardInterrupt:
        print("\nImage generation interrupted by user.")
    except Exception as e:
        print(f"\nError: {str(e)}")

if __name__ == "__main__":
    main()