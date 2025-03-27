# Job Agent Pipeline

A comprehensive job application assistant that helps with:
- Extracting job descriptions from websites or PDFs
- Summarizing job descriptions to extract key points
- Generating personalized cold emails based on the job and candidate information
- Creating interview preparation guides with timelines

## Setup

1. Install the required packages:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the project root with your Google API key:



# Generate a summary of a job description
python JDSummarizer.py https://example.com/job-posting

# Generate a cold email for a job application
python JDSummarizer.py https://example.com/job-posting --task cold_email --candidate-name "John Doe" --candidate-exp "5 years of Python development"

# Generate an interview preparation guide
python JDSummarizer.py https://example.com/job-posting --task interview_prep --interview-date "2023-08-15"

# Generate all outputs (summary, cold email, and interview prep guide)
python JDSummarizer.py https://example.com/job-posting --task all --candidate-name "Jane Smith" --candidate-exp "Full-stack developer with React experience" --interview-date "2023-09-01"

# Process a local PDF file
python JDSummarizer.py /path/to/job_description.pdf --task all --candidate-name "Alex Johnson" --candidate-exp "DevOps engineer" --output results.txt