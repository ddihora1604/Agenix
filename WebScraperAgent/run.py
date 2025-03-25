"""
Run script to start the Web Scraper Agent terminal interface.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def main():
    """Main run function."""
    # Validate API key
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "your_google_api_key_here":
        print("Warning: Valid API key is not set. Using mock mode.")
        print("You can set a valid API key in the .env file with the following content:")
        print("GOOGLE_API_KEY=your_actual_google_api_key")
        os.environ["USE_MOCK_MODE"] = "true"
    
    # Run terminal interface
    print("Starting Web Scraper Agent terminal interface...")
    import terminal_interface
    terminal_interface.main()

if __name__ == "__main__":
    main() 