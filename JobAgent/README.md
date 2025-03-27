# Job Agent

The Job Agent is a powerful tool that processes job descriptions to generate:
- **Comprehensive job summaries** with key requirements and responsibilities
- **Personalized cold emails** tailored to your experience and the job requirements
- **Interview preparation guides** with suggested questions and topic areas

## Operating Modes

The Job Agent can operate in two modes:

1. **Full AI Mode** (Default): Uses advanced AI capabilities through langchain and LLM models to provide highly personalized and detailed analysis of job descriptions. Requires additional Python dependencies.

2. **Lite Mode** (Fallback): A simplified version that works without AI dependencies, using templates and basic keyword extraction. This mode is automatically used if the full mode fails due to missing dependencies.

## Setup

### Prerequisites
- Python 3.8 or later
- pip (Python package installer)

### Installation

1. **Run the setup script**:
   ```
   cd JobAgent
   python setup.py
   ```

   This script will:
   - Verify your Python installation
   - Install required dependencies
   - Create a template .env file if needed
   - Check if everything is set up correctly

2. **Set up your API key**:
   Edit the `.env` file in the JobAgent directory and add your Google API key:
   ```
   GOOGLE_API_KEY=your_actual_api_key_here
   ```

   You can obtain a Google API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

### Full AI Installation

For the full AI capabilities, you'll need to install additional dependencies:

```
pip install langchain langchain-core langchain-community faiss-cpu
```

Without these packages, the system will automatically use the lite mode.

### Manual Installation

If the setup script doesn't work for any reason, you can install dependencies manually:

```
cd JobAgent
pip install -r requirements.txt
```

## Usage

The Job Agent is integrated into the MercadoVista web interface. To use it:

1. Navigate to the Dashboard
2. Click on the "Job Agent" card
3. Enter the job details:
   - Job description (URL or text)
   - Your name
   - Your experience
   - Optional interview date
4. Select which type of content you want to generate
5. Click "Generate Content"

## Performance Considerations

- **Processing Time**: The full AI mode will take more time (typically 20-60 seconds) to process job descriptions as it performs sophisticated analysis.
- **Lite Mode**: Provides faster results (usually 1-5 seconds) with simpler templates but less personalization.
- **Long Job Descriptions**: Very lengthy job descriptions may take longer to process or time out in the full AI mode. Consider using shorter excerpts for better performance.

## Troubleshooting

### Common Issues

1. **Missing dependencies error**:
   ```
   pip install PyPDF2 requests beautifulsoup4 python-dotenv
   ```

2. **Missing AI dependencies**:
   ```
   pip install langchain langchain-core langchain-community faiss-cpu
   ```

3. **Google API key error**:
   Make sure your API key is correctly set in the `.env` file and is valid.

4. **Permission issues on Windows**:
   Run PowerShell or Command Prompt as Administrator, then try the setup again.

5. **"Python not found" error**:
   Ensure Python is installed and added to your PATH environment variable.

6. **Timeout errors**:
   - Try using a shorter job description
   - Ensure all dependencies are installed
   - Check that API keys are properly set up
   - The system should automatically fall back to lite mode

### Getting Help

If you continue to experience issues, please:
1. Check the console logs for detailed error messages
2. Ensure all installation steps have been followed
3. Try restarting the application after making changes

## Advanced Usage

### Command Line Interface

You can also run the Job Agent directly from the command line:

```
python JobAgent.py "job description text" --task all --candidate-name "Your Name" --candidate-exp "Your experience" --interview-date "Interview date"
```

Or the lite version:

```
python JobAgent_lite.py "job description text" --task all --candidate-name "Your Name" --candidate-exp "Your experience" --interview-date "Interview date"
```

Available tasks:
- `summary`: Generate only the job summary
- `cold_email`: Generate only the cold email
- `interview_prep`: Generate only the interview preparation guide
- `all`: Generate all three (default)

## License

This software is part of the MercadoVista platform. 