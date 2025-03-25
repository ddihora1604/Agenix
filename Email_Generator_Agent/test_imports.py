import sys
import os

print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Current working directory: {os.getcwd()}")

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    print("SUCCESS: langchain_google_genai imported successfully")
except ImportError as e:
    print(f"ERROR: Failed to import langchain_google_genai: {str(e)}")
    
try:
    from langchain.prompts import PromptTemplate
    from langchain.chains import LLMChain
    print("SUCCESS: langchain components imported successfully")
except ImportError as e:
    print(f"ERROR: Failed to import langchain components: {str(e)}")
    
try:
    from dotenv import load_dotenv
    print("SUCCESS: dotenv imported successfully")
except ImportError as e:
    print(f"ERROR: Failed to import dotenv: {str(e)}")
    
try:
    import colorama
    from colorama import Fore, Style
    print("SUCCESS: colorama imported successfully")
except ImportError as e:
    print(f"ERROR: Failed to import colorama: {str(e)}")
    
try:
    import google.generativeai
    print("SUCCESS: google.generativeai imported successfully")
except ImportError as e:
    print(f"ERROR: Failed to import google.generativeai: {str(e)}")

print("Import test complete.") 