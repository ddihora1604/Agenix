import os
import argparse
from typing import List, Dict
from dotenv import load_dotenv
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import RetrievalQA
import google.generativeai as genai
import time
import sys
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

class WebsiteQueryAgent:
    def __init__(self, api_key: str = None, model_name: str = "models/gemini-1.5-flash"):
        """Initialize the website query agent with Google API key and model"""
        # Use provided API key or get from environment
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key is required. Provide it directly or set in .env file.")
            
        os.environ["GOOGLE_API_KEY"] = self.api_key
        genai.configure(api_key=self.api_key)
        self.model_name = model_name
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        self.vector_store = None
        self.qa_chain = None
    
    def load_website(self, urls: List[str]) -> None:
        """Load content from a list of URLs using WebBaseLoader"""
        print(f"Loading content from {len(urls)} URLs...")
        
        start_time = time.time()
        
        loader = WebBaseLoader(urls)
        documents = loader.load()
        
        # Try to extract title from the first document
        website_title = "Website Analysis"
        if documents and hasattr(documents[0], 'metadata') and 'title' in documents[0].metadata:
            website_title = documents[0].metadata['title']
            print(f"Title: {website_title}")
        
        # Split documents into chunks with larger chunk size for better context
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,  # Increased chunk size
            chunk_overlap=150  # Increased overlap
        )
        chunks = text_splitter.split_documents(documents)
        print(f"Split into {len(chunks)} chunks")
        
        # Create vector store
        self.vector_store = FAISS.from_documents(chunks, self.embeddings)
        print("Vector store created successfully")
        
        # Set up Gemini model for QA with improved settings
        llm = ChatGoogleGenerativeAI(
            model=self.model_name, 
            temperature=0.2,
            top_p=0.95,
            max_output_tokens=4096  # Increased token limit for longer responses
        )
        
        template = """You are an expert assistant that provides detailed, accurate answers based on the provided context.

            Context: {context}
            
            Question: {question}
            
            Guidelines for your response:
            1. Answer based only on the provided context. If you cannot answer from the context, say "I don't have enough information to answer this question."
            2. For questions about code, extract the complete code snippet and format it properly with appropriate markdown code blocks.
            3. When asked for examples, provide the complete example with detailed explanation.
            4. When asked to explain a concept, give a thorough explanation with all relevant details from the context.
            5. Use proper formatting, including bullet points, numbered lists, and code blocks where appropriate.
            6. If there are step-by-step instructions in the context, preserve the complete sequence.
            7. For technical content, be precise and include all important details from the context.
            8. Explain with your own examples or analogies to make the answer more understandable if required.
            9. If summary is asked give a detailed summary of the context in this format:
                1. KEY POINTS: Identify and summarize the most important information
                2. MAIN ARGUMENTS: Extract the primary arguments or claims made in the document
                3. EVIDENCE/DATA: Include significant evidence, statistics, or data presented, if any
                4. CONCLUSIONS: Summarize the author's conclusions or recommendations
                5. CONTEXT: Provide relevant context about the document's purpose and audience
                Dont include the headers "KEY POINTS", "MAIN ARGUMENTS", etc. in your response, just the content.
                
                Focus only on information present in the document. If you don't have enough information in the 
                provided context, do your best with what's available.
                
                Do not include phrases like "The document discusses" or "The text mentions" in your summary.
                Format the summary in clear paragraphs with logical organization.

            Provide a comprehensive answer:
            """
        prompt = ChatPromptTemplate.from_template(template)
        
        # Create QA chain with improved retrieval
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=self.vector_store.as_retriever(search_kwargs={"k": 5}),  # Increased k for more context
            chain_type_kwargs={"prompt": prompt}
        )
        
        end_time = time.time()
        process_time = end_time - start_time
        print(f"QA chain setup complete")
        print(f"Total execution time: {process_time:.2f} seconds")
    
    def save_vector_store(self, path: str) -> None:
        """Save the FAISS vector store to disk"""
        if self.vector_store:
            self.vector_store.save_local(path)
            print(f"Vector store saved to {path}")
        else:
            print("No vector store to save")
    
    def load_vector_store(self, path: str) -> None:
        """Load a FAISS vector store from disk"""
        if os.path.exists(path):
            self.vector_store = FAISS.load_local(path, self.embeddings)
            
            # Set up Gemini model for QA with improved settings
            llm = ChatGoogleGenerativeAI(
                model=self.model_name, 
                temperature=0.2,
                top_p=0.95,
                max_output_tokens=4096  # Increased token limit for longer responses
            )
            
            # Create enhanced prompt template
            template = """You are an expert assistant that provides detailed, accurate answers based on the provided context.

            Context: {context}
            
            Question: {question}
            
            Guidelines for your response:
            1. Answer based only on the provided context. If you cannot answer from the context, say "I don't have enough information to answer this question."
            2. For questions about code, extract the complete code snippet and format it properly with appropriate markdown code blocks.
            3. When asked for examples, provide the complete example with detailed explanation.
            4. When asked to explain a concept, give a thorough explanation with all relevant details from the context.
            5. Use proper formatting, including bullet points, numbered lists, and code blocks where appropriate.
            6. If there are step-by-step instructions in the context, preserve the complete sequence.
            7. For technical content, be precise and include all important details from the context.
            8. Explain with your own examples or analogies to make the answer more understandable if required.
            9. If summary is asked give a detailed summary of the context in this format:
                1. KEY POINTS: Identify and summarize the most important information
                2. MAIN ARGUMENTS: Extract the primary arguments or claims made in the document
                3. EVIDENCE/DATA: Include significant evidence, statistics, or data presented, if any
                4. CONCLUSIONS: Summarize the author's conclusions or recommendations
                5. CONTEXT: Provide relevant context about the document's purpose and audience
                Dont include the headers "KEY POINTS", "MAIN ARGUMENTS", etc. in your response, just the content.

                Focus only on information present in the document. If you don't have enough information in the 
                provided context, do your best with what's available.
                
                Do not include phrases like "The document discusses" or "The text mentions" in your summary.
                Format the summary in clear paragraphs with logical organization.

            Provide a comprehensive answer:
            """
            prompt = ChatPromptTemplate.from_template(template)
            
            # Create QA chain with improved retrieval
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=self.vector_store.as_retriever(search_kwargs={"k": 5}),  # Increased k for more context
                chain_type_kwargs={"prompt": prompt}
            )
            print(f"Vector store loaded from {path}")
        else:
            print(f"No vector store found at {path}")
    
    def query(self, question: str) -> Dict:
        """Query the website content with enhanced handling of code and examples"""
        if not self.qa_chain:
            return {"answer": "Please load a website or vector store first"}
        
        # Analyze the question to detect code or example requests
        code_keywords = ["code", "snippet", "implementation", "function", "class", "method"]
        example_keywords = ["example", "sample", "demonstrate", "illustration", "walkthrough"]
        
        is_code_request = any(keyword in question.lower() for keyword in code_keywords)
        is_example_request = any(keyword in question.lower() for keyword in example_keywords)
        
        # Enhance the question for better retrieval if needed
        enhanced_question = question
        if is_code_request:
            enhanced_question = f"Extract and format the complete code for: {question}"
        elif is_example_request:
            enhanced_question = f"Provide the full, detailed example for: {question}"
        
        try:
            start_time = time.time()
            response = self.qa_chain.invoke({"query": enhanced_question})
            end_time = time.time()
            process_time = end_time - start_time
            print(f"Query processed in {process_time:.2f} seconds")
            return response
        except Exception as e:
            return {"answer": f"Error processing query: {str(e)}"}

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description="Website Query Agent Tool")
    parser.add_argument("--api_key", help="Google API key (optional, can use environment variable)")
    parser.add_argument("--urls", nargs="+", help="URLs to analyze")
    parser.add_argument("--save_path", default="vector_store", help="Path to save vector store")
    parser.add_argument("--load_path", help="Path to load existing vector store")
    parser.add_argument("--query", help="Question to ask about the website")
    parser.add_argument("--interactive", action="store_true", help="Run in interactive mode")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Print timestamp if verbose
    if args.verbose:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] - Starting website agent")
    
    try:
        # Initialize agent
        agent = WebsiteQueryAgent(api_key=args.api_key)
        
        # Load existing vector store if specified
        if args.load_path:
            agent.load_vector_store(args.load_path)
        
        # Load URLs if provided
        if args.urls:
            agent.load_website(args.urls)
            
            # Save vector store if path specified
            if args.save_path:
                agent.save_vector_store(args.save_path)
        
        # Process query if provided
        if args.query:
            # Check if query is a file reference (starts with @)
            query = args.query
            
            # Handle JSON-formatted strings (for Windows compatibility)
            if (query.startswith('"') and query.endswith('"')) or (query.startswith("'") and query.endswith("'")):
                try:
                    import json
                    # Try to parse as JSON string
                    query = json.loads(query)
                    if args.verbose:
                        print(f"Parsed JSON-formatted query: {query}")
                except:
                    # If not valid JSON, use as-is but strip outer quotes
                    if len(query) > 1:
                        query = query[1:-1]
                    if args.verbose:
                        print(f"Using query with quotes removed: {query}")
            
            # Handle file references
            if query.startswith('@'):
                try:
                    file_path = query[1:]  # Remove the @ symbol
                    with open(file_path, 'r', encoding='utf-8') as file:
                        query = file.read().strip()
                    if args.verbose:
                        print(f"Loaded query from file: {file_path}")
                except Exception as e:
                    print(f"Error loading query from file: {str(e)}")
                    return 1
            
            if not agent.qa_chain:
                print("Error: No website loaded. Please provide URLs or a vector store path.")
                return
            
            result = agent.query(query)
            print("\nAnswer:")
            print(result.get("result", "No answer found"))
        
        # Run in interactive mode if specified
        if args.interactive:
            run_interactive_mode(agent, args.save_path, args.load_path)
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1
    
    return 0

