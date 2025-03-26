import os
from typing import List, Dict
import argparse
from dotenv import load_dotenv
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import RetrievalQA
import google.generativeai as genai

# Try to import FAISS, fall back to simple list store if not available
try:
    from langchain_community.vectorstores import FAISS
    VECTOR_STORE_MODULE = "FAISS"
except ImportError:
    print("FAISS not available, using simple list store.")
    from langchain_community.vectorstores.memory import MemoryVectorStore
    VECTOR_STORE_MODULE = "InMemory"

# Check for required packages
def check_required_packages():
    missing_packages = []
    
    try:
        import langchain
        import langchain_community
        import langchain_google_genai
    except ImportError as e:
        missing_packages.append(str(e).split("'")[1])
    
    try:
        import google.generativeai
    except ImportError:
        missing_packages.append("google-generativeai")
    
    try:
        import bs4
    except ImportError:
        missing_packages.append("beautifulsoup4")
    
    try:
        import lxml
    except ImportError:
        missing_packages.append("lxml")
        
    if missing_packages:
        print(f"Error: Missing required packages: {', '.join(missing_packages)}")
        print(f"Please install them using: pip install --user {' '.join(missing_packages)}")
        return False
    
    return True

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
        
        # Create vector store based on available module
        if VECTOR_STORE_MODULE == "FAISS":
            self.vector_store = FAISS.from_documents(chunks, self.embeddings)
        else:
            self.vector_store = MemoryVectorStore.from_documents(chunks, self.embeddings)
            
        print(f"Vector store created successfully using {VECTOR_STORE_MODULE}")
        
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
    # First check for required packages
    if not check_required_packages():
        return 1
        
    # Load environment variables
    load_dotenv()
    
    # Use argparse for command line arguments
    parser = argparse.ArgumentParser(description='Load a website and query its content.')
    parser.add_argument('url_file', help='File containing the website URL to load')
    parser.add_argument('--question', help='Question to ask about the website content')
    parser.add_argument('--save_path', default='vector_store', help='Path to save the vector store')
    parser.add_argument('--load_path', help='Path to load the vector store from')
    args = parser.parse_args()
    
    # Get API key from environment
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY environment variable not set.")
        print("Please set it in the .env file or as an environment variable.")
        return 1
    
    try:
        # Read URL from file
        if os.path.exists(args.url_file):
            with open(args.url_file, 'r') as f:
                url = f.read().strip()
                if not url:
                    print("Error: URL file is empty.")
                    return 1
        else:
            # Treat as direct URL input if file doesn't exist and it looks like a URL
            url = args.url_file.strip()
            if not url.startswith(('http://', 'https://')):
                print(f"Error: URL file '{args.url_file}' not found and input is not a valid URL.")
                return 1
        
        # Extract website domain for vector store path
        try:
            from urllib.parse import urlparse
            domain = urlparse(url).netloc
            vector_store_path = os.path.join(args.save_path, domain.replace('.', '_'))
        except:
            vector_store_path = args.save_path
        
        # Initialize agent
        agent = WebsiteQueryAgent(api_key=api_key)
        
        # Check for load path
        if args.load_path and os.path.exists(args.load_path):
            # Load existing vector store
            agent.load_vector_store(args.load_path)
        else:
            # Load website and create new vector store
            print(f"Analyzing website: {url}")
            agent.load_website([url])
            os.makedirs(os.path.dirname(vector_store_path), exist_ok=True)
            agent.save_vector_store(vector_store_path)
        
        # If question is provided, query the website
        if args.question:
            response = agent.query(args.question)
            print(response['result'])
        else:
            # Otherwise, run in interactive mode
            run_interactive_mode(agent, save_path=vector_store_path)
            
        return 0
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)
