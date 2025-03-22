#!/usr/bin/env python
import sys
import warnings
import os
import time
import random
from datetime import datetime
from dotenv import load_dotenv

from latest_ai_development.crew import LatestAiDevelopment

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

# This main file is intended to be a way for you to run your
# crew locally, so refrain from adding unnecessary logic into this file.
# Replace with inputs you want to test with, it will automatically
# interpolate any tasks and agents information

def run():
    """
    Run the educational AI agents crew.
    """
    inputs = {
        'subject': 'Data Science',
        'topic': 'Machine Learning Fundamentals',
        'learning_style': 'Visual and hands-on learning'
    }
    
    try:
        # Add a delay before starting to ensure all environment variables are properly set
        print("Preparing to initialize Educational AI Agents...")
        add_delay("initialization preparation")
        
        print("Initializing Educational AI Agents...")
        
        education_ai = LatestAiDevelopment()
        
        # Add a delay after initialization
        add_delay("post-initialization")
        
        print("Creating crew instance...")
        education_crew = education_ai.crew()
        
        # Add a delay before kickoff
        add_delay("pre-kickoff preparation")
        
        print("Starting crew execution with Gemini model")
        print("Using model:", MODEL_NAME)
        print("Rate limiting prevention enabled with delays between {}-{}s".format(MIN_DELAY, MAX_DELAY))
        
        education_crew.kickoff(inputs=inputs)
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")


def train():
    """
    Train the crew for a given number of iterations.
    """
    inputs = {
        'subject': 'Data Science',
        'topic': 'Machine Learning Fundamentals',
        'learning_style': 'Visual and hands-on learning'
    }
    try:
        # Add a delay before starting
        print("Preparing to initialize Educational AI Agents for training...")
        add_delay("pre-training preparation")
        
        education_ai = LatestAiDevelopment()
        
        # Add a delay after initialization
        add_delay("post-initialization")
        
        education_crew = education_ai.crew()
        
        # Add a delay before training
        add_delay("pre-training")
        
        print(f"Starting training for {sys.argv[1]} iterations with rate limiting prevention...")
        education_crew.train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)
    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")

def replay():
    """
    Replay the crew execution from a specific task.
    """
    try:
        # Add a delay before starting
        print("Preparing to initialize Educational AI Agents for replay...")
        add_delay("pre-replay preparation")
        
        education_ai = LatestAiDevelopment()
        
        # Add a delay after initialization
        add_delay("post-initialization")
        
        education_crew = education_ai.crew()
        
        # Add a delay before replay
        add_delay("pre-replay")
        
        print(f"Starting replay from task {sys.argv[1]} with rate limiting prevention...")
        education_crew.replay(task_id=sys.argv[1])
    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")

def test():
    """
    Test the crew execution and returns the results.
    """
    inputs = {
        'subject': 'Data Science',
        'topic': 'Machine Learning Fundamentals',
        'learning_style': 'Visual and hands-on learning'
    }
    try:
        # Add a delay before starting
        print("Preparing to initialize Educational AI Agents for testing...")
        add_delay("pre-testing preparation")
        
        education_ai = LatestAiDevelopment()
        
        # Add a delay after initialization
        add_delay("post-initialization")
        
        education_crew = education_ai.crew()
        
        # Add a delay before testing
        add_delay("pre-testing")
        
        print(f"Starting test for {sys.argv[1]} iterations with rate limiting prevention...")
        education_crew.test(n_iterations=int(sys.argv[1]), model_name=MODEL_NAME, inputs=inputs)
    except Exception as e:
        raise Exception(f"An error occurred while testing the crew: {e}")
