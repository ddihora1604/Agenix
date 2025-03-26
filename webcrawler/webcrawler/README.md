# Website Query Agent

This tool uses LangChain's WebBaseLoader, Google's Gemini 2.0 model, and FAISS vector database to create a system that can:
1. Crawl and extract content from websites, focusing on pages relevant to your query
2. Index the content in a vector database
3. Answer questions about the website content using Gemini 2.0

## Setup

1. Install the required packages:
```bash
pip install -r requirements.txt
```

2. Get a Google API key from [Google AI Studio](https://ai.google.dev/)

3. Set up your API key in one of these ways:
   - Create a `.env` file in the project directory with the following content:
     ```
     GOOGLE_API_KEY=your_api_key_here
     ```
   - Provide it as a command-line argument
   - Set it as an environment variable
   - Enter it when prompted in interactive mode

## Usage

### Interactive Mode (Recommended)

Run the tool in interactive mode to add URLs and ask questions directly in the terminal:

```bash
# Using API key from .env file
python website_agent.py
```

In interactive mode:
1. Enter the URL(s) you want to query (space-separated)
2. Enable smart crawling and provide a query to guide the crawler to relevant pages
3. Ask questions about the website content
4. Type 'new' to load different URLs
5. Type 'exit' to quit

### Non-Interactive Mode

#### Smartly crawl a website and ask questions

```bash
python website_agent.py --urls "https://example.com" --crawl_depth 1 --crawl_query "product features" --query "What are the main features of the product?"
```

#### Disable crawling (only process the specified URLs)

```bash
python website_agent.py --urls "https://example.com" --crawl_depth 0 --query "What is this website about?"
```

#### Save the vector store for later use

```bash
python website_agent.py --urls "https://example.com" --crawl_query "company history" --save_path "my_vector_store"
```

#### Load an existing vector store and ask questions

```bash
python website_agent.py --load_path "my_vector_store" --query "What services does the company offer?"
```

## Example Integration

You can also import and use the WebsiteQueryAgent class in your own code:

```python
from website_agent import WebsiteQueryAgent

# Using API key from .env file with smart crawling enabled
agent = WebsiteQueryAgent(crawl_depth=1)

# Load website and crawl pages relevant to the query
agent.load_website(
    ["https://example.com"], 
    query="product features", 
    crawl=True
)

# Ask a question
response = agent.query("What are the main features of the product?")
print(response["result"])
```

## How Smart Crawling Works

The smart crawling feature:
1. Analyzes the starting pages and extracts links
2. Uses Gemini to evaluate which links are most relevant to your query
3. Only follows the links that are likely to contain information related to your query
4. Creates a focused dataset of pages for more accurate answers
