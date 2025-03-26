import os
import argparse
import warnings
import sys
import uuid
import time
import traceback
import multiprocessing
import re
from typing import List, Dict, Any
from dotenv import load_dotenv

# Suppress deprecation warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Load environment variables from .env file
load_dotenv()

# Set timeout values for API calls
DEFAULT_API_TIMEOUT = 60  # seconds
MAX_API_TIMEOUT = 120  # seconds
MAX_TEXT_LENGTH = 25000  # Maximum text length to process

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
    has_langchain = True
    
    try:
        from langchain_community.document_loaders import PyPDFLoader
    except ImportError:
        langchain_deps.append("langchain-community")
        has_langchain = False
    
    try:
        from langchain.text_splitter import RecursiveCharacterTextSplitter
    except ImportError:
        langchain_deps.append("langchain")
        has_langchain = False
    
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
        'has_langchain': has_langchain,
        'has_langchain_genai': has_langchain_genai,
        'vector_store_available': vector_store_available
    }

# Function to validate PDF file and extract page count
def validate_pdf(pdf_path):
    """Validate a PDF file and return basic info about it."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        return {
            "valid": True,
            "page_count": len(reader.pages),
            "is_encrypted": reader.is_encrypted,
            "metadata": reader.metadata
        }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e)
        }

# Optimized PDF text extraction function
def extract_text_from_pdf(pdf_path, max_pages=None):
    """Extract text from PDF with improved performance and memory usage."""
    try:
        from pypdf import PdfReader
        start_time = time.time()
        
        # Get PDF info
        reader = PdfReader(pdf_path)
        total_pages = len(reader.pages)
        
        # Limit pages if specified
        if max_pages and max_pages < total_pages:
            process_pages = max_pages
            print(f"Processing only first {max_pages} of {total_pages} pages", file=sys.stderr)
        else:
            process_pages = total_pages
            
        # Define a worker function for parallel processing
        def extract_text_from_page(page_info):
            page_num, reader_path = page_info
            try:
                # We need to create a new reader for each process to avoid sharing resources
                local_reader = PdfReader(reader_path)
                page = local_reader.pages[page_num]
                text = page.extract_text()
                return page_num, text if text and text.strip() else ""
            except Exception as e:
                print(f"Warning: Could not extract text from page {page_num+1}: {e}", file=sys.stderr)
                return page_num, ""
        
        # Determine if we should use multiprocessing
        # For small documents, sequential processing may be faster due to overhead
        use_parallel = process_pages > 10 and multiprocessing.cpu_count() > 1
        
        if use_parallel:
            # Prepare the arguments for parallel processing
            try:
                print(f"Using parallel processing with {min(multiprocessing.cpu_count(), 4)} workers", file=sys.stderr)
                page_args = [(i, pdf_path) for i in range(process_pages)]
                
                # Use a smaller chunk size for more even distribution of work
                chunk_size = max(1, process_pages // (multiprocessing.cpu_count() * 4))
                
                # Create a pool with a reasonable number of processes
                with multiprocessing.Pool(processes=min(multiprocessing.cpu_count(), 4)) as pool:
                    # Process pages in parallel and collect results
                    results = list(pool.imap_unordered(extract_text_from_page, page_args, chunk_size))
                
                # Sort results by page number to maintain document order
                results.sort(key=lambda x: x[0])
                all_text = [text for _, text in results if text]
                
                print(f"Processed {len(results)} pages in parallel", file=sys.stderr)
            except Exception as mp_error:
                print(f"Parallel processing failed: {mp_error}. Falling back to sequential processing.", file=sys.stderr)
                use_parallel = False
        
        # Sequential processing (fallback or default for small documents)
        if not use_parallel:
            print("Using sequential processing", file=sys.stderr)
            # Process pages in smaller batches to avoid memory issues
            batch_size = 10
            all_text = []
            
            for batch_start in range(0, process_pages, batch_size):
                batch_end = min(batch_start + batch_size, process_pages)
                batch_text = []
                
                for i in range(batch_start, batch_end):
                    if i % 10 == 0:
                        print(f"Extracting text from page {i+1}/{process_pages}...", file=sys.stderr)
                    try:
                        page = reader.pages[i]
                        text = page.extract_text()
                        if text and text.strip():
                            batch_text.append(text)
                    except Exception as e:
                        print(f"Warning: Could not extract text from page {i+1}: {e}", file=sys.stderr)
                
                # Join text from this batch
                all_text.extend(batch_text)
                
                # Report progress
                print(f"Processed pages {batch_start+1}-{batch_end} ({batch_end}/{process_pages})", file=sys.stderr)
        
        # Join all text with double newlines
        result = "\n\n".join(all_text)
        
        elapsed = time.time() - start_time
        print(f"PDF text extraction completed in {elapsed:.2f} seconds", file=sys.stderr)
        print(f"Extracted {len(result)} characters from {process_pages} pages", file=sys.stderr)
        
        # Check if we actually extracted content
        if not result.strip():
            print("WARNING: No text content extracted from PDF.", file=sys.stderr)
            return {
                "success": False,
                "error": "No text content could be extracted from the PDF.",
                "error_type": "EmptyContent"
            }
        
        return {
            "success": True,
            "text": result,
            "total_pages": total_pages,
            "processed_pages": process_pages,
            "elapsed_time": elapsed
        }
    except Exception as e:
        print(f"ERROR: Failed to extract text from PDF: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }

# Check dependencies first
dependencies = check_dependencies()

def direct_summary_with_genai(pdf_path, summary_length="standard", focus_areas=None, max_pages=None):
    """Generate a summary directly from a PDF file using Google GenerativeAI."""
    start_time = time.time()
    try:
        # Import required packages inside function to handle import errors gracefully
        try:
            import google.generativeai as genai
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
        
        # Validate the PDF first
        print("Validating PDF file...", file=sys.stderr)
        pdf_info = validate_pdf(pdf_path)
        if not pdf_info["valid"]:
            return f"Error: Invalid PDF file - {pdf_info['error']}"
        
        print(f"PDF validation successful. Document has {pdf_info['page_count']} pages.", file=sys.stderr)
        
        if pdf_info["is_encrypted"]:
            return "Error: Cannot process encrypted PDF files"
        
        # Apply page limit if specified
        effective_max_pages = max_pages
        if effective_max_pages is None and pdf_info["page_count"] > 50:
            effective_max_pages = 50
            print(f"PDF has {pdf_info['page_count']} pages, limiting to first {effective_max_pages} pages for performance", file=sys.stderr)
            
        # Extract text from PDF with better memory management
        print(f"Extracting text from PDF (max pages: {effective_max_pages})...", file=sys.stderr)
        extraction_result = extract_text_from_pdf(pdf_path, effective_max_pages)
        if not extraction_result["success"]:
            return f"Error: Failed to extract text from PDF - {extraction_result['error']}"
        
        text = extraction_result["text"]
        
        if not text.strip():
            return "Error: Could not extract text from the PDF. The document may be scanned or secured."
            
        # Log time taken for PDF extraction
        extraction_time = time.time() - start_time
        print(f"PDF extraction completed in {extraction_time:.2f} seconds", file=sys.stderr)
        print(f"Extracted {len(text)} characters from {extraction_result['processed_pages']} pages", file=sys.stderr)
        
        # Handle large documents by splitting into chunks if needed
        max_chunk_size = MAX_TEXT_LENGTH
        if len(text) > max_chunk_size:
            print(f"Document is large ({len(text)} chars). Processing in chunks...", file=sys.stderr)
            
            # Split into roughly equal chunks, trying to break at paragraph boundaries
            chunks = []
            # Find paragraph or sentence boundaries
            boundaries = [m.start() for m in re.finditer(r'\n\s*\n|\.\s+[A-Z]', text)]
            
            if not boundaries:
                # If no good boundaries found, just split by character count
                boundaries = list(range(0, len(text), max_chunk_size))
            
            # Create chunks
            current_pos = 0
            for next_boundary in boundaries:
                if next_boundary - current_pos >= max_chunk_size:
                    # Find a good place to break (prefer paragraph breaks)
                    break_pos = text.rfind('\n\n', current_pos, current_pos + max_chunk_size)
                    if break_pos == -1:
                        # Try to break at a sentence boundary
                        break_pos = text.rfind('. ', current_pos, current_pos + max_chunk_size)
                        if break_pos == -1:
                            # Last resort: just break at the maximum length
                            break_pos = current_pos + max_chunk_size
                    
                    # Add a small overlap to ensure context continuity
                    chunks.append(text[current_pos:break_pos + 2])
                    current_pos = break_pos
                    
            # Add the last chunk
            if current_pos < len(text):
                chunks.append(text[current_pos:])
                
            print(f"Split document into {len(chunks)} chunks for processing", file=sys.stderr)
            
            # Process each chunk and aggregate results
            partial_summaries = []
            for i, chunk in enumerate(chunks):
                print(f"Processing chunk {i+1}/{len(chunks)} ({len(chunk)} chars)...", file=sys.stderr)
                
                # Create a partial summary for this chunk
                chunk_summary = summarize_chunk(chunk, genai, summary_length, focus_areas, i+1, len(chunks))
                
                if chunk_summary.startswith("Error:"):
                    print(f"Error processing chunk {i+1}: {chunk_summary}", file=sys.stderr)
                    # If it's the first chunk and fails, that's a problem
                    if i == 0:
                        return chunk_summary
                    # Otherwise, try to continue with what we have
                    continue
                    
                partial_summaries.append(chunk_summary)
                
            if not partial_summaries:
                return "Error: Failed to generate any summaries from the document chunks"
                
            # If we have only one partial summary, just return it
            if len(partial_summaries) == 1:
                return partial_summaries[0]
                
            # Otherwise, we need to create a combined summary
            print("Generating final summary from partial summaries...", file=sys.stderr)
            combined_text = "\n\n".join(partial_summaries)
            return generate_final_summary(combined_text, genai, summary_length, focus_areas)
        else:
            # Document is small enough to process in one go
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
            
            # Prepare prompt with a more structured approach
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
            
            Focus only on information present in the document. If you don't have enough information in the 
            provided context, do your best with what's available.
            
            Do not include phrases like "The document discusses" or "The text mentions" in your summary.
            Format the summary in clear paragraphs with logical organization.
            Use bullet points for key findings or recommendations if appropriate.
            
            PDF CONTENT:
            {text}
            
            SUMMARY:
            """
            
            return generate_summary_with_model(prompt, genai)
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(f"ERROR: {error_msg}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return error_msg

def summarize_chunk(text_chunk, genai, summary_length="standard", focus_areas=None, chunk_num=1, total_chunks=1):
    """Generate a summary for a single chunk of text."""
    # Define newline character first
    newline = '\n'
    
    # Create prompt for this chunk
    chunk_specific = f"This is part {chunk_num} of {total_chunks} from the document." if total_chunks > 1 else ""
    
    # Determine length instructions based on the summary_length parameter and chunk context
    if total_chunks > 1:
        # For multi-chunk documents, make each chunk summary shorter
        length_guide = "Create a concise summary of this section of the document that captures the key information."
    else:
        length_guide = {
            "brief": "Create a brief summary (1-2 paragraphs) that captures the most essential information.",
            "standard": "Create a standard-length summary (3-4 paragraphs) that balances completeness with conciseness.",
            "comprehensive": "Create a detailed, comprehensive summary (5+ paragraphs) that covers all significant aspects."
        }.get(summary_length, "Create a standard-length summary (3-4 paragraphs) that balances completeness with conciseness.")
    
    # Add focus areas instructions if provided
    focus_instruction = ""
    if focus_areas and focus_areas.strip():
        focus_instruction = f"Pay special attention to these specific areas: {focus_areas}"
    
    # Prepare prompt with a more structured approach
    prompt = f"""
    You are an expert document analyst and summarizer. The following text is extracted from a PDF document.
    {chunk_specific}
    
    {length_guide}
    
    Consider the following aspects when creating your summary:
    
    1. KEY POINTS: Identify and summarize the most important information
    2. MAIN ARGUMENTS: Extract the primary arguments or claims made in the section
    3. EVIDENCE/DATA: Include significant evidence, statistics, or data presented, if any
    4. CONCLUSIONS: Summarize any conclusions or recommendations in this section
    
    {focus_instruction}
    
    Focus only on information present in the provided text. 
    Do not include phrases like "The document discusses" or "The text mentions" in your summary.
    
    PDF CONTENT:
    {text_chunk}
    
    SUMMARY:
    """
    
    return generate_summary_with_model(prompt, genai)

def generate_final_summary(combined_summaries, genai, summary_length="standard", focus_areas=None):
    """Generate a final summary from multiple partial summaries."""
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
    
    # Prepare prompt for the final summary
    prompt = f"""
    You are an expert document analyst and summarizer. The following text consists of summaries from different parts of a document.
    
    Your task is to create a cohesive {summary_length} summary that integrates all the partial summaries.
    {length_guide}
    
    Consider the following aspects when creating your integrated summary:
    
    1. KEY POINTS: Identify and summarize the most important information across all sections
    2. MAIN ARGUMENTS: Extract the primary arguments or claims made in the document
    3. EVIDENCE/DATA: Include significant evidence, statistics, or data presented, if any
    4. CONCLUSIONS: Summarize the author's conclusions or recommendations
    5. CONTEXT: Provide relevant context about the document's purpose and audience
    
    {focus_instruction}
    
    Ensure the final summary flows well and presents a coherent overview of the entire document.
    Do not include phrases like "According to the summaries" or "The document discusses".
    
    PARTIAL SUMMARIES:
    {combined_summaries}
    
    INTEGRATED SUMMARY:
    """
    
    return generate_summary_with_model(prompt, genai)

def generate_summary_with_model(prompt, genai):
    """Generate a summary using the Google Generative AI model with error handling and retries."""
    # Initialize the model with retry mechanism
    max_retries = 2
    retry_count = 0
    last_error = None
    
    while retry_count <= max_retries:
        try:
            print(f"Initializing Gemini model (attempt {retry_count + 1}/{max_retries + 1})...", file=sys.stderr)
            # Try models in order until one works
            model_options = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.0-pro']
            model = None
            
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
                        
            if model is None:
                raise ValueError("Failed to initialize any Gemini model")
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
    
    print(f"Starting summary generation...", file=sys.stderr)
    start_time = time.time()
    
    while retry_count <= max_retries:
        try:
            print(f"Generating summary using Gemini (attempt {retry_count + 1}/{max_retries + 1})...", file=sys.stderr)
            print(f"Using timeout of {api_timeout} seconds", file=sys.stderr)
            
            generation_start = time.time()
            
            # Set generation config with appropriate parameters
            generation_config = {
                'temperature': 0.2,  # Lower temperature for more consistent summaries
                'top_p': 0.95,
                'top_k': 40,
                'max_output_tokens': 2048,
            }
            
            # Generate response (with timeout handling)
            try:
                response = model.generate_content(
                    prompt,
                    generation_config=generation_config
                )
                
                generation_time = time.time() - generation_start
                print(f"Summary generated in {generation_time:.2f} seconds", file=sys.stderr)
                
                if not response or not hasattr(response, 'text'):
                    print("ERROR: Empty response from Gemini API", file=sys.stderr)
                    raise ValueError("Empty response from Gemini API")
                
                # Format the summary text
                summary = response.text.strip()
                
                if not summary:
                    print("ERROR: Empty summary returned", file=sys.stderr)
                    raise ValueError("Empty summary returned")
                
                print(f"Generated summary with {len(summary)} characters", file=sys.stderr)
                
                # Calculate and log total process time
                total_time = time.time() - start_time
                print(f"Total processing time: {total_time:.2f} seconds", file=sys.stderr)
                
                # Return the summary with success indicators
                print("###SUMMARY_START###", file=sys.stdout)
                print(summary, file=sys.stdout)
                print("###SUMMARY_END###", file=sys.stdout)
                
                return summary
                
            except Exception as api_error:
                print(f"ERROR during API call: {api_error}", file=sys.stderr)
                if "quota" in str(api_error).lower() or "rate" in str(api_error).lower():
                    return f"Error: Google API quota or rate limit exceeded - {str(api_error)}"
                raise api_error
                
        except Exception as gen_error:
            last_error = gen_error
            retry_count += 1
            print(f"ERROR: Summary generation failed (attempt {retry_count}/{max_retries + 1}): {gen_error}", file=sys.stderr)
            
            if retry_count <= max_retries:
                wait_time = 2 * retry_count  # Exponential backoff
                print(f"Retrying in {wait_time} seconds...", file=sys.stderr)
                time.sleep(wait_time)
                
                # Increase timeout for retry
                api_timeout = min(api_timeout * 1.5, MAX_API_TIMEOUT)
            else:
                print(f"ERROR: Max retries exceeded for summary generation", file=sys.stderr)
                return f"Error: Failed to generate summary after {max_retries + 1} attempts - {str(last_error)}"

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
            from langchain_chroma import Chroma
            return Chroma.from_documents(documents, embeddings)
        elif vector_store_type == "faiss":
            from langchain_community.vectorstores import FAISS
            return FAISS.from_documents(documents, embeddings)
        else:
            # Fallback to simple list-based store
            print("No vector store available. Using simple in-memory list store.", file=sys.stderr)
            from langchain_community.vectorstores import DocArrayInMemorySearch
            return DocArrayInMemorySearch.from_documents(documents, embeddings)
    except Exception as e:
        print(f"Error creating vector store: {e}", file=sys.stderr)
        try:
            # Last resort fallback if even the simple store fails
            print("Attempting to use minimal in-memory list store without embeddings", file=sys.stderr)
            from langchain.retrievers import ListRetriever
            return ListRetriever(documents=documents)
        except Exception as fallback_error:
            print(f"Error creating fallback retriever: {fallback_error}", file=sys.stderr)
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
    parser.add_argument('--max_pages', type=int, default=None,
                        help='Maximum number of pages to process (default: all pages)')
    
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
        
        # Check if the file is actually a PDF
        if not args.pdf_path.lower().endswith('.pdf'):
            print(f"ERROR: File does not appear to be a PDF: {args.pdf_path}", file=sys.stderr)
            sys.exit(1)
            
        # Print start time for performance tracking
        start_time = time.time()
        print(f"Starting document summarization at {time.strftime('%H:%M:%S')}...", file=sys.stderr)
            
        # Attempt to summarize the PDF
        print(f"Processing PDF: {args.pdf_path}", file=sys.stderr)
        print(f"Summary length: {args.summary_length}", file=sys.stderr)
        if args.focus_areas:
            print(f"Focus areas: {args.focus_areas}", file=sys.stderr)
            
        # Always use direct_summary_with_genai for better reliability and performance
        summary = direct_summary_with_genai(args.pdf_path, args.summary_length, args.focus_areas, args.max_pages)
        
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
        # This is already handled in direct_summary_with_genai, but we ensure it's properly formatted
        if not "###SUMMARY_START###" in summary:
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
