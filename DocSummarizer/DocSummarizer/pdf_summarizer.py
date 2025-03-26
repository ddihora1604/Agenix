import os
import argparse
import warnings
import sys
import uuid
import time
import traceback
from typing import List, Dict, Any
from dotenv import load_dotenv

# Suppress deprecation warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Load environment variables from .env file
load_dotenv()

# Set timeout values for API calls
DEFAULT_API_TIMEOUT = 60  # seconds
MAX_API_TIMEOUT = 120 # seconds

# Function to check dependencies
def check_dependencies():
    missing_deps = []
    
    # Check for core dependencies
    try:
        import google.generativeai
    except ImportError:
        missing_deps.append("google-generativeai")
    
    try:
        import pypdf
    except ImportError:
        missing_deps.append("pypdf")
    
    if missing_deps:
        print("ERROR: Missing dependencies:", ", ".join(missing_deps), file=sys.stderr)
        print("Please install the missing dependencies using:", file=sys.stderr)
        print(f"pip install {' '.join(missing_deps)}", file=sys.stderr)
        sys.exit(1)
    
    # Continue with checking LangChain dependencies - but don't fail if they're inconsistent
    print("Checking LangChain dependencies...", file=sys.stderr)
    
    langchain_deps = []
    try:
        from langchain_community.document_loaders import PyPDFLoader
    except ImportError:
        langchain_deps.append("langchain-community")
    
    try:
        from langchain.text_splitter import RecursiveCharacterTextSplitter
    except ImportError:
        langchain_deps.append("langchain")
    
    try:
        import google.generativeai as genai
        has_genai = True
    except ImportError:
        has_genai = False
        langchain_deps.append("google-generativeai")
    
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
        has_langchain_genai = True
    except (ImportError, Exception) as e:
        has_langchain_genai = False
        print(f"Warning: langchain-google-genai import error: {e}", file=sys.stderr)
        langchain_deps.append("langchain-google-genai")
    
    vector_store_available = False
    try:
        from langchain_chroma import Chroma
        vector_store_available = "chroma"
    except (ImportError, Exception):
        try:
            from langchain_community.vectorstores import FAISS
            vector_store_available = "faiss"
        except (ImportError, Exception):
            if not any(x in langchain_deps for x in ["langchain-chroma", "faiss-cpu"]):
                langchain_deps.append("langchain-chroma or faiss-cpu")
    
    if langchain_deps:
        print("Warning: Some LangChain dependencies may be missing or incompatible:", ", ".join(langchain_deps), file=sys.stderr)
        print("The script will attempt to run with limited functionality.", file=sys.stderr)
    
    return {
        'has_genai': has_genai,
        'has_langchain_genai': has_langchain_genai,
        'vector_store_available': vector_store_available
    }

# Check dependencies first
dependencies = check_dependencies()

