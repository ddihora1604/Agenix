#!/usr/bin/env python3
"""
JobAgent.py - AI-powered job description analysis tool

This script processes job descriptions to generate:
- A concise summary of the job requirements and responsibilities
- A personalized cold email for job applications
- An interview preparation guide
"""

import os
import sys
import argparse
import textwrap
from datetime import datetime
import traceback

# Safely try to import optional dependencies
PDF_SUPPORT = False
try:
    import PyPDF2
    PDF_SUPPORT = True
except ImportError:
    print("PyPDF2 not installed. PDF processing will be limited.", file=sys.stderr)

WEB_SUPPORT = False
try:
    import requests
    from bs4 import BeautifulSoup
    WEB_SUPPORT = True
except ImportError:
    print("requests/BeautifulSoup not installed. Web URL processing will be limited.", file=sys.stderr)

# Try to load environment variables from root .env file
try:
    from dotenv import load_dotenv
    # Load from root Agenix directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)  # Go up one level to the root Agenix directory
    env_path = os.path.join(root_dir, '.env')
    
    # Fallback to local .env if root doesn't exist
    if not os.path.exists(env_path):
        local_env_path = os.path.join(script_dir, '.env')
        if os.path.exists(local_env_path):
            env_path = local_env_path
            print(f"Using local .env file: {env_path}", file=sys.stderr)
        else:
            # Fall back to current working directory
            load_dotenv()
            print("Loaded environment from current directory", file=sys.stderr)
    else:
        load_dotenv(env_path)
        print(f"Loaded environment from root .env file: {env_path}", file=sys.stderr)
except ImportError:
    print("python-dotenv not installed. Using system environment variables.", file=sys.stderr)
except Exception as e:
    print(f"Warning: Failed to load .env file: {e}", file=sys.stderr)

# Check if Google API key is set - but use a dummy key if not found to allow for testing
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    print("Warning: GOOGLE_API_KEY environment variable not set, using sample data for testing", file=sys.stderr)

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Process job descriptions using AI')
    parser.add_argument('job_input', help='Job description text or URL')
    parser.add_argument('--task', 
                        choices=['summary', 'cold_email', 'interview_prep', 'all'],
                        default='all',
                        help='Type of output to generate')
    parser.add_argument('--candidate-name', help='Name of the candidate (for cold email)')
    parser.add_argument('--candidate-exp', help='Brief description of candidate experience (for cold email)')
    parser.add_argument('--interview-date', help='Optional interview date (for interview prep)')
    
    return parser.parse_args()

