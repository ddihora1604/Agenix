"""
Configuration module for the Web Scraper Agent.
Contains environment variables and configuration settings.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Agent Configuration
DEFAULT_TEMPERATURE = 0.7  # Higher temperature for more creative, detailed responses
DEFAULT_MODEL = "gemini-1.5-flash"
DEFAULT_MAX_TOKENS = 1000000000  # Maximum token limit for comprehensive, detailed responses
DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Web Scraping Configuration
REQUEST_TIMEOUT = 30  # seconds
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

# Search Configuration
SEARCH_LIMIT = 5  # Number of search results to consider 