def run_interactive_mode(agent: WebsiteQueryAgent, save_path: str = "vector_store", load_path: str = None):
    """Run the agent in interactive mode via terminal"""
    print("\n===== Website Query Agent - Interactive Mode =====")
    
    # Load existing vector store if specified
    if load_path:
        agent.load_vector_store(load_path)
        print(f"Loaded vector store from {load_path}")
        has_data = True
    else:
        has_data = False
    
    # Main interactive loop
    while True:
        if not has_data:
            print("\nEnter the URL(s) you want to query (space-separated) or 'exit' to quit:")
            urls_input = input("> ").strip()
            
            if urls_input.lower() == 'exit':
                print("Exiting. Goodbye!")
                break
                
            if not urls_input:
                print("No URLs provided. Please try again.")
                continue
                
            urls = urls_input.split()
            try:
                agent.load_website(urls)
                has_data = True
                
                # Automatically save vector store
                agent.save_vector_store(save_path)
                print(f"Vector store saved to {save_path}")
            except Exception as e:
                print(f"Error loading URLs: {str(e)}")
                continue
        
        print("\nAsk a question about the website(s) or type:")
        print("- 'new' to load new URLs")
        print("- 'exit' to quit")
        
        question = input("> ").strip()
        
        if question.lower() == 'exit':
            print("Exiting. Goodbye!")
            break
            
        if question.lower() == 'new':
            has_data = False
            continue
            
        if not question:
            print("No question provided. Please try again.")
            continue
            
        print("\nProcessing question...")
        try:
            response = agent.query(question)
            print("\nAnswer:")
            print(response.get("result", "No answer found"))
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    sys.exit(main())
