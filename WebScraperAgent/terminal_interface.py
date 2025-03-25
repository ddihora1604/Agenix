#!/usr/bin/env python3
"""
Terminal Interface for the Web Scraper Agent.
This script provides a simple terminal interface for interacting with the Web Scraper Agent.
Users can input either a URL or a text query, and the results will be displayed in the terminal.
"""

import os
import sys
import json
import validators
from typing import Dict, Any
from dotenv import load_dotenv

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the WebScraperAgent and configuration
from src.web_scraper_agent import WebScraperAgent
from config.config import GOOGLE_API_KEY

def print_json(data: Dict[str, Any]) -> None:
    """
    Pretty print JSON data with enhanced formatting.
    
    Args:
        data: Data to print as JSON
    """
    def format_section(title: str, content: Any) -> None:
        print(f"\n{title}")
        print("=" * len(title))
        if isinstance(content, (dict, list)):
            print(json.dumps(content, indent=2, ensure_ascii=False))
        else:
            print(content)
    
    # Print extraction info if available
    if "_extraction_info" in data:
        info = data["_extraction_info"]
        print("\n🔍 Extraction Information")
        print("=====================")
        if info.get("mock_response"):
            print("⚠️  Mock Response Mode")
        print(f"Model: {info.get('model', 'Unknown')}")
        if "note" in info:
            print(f"Note: {info['note']}")
        print()
    
    # Print metadata
    if "metadata" in data:
        format_section("📋 Metadata", data["metadata"])
    
    # Print main content
    if "main_content" in data:
        format_section("📄 Main Content", data["main_content"])
    
    # Print sections
    if "sections" in data:
        print("\n📑 Sections")
        print("=========")
        for section in data["sections"]:
            print(f"\n{section.get('title', 'Untitled Section')} ", end='')
            if "importance" in section:
                importance = section["importance"].lower()
                if importance == "high":
                    print("(❗ High Priority)")
                elif importance == "medium":
                    print("(⚡ Medium Priority)")
                else:
                    print("(ℹ️ Low Priority)")
            print("-" * 40)
            print(section.get("content", "No content"))
    
    # Print key points
    if "key_points" in data:
        print("\n🎯 Key Points")
        print("===========")
        for i, point in enumerate(data["key_points"], 1):
            print(f"\n{i}. {point.get('point', 'No point specified')}")
            if "context" in point:
                print(f"   Context: {point['context']}")
            if "relevance" in point:
                print(f"   Relevance: {point['relevance']}")
    
    # Print relationships
    if "relationships" in data:
        format_section("🔗 Relationships", data["relationships"])
    
    # Print additional info
    if "additional_info" in data:
        format_section("ℹ️  Additional Information", data["additional_info"])
    
    # Print any remaining fields that don't fit the standard format
    standard_fields = {"_extraction_info", "metadata", "main_content", "sections", 
                      "key_points", "relationships", "additional_info"}
    remaining_fields = set(data.keys()) - standard_fields
    
    if remaining_fields:
        print("\n📌 Other Information")
        print("================")
        for field in remaining_fields:
            format_section(field, data[field])

def process_url(agent: WebScraperAgent, url: str) -> None:
    """
    Process a URL.
    
    Args:
        agent: Web Scraper Agent instance
        url: URL to process
    """
    if not validators.url(url):
        print(f"Error: Invalid URL - {url}")
        return
    
    print(f"Processing URL: {url}")
    result = agent.process_input(url)
    
    # Handle different response types
    if "error" in result:
        print(f"\n⚠️ Warning: {result['error']}")
        if "fallback_response" in result:
            print("Using fallback processing...")
    
    if "mock_response" in result:
        print("\nℹ️ Note: Running in mock/fallback mode")
        print(f"Message: {result['message']}")
    
    if "data" in result:
        print("\n📊 Extracted Data:")
        print_json(result["data"])
    else:
        print("\n📄 Response:")
        print_json(result)

def process_query(agent: WebScraperAgent, query: str) -> None:
    """
    Process a search query.
    
    Args:
        agent: Web Scraper Agent instance
        query: Search query
    """
    print(f"Processing query: {query}")
    result = agent.process_input(query)
    
    # Handle different response types
    if "error" in result:
        print(f"\n⚠️ Warning: {result['error']}")
        if "fallback_response" in result:
            print("Using fallback processing...")
    
    if "mock_response" in result:
        print("\nℹ️ Note: Running in mock/fallback mode")
        print(f"Message: {result['message']}")
    
    if "results" in result:
        print("\n🔍 Search Results:")
        print_json(result["results"])
    else:
        print("\n📄 Response:")
        print_json(result)

def main():
    """Main terminal interface function."""
    # Load environment variables
    load_dotenv()
    
    # Check if API key is valid
    api_key = GOOGLE_API_KEY
    use_mock = False
    
    if not api_key or api_key == "your_google_api_key_here":
        print("Warning: Valid API key is not set. Using mock mode.")
        print("You can set a valid API key in the .env file.")
        use_mock = True
    
    # Initialize the agent
    if use_mock:
        print("⚠️ Running in MOCK MODE - responses will be simulated")
        agent = WebScraperAgent(force_mock=True)
    else:
        agent = WebScraperAgent(api_key=api_key)
        if agent.use_mock:
            print("⚠️ NOTICE: Automatically using MOCK MODE due to API limitations")
    
    print("\nWeb Scraper Agent")
    print("=================")
    print("Choose input type:")
    print("1) URL")
    print("2) Text query")
    
    choice = input("Enter your choice (1 or 2): ").strip()
    
    if choice == "1":
        url = input("\nEnter a URL to process: ").strip()
        process_url(agent, url)
    elif choice == "2":
        query = input("\nEnter a text query: ").strip()
        process_query(agent, query)
    else:
        print("Invalid choice. Please run again and select 1 or 2.")

if __name__ == "__main__":
    main() 