def extract_text_from_input(job_input):
    """Extract text from various input formats (URL, PDF, plain text)."""
    # Check if input is a URL
    if job_input.startswith(('http://', 'https://')):
        if not WEB_SUPPORT:
            return f"Job posting from URL: {job_input} (web scraping not available)"
        
        try:
            response = requests.get(job_input, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            # Extract text from the main content (modify this based on site structure)
            main_content = soup.find('main') or soup.find('article') or soup.body
            if main_content:
                # Strip HTML tags and get text
                text = main_content.get_text(separator='\n', strip=True)
                return text
            else:
                return response.text
        except Exception as e:
            print(f"Error fetching URL: {e}", file=sys.stderr)
            return f"Job posting from URL: {job_input} (failed to scrape)"
    
    # Check if input is a file path to a PDF
    elif job_input.lower().endswith('.pdf'):
        if not PDF_SUPPORT:
            return f"Job description from PDF: {job_input} (PDF parsing not available)"
        
        try:
            with open(job_input, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page_num in range(len(pdf_reader.pages)):
                    text += pdf_reader.pages[page_num].extract_text()
                return text
        except Exception as e:
            print(f"Error reading PDF: {e}", file=sys.stderr)
            return f"Job description from PDF: {job_input} (failed to parse)"
    
    # Default: assume it's plain text
    return job_input

def generate_summary(job_description):
    """Generate a summary of the job description."""
    # In a real implementation, this would use an AI model to analyze the job description
    # For now, we'll use a simple placeholder output
    
    summary = f"""
This position requires a skilled professional with 3+ years of experience in software development.
Key responsibilities include:
- Developing and maintaining web applications
- Collaborating with cross-functional teams
- Writing clean, maintainable code
- Participating in code reviews

Required skills:
- JavaScript/TypeScript
- React or similar frontend frameworks
- Node.js
- Experience with REST APIs
- Strong problem-solving abilities
    """
    
    return summary.strip()

def generate_cold_email(job_description, candidate_name, candidate_experience):
    """Generate a cold email for job application."""
    # In a real implementation, this would use an AI model to create a personalized email
    if not candidate_name or not candidate_experience:
        return "Error: Candidate name and experience are required for cold email generation."
    
    # Get the current date for the email
    today = datetime.now().strftime("%B %d, %Y")
    
    # Placeholder email content
    email = f"""
Subject: Application for Software Developer Position - {candidate_name}

Dear Hiring Manager,

I hope this email finds you well. I am writing to express my interest in the Software Developer position at your company, which I discovered recently.

With {candidate_experience}, I believe I have the necessary skills and experience to make a significant contribution to your team.

What particularly excites me about this role is the opportunity to work on innovative projects while collaborating with talented professionals. I am confident that my technical skills in JavaScript, React, and Node.js, combined with my problem-solving abilities, make me a strong candidate for this position.

I have attached my resume for your review and would welcome the opportunity to discuss how my background, skills, and experience would be an ideal fit for this role.

Thank you for considering my application. I look forward to the possibility of speaking with you soon.

Best regards,
{candidate_name}
    """
    
    return email.strip()

def generate_interview_prep(job_description, interview_date=None):
    """Generate an interview preparation guide."""
    # In a real implementation, this would use an AI model to create a tailored interview guide
    
    date_section = ""
    if interview_date:
        date_section = f"\nPrepare for your interview on {interview_date}.\n"
    
    prep_guide = f"""
PREPARATION CHECKLIST:

1. Research the company thoroughly - understand their products, services, and culture.
2. Review the job description and be ready to discuss how your skills match their requirements.
3. Prepare specific examples of your work that demonstrate relevant skills.
4. Practice common interview questions, focusing on behavioral and technical aspects.
5. Prepare thoughtful questions to ask the interviewer about the role and company.

TECHNICAL CONCEPTS TO REVIEW:

- JavaScript fundamentals and ES6+ features
- React component lifecycle and hooks
- State management patterns
- RESTful API design principles
- Testing frameworks and methodologies

POTENTIAL INTERVIEW QUESTIONS:

1. Describe a challenging project you worked on and how you approached it.
2. How do you ensure your code is maintainable and scalable?
3. Explain how you would debug a complex issue in a web application.
4. How do you stay updated on the latest developments in web technologies?
5. Describe your experience working in agile development environments.
{date_section}
Remember to arrive 10-15 minutes early, dress professionally, and bring copies of your resume.
    """
    
    return prep_guide.strip()

def main():
    try:
        args = parse_arguments()
        job_input = args.job_input
        task = args.task
        candidate_name = args.candidate_name
        candidate_exp = args.candidate_exp
        interview_date = args.interview_date
        
        # Process the job input (text, URL, PDF)
        print(f"Processing job input: {job_input}", file=sys.stderr)
        job_description = extract_text_from_input(job_input)
        
        # Process requested tasks
        if task == 'summary' or task == 'all':
            summary = generate_summary(job_description)
            print("JOB DESCRIPTION SUMMARY")
            print("=" * 80)
            print()
            print(summary)
            print()
        
        if task == 'cold_email' or task == 'all':
            if task == 'all':
                print("=" * 80)
            
            cold_email = generate_cold_email(job_description, candidate_name, candidate_exp)
            print("COLD EMAIL")
            print("=" * 80)
            print()
            print(cold_email)
            print()
        
        if task == 'interview_prep' or task == 'all':
            if task == 'all':
                print("=" * 80)
                
            interview_prep = generate_interview_prep(job_description, interview_date)
            print("INTERVIEW PREPARATION GUIDE")
            print("=" * 80)
            print()
            print(interview_prep)
            print()
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 