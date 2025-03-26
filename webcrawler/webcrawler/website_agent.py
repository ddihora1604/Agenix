import os
from typing import List, Dict
import argparse
from dotenv import load_dotenv
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS  # Updated import path
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import RetrievalQA
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

class WebsiteQueryAgent:
    def __init__(self, api_key: str = None, model_name: str = "models/gemini-2.0-flash"):
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
        loader = WebBaseLoader(urls)
        documents = loader.load()
        
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
        print("QA chain setup complete")
    
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
            response = self.qa_chain.invoke({"query": enhanced_question})
            return response
        except Exception as e:
            return {"answer": f"Error processing query: {str(e)}"}


def run_interactive_mode(agent: WebsiteQueryAgent, save_path: str = "vector_store", load_path: str = None):
    """Run the agent in interactive mode via terminal - simplified version"""
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
            print("\nQuestion:", question)
            print("\nAnswer:", response.get("result", "No answer found"))
            
            # Add an extra prompt for follow-up questions
            print("\nDo you want more details or have a follow-up question? (Or type 'new'/'exit')")
        except Exception as e:
            print(f"Error processing question: {str(e)}")


def main():
    # Load environment variables
    load_dotenv()
    
    parser = argparse.ArgumentParser(description="Website Query Agent using Gemini 2.0 Flash")
    parser.add_argument("--api_key", type=str, help="Google API Key (overrides .env file)")
    parser.add_argument("--urls", nargs="+", help="List of URLs to process")
    parser.add_argument("--save_path", type=str, help="Path to save vector store", default="vector_store")
    parser.add_argument("--load_path", type=str, help="Path to load vector store")
    parser.add_argument("--query", type=str, help="Question to ask")
    parser.add_argument("--interactive", "-i", action="store_true", help="Enter interactive mode")
    
    args = parser.parse_args()
    
    # Priority: 1. Command line arg, 2. .env file, 3. Interactive input
    api_key = args.api_key or os.environ.get("GOOGLE_API_KEY")
    
    # If no arguments provided, default to interactive mode
    if not (args.urls or args.load_path or args.interactive):
        args.interactive = True
        print("No arguments provided, defaulting to interactive mode.")
    
    # If in interactive mode and no API key, prompt for it
    if args.interactive and not api_key:
        api_key = input("Enter your Google API key: ").strip()
    
    if not api_key:
        print("Error: Google API key is required. Provide it with --api_key or set GOOGLE_API_KEY in .env file.")
        return
    
    try:
        agent = WebsiteQueryAgent(api_key=api_key)
        
        # Interactive mode
        if args.interactive:
            run_interactive_mode(agent, args.save_path, args.load_path)
            return
        
        # Non-interactive mode
        if args.load_path:
            agent.load_vector_store(args.load_path)
        elif args.urls:
            agent.load_website(args.urls)
            if args.save_path:
                agent.save_vector_store(args.save_path)
        else:
            print("Please provide either URLs to process or a vector store to load")
            return
        
        if args.query:
            response = agent.query(args.query)
            print("\nQuestion:", args.query)
            print("\nAnswer:", response.get("result", "No answer found"))
    
    except ValueError as e:
        print(f"Error: {str(e)}")
        return


if __name__ == "__main__":
    main()
