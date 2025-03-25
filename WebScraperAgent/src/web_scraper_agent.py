"""
Web Scraper Agent for extracting structured data from websites.
"""

import os
import sys
import logging
import json
from typing import Dict, Any, List, Union, Optional
import re

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Try to import validators, but don't fail if not available
VALIDATORS_AVAILABLE = False
try:
    import validators
    VALIDATORS_AVAILABLE = True
except ImportError:
    logger.warning("validators module not available. URL validation will be simplified.")

# Try to import langchain modules, but don't fail if not available
LANGCHAIN_AVAILABLE = False
try:
    from langchain.agents import AgentType, AgentExecutor, initialize_agent
    from langchain.tools import tool, Tool
    from langchain.prompts import PromptTemplate
    from langchain_core.messages import SystemMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    logger.warning("LangChain modules not available. Using simplified agent functionality.")

from src.utils.web_scraper import WebScraper
from src.utils.search_utils import WebSearcher
from src.utils.gemini_client import GeminiClient

# Import config or use defaults if import fails
try:
    from config.config import GOOGLE_API_KEY, DEFAULT_MODEL, DEFAULT_TEMPERATURE
except ImportError:
    logger.warning("Failed to import config. Using default values.")
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
    DEFAULT_MODEL = "gemini-1.5-flash"
    DEFAULT_TEMPERATURE = 0.7

