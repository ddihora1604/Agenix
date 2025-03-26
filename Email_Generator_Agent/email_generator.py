import os
import sys
from datetime import datetime

# Import the pydantic patch modules with fallbacks
try:
    # Add debugging information
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    print(f"Current working directory: {os.getcwd()}")
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"Script directory: {script_dir}")
    
    # First try a simple direct patch approach
    try:
        # Add the script directory to Python path to ensure imports work
        if script_dir not in sys.path:
            sys.path.insert(0, script_dir)
        
        print("Attempting to apply simple direct Pydantic patch...")
        import simple_patch
        print("Successfully applied simple Pydantic patch")
    except Exception as simple_patch_error:
        print(f"Warning: Simple patch failed: {simple_patch_error}")
        
        # Try the advanced patch as fallback (with import hooks)
        try:
            print("Attempting to apply advanced Pydantic patch...")
            import pydantic_patch
            print("Successfully applied advanced Pydantic patch")
        except Exception as advanced_patch_error:
            print(f"Warning: Advanced patch failed: {advanced_patch_error}")
            print("Continuing without patching, which may cause issues with newer Pydantic versions")
    
    # Continue with the rest of the imports
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        print("Successfully imported langchain_google_genai")
    except ImportError as e:
        print(f"Error importing langchain_google_genai: {str(e)}")
        raise
        
    try:
        from langchain.prompts import PromptTemplate
        from langchain.chains import LLMChain
        print("Successfully imported langchain components")
    except ImportError as e:
        print(f"Error importing langchain components: {str(e)}")
        raise
        
    try:
        from dotenv import load_dotenv
        print("Successfully imported dotenv")
    except ImportError as e:
        print(f"Error importing dotenv: {str(e)}")
        raise
        
    try:
        import colorama
        from colorama import Fore, Style
        print("Successfully imported colorama")
    except ImportError as e:
        print(f"Error importing colorama: {str(e)}")
        raise
except ImportError as e:
    print(f"ERROR: Missing required dependencies. {str(e)}")
    print("Please run 'python setup.py' to install dependencies.")
    print("Or run 'pip install --user langchain langchain-google-genai python-dotenv colorama google-generativeai' manually.")
    sys.exit(1)

# Initialize colorama for Windows
colorama.init()

# Get the directory of this script
script_dir = os.path.dirname(os.path.abspath(__file__))
print(f"Script directory: {script_dir}")

# Load environment variables from the .env file in the script directory
dotenv_path = os.path.join(script_dir, '.env')
print(f"Loading .env from: {dotenv_path}")

# Check if .env file exists
if not os.path.exists(dotenv_path):
    print(f"{Fore.RED}Error: .env file not found at {dotenv_path}{Style.RESET_ALL}")
    # Create a template .env file
    try:
        with open(dotenv_path, 'w') as f:
            f.write("# Replace this with your actual Google API key for Gemini 1.5 Flash\n")
            f.write("GOOGLE_API_KEY=your-google-api-key-here\n")
        print(f"{Fore.YELLOW}Created a template .env file. Please edit it with your API key.{Style.RESET_ALL}")
    except Exception as e:
        print(f"{Fore.RED}Failed to create template .env file: {str(e)}{Style.RESET_ALL}")
    sys.exit(2)

# Load the .env file
load_dotenv(dotenv_path)

# Check if Google API key is available - more graceful error handling
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    print(f"{Fore.RED}Error: GOOGLE_API_KEY environment variable not found.{Style.RESET_ALL}")
    print(f"Please edit the .env file in the Email_Generator_Agent directory with your Google API key:")
    print(f"{Fore.YELLOW}GOOGLE_API_KEY=your_api_key_here{Style.RESET_ALL}")
    print(f"Current .env path checked: {dotenv_path}")
    sys.exit(2)
elif GOOGLE_API_KEY == "your-google-api-key-here":
    print(f"{Fore.RED}Error: You need to replace the placeholder with your actual Google API key.{Style.RESET_ALL}")
    print(f"Please edit the .env file at: {dotenv_path}")
    sys.exit(2)

