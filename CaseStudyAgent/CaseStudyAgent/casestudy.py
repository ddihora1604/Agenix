#!/usr/bin/env python3
import os
import sys
import argparse
import logging
import json
import time
import random
from pathlib import Path
import re
import base64
import requests
from urllib.parse import quote
import io

# LangChain imports
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
from google.api_core.exceptions import ResourceExhausted

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get API key as string from environment
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

class CaseStudyAgent:
    def __init__(self):
        """Initialize the Case Study Agent"""
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )
        
        # Initialize LLM with conservative settings to reduce API usage
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.2,  # Lower temp for more consistent responses
            max_output_tokens=2048,  # Reduced token output
            google_api_key=GOOGLE_API_KEY,
        )
        
        # Setup prompt templates
        self.setup_templates()

    def setup_templates(self):
        """Initialize prompt templates for case study generation"""
        # Template for planning the case study structure
        self.case_study_planning_template = PromptTemplate(
            template="""
            You are tasked with planning a professional case study about: {topic}
            
            Create a structured outline that includes:
            1) An overview of the situation/problem
            2) Key challenges that needed to be addressed
            3) The approach or solution implemented
            4) Results and outcomes
            5) Lessons learned and best practices
            
            Your outline should be concise but comprehensive enough to guide the development
            of a complete case study. Focus on creating a logical flow of information.
            
            Case Study Outline:
            """,
            input_variables=["topic"]
        )
        
        # Template for generating the complete case study
        self.case_study_generation_template = PromptTemplate(
            template="""
            You are a professional case study writer. Create a comprehensive case study about {topic} 
            following this outline:
            
            {outline}
            
            Additional context/information (if any):
            {context}
            
            Your case study should:
            1) Have a clear, engaging title
            2) Include an executive summary
            3) Present the situation, challenges, approach, and results in a structured format
            4) Use bullet points where appropriate to highlight key information
            5) Include a conclusion with key takeaways
            
            Format the case study in professional Markdown.
            
            Case Study:
            """,
            input_variables=["topic", "outline", "context"]
        )

    @retry(
        retry=retry_if_exception_type(ResourceExhausted),
        stop=stop_after_attempt(3),  # Reduced retry attempts
        wait=wait_exponential(multiplier=1, min=4, max=20),  # Shorter max wait
        before_sleep=lambda retry_state: logger.info(f"Rate limit hit, retrying in {retry_state.next_action.sleep} seconds...")
    )
    def _call_with_retry(self, chain, input_data):
        """Call LLM with retry logic for rate limits"""
        try:
            return chain.run(input_data)
        except ResourceExhausted as e:
            logger.warning(f"Hit rate limit: {str(e)}")
            # Add jitter to avoid synchronized retries
            time.sleep(random.uniform(1, 3))
            raise  # Let the retry decorator handle it
    
    def fetch_context(self, url=None):
        """Optionally fetch additional context from a URL"""
        if not url:
            return ""
            
        try:
            logger.info(f"Fetching context from: {url}")
            loader = WebBaseLoader(url)
            docs = loader.load()
            
            if not docs:
                return ""
                
            # Combine all document content
            text = "\n\n".join([doc.page_content for doc in docs])
            
            # Limit context length to reduce token usage
            if len(text) > 2000:
                text = text[:2000] + "..."
                
            return text
        except Exception as e:
            logger.error(f"Error fetching context: {str(e)}")
            return ""
    
    def create_case_study_outline(self, topic):
        """Create an outline for the case study"""
        logger.info(f"Creating case study outline for: {topic}")
        
        outline_chain = LLMChain(
            llm=self.llm,
            prompt=self.case_study_planning_template
        )
        
        try:
            outline = self._call_with_retry(outline_chain, {"topic": topic})
            logger.info("Case study outline created successfully")
            return outline
        except Exception as e:
            logger.error(f"Error creating case study outline: {str(e)}")
            # Return basic outline in case of failure
            return """
            # Outline for Case Study
            
            ## 1. Introduction
            - Background information
            - Problem statement
            
            ## 2. Challenges
            - Key obstacles
            - Constraints
            
            ## 3. Solution
            - Approach taken
            - Implementation details
            
            ## 4. Results
            - Outcomes
            - Metrics and achievements
            
            ## 5. Conclusion
            - Lessons learned
            - Best practices
            """
    
    def generate_case_study(self, topic, outline, context=""):
        """Generate the complete case study"""
        logger.info(f"Generating case study for: {topic}")
        
        case_study_chain = LLMChain(
            llm=self.llm,
            prompt=self.case_study_generation_template
        )
        
        try:
            case_study = self._call_with_retry(case_study_chain, {
                "topic": topic,
                "outline": outline,
                "context": context
            })
            
            logger.info(f"Case study generated with {len(case_study)} characters")
            return case_study
        except Exception as e:
            logger.error(f"Error generating case study: {str(e)}")
            return f"Error generating case study: {str(e)}"
    
    def run_case_study_generation(self, topic, context_url=None):
        """Run the complete case study generation pipeline"""
        logger.info(f"Starting case study generation for topic: {topic}")
        
        # Step 1: Fetch context if URL is provided
        context = self.fetch_context(context_url) if context_url else ""
        
        # Step 2: Create case study outline
        outline = self.create_case_study_outline(topic)
        
        # Step 3: Generate complete case study
        case_study = self.generate_case_study(topic, outline, context)
        
        return {
            "topic": topic,
            "outline": outline,
            "case_study": case_study
        }

def main():
    """Main function to run the Case Study Agent from command line"""
    parser = argparse.ArgumentParser(description="Generate professional case studies on any topic")
    parser.add_argument("topic", help="Case study topic or focus")
    parser.add_argument("--context", "-c", help="Optional URL to fetch additional context from")
    args = parser.parse_args()
    
    # Initialize and run the case study agent
    agent = CaseStudyAgent()
    try:
        result = agent.run_case_study_generation(args.topic, args.context)
        
        # Display the case study directly in the terminal
        print("\n" + "="*80)
        print(f"CASE STUDY ON: {args.topic.upper()}")
        print("="*80 + "\n")
        
        print("OUTLINE:")
        print("-"*80)
        print(result["outline"])
        print("\n" + "-"*80 + "\n")
        
        print("CASE STUDY:")
        print("-"*80)
        print(result["case_study"])
        print("\n" + "-"*80)
        
        logger.info(f"Case study generation completed and displayed in terminal")
        
    except Exception as e:
        logger.error(f"Error in case study generation: {str(e)}")
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
