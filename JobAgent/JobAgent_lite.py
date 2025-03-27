#!/usr/bin/env python3
"""
JobAgent_lite.py - Lightweight version of the Job Agent tool

This is a simplified version that doesn't require AI dependencies.
It outputs the same format as the full version but with pre-written templates.
"""

import os
import sys
import argparse
from datetime import datetime

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Process job descriptions using templates')
    parser.add_argument('job_input', help='Job description text or URL')
    parser.add_argument('--task', 
                        choices=['summary', 'cold_email', 'interview_prep', 'all'],
                        default='all',
                        help='Type of output to generate')
    parser.add_argument('--candidate-name', help='Name of the candidate (for cold email)')
    parser.add_argument('--candidate-exp', help='Brief description of candidate experience (for cold email)')
    parser.add_argument('--interview-date', help='Optional interview date (for interview prep)')
    
    return parser.parse_args()

def extract_keywords(job_description):
    """Extract likely keywords from the job description."""
    keywords = []
    # Common tech keywords to look for
    tech_terms = ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'HTML', 'CSS', 
                  'SQL', 'NoSQL', 'MongoDB', 'Docker', 'Kubernetes', 'DevOps', 'Java', 'C#', 
                  'C++', 'PHP', 'Go', 'Ruby', 'Swift', 'AI', 'ML', 'Machine Learning', 'Data Science',
                  'Backend', 'Frontend', 'Full-stack', 'Web Development', 'Mobile Development',
                  'Cloud', 'Azure', 'GCP', 'Microservices', 'API', 'REST', 'GraphQL']
    
    for term in tech_terms:
        if term.lower() in job_description.lower():
            keywords.append(term)
    
    return keywords[:5]  # Return up to 5 keywords

def generate_summary(job_description):
    """Generate a summary of the job description."""
    keywords = extract_keywords(job_description)
    keywords_str = ", ".join(keywords) if keywords else "JavaScript, React, and Node.js"
    
    summary = f"""
Based on the job description provided, this position requires a skilled software developer with experience in {keywords_str}.

Key responsibilities include:
- Developing and maintaining web applications
- Collaborating with cross-functional teams
- Writing clean, maintainable code
- Participating in code reviews

Required skills:
- Strong programming fundamentals
- Experience with modern development frameworks
- Knowledge of best practices in software development
- Problem-solving abilities
- Team collaboration
    """
    
    return summary.strip()

def generate_cold_email(job_description, candidate_name, candidate_experience):
    """Generate a cold email for job application."""
    if not candidate_name or not candidate_experience:
        return "Error: Candidate name and experience are required for cold email generation."
    
    # Get the current date for the email
    today = datetime.now().strftime("%B %d, %Y")
    keywords = extract_keywords(job_description)
    keywords_str = ", ".join(keywords) if keywords else "software development"
    
    # Placeholder email content
    email = f"""
Subject: Application for Software Developer Position - {candidate_name}

Dear Hiring Manager,

I hope this email finds you well. I am writing to express my interest in the Software Developer position at your company, which I discovered recently.

With {candidate_experience}, I believe I have the necessary skills and experience to make a significant contribution to your team.

What particularly excites me about this role is the opportunity to work on innovative projects while collaborating with talented professionals. My experience with {keywords_str} aligns well with the requirements outlined in the job description.

I have attached my resume for your review and would welcome the opportunity to discuss how my background, skills, and experience would be an ideal fit for this role.

Thank you for considering my application. I look forward to the possibility of speaking with you soon.

Best regards,
{candidate_name}
    """
    
    return email.strip()

def generate_interview_prep(job_description, interview_date=None):
    """Generate an interview preparation guide."""
    keywords = extract_keywords(job_description)
    skills_to_review = ", ".join(keywords) if keywords else "JavaScript, React, and Node.js"
    
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

- Fundamentals of {skills_to_review}
- Software design principles
- Testing methodologies
- Problem-solving approaches
- System architecture concepts

POTENTIAL INTERVIEW QUESTIONS:

1. Describe a challenging project you worked on and how you approached it.
2. How do you ensure your code is maintainable and scalable?
3. Explain how you would debug a complex issue in a web application.
4. How do you stay updated on the latest developments in technology?
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
        
        print(f"Processing job input using lightweight templates", file=sys.stderr)
        
        # Process requested tasks
        if task == 'summary' or task == 'all':
            summary = generate_summary(job_input)
            print("JOB DESCRIPTION SUMMARY")
            print("=" * 80)
            print()
            print(summary)
            print()
        
        if task == 'cold_email' or task == 'all':
            if task == 'all':
                print("=" * 80)
            
            cold_email = generate_cold_email(job_input, candidate_name, candidate_exp)
            print("COLD EMAIL")
            print("=" * 80)
            print()
            print(cold_email)
            print()
        
        if task == 'interview_prep' or task == 'all':
            if task == 'all':
                print("=" * 80)
                
            interview_prep = generate_interview_prep(job_input, interview_date)
            print("INTERVIEW PREPARATION GUIDE")
            print("=" * 80)
            print()
            print(interview_prep)
            print()
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 