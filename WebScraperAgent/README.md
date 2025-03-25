# Web Scraper Agent

A terminal-based Web Scraper Agent using LangChain and Google's Gemini models to extract information from websites and the web.

## Features

- Extract structured data from websites and web pages
- Search the web for specific information
- Process both URLs and text queries
- Simple terminal interface for user interactions
- Automatic mock mode when API is unavailable

## Project Structure

```
WebScraperAgent/
├── config/
│   └── config.py         # Configuration settings
├── src/
│   ├── utils/
│   │   ├── web_scraper.py   # Web scraping utilities
│   │   ├── search_utils.py  # Web search utilities
│   │   └── gemini_client.py # Gemini model client
│   └── web_scraper_agent.py # Main agent class
├── terminal_interface.py    # Terminal interface script
├── run.py                   # Main runner script
├── .env                     # Environment variables
├── requirements.txt         # Project dependencies
└── README.md                # Project documentation
```

## Prerequisites

- Python 3.9 or higher
- Google API key for accessing Gemini models (optional, will run in mock mode without it)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/WebScraperAgent.git
cd WebScraperAgent
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Set up your Google API key (optional):

Create a `.env` file in the root directory with your Google API key:

```
GOOGLE_API_KEY=your_google_api_key_here
```

If you don't have a Google API key, the system will automatically run in mock mode with simulated responses.

## Google API Key Setup

To use the Gemini API, you need a valid API key:

1. Go to the [Google AI Studio](https://ai.google.dev/)
2. Create a Google Cloud project or select an existing one
3. Enable the Gemini API in your project
4. Create an API key
5. Add your key to the `.env` file

## Usage

### Running the Application

To run the application, simply use:

```bash
python run.py
```

This will start the terminal interface that allows you to:
1. Choose whether to process a URL or a text query
2. Enter your URL or text query
3. View the processed results in the terminal

Alternatively, you can directly use the terminal interface:

```bash
python terminal_interface.py
```

## Mock Mode

When the Gemini API is unavailable (due to API key issues, quota limits, or other errors), the system automatically falls back to using mock responses. This ensures that you can still test the functionality without API access.

To know if you're getting mock responses, check for:
- Console logs indicating "Using mock mode"
- Response objects containing `"mock_response": true`

## Limitations

- Web scraping may be subject to website's Terms of Service
- Some websites may block scraping attempts
- The quality of extracted data depends on the structure of the webpage
- When using mock responses, the quality of data extraction will be limited

## License

This project is licensed under the MIT License.

## Acknowledgements

- [LangChain](https://github.com/hwchase17/langchain) for the agent framework
- [Google Gemini](https://deepmind.google/technologies/gemini/) for the AI models
- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/) for HTML parsing
- [FastAPI](https://fastapi.tiangolo.com/) for the API interface 