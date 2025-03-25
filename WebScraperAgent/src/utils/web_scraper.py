"""
Web scraping utilities for the Web Scraper Agent.
"""

import time
import requests
import logging
from typing import Dict, Any, Optional, List, Union

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import BeautifulSoup, but don't fail if not available
BS4_AVAILABLE = False
try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    logger.warning("BeautifulSoup (bs4) module not available. Web scraping functionality will be limited to mock mode.")
    
# Try to import validators, but don't fail if not available
VALIDATORS_AVAILABLE = False
try:
    import validators
    VALIDATORS_AVAILABLE = True
except ImportError:
    logger.warning("validators module not available. URL validation will be simplified.")

from requests.exceptions import RequestException

# Import constants or use defaults if import fails
try:
    from config.config import (
        DEFAULT_USER_AGENT,
        REQUEST_TIMEOUT,
        MAX_RETRIES,
        RETRY_DELAY
    )
except ImportError:
    logger.warning("Failed to import config. Using default values.")
    DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    REQUEST_TIMEOUT = 10
    MAX_RETRIES = 3
    RETRY_DELAY = 1

class MockBeautifulSoup:
    """Mock implementation of BeautifulSoup for when bs4 is not available"""
    
    def __init__(self, html_content, parser=None):
        self.html_content = html_content
        self.parser = parser
        self.title = MockTag("title", "Mock Page Title")
        
    def get_text(self):
        """Simple mock implementation of get_text"""
        # Return a simplified version of the HTML content
        return self._clean_html(self.html_content)
    
    def _clean_html(self, html):
        """Very basic HTML cleaning"""
        # Remove HTML tags with a very simple approach
        import re
        text = re.sub(r'<[^>]+>', ' ', html)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
        
    def find_all(self, tag, **kwargs):
        """Mock implementation of find_all"""
        if tag == 'meta':
            return [
                MockTag('meta', '', {'name': 'description', 'content': 'Mock page description'}),
                MockTag('meta', '', {'property': 'og:title', 'content': 'Mock OG Title'})
            ]
        elif tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            return [MockTag(tag, f'Mock {tag.upper()} Heading')]
        elif tag == 'a':
            return [
                MockTag('a', 'Mock Link 1', {'href': 'https://example.com/page1'}),
                MockTag('a', 'Mock Link 2', {'href': 'https://example.com/page2'}),
                MockTag('a', 'Mock Link 3', {'href': 'https://example.com/page3'})
            ]
        return []
        
    def select(self, css_selector):
        """Mock implementation of select"""
        return [MockTag('div', f'Mock element matching {css_selector}')]
        
    def __call__(self, tags_to_remove):
        """Mock implementation of the call method to handle removal of elements"""
        return [MockTag(tag, f'Mock {tag} content') for tag in tags_to_remove]

class MockTag:
    """Mock implementation of a BeautifulSoup Tag"""
    
    def __init__(self, name, content, attrs=None):
        self.name = name
        self.content = content
        self.attrs = attrs or {}
        
    def get_text(self):
        """Return the content of the tag"""
        return self.content
        
    def extract(self):
        """Mock extraction method"""
        pass
        
    def __getitem__(self, key):
        """Allow dictionary-like access to attributes"""
        return self.attrs.get(key, '')
        
    def get(self, key, default=None):
        """Get attribute value by key with optional default"""
        return self.attrs.get(key, default)

