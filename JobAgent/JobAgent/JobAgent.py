#!/usr/bin/env python3
import os
import sys
import argparse
import logging
from pathlib import Path
import PyPDF2
import io
import requests

# LangChain imports
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS  # Import from community specifically
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
import time
import random
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

# Get API key as string directly from environment
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

class JDSummarizer:
    def __init__(self):
        # Initialize text splitter for chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )
        
        # Initialize LLM
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",  # Using a more stable model
            temperature=0.7,
            max_output_tokens=2048,
            google_api_key=GOOGLE_API_KEY,  # Pass as string
        )
        
        # Initialize embeddings
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            task_type="retrieval_document",
            google_api_key=GOOGLE_API_KEY,  # Pass as string
        )

    def extract_from_url(self, url):
        """Extract text from a URL (webpage or PDF)"""
        logger.info(f"Extracting text from URL: {url}")
        
        try:
            # Check if it's a PDF URL
            if url.lower().endswith('.pdf'):
                response = requests.get(url)
                response.raise_for_status()
                pdf_content = response.content
                
                # Use PyPDF2 to extract text
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                
                return text
            else:
                # Use WebBaseLoader for HTML content
                loader = WebBaseLoader(url)
                docs = loader.load()
                
                if not docs:
                    return None
                
                # Combine all document content
                text = "\n\n".join([doc.page_content for doc in docs])
                return text
                
        except Exception as e:
            logger.error(f"Error extracting from URL: {str(e)}")
            return None

    def extract_from_pdf(self, pdf_path):
        """Extract text from a local PDF file"""
        logger.info(f"Extracting text from PDF: {pdf_path}")
        
        try:
            # Use PyPDFLoader from LangChain
            loader = PyPDFLoader(pdf_path)
            docs = loader.load()
            
            if not docs:
                return None
                
            # Combine all document content
            text = "\n\n".join([doc.page_content for doc in docs])
            return text
            
        except Exception as e:
            logger.error(f"Error extracting from PDF: {str(e)}")
            return None

    @retry(
        retry=retry_if_exception_type(ResourceExhausted),
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        before_sleep=lambda retry_state: logger.info(f"Rate limit hit, retrying in {retry_state.next_action.sleep} seconds...")
    )
    def _call_with_retry(self, chain, input_data):
        """Call LLM with retry logic for rate limits"""
        try:
            return chain.run(input_data)
        except ResourceExhausted as e:
            logger.warning(f"Hit rate limit: {str(e)}")
            # Add jitter to avoid synchronized retries
            time.sleep(random.uniform(1, 5))
            raise  # Let the retry decorator handle it

    def create_embeddings(self, text):
        """Create embeddings from text and store in FAISS"""
        logger.info("Creating embeddings...")
        
        # Split text into chunks
        chunks = self.text_splitter.split_text(text)
        docs = [Document(page_content=chunk) for chunk in chunks]
        
        # Create vector store
        try:
            vector_store = FAISS.from_documents(docs, self.embeddings)
            return vector_store
        except Exception as e:
            logger.error(f"Error creating FAISS vector store: {str(e)}")
            return None

    def generate_summary(self, text, vector_store=None):
        """Generate a comprehensive summary of the job description"""
        logger.info("Generating summary...")
        
        # Use semantic search if vector store is provided to extract relevant parts
        if vector_store:
            try:
                queries = [
                    "job title and company",
                    "key responsibilities",
                    "required skills and qualifications",
                    "preferred qualifications",
                    "benefits and perks"
                ]
                
                context = ""
                for query in queries:
                    results = vector_store.similarity_search(query, k=2)
                    for doc in results:
                        context += f"\n{doc.page_content}\n"
            except Exception as e:
                logger.error(f"Error in vector search: {str(e)}")
                context = text
        else:
            context = text
        
        # Create a summarization prompt with an improved flexible approach
        summary_prompt = PromptTemplate(
            template="""
            Generate a detailed job description for the role of [Job Title] at [Company Name]. The job is located in [Location] and is [Remote/On-site/Hybrid].

            Responsibilities:
            List the key responsibilities of this role, including but not limited to:

            [Responsibility 1]

            [Responsibility 2]

            [Responsibility 3]

            Requirements:
            Outline the necessary qualifications, including:

            Required skills ([List key technical and soft skills])

            Educational background ([Degree, certifications, etc.])

            Experience level ([Years of experience, specific industries, etc.])

            Preferred Qualifications:
            (Include any additional skills, experiences, or certifications that would be a plus.)

            Salary & Benefits:
            (Optional: Mention salary range, benefits, perks, and other incentives.)

            About the Company:
            (Provide a short description of the company, its mission, culture, and values.)

            Format the response in a structured and professional manner.

            Dont write "info not available" or "I don't know" in the response in the output.

            Job Description:
            {text}
            
            Summary:
            """,
            input_variables=["text"]
        )
        
        summarize_chain = LLMChain(
            llm=self.llm,
            prompt=summary_prompt
        )
        
        # Generate summary
        try:
            summary = self._call_with_retry(summarize_chain, context)
            return summary.strip()
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return f"Error generating summary: {str(e)}"
    
    def generate_cold_email(self, text, vector_store, candidate_name, candidate_experience):
        """Generate a cold email based on the job description and candidate info"""
        logger.info("Generating cold email...")
        
        # Create a summary from the vector store
        summary = self.generate_summary(text, vector_store)
        
        # Generate a tailored cold email
        email_prompt = PromptTemplate(
            template="""
            You are a professional job application assistant.
            
            Create a personalized cold email for {candidate_name} to send to the hiring manager for the job described below.
            The candidate has the following experience: {candidate_experience}
            
            Job Description Summary:
            {summary}
            
            The email should:
            1. Be professional and concise (maximum 300 words)
            2. Mention specific skills that match the job requirements
            3. Show enthusiasm for the role and company
            4. Include a call to action
            5. Have a professional greeting and signature
            
            Cold Email:
            """,
            input_variables=["candidate_name", "candidate_experience", "summary"]
        )
        
        email_chain = LLMChain(
            llm=self.llm,
            prompt=email_prompt
        )
        
        try:
            result = self._call_with_retry(email_chain, {
                "candidate_name": candidate_name,
                "candidate_experience": candidate_experience,
                "summary": summary
            })
            return result.strip()
        except Exception as e:
            logger.error(f"Error generating cold email: {str(e)}")
            return "Error generating cold email. Please try again later."
    
    def generate_interview_prep(self, text, vector_store, interview_date=None):
        """Generate an interview preparation guide with a timeline"""
        logger.info("Generating interview preparation guide...")
        
        # Create a summary from the vector store
        summary = self.generate_summary(text, vector_store)
        
        # Generate the interview prep guide
        prep_prompt = PromptTemplate(
            template="""
            You are a professional interview coach.
            
            Create a comprehensive interview preparation guide for the job described below.
            Include a timeline of preparation activities.
            
            Job Description Summary:
            {summary}
            
            The guide should include:
            1. Technical concepts to review based on the job requirements
            2. Common interview questions for this role with suggested answers
            3. Questions the candidate should ask the interviewer
            4. Research to do about the company
            5. A detailed preparation timeline working backwards from {interview_date} (or from a general 2-week timeline if no date is provided)
            6. Tips for the day of the interview
            
            Interview Preparation Guide:
            """,
            input_variables=["summary", "interview_date"]
        )
        
        prep_chain = LLMChain(
            llm=self.llm,
            prompt=prep_prompt
        )
        
        timeline = interview_date if interview_date else "a standard 2-week preparation period"
        
        try:
            result = self._call_with_retry(prep_chain, {
                "summary": summary,
                "interview_date": timeline
            })
            return result.strip()
        except Exception as e:
            logger.error(f"Error generating interview prep guide: {str(e)}")
            return "Error generating interview preparation guide. Please try again later."
    
    def process_input(self, input_source, task="summary", candidate_name=None, 
                     candidate_experience=None, interview_date=None):
        """Process input and perform specified task"""
        
        # Extract text from source
        if input_source.startswith(('http://', 'https://')):
            text = self.extract_from_url(input_source)
        elif Path(input_source).exists() and input_source.lower().endswith('.pdf'):
            text = self.extract_from_pdf(input_source)
        else:
            logger.error("Input must be a valid URL or path to a PDF file")
            return {"status": "error", "message": "Invalid input source"}
        
        if not text:
            logger.error("Failed to extract text from the input source")
            return {"status": "error", "message": "Failed to extract text"}
        
        # Create embeddings and vector store
        vector_store = self.create_embeddings(text)
        if not vector_store:
            logger.warning("Could not create vector store, proceeding without embeddings")
        
        # Perform the requested task
        result = {"status": "success", "text": text}
        
        if task in ["summary", "all"]:
            result["summary"] = self.generate_summary(text, vector_store)
        
        if task in ["cold_email", "all"] and candidate_name and candidate_experience:
            result["cold_email"] = self.generate_cold_email(
                text, vector_store, candidate_name, candidate_experience
            )
        
        if task in ["interview_prep", "all"]:
            result["interview_prep"] = self.generate_interview_prep(
                text, vector_store, interview_date
            )
        
        return result

