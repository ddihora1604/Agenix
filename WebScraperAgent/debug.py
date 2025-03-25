#!/usr/bin/env python3
"""
Debug script to test individual components of the WebScraperAgent.
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

def test_gemini_client():
    """Test the GeminiClient with a simple request"""
    from src.utils.gemini_client import GeminiClient
    
    logger.info("Testing GeminiClient...")
    
    api_key = os.getenv("GOOGLE_API_KEY")
    client = GeminiClient(api_key=api_key)
    
    logger.info(f"Using API key: {api_key[:5]}... (truncated)")
    logger.info(f"Mock mode: {client.use_mock}")
    
    test_content = "This is a test content for summarization."
    result = client.summarize_content(test_content)
    
    logger.info(f"Result from summarize_content: {result[:100]}...")

def test_web_scraper():
    """Test the WebScraper with a simple URL"""
    from src.utils.web_scraper import WebScraper
    
    logger.info("Testing WebScraper...")
    
    scraper = WebScraper()
    test_url = "https://example.com"
    
    try:
        html_content = scraper.get_page_content(test_url)
        logger.info(f"Successfully retrieved HTML content from {test_url}")
        
        text_content = scraper.extract_text_content(html_content)
        logger.info(f"Extracted text content: {text_content[:100]}...")
    except Exception as e:
        logger.error(f"Error testing WebScraper: {e}")

def test_web_searcher():
    """Test the WebSearcher with a simple query"""
    from src.utils.search_utils import WebSearcher
    
    logger.info("Testing WebSearcher...")
    
    searcher = WebSearcher()
    test_query = "Python programming"
    
    try:
        results = searcher.search(test_query)
        logger.info(f"Search results count: {len(results)}")
        if results:
            logger.info(f"First result: {results[0]}")
    except Exception as e:
        logger.error(f"Error testing WebSearcher: {e}")

def test_agent():
    """Test creating the WebScraperAgent"""
    from src.web_scraper_agent import WebScraperAgent
    
    logger.info("Testing WebScraperAgent creation...")
    
    try:
        agent = WebScraperAgent(force_mock=True)
        logger.info("Agent created successfully in mock mode")
        
        # Test with a simple URL to ensure basic functionality works
        result = agent.process_input("https://example.com")
        logger.info(f"Result keys: {list(result.keys())}")
    except Exception as e:
        logger.error(f"Error creating or using agent: {e}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    try:
        # Test each component separately
        test_gemini_client()
        test_web_scraper()
        test_web_searcher()
        test_agent()
        
        print("\nAll debug tests complete. Check the logs for details.")
    except Exception as e:
        logger.critical(f"Debug script failed: {e}")
        import traceback
        logger.critical(traceback.format_exc()) 