#!/usr/bin/env python
"""
Dynamic Educational AI Crew Runner Script (Enhanced)

This script offers an improved interface for running the dynamic educational
AI crew with better error handling, dependency checking, and a more user-friendly
experience.

ENHANCED WITH MULTIMODAL CAPABILITIES:
- Automatically analyzes images when image URLs are provided
- Extracts content from web pages when URLs are provided
- Translates content in other languages when detected
- Produces rich educational materials including visual elements

Usage Examples:
  python run_dynamic_crew.py --interactive
  python run_dynamic_crew.py --subject "Digital Photography" --topic "Composition" --additional-content "https://example.com/image.jpg"
  python run_dynamic_crew.py --subject "French Literature" --topic "Modern Authors" --additional-content "Voici un exemple de texte français"
  python run_dynamic_crew.py --subject "Web Design" --topic "UX" --additional-content "https://example.com/article"
"""

import sys
import os
import time
import traceback
import importlib.util
import platform
import colorama
from colorama import Fore, Style, Back

# Initialize colorama for cross-platform colored output
colorama.init()

def print_header():
    """Display a colorful header"""
    print(f"\n{Fore.CYAN}{Style.BRIGHT}" + "=" * 80 + Style.RESET_ALL)
    print(f"{Fore.CYAN}{Style.BRIGHT}" + "DYNAMIC EDUCATIONAL AI CREW".center(80) + Style.RESET_ALL)
    print(f"{Fore.CYAN}{Style.BRIGHT}" + "=" * 80 + Style.RESET_ALL)
    print(f"{Fore.GREEN}An advanced AI system for creating personalized educational experiences{Style.RESET_ALL}")
    print(f"{Fore.GREEN}with multimodal capabilities and dynamic agent selection.{Style.RESET_ALL}\n")

def check_dependencies():
    """Check if all required dependencies are installed"""
    required_packages = ['crewai', 'dotenv', 'tqdm', 'colorama']
    missing_packages = []
    
    for package in required_packages:
        if importlib.util.find_spec(package) is None:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"{Fore.RED}{Style.BRIGHT}Missing required dependencies:{Style.RESET_ALL}")
        for package in missing_packages:
            print(f"{Fore.RED} - {package}{Style.RESET_ALL}")
        print(f"\n{Fore.YELLOW}Please install them using:{Style.RESET_ALL}")
        print(f"{Fore.WHITE}pip install {' '.join(missing_packages)}{Style.RESET_ALL}\n")
        return False
    
    return True

def check_environment():
    """Check if environment is properly set up"""
    # Check for .env file
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if not os.path.exists(env_file):
        print(f"{Fore.RED}{Style.BRIGHT}Warning: .env file not found at {env_file}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}This file should contain your API keys. Create it with:{Style.RESET_ALL}")
        print(f"{Fore.WHITE}GEMINI_API_KEY=your_api_key_here{Style.RESET_ALL}")
        print(f"{Fore.WHITE}MODEL=gemini/gemini-1.5-flash{Style.RESET_ALL}\n")
        return False
    
    # Check for basic directory structure
    src_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
    if not os.path.exists(src_dir):
        print(f"{Fore.RED}{Style.BRIGHT}Error: src directory not found at {src_dir}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Please ensure you're running this script from the project root directory.{Style.RESET_ALL}\n")
        return False
    
    return True

def main():
    """Main function to run the dynamic crew with better error handling"""
    print_header()
    
    # System information
    print(f"{Fore.BLUE}System Information:{Style.RESET_ALL}")
    print(f"  Python: {platform.python_version()}")
    print(f"  OS: {platform.system()} {platform.release()}")
    print(f"  Directory: {os.path.dirname(os.path.abspath(__file__))}\n")
    
    # Check dependencies
    print(f"{Fore.BLUE}Checking dependencies...{Style.RESET_ALL}")
    if not check_dependencies():
        sys.exit(1)
    print(f"{Fore.GREEN}✓ All dependencies installed{Style.RESET_ALL}\n")
    
    # Check environment
    print(f"{Fore.BLUE}Checking environment...{Style.RESET_ALL}")
    if not check_environment():
        user_input = input(f"{Fore.YELLOW}Continue anyway? (y/n): {Style.RESET_ALL}").strip().lower()
        if user_input != 'y':
            sys.exit(1)
    else:
        print(f"{Fore.GREEN}✓ Environment looks good{Style.RESET_ALL}\n")
    
    # Add the src directory to the Python path
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))
    
    try:
        # Import the run function and parse_arguments from our dynamic main module
        print(f"{Fore.BLUE}Loading modules...{Style.RESET_ALL}")
        from latest_ai_development.dynamic_main import run, parse_arguments
        from latest_ai_development.dynamic_crew import DynamicEducationCrew
        print(f"{Fore.GREEN}✓ Modules loaded successfully{Style.RESET_ALL}\n")
        
        # Log available workflows to help debug future issues
        print(f"{Fore.BLUE}Available workflows:{Style.RESET_ALL}")
        for key in DynamicEducationCrew.RECOMMENDED_WORKFLOWS.keys():
            print(f"  - {key}: {DynamicEducationCrew.RECOMMENDED_WORKFLOWS[key]['name']}")
        print()
        
        # Parse arguments
        print(f"{Fore.BLUE}Parsing arguments...{Style.RESET_ALL}")
        args = parse_arguments()
        print(f"{Fore.GREEN}✓ Arguments parsed{Style.RESET_ALL}\n")
        
        # Run the crew
        print(f"{Fore.BLUE}Starting Dynamic Educational AI Crew...{Style.RESET_ALL}\n")
        start_time = time.time()
        result = run(args)
        end_time = time.time()
        
        # Display completion message
        elapsed_time = end_time - start_time
        minutes = int(elapsed_time // 60)
        seconds = int(elapsed_time % 60)
        
        print(f"\n{Fore.GREEN}{Style.BRIGHT}Execution completed in {minutes}m {seconds}s{Style.RESET_ALL}")
        print(f"{Fore.GREEN}Thank you for using the Dynamic Educational AI Crew!{Style.RESET_ALL}\n")
        
    except KeyboardInterrupt:
        print(f"\n\n{Fore.YELLOW}{Style.BRIGHT}Execution cancelled by user{Style.RESET_ALL}")
        sys.exit(1)
    except ImportError as e:
        print(f"\n{Fore.RED}{Style.BRIGHT}Error importing modules: {str(e)}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Make sure all dependencies are installed and you're running from the correct directory.{Style.RESET_ALL}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Fore.RED}{Style.BRIGHT}Error during execution:{Style.RESET_ALL}")
        print(f"{Fore.RED}{str(e)}{Style.RESET_ALL}")
        print(f"\n{Fore.YELLOW}Stack trace:{Style.RESET_ALL}")
        print(f"{Fore.WHITE}{traceback.format_exc()}{Style.RESET_ALL}")
        sys.exit(1)

if __name__ == "__main__":
    main() 