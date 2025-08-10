from dotenv import load_dotenv
import os

# Load environment variables from root .env file
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to the root Agenix directory
env_path = os.path.join(root_dir, '.env')

# Fallback to local .env if root doesn't exist
if not os.path.exists(env_path):
    # Try the YTSummarizer directory level first
    yt_summarizer_env = os.path.join(os.path.dirname(script_dir), '.env')
    if os.path.exists(yt_summarizer_env):
        env_path = yt_summarizer_env
        load_dotenv(dotenv_path=env_path)
    else:
        # Fall back to default behavior
        load_dotenv()
else:
    load_dotenv(dotenv_path=env_path)
import sys
import json
import time
import traceback
import subprocess
import site
from typing import Dict, Any, Optional, Tuple, Union

# Try to add the user site packages to the path
# This is important for packages installed with --user flag
try:
    user_site = site.getusersitepackages()
    if user_site not in sys.path:
        sys.path.append(user_site)
    # Also add Scripts directory for Windows
    if os.name == 'nt':  # Windows
        scripts_dir = os.path.join(os.path.dirname(user_site), 'Scripts')
        if os.path.exists(scripts_dir) and scripts_dir not in sys.path:
            sys.path.append(scripts_dir)
    print(f"Added user site packages directory: {user_site}")
except Exception as e:
    print(f"Warning: Could not add user site packages: {e}")

def install_package(package_name):
    """Install a Python package using pip."""
    print(f"Attempting to install {package_name} with pip...")
    try:
        # First try with regular pip
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", package_name])
        print(f"Successfully installed {package_name}")
        
        # After installation, refresh sys.path to include new packages
        # This is critical for immediate use of newly installed packages
        import site
        import importlib
        importlib.reload(site)
        
        # Add the user site packages again to be sure
        try:
            user_site = site.getusersitepackages()
            if user_site not in sys.path:
                sys.path.append(user_site)
                print(f"Added user site packages after installation: {user_site}")
        except Exception as e:
            print(f"Warning: Could not add user site packages after install: {e}")
            
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to install {package_name} with pip: {e}")
        return False

# Try to import required packages and track missing ones
missing_packages = []
try:
    import google.generativeai as genai
except ImportError:
    missing_packages.append("google-generativeai")
    install_package("google-generativeai")
    try:
        import google.generativeai as genai
        missing_packages.remove("google-generativeai")
    except (ImportError, ValueError):
        pass

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    missing_packages.append("youtube-transcript-api")
    install_package("youtube-transcript-api")
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        missing_packages.remove("youtube-transcript-api")
    except (ImportError, ValueError):
        pass

# Report missing packages if any still remain after install attempts
if missing_packages:
    print(f"Error: Missing required packages: {', '.join(missing_packages)}")
    print("Please install them using: pip install --user " + " ".join(missing_packages))
    sys.exit(1)

# Configure the Gemini API with the key from environment variables
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("Error: GOOGLE_API_KEY environment variable not set")
    print("Please set it in the .env file")
    sys.exit(1)

try:
    genai.configure(api_key=api_key)
except Exception as e:
    print(f"Error configuring Gemini API: {str(e)}")
    sys.exit(1)

prompt = """You are a YouTube video summarizer. You will be taking the transcript text 
and summarizing the entire video and providing the important summary in points
within 250 words. Format your response with bullet points for key points.
Please provide the summary of the text given here:  """

def extract_transcript_details(youtube_video_url: str) -> Optional[str]:
    """Extract transcript from a YouTube video URL."""
    try:
        # Handle different YouTube URL formats and cleanup URLs
        youtube_video_url = youtube_video_url.strip()
        if "youtu.be" in youtube_video_url:
            video_id = youtube_video_url.split("/")[-1].split("?")[0]
        elif "v=" in youtube_video_url:
            video_id = youtube_video_url.split("v=")[1].split("&")[0]
        else:
            raise ValueError(f"Invalid YouTube URL format: {youtube_video_url}")
        
        print(f"Extracting transcript for video ID: {video_id}")
        
        languages = ['en']  # Start with English
        transcript_text = None
        errors = []
        
        # Try with default language first
        try:
            transcript_text = YouTubeTranscriptApi.get_transcript(video_id)
        except Exception as e:
            errors.append(str(e))
            print(f"Error fetching transcript with default language: {str(e)}")
            
            # Try with explicitly specified languages
            for lang in languages:
                try:
                    print(f"Trying to fetch transcript in {lang}...")
                    transcript_text = YouTubeTranscriptApi.get_transcript(video_id, languages=[lang])
                    print(f"Successfully retrieved {lang} transcript")
                    break
                except Exception as lang_error:
                    errors.append(str(lang_error))
                    print(f"Failed to get transcript in {lang}: {str(lang_error)}")
            
        if not transcript_text:
            error_msg = f"Could not retrieve transcript for video ID {video_id}. Errors: {', '.join(errors)}"
            print(error_msg)
            raise ValueError(error_msg)

        transcript = ""
        for i in transcript_text:
            transcript += " " + i["text"]

        print(f"Transcript extracted successfully ({len(transcript)} characters)")
        return transcript

    except Exception as e:
        print(f"Error extracting transcript: {str(e)}")
        traceback.print_exc()
        return None

