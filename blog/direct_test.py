import asyncio
import os
import json
from dotenv import load_dotenv
from blog import BlogGenerator

async def test_blog_generator():
    print("Testing BlogGenerator...")
    
    # Load environment variables from .env file
    load_dotenv()
    
    # Get API key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("ERROR: GROQ API key not found")
        return
    
    try:
        # Create a BlogGenerator instance
        print("Creating BlogGenerator...")
        generator = BlogGenerator(api_key)
        
        # Generate a test blog
        print("Generating test blog...")
        test_topic = "Python programming"
        blog_post = await generator.generate_blog(
            topic=test_topic,
            style="technical",
            tone="informative",
            length="short" # Use short for quick testing
        )
        
        # Print the generated blog
        print("\nGenerated Blog Post:")
        print(json.dumps(blog_post, indent=2))
        print("\nBlog generation test completed successfully!")
        
    except Exception as e:
        print(f"ERROR during blog generation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("Starting direct test of BlogGenerator...")
    asyncio.run(test_blog_generator()) 