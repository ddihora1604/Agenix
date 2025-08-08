
import sys
import json
from blog import BlogGenerator
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

async def main():
    # Get API key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print(json.dumps({"error": "GROQ API key not found"}))
        return
    
    # Read topic from file
    topic_file = sys.argv[1]
    with open(topic_file, 'r') as f:
        topic = f.read().strip()
    
    # Generate blog
    generator = BlogGenerator(api_key)
    try:
        blog_post = await generator.generate_blog(
            topic=topic,
            style="technical",  # Default values
            tone="informative",
            length="medium"
        )
        
        # Print the blog post as JSON
        print(json.dumps(blog_post))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    asyncio.run(main())