def generate_gemini_content(transcript_text: str, prompt: str) -> str:
    """Generate summary using Google Gemini model."""
    try:
        if len(transcript_text) > 30000:
            print("Transcript is very long, truncating to 30,000 characters")
            transcript_text = transcript_text[:30000]
            
        print("Generating summary...")
        start_time = time.time()
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt + transcript_text)
        end_time = time.time()
        print(f"Summary generated in {round(end_time - start_time, 2)} seconds")
        return response.text
    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        traceback.print_exc()
        return f"Error generating summary: {str(e)}"

def save_to_file(content: str, filename: str, youtube_link: str) -> None:
    """Save summary to a file."""
    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"Summary for YouTube video: {youtube_link}\n\n")
            f.write(content)
        print(f"Summary saved to {filename}")
    except Exception as e:
        print(f"Error saving file: {str(e)}")

def main(youtube_link: Optional[str] = None) -> Dict[str, Any]:
    """Main function to run the YouTube summarizer with command-line argument or interactively."""
    result = {
        "success": False,
        "summary": "",
        "error": "",
        "title": ""
    }
    
    print("=" * 50)
    print("YouTube Transcript to Detailed Notes Converter")
    print("=" * 50)
    
    # If no YouTube link provided as argument, prompt the user
    if not youtube_link:
        youtube_link = input("\nEnter YouTube Video Link: ")
    
    if not youtube_link:
        result["error"] = "No YouTube link provided."
        print(result["error"])
        return result
    
    try:
        # Get transcript
        print("\nExtracting transcript...")
        transcript_text = extract_transcript_details(youtube_link)

        if not transcript_text:
            result["error"] = "Failed to extract transcript. Please check the YouTube URL and try again."
            print(result["error"])
            return result
            
        # Generate summary
        summary = generate_gemini_content(transcript_text, prompt)
        
        if summary.startswith("Error"):
            result["error"] = summary
            print(result["error"])
            return result
            
        print("\n" + "=" * 50)
        print("DETAILED NOTES:")
        print("=" * 50)
        print(summary)
        print("=" * 50)
        
        # Set result data
        result["success"] = True
        result["summary"] = summary
        
        # Ask if user wants to save the summary (only in interactive mode)
        if len(sys.argv) <= 1:
            save_option = input("\nDo you want to save these notes to a file? (y/n): ")
            if save_option.lower() == 'y':
                filename = input("Enter filename (default: summary.txt): ") or "summary.txt"
                save_to_file(summary, filename, youtube_link)
        
        return result
        
    except Exception as e:
        error_msg = f"An error occurred: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        result["error"] = error_msg
        return result

if __name__ == "__main__":
    # Check if a video URL is provided as a command-line argument
    try:
        result = {}
        
        if len(sys.argv) > 1:
            # If a file path is provided, read the URL from the file
            file_path = sys.argv[1]
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        youtube_url = f.read().strip()
                    result = main(youtube_url)
                except Exception as e:
                    print(f"Error reading URL from file: {str(e)}")
                    result = {"success": False, "error": f"Error reading URL from file: {str(e)}"}
            else:
                # If it's not a file, assume it's a direct URL
                result = main(sys.argv[1])
        else:
            # No command-line argument, run in interactive mode
            result = main()
        
        # If running in non-interactive mode, output the result as JSON
        if len(sys.argv) > 1:
            # Print the result in a format that can be easily parsed
            print("\nRESULT_JSON_START")
            print(json.dumps(result))
            print("RESULT_JSON_END")
            
    except Exception as e:
        print(f"Fatal error: {str(e)}")
        traceback.print_exc()
        result = {"success": False, "error": f"Fatal error: {str(e)}"}
        print("\nRESULT_JSON_START")
        print(json.dumps(result))
        print("RESULT_JSON_END")
        sys.exit(1)