def main():
    parser = argparse.ArgumentParser(description="Job Agent: Process job descriptions and generate useful content")
    parser.add_argument("input", help="URL or path to a PDF file containing a job description")
    parser.add_argument("--task", choices=["summary", "cold_email", "interview_prep", "all"], 
                       default="summary", help="Task to perform (default: summary)")
    parser.add_argument("--candidate-name", help="Your name (required for cold email)")
    parser.add_argument("--candidate-exp", help="Your experience (required for cold email)")
    parser.add_argument("--interview-date", help="Target interview date (for interview prep)")
    parser.add_argument("--output", "-o", help="Path to save the output summary (optional)")
    args = parser.parse_args()
    
    # Validate args
    if args.task in ["cold_email", "all"] and (not args.candidate_name or not args.candidate_exp):
        print("Error: --candidate-name and --candidate-exp are required for cold email generation")
        sys.exit(1)
    
    agent = JDSummarizer()
    result = agent.process_input(
        args.input, 
        task=args.task,
        candidate_name=args.candidate_name,
        candidate_experience=args.candidate_exp,
        interview_date=args.interview_date
    )
    
    if result["status"] == "success":
        # Print results
        if "summary" in result:
            print("\n" + "="*80)
            print("JOB DESCRIPTION SUMMARY")
            print("="*80 + "\n")
            print(result["summary"])
        
        if "cold_email" in result:
            print("\n" + "="*80)
            print("COLD EMAIL")
            print("="*80 + "\n")
            print(result["cold_email"])
        
        if "interview_prep" in result:
            print("\n" + "="*80)
            print("INTERVIEW PREPARATION GUIDE")
            print("="*80 + "\n")
            print(result["interview_prep"])
        
        # Save to file if output path is provided
        if args.output:
            with open(args.output, 'w') as f:
                if "summary" in result:
                    f.write("JOB DESCRIPTION SUMMARY\n")
                    f.write("="*80 + "\n\n")
                    f.write(result["summary"] + "\n\n")
                
                if "cold_email" in result:
                    f.write("COLD EMAIL\n")
                    f.write("="*80 + "\n\n")
                    f.write(result["cold_email"] + "\n\n")
                
                if "interview_prep" in result:
                    f.write("INTERVIEW PREPARATION GUIDE\n")
                    f.write("="*80 + "\n\n")
                    f.write(result["interview_prep"])
                
            print(f"\nResults saved to {args.output}")
    else:
        print(f"Error: {result.get('message', 'Unknown error')}")

if __name__ == "__main__":
    main()
