"""
Web search utilities for the Web Scraper Agent.
"""

import logging
import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import duckduckgo_search but don't fail if not available
DDGS_AVAILABLE = False
try:
    from duckduckgo_search import DDGS
    DDGS_AVAILABLE = True
except ImportError:
    logger.warning("duckduckgo_search module not available. Web search functionality will be limited to mock mode.")

# Import config or use defaults
try:
    from config.config import SEARCH_LIMIT
except ImportError:
    logger.warning("Failed to import config. Using default search limit.")
    SEARCH_LIMIT = 5

class WebSearcher:
    """Utility class for web search operations."""
    
    def __init__(self, search_limit: int = SEARCH_LIMIT):
        """
        Initialize the WebSearcher.
        
        Args:
            search_limit: Maximum number of search results to return
        """
        self.search_limit = search_limit
        self.use_mock = not DDGS_AVAILABLE
        
        if DDGS_AVAILABLE:
            self.search_engine = DDGS()
            logger.info("WebSearcher initialized with DDGS")
        else:
            logger.warning("WebSearcher initialized in mock mode due to missing duckduckgo_search module")
    
    def search(self, query: str) -> List[Dict[str, Any]]:
        """
        Search the web for the given query.
        
        Args:
            query: Search query string
            
        Returns:
            List[Dict[str, Any]]: List of search results with URLs and snippets
        """
        if self.use_mock:
            logger.info(f"Using mock search results for query: {query}")
            return self._generate_mock_search_results(query)
            
        try:
            results = list(self.search_engine.text(query, max_results=self.search_limit))
            processed_results = []
            
            for result in results:
                processed_results.append({
                    "title": result.get("title", ""),
                    "url": result.get("href", ""),
                    "snippet": result.get("body", ""),
                })
            
            return processed_results
        except Exception as e:
            logger.error(f"Search error: {e}")
            # Fallback to mock results if search fails
            logger.info("Falling back to mock search results")
            return self._generate_mock_search_results(query)
            
    def search_news(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for news articles related to the query.
        
        Args:
            query: Search query string
            
        Returns:
            List[Dict[str, Any]]: List of news articles with URLs and snippets
        """
        if self.use_mock:
            logger.info(f"Using mock news results for query: {query}")
            return self._generate_mock_news_results(query)
            
        try:
            results = list(self.search_engine.news(query, max_results=self.search_limit))
            processed_results = []
            
            for result in results:
                processed_results.append({
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "source": result.get("source", ""),
                    "snippet": result.get("body", ""),
                    "date": result.get("date", "")
                })
            
            return processed_results
        except Exception as e:
            logger.error(f"News search error: {e}")
            # Fallback to mock results if search fails
            logger.info("Falling back to mock news results")
            return self._generate_mock_news_results(query)
            
    def search_images(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for images related to the query.
        
        Args:
            query: Search query string
            
        Returns:
            List[Dict[str, Any]]: List of image results with URLs
        """
        if self.use_mock:
            logger.info(f"Using mock image results for query: {query}")
            return self._generate_mock_image_results(query)
            
        try:
            results = list(self.search_engine.images(query, max_results=self.search_limit))
            processed_results = []
            
            for result in results:
                processed_results.append({
                    "title": result.get("title", ""),
                    "image_url": result.get("image", ""),
                    "source_url": result.get("url", ""),
                    "width": result.get("width", ""),
                    "height": result.get("height", "")
                })
            
            return processed_results
        except Exception as e:
            logger.error(f"Image search error: {e}")
            # Fallback to mock results if search fails
            logger.info("Falling back to mock image results")
            return self._generate_mock_image_results(query)
            
    def _generate_mock_search_results(self, query: str) -> List[Dict[str, Any]]:
        """Generate mock search results for the given query."""
        # Create some basic mock data based on the query
        mock_results = []
        
        # Get keywords from the query
        keywords = query.split()
        main_keyword = keywords[0] if keywords else "example"
        
        # Common domains for mock results
        domains = ["example.com", "mockresults.org", "searchdemo.net", "infoportal.com", "reference.io"]
        
        # Create some variation in titles and snippets
        titles = [
            f"Understanding {query} - Complete Guide",
            f"{query.title()} Tutorial for Beginners",
            f"Advanced {query.title()} Techniques",
            f"Everything You Need to Know About {query}",
            f"{query.title()} - Official Documentation and Resources"
        ]
        
        snippets = [
            f"Comprehensive guide to {query} with examples and tutorials. Learn the basics and advanced concepts of {query}.",
            f"This {query} tutorial covers all aspects from beginning to advanced topics. Perfect for those looking to understand {main_keyword}.",
            f"Discover advanced techniques for working with {query}. This resource provides in-depth information on {main_keyword} applications.",
            f"A complete reference for {query} with detailed explanations and code samples. Includes best practices for {main_keyword}.",
            f"Official documentation and resources for {query}. Includes API references, examples, and community support options."
        ]
        
        # Generate the mock results
        for i in range(min(self.search_limit, 5)):
            mock_results.append({
                "title": titles[i],
                "url": f"https://{domains[i]}/{main_keyword.lower()}/guide",
                "snippet": snippets[i],
                "mock_result": True  # Flag to indicate this is a mock result
            })
            
        return mock_results
        
    def _generate_mock_news_results(self, query: str) -> List[Dict[str, Any]]:
        """Generate mock news results for the given query."""
        # Create some basic mock news data based on the query
        mock_results = []
        
        # Get keywords from the query
        keywords = query.split()
        main_keyword = keywords[0] if keywords else "topic"
        
        # Generate some random recent dates
        today = datetime.now()
        dates = [
            (today - timedelta(days=1)).strftime("%Y-%m-%d"),
            (today - timedelta(days=2)).strftime("%Y-%m-%d"),
            (today - timedelta(days=3)).strftime("%Y-%m-%d"),
            (today - timedelta(days=5)).strftime("%Y-%m-%d"),
            (today - timedelta(days=7)).strftime("%Y-%m-%d")
        ]
        
        # News sources
        sources = ["Mock News Network", "Daily Mock", "Mock Tribune", "The Mock Times", "Mock Herald"]
        
        # Create some variation in titles and snippets
        titles = [
            f"Breaking: New Developments in {query.title()}",
            f"Experts Reveal Latest {query.title()} Trends",
            f"{query.title()} Makes Headlines Across the Industry",
            f"New Study Reveals Surprising Facts About {query.title()}",
            f"{query.title()} Revolution: What You Need to Know"
        ]
        
        snippets = [
            f"Recent developments in {query} have shocked experts. The latest news suggests significant changes in how we understand {main_keyword}.",
            f"Industry experts revealed the latest trends in {query} yesterday. These insights suggest a major shift in {main_keyword} applications.",
            f"{query.title()} is making headlines as new information comes to light. Analysts suggest this could transform the entire {main_keyword} landscape.",
            f"A groundbreaking study on {query} published today reveals surprising facts that contradict previous understanding of {main_keyword}.",
            f"The {query} revolution is gaining momentum according to recent reports. Experts say this represents a paradigm shift in {main_keyword} technology."
        ]
        
        # Generate the mock results
        for i in range(min(self.search_limit, 5)):
            mock_results.append({
                "title": titles[i],
                "url": f"https://news.{sources[i].lower().replace(' ', '')}.com/{main_keyword.lower()}/article{i+1}",
                "source": sources[i],
                "snippet": snippets[i],
                "date": dates[i],
                "mock_result": True  # Flag to indicate this is a mock result
            })
            
        return mock_results
        
    def _generate_mock_image_results(self, query: str) -> List[Dict[str, Any]]:
        """Generate mock image search results for the given query."""
        # Create some basic mock image data based on the query
        mock_results = []
        
        # Get keywords from the query
        keywords = query.split()
        main_keyword = keywords[0] if keywords else "image"
        
        # Common image hosting domains
        domains = ["mockimages.com", "imagerepo.org", "picturelibrary.net", "visualdata.io", "imagecollection.com"]
        
        # Create some variation in titles
        titles = [
            f"High-quality {query.title()} image",
            f"{query.title()} visualization",
            f"Detailed {query.title()} photograph",
            f"{query.title()} illustration",
            f"{query.title()} reference image"
        ]
        
        # Image dimensions
        dimensions = [
            {"width": 800, "height": 600},
            {"width": 1024, "height": 768},
            {"width": 1280, "height": 720},
            {"width": 1920, "height": 1080},
            {"width": 640, "height": 480}
        ]
        
        # Generate the mock results
        for i in range(min(self.search_limit, 5)):
            mock_results.append({
                "title": titles[i],
                "image_url": f"https://images.{domains[i]}/{main_keyword.lower()}/image{i+1}.jpg",
                "source_url": f"https://{domains[i]}/{main_keyword.lower()}/gallery",
                "width": dimensions[i]["width"],
                "height": dimensions[i]["height"],
                "mock_result": True  # Flag to indicate this is a mock result
            })
            
        return mock_results 