class SimplifiedAgent:
    """
    Simplified agent implementation when LangChain is not available.
    Provides basic routing to different tools based on input type.
    """
    
    def __init__(self, gemini_client, web_scraper, web_searcher):
        """Initialize with the necessary components."""
        self.gemini_client = gemini_client
        self.web_scraper = web_scraper
        self.web_searcher = web_searcher
        logger.info("Initialized SimplifiedAgent")
        
    def invoke(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the input and route to appropriate function.
        
        Args:
            params: Dictionary with input parameters
            
        Returns:
            Dict[str, Any]: Processing results
        """
        user_input = params.get("input", "")
        
        # Check if the input contains a URL extraction request
        if "Extract structured data from the following URL:" in user_input:
            # Extract URL from the input
            url_match = re.search(r"URL: (https?://\S+)", user_input)
            if url_match:
                url = url_match.group(1)
                return self._extract_structured_data(url)
            else:
                return {"error": "No valid URL found in the input"}
                
        # Check if the input contains a search request
        elif "Search for information about:" in user_input:
            # Extract search query from the input
            query_match = re.search(r"about: (.+)$", user_input)
            if query_match:
                query = query_match.group(1).strip()
                return self._search_web(query)
            else:
                return {"error": "No valid search query found in the input"}
                
        # Default handling for other types of input
        else:
            # Try to detect if it's a URL
            if user_input.startswith(('http://', 'https://')):
                return self._extract_structured_data(user_input)
            else:
                return self._search_web(user_input)
                
    def _extract_structured_data(self, url: str) -> Dict[str, Any]:
        """Extract structured data from a URL."""
        try:
            # Check if the URL is valid
            is_valid = False
            if VALIDATORS_AVAILABLE:
                is_valid = validators.url(url) is True
            else:
                is_valid = url.startswith(('http://', 'https://'))
                
            if not is_valid:
                return {"error": f"Invalid URL: {url}"}
                
            # Get structured data
            structured_data = self.web_scraper.extract_structured_data(url)
            
            # If there's main content, try to enhance it with Gemini
            if "main_content" in structured_data and structured_data["main_content"]:
                content = structured_data["main_content"]
                
                # Truncate if needed to avoid token limits
                if len(content) > 8000:
                    content = content[:8000]
                    
                # Add a summary using Gemini
                try:
                    summary = self.gemini_client.summarize_content(content)
                    structured_data["content_summary"] = summary
                except Exception as e:
                    logger.warning(f"Failed to generate summary: {e}")
                    
                # Try to extract more structured information
                try:
                    extraction_instructions = "Extract key information, main topics, and important points from this webpage content."
                    enhanced_data = self.gemini_client.extract_structured_info(content, extraction_instructions)
                    
                    # Merge the enhanced data with our basic extraction
                    for key, value in enhanced_data.items():
                        if key not in structured_data:
                            structured_data[key] = value
                except Exception as e:
                    logger.warning(f"Failed to extract enhanced information: {e}")
            
            return structured_data
        except Exception as e:
            logger.error(f"Error extracting structured data: {e}")
            return {"error": f"Failed to extract data from {url}: {str(e)}"}
            
    def _search_web(self, query: str) -> Dict[str, Any]:
        """Search the web for information."""
        try:
            # Get search results
            search_results = self.web_searcher.search(query)
            
            # If we have results, try to enhance them
            if search_results:
                # Format the search results as text
                results_text = "Search Results:\n"
                for i, result in enumerate(search_results[:3]):  # Limit to first 3 for token efficiency
                    results_text += f"\n{i+1}. {result['title']}\n"
                    results_text += f"   URL: {result['url']}\n"
                    results_text += f"   {result['snippet']}\n"
                
                # Try to extract insights from the search results
                try:
                    extraction_instructions = f"Analyze these search results for '{query}' and extract key insights and information."
                    insights = self.gemini_client.extract_structured_info(results_text, extraction_instructions)
                    
                    # Return both the raw results and the enhanced insights
                    return {
                        "query": query,
                        "search_results": search_results,
                        "insights": insights
                    }
                except Exception as e:
                    logger.warning(f"Failed to extract insights from search results: {e}")
            
            # Fallback to just returning the search results
            return {
                "query": query,
                "search_results": search_results
            }
        except Exception as e:
            logger.error(f"Error searching for information: {e}")
            return {"error": f"Failed to search for '{query}': {str(e)}"}

class WebScraperAgent:
    """
    Web Scraper Agent for extracting structured data from websites.
    Uses either LangChain or a simplified approach for the agent functionality.
    """
    
    def __init__(
        self,
        api_key: str = GOOGLE_API_KEY,
        model_name: str = DEFAULT_MODEL,
        temperature: float = DEFAULT_TEMPERATURE,
        force_mock: bool = False
    ):
        """
        Initialize the Web Scraper Agent.
        
        Args:
            api_key: Google API key for accessing Gemini
            model_name: Name of the Gemini model to use
            temperature: Temperature parameter for generation
            force_mock: Force using mock responses regardless of API key validity
        """
        # Check if API key is valid
        if not api_key or api_key == "your_google_api_key_here":
            logger.warning("Invalid or missing API key - forcing mock mode")
            force_mock = True
            
        # Initialize components
        self.gemini_client = GeminiClient(
            api_key=api_key, 
            model_name=model_name
        )
        self.web_scraper = WebScraper()
        self.web_searcher = WebSearcher()
        self.use_mock = force_mock or self.gemini_client.use_mock
        
        # Initialize agent with appropriate implementation
        try:
            if LANGCHAIN_AVAILABLE and not self.use_mock:
                self.agent = self._create_langchain_agent()
                self.using_langchain = True
                logger.info("Created LangChain-based agent")
            else:
                self.agent = SimplifiedAgent(self.gemini_client, self.web_scraper, self.web_searcher)
                self.using_langchain = False
                logger.info("Created simplified agent without LangChain")
        except Exception as e:
            logger.error(f"Failed to create agent: {e}")
            self.agent = SimplifiedAgent(self.gemini_client, self.web_scraper, self.web_searcher)
            self.using_langchain = False
            self.use_mock = True
            logger.info("Fallback to simplified agent due to error")
    
    def _create_langchain_agent(self) -> Any:
        """
        Create a LangChain agent with the necessary tools.
        Only called when LangChain is available.
        
        Returns:
            Any: Initialized agent with tools
        """
        # Create tools using Tool class
        tools = [
            Tool(
                name="GetWebpageContent",
                func=lambda url: self.get_webpage_content(url),
                description="Get the raw content of a webpage. Input should be a URL."
            ),
            Tool(
                name="ExtractStructuredData",
                func=lambda url: self.extract_structured_data(url),
                description="Extract structured data from a webpage. Input should be a URL."
            ),
            Tool(
                name="SearchWeb",
                func=lambda query: self.search_web(query),
                description="Search the web for information. Input should be a search query."
            ),
            Tool(
                name="ExtractSpecificElements",
                func=lambda url_and_selector: self.extract_specific_elements(url_and_selector),
                description="Extract specific elements from a webpage using CSS selectors. Input should be in the format 'url | css_selector'."
            ),
            Tool(
                name="SummarizeWebpage",
                func=lambda url: self.summarize_webpage(url),
                description="Summarize the content of a webpage. Input should be a URL."
            ),
            Tool(
                name="AnswerQuestionFromWebpage",
                func=lambda url_and_question: self.answer_question_from_webpage(url_and_question),
                description="Answer a specific question based on the content of a webpage. Input should be in the format 'url | question'."
            )
        ]
        
        # Create system message for the agent
        system_message = SystemMessage(
            content="""You are a Web Scraper Agent specialized in extracting structured data from websites.
            You can process URLs to extract content or search the web for information.
            For any URL input, you will extract relevant information and organize it in a structured format.
            For any search query, you will find relevant webpages and extract useful information from them.
            
            Please follow these guidelines:
            1. Always validate URLs before processing them
            2. Extract information that is relevant to the user's request
            3. For structured data extraction, return information in a clean, organized format
            4. For search queries, provide results from the most relevant sources
            5. Always respect website terms of service and rate limits during scraping
            6. Handle errors gracefully and provide informative error messages
            
            When extracting data, focus on:
            - Main content of the page
            - Important metadata and headers
            - Relevant tables, lists, and structured elements
            - Key facts and information related to the user's query
            """
        )
        
        # Initialize the agent
        agent = initialize_agent(
            tools,
            self.gemini_client.llm,
            agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            handle_parsing_errors=True,
            system_message=system_message
        )
        
        return agent
    
    def get_webpage_content(self, url: str) -> str:
        """
        Get the raw content of a webpage.
        
        Args:
            url: URL of the webpage to fetch
            
        Returns:
            str: Raw text content of the webpage
        """
        # Check if URL is valid
        is_valid = False
        if VALIDATORS_AVAILABLE:
            is_valid = validators.url(url) is True
        else:
            is_valid = url.startswith(('http://', 'https://'))
            
        if not is_valid:
            return f"Error: Invalid URL - {url}"
            
        html_content = self.web_scraper.get_page_content(url)
        if not html_content:
            return f"Error: Failed to fetch content from {url}"
            
        text_content = self.web_scraper.extract_text_content(html_content)
        return text_content[:8000]  # Limit content to 8000 chars to avoid token limits
    
    def extract_structured_data(self, url: str) -> Dict[str, Any]:
        """
        Extract structured data from a webpage.
        
        Args:
            url: URL of the webpage to extract data from
            
        Returns:
            Dict[str, Any]: Structured data extracted from the webpage
        """
        try:
            # Check if URL is valid
            is_valid = False
            if VALIDATORS_AVAILABLE:
                is_valid = validators.url(url) is True
            else:
                is_valid = url.startswith(('http://', 'https://'))
                
            if not is_valid:
                return {"error": f"Invalid URL - {url}"}
                
            structured_data = self.web_scraper.extract_structured_data(url)
            
            # Truncate main content to avoid token limits
            if "main_content" in structured_data and structured_data["main_content"]:
                structured_data["main_content"] = structured_data["main_content"][:5000]
                
            return structured_data
        except Exception as e:
            logger.error(f"Error in extract_structured_data: {e}")
            return {
                "error": "Failed to extract structured data",
                "url": url,
                "mock_response": True,
                "message": str(e)
            }
    
    def search_web(self, query: str) -> List[Dict[str, Any]]:
        """
        Search the web for information.
        
        Args:
            query: Search query string
            
        Returns:
            List[Dict[str, Any]]: List of search results
        """
        try:
            return self.web_searcher.search(query)
        except Exception as e:
            logger.error(f"Error in search_web: {e}")
            return [{
                "title": "Search Error",
                "url": "#",
                "snippet": f"An error occurred during search: {str(e)}",
                "mock_response": True
            }]
    
    def extract_specific_elements(self, url_and_selector: str) -> List[str]:
        """
        Extract specific elements from a webpage using CSS selectors.
        Format: "url | css_selector"
        
        Args:
            url_and_selector: URL and CSS selector separated by a pipe character
            
        Returns:
            List[str]: List of extracted elements
        """
        try:
            parts = url_and_selector.split("|", 1)
            if len(parts) != 2:
                return ["Error: Input should be in the format 'url | css_selector'"]
                
            url = parts[0].strip()
            css_selector = parts[1].strip()
            
            # Check if URL is valid
            is_valid = False
            if VALIDATORS_AVAILABLE:
                is_valid = validators.url(url) is True
            else:
                is_valid = url.startswith(('http://', 'https://'))
                
            if not is_valid:
                return [f"Error: Invalid URL - {url}"]
                
            return self.web_scraper.extract_specific_elements(url, css_selector)
        except Exception as e:
            logger.error(f"Error extracting elements: {e}")
            return [f"Error extracting elements: {str(e)}"]
    
    def summarize_webpage(self, url: str) -> str:
        """
        Summarize the content of a webpage.
        
        Args:
            url: URL of the webpage to summarize
            
        Returns:
            str: Summary of the webpage content
        """
        try:
            # Check if URL is valid
            is_valid = False
            if VALIDATORS_AVAILABLE:
                is_valid = validators.url(url) is True
            else:
                is_valid = url.startswith(('http://', 'https://'))
                
            if not is_valid:
                return f"Error: Invalid URL - {url}"
                
            html_content = self.web_scraper.get_page_content(url)
            if not html_content:
                return f"Error: Failed to fetch content from {url}"
                
            text_content = self.web_scraper.extract_text_content(html_content)
            return self.gemini_client.summarize_content(text_content)
        except Exception as e:
            logger.error(f"Error summarizing webpage: {e}")
            return f"Error summarizing webpage: {str(e)}"
    
    def answer_question_from_webpage(self, url_and_question: str) -> str:
        """
        Answer a specific question based on the content of a webpage.
        Format: "url | question"
        
        Args:
            url_and_question: URL and question separated by a pipe character
            
        Returns:
            str: Answer to the question based on the webpage content
        """
        try:
            parts = url_and_question.split("|", 1)
            if len(parts) != 2:
                return "Error: Input should be in the format 'url | question'"
                
            url = parts[0].strip()
            question = parts[1].strip()
            
            # Check if URL is valid
            is_valid = False
            if VALIDATORS_AVAILABLE:
                is_valid = validators.url(url) is True
            else:
                is_valid = url.startswith(('http://', 'https://'))
                
            if not is_valid:
                return f"Error: Invalid URL - {url}"
                
            html_content = self.web_scraper.get_page_content(url)
            if not html_content:
                return f"Error: Failed to fetch content from {url}"
                
            text_content = self.web_scraper.extract_text_content(html_content)
            return self.gemini_client.answer_question(text_content, question)
        except Exception as e:
            logger.error(f"Error answering question: {e}")
            return f"Error answering question: {str(e)}"
    
    def process_input(self, user_input: str) -> Dict[str, Any]:
        """
        Process user input - either a URL or a search query.
        
        Args:
            user_input: URL or search query
            
        Returns:
            Dict[str, Any]: Processing results
        """
        try:
            # If using the simplified agent, no need for additional logic
            if not self.using_langchain:
                # For URLs, invoke the agent with a URL extraction request
                if user_input.startswith(('http://', 'https://')):
                    return self.agent.invoke({"input": f"Extract structured data from the following URL: {user_input}"})
                else:
                    # For search queries, invoke the agent with a search request
                    return self.agent.invoke({"input": f"Search for information about: {user_input}"})
            
            # Using the LangChain agent
            # Check if input is a URL
            is_valid = False
            if VALIDATORS_AVAILABLE:
                is_valid = validators.url(user_input) is True
            else:
                is_valid = user_input.startswith(('http://', 'https://'))
            
            if is_valid:
                # Process as URL
                return self.agent.invoke({"input": f"Extract structured data from the following URL: {user_input}"})
            else:
                # Process as search query
                return self.agent.invoke({"input": f"Search for information about: {user_input}"})
        except Exception as e:
            logger.error(f"Error processing input: {e}")
            # Enhanced fallback response with more context
            error_message = str(e)
            if "quota" in error_message.lower():
                error_message = "API quota exceeded. Using basic web scraping/search as fallback."
            
            # Try basic web scraping/search as fallback
            try:
                if user_input.startswith(('http://', 'https://')):
                    structured_data = self.web_scraper.extract_structured_data(user_input)
                    return {
                        "error": error_message,
                        "input": user_input,
                        "fallback_response": True,
                        "data": structured_data
                    }
                else:
                    search_results = self.web_searcher.search(user_input)
                    return {
                        "error": error_message,
                        "input": user_input,
                        "fallback_response": True,
                        "results": search_results
                    }
            except Exception as fallback_error:
                logger.error(f"Fallback processing failed: {fallback_error}")
                return {
                    "error": error_message,
                    "input": user_input,
                    "fallback_response": True,
                    "message": "Both API and fallback processing failed. Please try again later."
                }
            
    def custom_extraction(self, url: str, extraction_instructions: str) -> Dict[str, Any]:
        """
        Perform custom data extraction based on specific instructions.
        
        Args:
            url: URL of the webpage to extract data from
            extraction_instructions: Specific instructions for what to extract
            
        Returns:
            Dict[str, Any]: Custom extracted data
        """
        try:
            # Check if URL is valid
            is_valid = False
            if VALIDATORS_AVAILABLE:
                is_valid = validators.url(url) is True
            else:
                is_valid = url.startswith(('http://', 'https://'))
                
            if not is_valid:
                return {"error": f"Invalid URL - {url}"}
                
            html_content = self.web_scraper.get_page_content(url)
            if not html_content:
                return {"error": f"Failed to fetch content from {url}"}
                
            text_content = self.web_scraper.extract_text_content(html_content)
            
            # Use Gemini to extract structured information
            return self.gemini_client.extract_structured_info(text_content, extraction_instructions)
        except Exception as e:
            logger.error(f"Error in custom_extraction: {e}")
            # Create a fallback response
            return {
                "error": "An error occurred during extraction",
                "url": url,
                "fallback_response": True,
                "message": "The extraction could not be completed due to an error. Please check your API key and try again."
            } 