# Validate the API key format
elif (len(GOOGLE_API_KEY) < 20 or ' ' in GOOGLE_API_KEY or GOOGLE_API_KEY.startswith('AIza') == False):
    print(f"{Fore.RED}Error: The Google API key format appears to be invalid.{Style.RESET_ALL}")
    print(f"API keys typically start with 'AIza' and don't contain spaces.")
    print(f"Please check your key in the .env file at: {dotenv_path}")
    sys.exit(2)

print(f"{Fore.GREEN}API key loaded successfully{Style.RESET_ALL}")

def clear_screen():
    """Clear the terminal screen based on OS."""
    # Skip clearing when running from API
    if len(sys.argv) <= 1:
        os.system('cls' if os.name == 'nt' else 'clear')

def print_header():
    """Print a stylized header for the application."""
    clear_screen()
    print(f"\n{Fore.CYAN}{'=' * 50}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 15}{Style.RESET_ALL} {Fore.WHITE}EMAIL GENERATOR AI{Style.RESET_ALL} {Fore.CYAN}{'=' * 15}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 50}{Style.RESET_ALL}\n")

def print_email(email_content):
    """Print the generated email with formatting."""
    print(f"\n{Fore.GREEN}{'=' * 40} GENERATED EMAIL {'=' * 40}{Style.RESET_ALL}\n")
    print(email_content)
    print("\n")

def get_user_input(prompt_text):
    """Get user input with colored prompt."""
    return input(f"{Fore.YELLOW}{prompt_text}{Style.RESET_ALL}")

def get_multiline_input(prompt_text):
    """Get multiline user input with colored prompt."""
    print(f"{Fore.YELLOW}{prompt_text} (Press Enter twice when finished):{Style.RESET_ALL}")
    lines = []
    while True:
        line = input()
        if not line:
            break
        lines.append(line)
    return "\n".join(lines)

def create_email_generator():
    """Create and configure the LangChain email generator using Gemini."""
    try:
        print(f"{Fore.CYAN}Initializing language model...{Style.RESET_ALL}")
        
        # Validate API key before attempting to use it
        if not GOOGLE_API_KEY or len(GOOGLE_API_KEY.strip()) < 20:
            raise ValueError("Invalid Google API key format")
            
        # Initialize the language model with Gemini 1.5 Flash
        try:
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                temperature=0.7,
                google_api_key=GOOGLE_API_KEY,
                convert_system_message_to_human=True
            )
            print(f"{Fore.GREEN}Successfully initialized Gemini 1.5 Flash model{Style.RESET_ALL}")
        except Exception as e:
            error_msg = str(e)
            if "API key" in error_msg:
                print(f"{Fore.RED}API key error: {error_msg}{Style.RESET_ALL}")
                print(f"{Fore.YELLOW}Please check that your API key is correct and has access to the Gemini 1.5 Flash model.{Style.RESET_ALL}")
            else:
                print(f"{Fore.RED}Error initializing language model: {error_msg}{Style.RESET_ALL}")
            raise
        
        print(f"{Fore.CYAN}Creating email prompt template...{Style.RESET_ALL}")
        # Create a template for generating professional emails
        template = """
        You are a professional email writing assistant. Your task is to generate a well-structured, formal email based on the details provided by the user.
        
        The user has provided the following information about the email they want to write:
        
        {email_prompt}
        
        Based on this information, please generate a professional email with the following structure:
        1. Current date
        2. Appropriate salutation (Dear [Appropriate Recipient],)
        3. Subject line
        4. Well-structured body with:
           - Clear introduction stating the purpose
           - Detailed main content with proper paragraphs
           - Logical conclusion with next steps if appropriate
        5. Professional closing
        6. Appropriate signature
        
        The email should be detailed, well-formatted, and maintain a professional tone throughout. If specific details about recipient, sender, deadlines, or attachments are mentioned in the prompt, include them appropriately.
        """
        
        prompt = PromptTemplate(
            input_variables=["email_prompt"],
            template=template
        )
        
        print(f"{Fore.CYAN}Setting up LLM chain...{Style.RESET_ALL}")
        # Create the LLMChain for email generation
        email_chain = LLMChain(llm=llm, prompt=prompt)
        
        return email_chain
    except Exception as e:
        print(f"{Fore.RED}Error creating email generator: {str(e)}{Style.RESET_ALL}")
        raise

