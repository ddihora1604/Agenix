# Professional Email Generator AI

A Python-based command-line tool that helps you create well-structured, professional emails with proper formatting and detailed content using LangChain and Google's Gemini 1.5 Flash model.

## Features

- Generate professional emails with proper structure and formatting
- AI-powered content generation with Google's Gemini 1.5 Flash model
- Simple, single-input interface for describing your email needs
- Well-structured output with proper salutation, body, and closing
- Interactive command-line interface with colorful formatting
- Context-aware email generation based on your description

## Requirements

- Python 3.8 or higher
- Google API key for Gemini models

## Installation

1. Navigate to the Email_Generator_Agent directory
2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```
4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
5. Set up your Google API key:
   - Rename `.env.sample` to `.env`
   - Replace `your_google_api_key_here` with your actual Google API key
   - You can obtain a Google API key from https://makersuite.google.com/app/apikey

## Usage

Run the email generator:

```
python email_generator.py
```

Simply describe the purpose and context of the email you want to create in a single input. Include details such as:
- The purpose of your email
- Who it's intended for
- Key points you want to convey
- Any deadlines or attachments
- Preferred tone (formal, friendly, urgent, etc.)
- Your name and role (if relevant)

The tool will generate a well-structured professional email based on your description.

## Example Input

```
I need to write an email to the marketing team about our upcoming product launch on May 15th. 
I want to remind them about the deadline for submitting their promotional materials (April 30th),
and I want to emphasize the importance of following our brand guidelines. 
I'm the product manager, John Smith, and I've attached the latest brand guidelines document.
The tone should be professional but friendly.
```

## Example Output

```
========================================== GENERATED EMAIL ==========================================

March 27, 2024

Dear Marketing Team,

Subject: Upcoming Product Launch - Promotional Materials Deadline

I hope this email finds you well. I am writing to provide a reminder about our upcoming product launch scheduled for May 15th and to address some important deadlines regarding promotional materials.

As we approach this significant milestone, it is crucial that all promotional materials are submitted by April 30th to ensure adequate time for review, approval, and implementation. This timeline will allow us to maintain our launch schedule without unnecessary complications or delays.

I would like to emphasize the importance of adhering to our brand guidelines for all promotional content. Consistency in our messaging and visual identity is essential for maintaining brand recognition and professional presentation in the marketplace. For your reference, I have attached the latest version of our brand guidelines document, which contains all necessary specifications and requirements.

Please review this document thoroughly when preparing your materials, and don't hesitate to reach out if you have any questions or need clarification on any aspect of the guidelines. I'm available to provide guidance or feedback on draft materials before the final submission date.

I appreciate your dedication to making this product launch successful and look forward to seeing your creative promotional concepts.

Best regards,

John Smith
Product Manager

===============================================================================================
```

## Customization

You can modify the prompt template in the `create_email_generator()` function within the `email_generator.py` file to customize the email generation process.

## License

MIT