#!/usr/bin/env python
import sys
import warnings
import os
import time
import random
from dotenv import load_dotenv

from latest_ai_development.simple_crew import SimpleEducationCrew

# Load environment variables
load_dotenv()

# Get the model from environment variables
MODEL_NAME = os.getenv("MODEL", "gemini/gemini-1.5-flash")

# Rate limiting prevention configuration
MIN_DELAY = 2  # Minimum delay between API calls in seconds
MAX_DELAY = 5  # Maximum delay for randomized waits

def add_delay(reason="API call"):
    """Add a randomized delay to prevent rate limiting"""
    delay = random.uniform(MIN_DELAY, MAX_DELAY)
    print(f"Adding {delay:.2f}s delay for {reason}...")
    time.sleep(delay)

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

def run():
    """
    Run the simplified educational AI agents crew.
    """
    inputs = {
        'subject': 'Python Programming',
        'topic': 'Basic Data Structures',
        'learning_style': 'Hands-on, practical learning'
    }
    
    try:
        print("===============================================================")
        print("SIMPLE EDUCATIONAL AI CREW - TEST RUN")
        print("===============================================================")
        print(f"Subject: {inputs['subject']}")
        print(f"Topic: {inputs['topic']}")
        print(f"Learning Style: {inputs['learning_style']}")
        print("===============================================================")
        
        # Add a delay before starting
        print("Preparing to initialize Simple Educational AI Agents...")
        add_delay("initialization preparation")
        
        print("Initializing Simple Educational AI Agents...")
        education_crew = SimpleEducationCrew()
        
        # Add a delay after initialization
        add_delay("post-initialization")
        
        print("Creating crew instance...")
        crew = education_crew.crew()
        
        # Add a delay before kickoff
        add_delay("pre-kickoff preparation")
        
        print("Starting simplified crew execution with Gemini model")
        print("Using model:", MODEL_NAME)
        print("Rate limiting prevention enabled with delays between {}-{}s".format(MIN_DELAY, MAX_DELAY))
        print("===============================================================")
        
        result = crew.kickoff(inputs=inputs)
        
        print("===============================================================")
        print("EXECUTION COMPLETED")
        print("Output saved to simple_study_guide.md")
        print("===============================================================")
        
        return result
    except Exception as e:
        print("===============================================================")
        print("ERROR OCCURRED")
        print(f"Error details: {e}")
        print("===============================================================")
        raise Exception(f"An error occurred while running the crew: {e}")

if __name__ == "__main__":
    run() 