def generate_email_from_prompt(prompt_text):
    """Generate an email using the given prompt text."""
    try:
        # Create the email generator chain
        email_generator = create_email_generator()
        
        print(f"{Fore.CYAN}Sending prompt to Gemini 1.5 Flash...{Style.RESET_ALL}")
        # Generate the email
        email_content = email_generator.invoke({
            "email_prompt": prompt_text
        })
        
        return email_content["text"]
    except Exception as e:
        error_msg = str(e)
        print(f"{Fore.RED}Error generating email: {error_msg}{Style.RESET_ALL}")
        
        # Check for specific API errors
        if "API key" in error_msg or "auth" in error_msg.lower() or "credentials" in error_msg.lower():
            print(f"{Fore.YELLOW}This appears to be an API key issue. Please check if your key is valid and has access to the Gemini 1.5 Flash model.{Style.RESET_ALL}")
            print(f"Visit https://makersuite.google.com/app/apikey to verify your API key.")
        
        raise

def main():
    """Main function to run the email generator application."""
    # Check if a prompt file is provided as command-line argument
    if len(sys.argv) > 1:
        prompt_file = sys.argv[1]
        print(f"{Fore.CYAN}Reading prompt from file: {prompt_file}{Style.RESET_ALL}")
        
        if os.path.exists(prompt_file):
            try:
                with open(prompt_file, 'r', encoding='utf-8') as f:
                    email_prompt = f.read()
                
                print(f"{Fore.CYAN}Prompt content: {email_prompt}{Style.RESET_ALL}")
                
                try:
                    # Generate email from the prompt
                    print(f"{Fore.CYAN}Generating email from prompt file...{Style.RESET_ALL}")
                    email_content = generate_email_from_prompt(email_prompt)
                    
                    # Print the generated email
                    print_email(email_content)
                    
                    # Exit after processing the file
                    return
                except Exception as e:
                    # Print specific error for email generation failure
                    print(f"{Fore.RED}Failed to generate email: {str(e)}{Style.RESET_ALL}")
                    print(f"{Fore.YELLOW}This could be due to a network issue, API limits, or an issue with the prompt.{Style.RESET_ALL}")
                    print(f"{Fore.YELLOW}Please try again or check your internet connection and API key.{Style.RESET_ALL}")
                    sys.exit(10)
            except Exception as e:
                print(f"{Fore.RED}Error processing prompt file: {str(e)}{Style.RESET_ALL}")
                sys.exit(3)
        else:
            print(f"{Fore.RED}Error: Prompt file not found at {prompt_file}{Style.RESET_ALL}")
            sys.exit(4)
    
    # If no file is provided or it doesn't exist, run the interactive mode
    print_header()
    
    # Get comprehensive email prompt from user
    print(f"{Fore.CYAN}Welcome to the Email Generator!{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Please describe the purpose and context of the email you want to create.{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Include any relevant details such as:{Style.RESET_ALL}")
    print(f" - The purpose of your email")
    print(f" - Who it's intended for")
    print(f" - Key points you want to convey")
    print(f" - Any deadlines or attachments")
    print(f" - Preferred tone (formal, friendly, urgent, etc.)")
    print(f" - Your name and role (if relevant)")
    print()
    
    try:
        email_prompt = get_multiline_input("Enter your email details")
        
        # Generate the email
        print(f"\n{Fore.CYAN}Generating your professional email...{Style.RESET_ALL}")
        
        # Create the email generator chain
        email_generator = create_email_generator()
        
        email_content = email_generator.invoke({
            "email_prompt": email_prompt
        })
        
        # Print the generated email
        print_email(email_content["text"])
        
        # Ask if the user wants to generate another email
        another = get_user_input("Would you like to generate another email? (yes/no): ").lower()
        if another == 'yes':
            main()
        else:
            print(f"\n{Fore.CYAN}Thank you for using Email Generator AI. Goodbye!{Style.RESET_ALL}\n")
    except Exception as e:
        print(f"{Fore.RED}An error occurred while generating the email: {str(e)}{Style.RESET_ALL}")
        sys.exit(5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Fore.CYAN}Email Generator AI terminated by user. Goodbye!{Style.RESET_ALL}\n")
    except Exception as e:
        print(f"\n{Fore.RED}An unexpected error occurred: {str(e)}{Style.RESET_ALL}\n")
        sys.exit(100) 