def direct_summary_with_genai(pdf_path, summary_length="standard", focus_areas=None):
    """Generate a summary directly from a PDF file using Google GenerativeAI."""
    start_time = time.time()
    try:
        # Import required packages inside function to handle import errors gracefully
        try:
            import google.generativeai as genai
            from pypdf import PdfReader
        except ImportError as e:
            print(f"Error importing necessary packages: {e}", file=sys.stderr)
            return f"Error: Missing dependencies - {e}"
            
        # Load environment variables if they exist
        dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
        if os.path.exists(dotenv_path):
            load_dotenv(dotenv_path)
            
        # Check for Google API Key
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("ERROR: GOOGLE_API_KEY not found in environment", file=sys.stderr)
            return "Error: GOOGLE_API_KEY not found in environment variables or .env file"
        
        # Configure the API with explicit error handling
        try:
            genai.configure(api_key=api_key)
        except Exception as config_error:
            print(f"ERROR: Failed to configure Google API: {config_error}", file=sys.stderr)
            return f"Error: Failed to configure Google API - {str(config_error)}"
        
        # Load and process the PDF file
        try:
            print(f"Loading PDF file: {pdf_path}", file=sys.stderr)
            reader = PdfReader(pdf_path)
            text = ""
            for i, page in enumerate(reader.pages):
                if i % 10 == 0 and i > 0:
                    print(f"Processed {i} pages so far...", file=sys.stderr)
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
                
            if not text.strip():
                return "Error: Could not extract text from the PDF. The document may be scanned or secured."
                
            print(f"Successfully extracted {len(reader.pages)} pages from PDF. Total chars: {len(text)}", file=sys.stderr)
            
            # Log time taken for PDF extraction
            extraction_time = time.time() - start_time
            print(f"PDF extraction completed in {extraction_time:.2f} seconds", file=sys.stderr)
        except Exception as pdf_error:
            print(f"ERROR: Failed to process PDF file: {pdf_error}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return f"Error: Failed to process PDF file - {str(pdf_error)}"
        
        # Define newline character first
        newline = '\n'
        
        # Determine length instructions based on the summary_length parameter
        length_guide = {
            "brief": "Create a brief summary (1-2 paragraphs) that captures the most essential information.",
            "standard": "Create a standard-length summary (3-4 paragraphs) that balances completeness with conciseness.",
            "comprehensive": "Create a detailed, comprehensive summary (5+ paragraphs) that covers all significant aspects."
        }.get(summary_length, "Create a standard-length summary (3-4 paragraphs) that balances completeness with conciseness.")
        
        # Add focus areas instructions if provided
        focus_instruction = ""
        if focus_areas and focus_areas.strip():
            focus_instruction = f"Pay special attention to these specific areas: {focus_areas}"
        
        # Prepare prompt with a more structured approach and limit input size
        max_text_length = 25000  # Reduced from 30000 to process faster
        
        # If text is too long, add note about truncation
        truncation_note = ""
        if len(text) > max_text_length:
            truncation_note = f"Note: The document is {len(text)} characters long, but for processing efficiency, only the first {max_text_length} characters are being analyzed."
            print(f"Document is large ({len(text)} chars). Truncating to {max_text_length} chars for faster processing.", file=sys.stderr)
        
        prompt = f"""
        You are an expert document analyst and summarizer. The following text is extracted from a PDF document.
        
        {length_guide}
        
        Consider the following aspects when creating your summary:
        
        1. KEY POINTS: Identify and summarize the most important information
        2. MAIN ARGUMENTS: Extract the primary arguments or claims made in the document
        3. EVIDENCE/DATA: Include significant evidence, statistics, or data presented, if any
        4. CONCLUSIONS: Summarize the author's conclusions or recommendations
        5. CONTEXT: Provide relevant context about the document's purpose and audience
        
        {focus_instruction}
        
        {truncation_note}
        
        Focus only on information present in the document. If you don't have enough information in the 
        provided context, do your best with what's available.
        
        Do not include phrases like "The document discusses" or "The text mentions" in your summary.
        Format the summary in clear paragraphs with logical organization.
        
        PDF CONTENT:
        {text[:max_text_length]}
        
        SUMMARY:
        """
        
        # Initialize the model with retry mechanism
        max_retries = 2
        retry_count = 0
        last_error = None
        
        while retry_count <= max_retries:
            try:
                print(f"Initializing Gemini model (attempt {retry_count + 1}/{max_retries + 1})...", file=sys.stderr)
                # Use gemini-1.0-pro as a fallback if available
                model_options = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro']
                
                # Try models in order until one works
                for model_name in model_options:
                    try:
                        print(f"Trying model: {model_name}", file=sys.stderr)
                        model = genai.GenerativeModel(model_name)
                        print(f"Successfully initialized {model_name}", file=sys.stderr)
                        break
                    except Exception as model_init_error:
                        print(f"Failed to initialize {model_name}: {model_init_error}", file=sys.stderr)
                        if model_name == model_options[-1]:  # If this was the last model option
                            raise model_init_error
                break
            except Exception as model_error:
                last_error = model_error
                retry_count += 1
                print(f"ERROR: Failed to initialize Gemini model (attempt {retry_count}/{max_retries + 1}): {model_error}", file=sys.stderr)
                if retry_count <= max_retries:
                    print(f"Retrying in 2 seconds...", file=sys.stderr)
                    time.sleep(2)
                else:
                    print(f"ERROR: Max retries exceeded for model initialization", file=sys.stderr)
                    return f"Error: Failed to initialize Gemini model after {max_retries + 1} attempts - {str(last_error)}"
        
        # Generate response with retry mechanism
        retry_count = 0
        api_timeout = DEFAULT_API_TIMEOUT
        
        print(f"Starting summary generation at {time.time() - start_time:.2f} seconds elapsed", file=sys.stderr)
        
        while retry_count <= max_retries:
            try:
                print(f"Generating summary using Gemini (attempt {retry_count + 1}/{max_retries + 1})...", file=sys.stderr)
                print(f"Using timeout of {api_timeout} seconds", file=sys.stderr)
                
                generation_start = time.time()
                response = model.generate_content(
                    prompt, 
                    generation_config={
                        "temperature": 0.2,  # Reduced from 0.3 for more deterministic output
                        "top_p": 0.95,
                        "max_output_tokens": 2048,
                        "timeout": api_timeout  # Using dynamic timeout
                    }
                )
                generation_time = time.time() - generation_start
                print(f"Successfully received response from Gemini API in {generation_time:.2f} seconds", file=sys.stderr)
                
                # Log total time taken
                total_time = time.time() - start_time
                print(f"Total processing time: {total_time:.2f} seconds", file=sys.stderr)
                
                return response.text
            except Exception as gen_error:
                last_error = gen_error
                retry_count += 1
                print(f"ERROR: Failed to generate summary (attempt {retry_count}/{max_retries + 1}): {gen_error}", file=sys.stderr)
                
                if "API key" in str(gen_error):
                    print(f"ERROR: Invalid API key or authentication issue", file=sys.stderr)
                    return f"Error: API key is invalid or has authentication issues - {str(gen_error)}"
                    
                if "quota" in str(gen_error).lower() or "limit" in str(gen_error).lower():
                    print(f"ERROR: API quota or rate limit exceeded", file=sys.stderr)
                    return f"Error: API quota or rate limit exceeded - {str(gen_error)}"
                
                # If timeout error or network issue, increase timeout for next attempt
                if "timeout" in str(gen_error).lower() or "network" in str(gen_error).lower():
                    api_timeout = min(api_timeout * 1.5, MAX_API_TIMEOUT)  # Increase timeout, but not beyond max
                    print(f"Timeout or network error. Increasing timeout to {api_timeout} seconds for next attempt", file=sys.stderr)
                
                if retry_count <= max_retries:
                    wait_time = 2 * retry_count  # Exponential backoff
                    print(f"Retrying in {wait_time} seconds...", file=sys.stderr)
                    time.sleep(wait_time)
                else:
                    print(f"ERROR: Max retries exceeded for summary generation", file=sys.stderr)
                    return f"Error: Failed to generate summary after {max_retries + 1} attempts - {str(last_error)}"
        
    except Exception as e:
        print(f"ERROR: Unexpected error in summary generation: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return f"Error: Unexpected error - {str(e)}"

# Now conditionally import LangChain components based on availability
if dependencies['has_langchain_genai']:
    try:
        # Import LangChain components with careful error handling
        from langchain_community.document_loaders import PyPDFLoader
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
        from langchain.prompts import ChatPromptTemplate
        from langchain.chains.combine_documents import create_stuff_documents_chain
        from langchain.chains import create_retrieval_chain
        
        # Set a global variable for vector store type based on what's available
        vector_store_type = dependencies['vector_store_available']
        if vector_store_type == 'chroma':
            from langchain_chroma import Chroma
        elif vector_store_type == 'faiss':
            from langchain_community.vectorstores import FAISS
        else:
            vector_store_type = None
    except Exception as import_error:
        print(f"WARNING: Failed to import LangChain components: {import_error}", file=sys.stderr)
        dependencies['has_langchain_genai'] = False
        vector_store_type = None
else:
    vector_store_type = None

def load_pdf(pdf_path: str) -> List[Dict]:
    """Load PDF document and return list of page contents."""
    try:
        from pypdf import PdfReader
        
        print(f"Loading PDF file: {pdf_path}", file=sys.stderr)
        reader = PdfReader(pdf_path)
        documents = []
        
        for i, page in enumerate(reader.pages):
            if i % 10 == 0 and i > 0:
                print(f"Processed {i} pages so far...", file=sys.stderr)
            text = page.extract_text()
            if text.strip():  # Only add non-empty pages
                documents.append({
                    "page_content": text,
                    "metadata": {"page": i+1, "source": pdf_path}
                })
        
        if not documents:
            raise ValueError(f"No content extracted from {pdf_path}")
            
        # Print a message to confirm extraction
        total_chars = sum(len(doc["page_content"]) for doc in documents)
        print(f"Successfully extracted {len(documents)} pages ({total_chars} characters) from PDF.", file=sys.stderr)
        
        return documents
    except Exception as e:
        print(f"Error loading PDF: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        raise

def split_documents(documents: List[Dict], chunk_size: int = 1000, chunk_overlap: int = 200) -> List[Dict]:
    """Split documents into chunks for processing without relying on LangChain."""
    chunks = []
    for doc in documents:
        text = doc["page_content"]
        metadata = doc["metadata"]
        
        # Simple chunk splitting - could be improved
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            if end < len(text) and end - start < chunk_size:
                # Find the last period or newline to make a more natural break
                last_period = text.rfind(".", start, end)
                last_newline = text.rfind("\n", start, end)
                break_point = max(last_period, last_newline)
                if break_point > start:
                    end = break_point + 1
            
            chunks.append({
                "page_content": text[start:end],
                "metadata": metadata.copy()
            })
            
            start = end - chunk_overlap
            if start < 0:
                start = 0
    
    print(f"Split content into {len(chunks)} chunks.", file=sys.stderr)
    return chunks

def convert_to_langchain_docs(documents: List[Dict]) -> List:
    """Convert our document format to LangChain Document objects."""
    try:
        from langchain_core.documents import Document
        return [Document(page_content=doc["page_content"], metadata=doc["metadata"]) for doc in documents]
    except Exception as e:
        print(f"Error converting to LangChain documents: {e}", file=sys.stderr)
        return None

def create_vectorstore(documents):
    """Create vector store from documents for retrieval."""
    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        
        # Use the appropriate vector store based on what's available
        if vector_store_type == "chroma":
            return VectorStore.from_documents(documents, embeddings)
        elif vector_store_type == "faiss":
            return VectorStore.from_documents(documents, embeddings)
        else:
            raise ValueError("No suitable vector store available")
    except Exception as e:
        print(f"Error creating vector store: {e}", file=sys.stderr)
        return None

def get_sophisticated_summary_prompt(summary_length="standard", focus_areas=None):
    """Create a sophisticated prompt template for document summarization."""
    # Determine length instructions based on the summary_length parameter
    length_guide = {
        "brief": "Create a brief summary (1-2 paragraphs) that captures the most essential information.",
        "standard": "Create a standard-length summary (3-4 paragraphs) that balances completeness with conciseness.",
        "comprehensive": "Create a detailed, comprehensive summary (5+ paragraphs) that covers all significant aspects."
    }.get(summary_length, "Create a standard-length summary (3-4 paragraphs) that balances completeness with conciseness.")
    
    # Add focus areas instructions if provided
    focus_instruction = ""
    if focus_areas and focus_areas.strip():
        focus_instruction = f"Pay special attention to these specific areas: {focus_areas}"
    
    template = f"""
    You are an expert document analyst and summarizer. The following text is extracted from a PDF document.
    
    {length_guide}
    
    Consider the following aspects when creating your summary:
    
    1. KEY POINTS: Identify and summarize the most important information
    2. MAIN ARGUMENTS: Extract the primary arguments or claims made in the document
    3. EVIDENCE/DATA: Include significant evidence, statistics, or data presented, if any
    4. CONCLUSIONS: Summarize the author's conclusions or recommendations
    5. CONTEXT: Provide relevant context about the document's purpose and audience
    
    {focus_instruction}
    
    Focus only on information present in the document. If you don't have enough information in the 
    provided context, do your best with what's available.
    
    Do not include phrases like "The document discusses" or "The text mentions" in your summary.
    Format the summary in clear paragraphs with logical organization.
    
    PDF CONTENT:
    {{context}}
    
    SUMMARY:
    """
    
    return ChatPromptTemplate.from_template(template)

def create_summary_chain(llm, summary_length="standard", focus_areas=None):
    """Create a chain for document summarization."""
    prompt = get_sophisticated_summary_prompt(summary_length, focus_areas)
    return create_stuff_documents_chain(llm, prompt)

def print_document_sample(documents, max_chars=200):
    """Print a sample of the document content for debugging."""
    if not documents:
        print("No document content available", file=sys.stderr)
        return
    
    if isinstance(documents[0], dict):
        sample = documents[0]["page_content"][:max_chars]
    else:
        # Assume LangChain Document objects
        sample = documents[0].page_content[:max_chars]
        
    print(f"\nDocument sample (first {max_chars} chars):", file=sys.stderr)
    print("-" * 50, file=sys.stderr)
    print(sample + "...", file=sys.stderr)
    print("-" * 50, file=sys.stderr)

def summarize_pdf(pdf_path: str, summary_length="standard", focus_areas=None) -> str:
    """Main function to summarize a PDF document."""
    start_time = time.time()
    
    try:
        # Get API key from environment variable
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("ERROR: GOOGLE_API_KEY not found in environment", file=sys.stderr)
            return "Error: GOOGLE_API_KEY not found in environment variables or .env file"
        os.environ["GOOGLE_API_KEY"] = api_key
        
        # If LangChain integration is not available, fall back to direct API usage
        if not dependencies['has_langchain_genai']:
            print("LangChain integration not available. Using direct Google Generative AI...", file=sys.stderr)
            summary = direct_summary_with_genai(pdf_path, summary_length, focus_areas)
            return summary
        
        try:
            # Load and process the PDF
            documents = load_pdf(pdf_path)
            
            load_time = time.time() - start_time
            print(f"PDF loading completed in {load_time:.2f} seconds", file=sys.stderr)
            
            # Print a sample of the document content
            print_document_sample(documents)
            
            # Split into chunks if document is large
            chunks = split_documents(documents)
            
            chunk_time = time.time() - start_time
            print(f"Document chunking completed in {chunk_time:.2f} seconds", file=sys.stderr)
            
            # Convert to LangChain Document objects if needed
            lc_documents = convert_to_langchain_docs(chunks)
            if not lc_documents:
                print("Failed to convert documents to LangChain format. Falling back to direct API.", file=sys.stderr)
                summary = direct_summary_with_genai(pdf_path, summary_length, focus_areas)
                return summary
            
            # Create vector store for retrieval
            print(f"Creating vector store for document retrieval using {vector_store_type}...", file=sys.stderr)
            vectorstore = create_vectorstore(lc_documents)
            if not vectorstore:
                print("Failed to create vector store. Falling back to direct API.", file=sys.stderr)
                summary = direct_summary_with_genai(pdf_path, summary_length, focus_areas)
                return summary
            
            vector_time = time.time() - start_time
            print(f"Vector store creation completed in {vector_time:.2f} seconds", file=sys.stderr)
            
            retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
            
            # Set up the LLM
            print("Initializing Gemini model...", file=sys.stderr)
            
            # Try multiple model options in case the primary one fails
            llm = None
            model_options = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro']
            for model_name in model_options:
                try:
                    print(f"Trying model: {model_name}", file=sys.stderr)
                    llm = ChatGoogleGenerativeAI(
                        model=model_name,
                        temperature=0.2,  # Reduced from 0.3 for more consistent results
                        top_p=0.95,
                        max_output_tokens=2048,
                        timeout=DEFAULT_API_TIMEOUT
                    )
                    print(f"Successfully initialized {model_name}", file=sys.stderr)
                    break
                except Exception as model_error:
                    print(f"Failed to initialize {model_name}: {model_error}", file=sys.stderr)
            
            if not llm:
                print("Failed to initialize any Gemini model. Falling back to direct API.", file=sys.stderr)
                summary = direct_summary_with_genai(pdf_path, summary_length, focus_areas)
                return summary
            
            # Create the summary chain with specified parameters
            summary_chain = create_summary_chain(llm, summary_length, focus_areas)
            
            # Create retrieval chain
            retrieval_chain = create_retrieval_chain(retriever, summary_chain)
            
            # Run the chain
            print(f"Generating {summary_length} summary...", file=sys.stderr)
            
            chain_start = time.time()
            result = retrieval_chain.invoke({"input": "Summarize this document thoroughly."})
            chain_time = time.time() - chain_start
            
            print(f"Summary generation completed in {chain_time:.2f} seconds", file=sys.stderr)
            
            # Total processing time
            total_time = time.time() - start_time
            print(f"Total processing time: {total_time:.2f} seconds", file=sys.stderr)
            
            # Return the summary with markers removed
            if str(result["answer"]).startswith("Error:"):
                print(f"ERROR: {result['answer'][7:]}", file=sys.stderr)
                return result["answer"]
            return result["answer"]
        except Exception as e:
            print(f"ERROR: {str(e)}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            print("Falling back to direct Google Generative AI...", file=sys.stderr)
            summary = direct_summary_with_genai(pdf_path, summary_length, focus_areas)
            return summary
    except Exception as e:
        print(f"ERROR: Failed to summarize PDF: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return f"Error: Failed to summarize document - {str(e)}"

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Summarize a PDF document using LangChain and Gemini')
    parser.add_argument('pdf_path', type=str, help='Path to the PDF file')
    parser.add_argument('--summary_length', type=str, choices=['brief', 'standard', 'comprehensive'], 
                        default='standard', help='Length of summary (brief, standard, comprehensive)')
    parser.add_argument('--focus_areas', type=str, default='', 
                        help='Comma-separated list of areas to focus on in the summary')
    
    args = parser.parse_args()
    
    # Redirect warning messages to stderr
    import warnings
    warnings._showwarning_orig = warnings.showwarning
    def _showwarning(message, *args, **kwargs):
        print(message, file=sys.stderr)
    warnings.showwarning = _showwarning
    
    try:
        # Check if the PDF file exists
        if not os.path.exists(args.pdf_path):
            print(f"ERROR: PDF file not found: {args.pdf_path}", file=sys.stderr)
            sys.exit(1)
            
        # Print start time for performance tracking
        start_time = time.time()
        print(f"Starting document summarization at {time.strftime('%H:%M:%S')}...", file=sys.stderr)
            
        # Attempt to summarize the PDF
        print(f"Processing PDF: {args.pdf_path}", file=sys.stderr)
        print(f"Summary length: {args.summary_length}", file=sys.stderr)
        if args.focus_areas:
            print(f"Focus areas: {args.focus_areas}", file=sys.stderr)
            
        summary = summarize_pdf(args.pdf_path, args.summary_length, args.focus_areas)
        
        # Check if the summary starts with "Error:"
        if summary.startswith("Error:"):
            print(f"ERROR: {summary[7:]}", file=sys.stderr)
            sys.exit(1)
        
        # Print elapsed time for performance tracking
        elapsed_time = time.time() - start_time
        print(f"Document summarization completed in {elapsed_time:.2f} seconds", file=sys.stderr)
        
        # Flush stderr to ensure all debug messages are separated from stdout
        sys.stderr.flush()
        
        # Clear any previous stdout content
        sys.stdout.flush()
        
        # Print the summary with clear markers for the frontend to parse
        print("###SUMMARY_START###")
        # Ensure the output is immediately flushed
        sys.stdout.flush()
        print(summary)
        sys.stdout.flush()
        print("###SUMMARY_END###")
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: Failed to summarize document: {str(e)}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