class WebScraper:
    """Utility class for web scraping operations."""

    def __init__(self, user_agent: str = DEFAULT_USER_AGENT):
        """
        Initialize the WebScraper with a user agent.
        
        Args:
            user_agent: Custom user agent string to use for requests
        """
        self.headers = {"User-Agent": user_agent}
        self.use_mock = not BS4_AVAILABLE
        if self.use_mock:
            logger.warning("WebScraper initialized in mock mode due to missing bs4 module")
    
    def is_valid_url(self, url: str) -> bool:
        """
        Check if a URL is valid.
        
        Args:
            url: URL string to validate
            
        Returns:
            bool: True if URL is valid, False otherwise
        """
        if VALIDATORS_AVAILABLE:
            return validators.url(url) is True
        else:
            # Simple URL validation when validators module is not available
            return (
                url.startswith(('http://', 'https://')) and 
                '.' in url.split('/')[2] if len(url.split('/')) > 2 else False
            )
    
    def get_page_content(self, url: str, retry: int = MAX_RETRIES) -> Optional[str]:
        """
        Fetch the HTML content of a webpage.
        
        Args:
            url: URL of the webpage to fetch
            retry: Number of retries in case of failure
            
        Returns:
            Optional[str]: HTML content as string or None if failed
        """
        # If in mock mode, return mock HTML
        if self.use_mock:
            logger.info(f"Using mock content for URL: {url}")
            return self._generate_mock_html(url)
            
        if not self.is_valid_url(url):
            logger.warning(f"Invalid URL: {url}")
            return None
            
        attempts = 0
        while attempts < retry:
            try:
                response = requests.get(url, headers=self.headers, timeout=REQUEST_TIMEOUT)
                response.raise_for_status()
                return response.text
            except RequestException as e:
                attempts += 1
                if attempts < retry:
                    logger.warning(f"Request failed, retrying {attempts}/{retry}. Error: {e}")
                    time.sleep(RETRY_DELAY)
                else:
                    logger.error(f"Failed to fetch {url} after {retry} attempts. Error: {e}")
                    return None
    
    def parse_html(self, html_content: str) -> Union['MockBeautifulSoup', Any, None]:
        """
        Parse HTML content using BeautifulSoup or MockBeautifulSoup.
        
        Args:
            html_content: HTML content as string
            
        Returns:
            Union: BeautifulSoup or MockBeautifulSoup object or None if parsing failed
        """
        if not html_content:
            return None
            
        try:
            if BS4_AVAILABLE:
                return BeautifulSoup(html_content, "html.parser")
            else:
                # Use mock implementation when bs4 is not available
                return MockBeautifulSoup(html_content, "html.parser")
        except Exception as e:
            logger.error(f"Failed to parse HTML: {e}")
            return None
    
    def extract_text_content(self, html_content: str) -> str:
        """
        Extract clean text content from HTML.
        
        Args:
            html_content: HTML content as string
            
        Returns:
            str: Clean text extracted from HTML
        """
        soup = self.parse_html(html_content)
        if not soup:
            return ""
            
        # Remove script and style elements
        for script_or_style in soup(["script", "style", "header", "footer", "nav"]):
            script_or_style.extract()
            
        # Get text
        text = soup.get_text()
        
        # If in mock mode and text is very short, add more content
        if self.use_mock and len(text) < 200:
            return self._generate_mock_content()
        
        # Break into lines and remove leading and trailing space on each
        lines = (line.strip() for line in text.splitlines())
        
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        
        # Drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        return text
    
    def extract_structured_data(self, url: str) -> Dict[str, Any]:
        """
        Extract structured data from a webpage.
        
        Args:
            url: URL of the webpage
            
        Returns:
            Dict[str, Any]: Structured data extracted from the webpage
        """
        html_content = self.get_page_content(url)
        if not html_content:
            return {"error": f"Failed to fetch content from {url}"}
            
        soup = self.parse_html(html_content)
        if not soup:
            return {"error": "Failed to parse HTML content"}
        
        # Extract basic metadata
        title = soup.title.get_text() if hasattr(soup, 'title') and soup.title else "No title found"
        
        # Extract meta tags
        meta_tags = {}
        for meta in soup.find_all("meta"):
            name = meta.get("name") or meta.get("property")
            if name:
                content = meta.get("content")
                if content:
                    meta_tags[name] = content
        
        # Extract all headings
        headings = {}
        for level in range(1, 7):
            heading_tags = soup.find_all(f'h{level}')
            if heading_tags:
                headings[f'h{level}'] = [tag.get_text().strip() for tag in heading_tags]
        
        # Extract links
        links = []
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            text = a_tag.get_text().strip()
            if href and text and not href.startswith('#'):
                links.append({"text": text, "href": href})
        
        # Extract main text content
        main_content = self.extract_text_content(html_content)
        
        # Compile structured data
        structured_data = {
            "url": url,
            "title": title,
            "meta_tags": meta_tags,
            "headings": headings,
            "links": links[:20],  # Limit to first 20 links
            "main_content": main_content,
        }
        
        return structured_data
    
    def extract_specific_elements(self, url: str, css_selector: str) -> List[str]:
        """
        Extract specific elements using CSS selectors.
        
        Args:
            url: URL of the webpage
            css_selector: CSS selector to identify elements
            
        Returns:
            List[str]: List of text content from matched elements
        """
        html_content = self.get_page_content(url)
        if not html_content:
            return []
            
        soup = self.parse_html(html_content)
        if not soup:
            return []
        
        elements = soup.select(css_selector)
        return [el.get_text().strip() for el in elements]
        
    def _generate_mock_html(self, url: str) -> str:
        """Generate mock HTML content for testing purposes."""
        domain = url.split('/')[2] if len(url.split('/')) > 2 else 'example.com'
        path = '/'.join(url.split('/')[3:]) if len(url.split('/')) > 3 else ''
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mock Page for {domain}/{path}</title>
            <meta name="description" content="This is a mock page generated for testing the WebScraperAgent.">
            <meta property="og:title" content="Mock OG Title for {domain}">
            <meta property="og:description" content="Mock OG description for this page.">
        </head>
        <body>
            <header>
                <nav>
                    <ul>
                        <li><a href="https://{domain}/">Home</a></li>
                        <li><a href="https://{domain}/about">About</a></li>
                        <li><a href="https://{domain}/contact">Contact</a></li>
                    </ul>
                </nav>
            </header>
            <main>
                <h1>Welcome to {domain}</h1>
                <p>This is a mock webpage generated for {url} since BeautifulSoup is not available.</p>
                <h2>Features</h2>
                <ul>
                    <li>Mock content generation</li>
                    <li>Simulated web scraping</li>
                    <li>Testing compatibility</li>
                </ul>
                <h2>About this Page</h2>
                <p>This page was automatically generated to test the WebScraperAgent's functionality 
                when the real web scraping capabilities are limited. It contains various HTML elements 
                to ensure the agent can process different types of content.</p>
                <h3>Technical Details</h3>
                <p>The WebScraperAgent uses a mock implementation when BeautifulSoup is not available, 
                allowing for testing and demonstration without the actual web scraping dependencies.</p>
            </main>
            <footer>
                <p>&copy; 2025 Mock WebScraperAgent. All rights reserved.</p>
            </footer>
        </body>
        </html>
        """
        
    def _generate_mock_content(self) -> str:
        """Generate mock text content for testing purposes."""
        return """
        Welcome to the mock content page.
        
        This content is generated for testing purposes when BeautifulSoup is not available.
        
        The WebScraperAgent is designed to analyze web content and provide structured information.
        It can process both textual and HTML content, extracting key insights and organizing them
        in a meaningful way.
        
        Key Features:
        - Content extraction from URLs
        - Text analysis and summarization
        - Structured data organization
        - Question answering based on content
        
        This mock content ensures that the WebScraperAgent can be tested even without all dependencies.
        In a real-world scenario, the agent would connect to actual websites and extract genuine content
        for analysis.
        
        Technical Requirements:
        - Python 3.8 or higher
        - BeautifulSoup for HTML parsing
        - Requests for HTTP operations
        - Natural language processing capabilities
        
        The WebScraperAgent represents a sophisticated approach to automated web content analysis
        and information extraction, making it easier to process large amounts of web-based information.
        """ 