import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Function to check if running in a virtual environment
async function checkIfVirtualEnv(): Promise<boolean> {
  return new Promise((resolve) => {
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    const checkVenvScript = 'import sys; print(hasattr(sys, "real_prefix") or (hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix))';
    
    exec(`${pythonCommand} -c "${checkVenvScript}"`, (error, stdout) => {
      if (error) {
        console.error(`Error checking virtual environment: ${error.message}`);
        resolve(false);
        return;
      }
      
      const isVirtualEnv = stdout.trim() === 'True';
      console.log(`Running in virtual environment: ${isVirtualEnv}`);
      resolve(isVirtualEnv);
    });
  });
}

// Helper function to run a command and get its output
async function runCommand(command: string, args: string[], options: any = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    // Special handling for Windows PowerShell
    let proc;
    if (process.platform === 'win32') {
      // For Windows, properly quote arguments that contain spaces
      const quotedArgs = args.map(arg => {
        if (arg.includes(' ') && !arg.startsWith('"')) {
          return `"${arg}"`;
        }
        return arg;
      });
      
      // For Windows, use process.spawn with shell:true to ensure PowerShell compatibility
      proc = spawn(command, quotedArgs, {
        ...options,
        shell: true,
        windowsHide: true // Hide the window to prevent console flashing
      });
    } else {
      proc = spawn(command, args, options);
    }
    
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        const error = new Error(`Command failed with code ${code}: ${stderr}`);
        (error as any).stderr = stderr;
        (error as any).stdout = stdout;
        reject(error);
      } else {
        resolve(stdout);
      }
    });

    proc.on('error', (err) => {
      (err as any).stderr = stderr;
      (err as any).stdout = stdout;
      reject(err);
    });
  });
}

// Check if Python is correctly installed and accessible
async function verifyPythonInstallation(): Promise<boolean> {
  try {
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    const { stdout } = await new Promise<{stdout: string, stderr: string}>((resolve, reject) => {
      exec(`${pythonCommand} --version`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
    
    return true;
  } catch (error: any) {
    return false;
  }
}

// Ensure Python dependencies are installed
async function ensurePythonDependencies(scriptDir: string): Promise<void> {
  console.log(`Checking Python dependencies in directory: ${scriptDir}`);
  
  // First, verify Python is installed
  const isPythonInstalled = await verifyPythonInstallation();
  if (!isPythonInstalled) {
    console.error('Python installation check failed');
    throw new Error('Python is not properly installed or accessible');
  }
  console.log('Python installation verified successfully');

  // Check if the requirements.txt file exists
  const requirementsPath = path.join(scriptDir, 'requirement.txt');
  if (!fs.existsSync(requirementsPath)) {
    console.error(`Requirements file not found at: ${requirementsPath}`);
    throw new Error('requirement.txt file not found in the Fluxai directory');
  }
  console.log(`Found requirements file at: ${requirementsPath}`);

  // Try installing dependencies
  try {
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    const pipCommand = process.platform === 'win32' ? 'pip' : 'pip3';
    
    // Check if pip is installed
    console.log('Checking pip installation...');
    await runCommand(pipCommand, ['--version'], { cwd: scriptDir });
    console.log('Pip installation verified successfully');
    
    // Check if running in a virtual environment
    const isVirtualEnv = await checkIfVirtualEnv();
    
    // Install required packages
    console.log('Installing required packages...');
    // Always use basic install without --user flag to avoid virtualenv issues
const pipArgs = ['install', '-r', 'requirement.txt'];
    await runCommand(pipCommand, pipArgs, { cwd: scriptDir });
    console.log('Required packages installed successfully');
    
    return;
  } catch (error: any) {
    console.error(`Python dependency installation failed: ${error.message}`);
    throw new Error(`Failed to install Python dependencies: ${error.message}`);
  }
}

// Run the image generator Python script
async function runImageGenerator(scriptPath: string, promptFile: string, scriptDir: string): Promise<string> {
  try {
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    // Run the Python script with the prompt file as argument
    return await runCommand(pythonCommand, [scriptPath, promptFile], {
      cwd: scriptDir,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1', // Prevent Python from buffering output
        // Set the FAL_KEY environment variable directly in the child process
        FAL_KEY: '2d2b231c-4c34-45c3-a032-91e8ce74dab3:634d0793cb3b509444227c1f6bddaa2d'
      }
    });
  } catch (error: any) {
    if (error.stderr && error.stderr.includes('ModuleNotFoundError')) {
      // Missing Python module error
      throw new Error(`Missing Python module: ${error.stderr}`);
    } else if (error.stderr && (error.stderr.includes('API key') || error.stderr.includes('FAL_API_KEY'))) {
      // API key error
      throw new Error('FAL API Key is missing or invalid');
    } else if (error.message.includes('ENOENT') || !error.stderr) {
      // Python not found
      throw new Error('Python is not properly installed or accessible');
    } else {
      // Other errors
      throw new Error(`Failed to run image generator: ${error.message}`);
    }
  }
}

// Extract the image URL from the output of the Python script
function extractImageUrl(output: string): string | null {
  // Look for a URL in the output that ends with a common image extension
  const urlMatch = output.match(/https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)/i);
  if (urlMatch) {
    return urlMatch[0];
  }
  
  // If the above pattern doesn't work, look for an image URL within the output
  // We're specifically looking for the URL that follows "Image URL:" in the output
  const imageUrlLine = output.split('\n').find(line => line.includes('Image URL:'));
  if (imageUrlLine) {
    const url = imageUrlLine.split('Image URL:')[1]?.trim();
    if (url) return url;
  }
  
  return null;
}

export async function POST(req: NextRequest) {
  let tempDir = '';
  console.log('Image generation request received');
  
  try {
    // Get prompt from request body
    const body = await req.json();
    const prompt = body.prompt;
    
    if (!prompt || typeof prompt !== 'string') {
      console.error('Invalid prompt received');
      return NextResponse.json({ message: 'Invalid prompt' }, { status: 400 });
    }
    console.log(`Processing prompt: "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"`);

    // Create temp directory for processing
    tempDir = path.join(os.tmpdir(), 'image-generator-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    const promptFilePath = path.join(tempDir, 'prompt.txt');
    console.log(`Created temp directory: ${tempDir}`);
    
    // Write prompt to temp file
    fs.writeFileSync(promptFilePath, prompt, 'utf8');
    console.log('Prompt written to temporary file');
    
    // Path to the image generator script - check multiple possible locations
    let scriptDir = '';
    let scriptPath = '';
    
    // First try the nested structure
    const nestedDir = path.join(process.cwd(), 'Fluxai', 'Fluxai');
    const nestedScriptPath = path.join(nestedDir, 'flux_ai.py');
    console.log(`Checking for script at: ${nestedScriptPath}`);
    
    if (fs.existsSync(nestedScriptPath)) {
      scriptDir = nestedDir;
      scriptPath = nestedScriptPath;
      console.log(`Found script at nested location: ${scriptPath}`);
    } else {
      // Try the direct structure
      const directDir = path.join(process.cwd(), 'Fluxai');
      const directScriptPath = path.join(directDir, 'flux_ai.py');
      console.log(`Checking for script at: ${directScriptPath}`);
      
      if (fs.existsSync(directScriptPath)) {
        scriptDir = directDir;
        scriptPath = directScriptPath;
        console.log(`Found script at direct location: ${scriptPath}`);
      } else {
        // Try to create the script if it doesn't exist
        console.log('Script not found in any expected location. Attempting to create it...');
        
        // Ensure Fluxai directories exist
        try {
          if (!fs.existsSync(directDir)) {
            fs.mkdirSync(directDir, { recursive: true });
          }
          
          if (!fs.existsSync(nestedDir)) {
            fs.mkdirSync(nestedDir, { recursive: true });
          }
          
          // Create flux_ai.py in the nested directory
          scriptDir = nestedDir;
          scriptPath = nestedScriptPath;
          
          // Create a simple flux_ai.py
          const basicScript = `
import fal_client
import os
import webbrowser
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variables
fal_api_key = os.getenv("FAL_API_KEY")
if not fal_api_key:
    raise ValueError("FAL_API_KEY environment variable not set. Please add it to your .env file.")

# Set the FAL_KEY environment variable for the client to use
os.environ["FAL_KEY"] = fal_api_key

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

def generate_image(prompt):
    print(f"\\nGenerating image for prompt: '{prompt}'")
    print("Please wait...")
    
    result = fal_client.subscribe(
        "fal-ai/flux/dev",
        arguments={
            "prompt": prompt
        },
        with_logs=True,
        on_queue_update=on_queue_update,
    )
    
    return result

def main():
    print("\\n===== Flux AI Image Generator =====")
    print("This tool generates images from text descriptions using Flux AI")
    
    while True:
        # Get the prompt from the user
        prompt = input("\\nEnter your image prompt (or 'quit' to exit): ")
        
        if prompt.lower() == 'quit':
            print("\\nThank you for using Flux AI Image Generator!")
            break
            
        if not prompt.strip():
            print("Error: Empty prompt. Please provide a description.")
            continue
            
        try:
            # Generate the image
            result = generate_image(prompt)
            
            # Display the result
            print("\\nImage generated successfully!")
            print(f"Resolution: {result['images'][0]['width']}x{result['images'][0]['height']}")
            print(f"Processing time: {result['timings']['inference']:.2f} seconds")
            
            # Show the image URL
            image_url = result['images'][0]['url']
            print(f"\\nImage URL: {image_url}")
            
            # Ask if user wants to open the image in a browser
            open_browser = input("\\nOpen the image in your browser? (y/n): ")
            if open_browser.lower() == 'y':
                webbrowser.open(image_url)
                
        except Exception as e:
            print(f"\\nError generating image: {str(e)}")
    
if __name__ == "__main__":
    main()
          `;
          
          fs.writeFileSync(scriptPath, basicScript);
          console.log(`Created flux_ai.py script at: ${scriptPath}`);
          
          // Create requirement.txt
          const requirementPath = path.join(scriptDir, 'requirement.txt');
          if (!fs.existsSync(requirementPath)) {
            fs.writeFileSync(requirementPath, 'fal_client\npython-dotenv\n');
            console.log(`Created requirement.txt at: ${requirementPath}`);
          }
        } catch (createError: any) {
          console.error('Failed to create script:', createError);
          throw new Error(`Could not find or create flux_ai.py script. Error: ${createError.message}`);
        }
      }
    }
    
    if (!scriptDir || !scriptPath) {
      console.error('Failed to resolve script path after all attempts');
      return NextResponse.json({ 
        message: 'Could not locate or create flux_ai.py. Please check the installation.',
        isPythonError: true
      }, { status: 500 });
    }
    
    // Modify the script to run non-interactively using the prompt from the file
    // The simplified script that just focuses on the core functionality
    const modifiedScript = `
import sys
import fal_client
import os
import json
import traceback
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

# Enhanced error logging
def log_error(message):
    print(f"ERROR: {message}", file=sys.stderr)

# Debug helper
def debug(message):
    print(f"DEBUG: {message}")
    
try:
    debug("Script started")
    
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    debug(f"Script directory: {script_dir}")
    
    # Try multiple locations for .env file
    env_files = [
        os.path.join(script_dir, ".env"),                         # Same directory as script
        os.path.join(script_dir, "..", ".env"),                   # Parent directory
        os.path.join(script_dir, "..", "..", ".env"),             # Grandparent directory
        str(Path.home() / "Downloads" / "MercadoVista" / "Fluxai" / "Fluxai" / ".env"),  # Absolute path
        str(Path.home() / "Downloads" / "MercadoVista" / "Fluxai" / ".env"),             # Alternate path
    ]
    
    # Try to find .env file
    api_key = None
    for env_file in env_files:
        debug(f"Checking for .env at: {env_file}")
        if os.path.exists(env_file):
            debug(f"Found .env file at: {env_file}")
            load_dotenv(env_file)
            api_key = os.getenv("FAL_API_KEY")
            if api_key:
                debug("API key loaded successfully from .env file")
                break
    
    # If no .env file found, try using the API key directly from the route.ts file
    if not api_key:
        debug("No API key found in .env files, trying hardcoded API key")
        # Use the API key directly - this is the same one from your .env file
        api_key = "2d2b231c-4c34-45c3-a032-91e8ce74dab3:634d0793cb3b509444227c1f6bddaa2d"
    
    if not api_key:
        log_error("FAL_API_KEY environment variable not set and no hardcoded key available.")
        sys.exit(1)
    
    # Set the API key for fal_client
    os.environ["FAL_KEY"] = api_key
    debug("API key set in environment")
    
    def on_queue_update(update):
        if isinstance(update, fal_client.InProgress):
            for log in update.logs:
                print(log["message"])
    
    def generate_image(prompt):
        debug(f"Generating image for prompt: '{prompt}'")
        
        result = fal_client.subscribe(
            "fal-ai/flux/dev",
            arguments={
                "prompt": prompt
            },
            with_logs=True,
            on_queue_update=on_queue_update,
        )
        
        return result
    
    # Read the prompt from the file
    if len(sys.argv) != 2:
        log_error("Usage: python temp_flux_ai.py prompt_file.txt")
        sys.exit(1)
    
    prompt_file = sys.argv[1]
    debug(f"Reading prompt from file: {prompt_file}")
    
    with open(prompt_file, 'r') as f:
        prompt = f.read().strip()
        
    if not prompt:
        log_error("Empty prompt in file.")
        sys.exit(1)
    
    debug(f"Starting image generation for prompt: {prompt}")
    # Generate the image
    result = generate_image(prompt)
    
    # Display the result as JSON
    output = {
        "imageUrl": result['images'][0]['url'],
        "width": result['images'][0]['width'],
        "height": result['images'][0]['height'],
        "processingTime": result['timings']['inference']
    }
    
    print("\\nIMAGE_GENERATION_RESULT:")
    print(json.dumps(output))
    debug("Generation completed successfully")
    
except Exception as e:
    log_error(f"Error in flux_ai.py: {str(e)}")
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
    `
    
    // Write the modified script to the temp directory
    fs.writeFileSync(path.join(tempDir, 'temp_flux_ai.py'), modifiedScript, 'utf8');
    console.log('Modified script created successfully');
    
    try {
      // Ensure Python is installed with all required dependencies
      console.log('Ensuring Python dependencies...');
      await ensurePythonDependencies(scriptDir);
      
      // Run the image generator script
      console.log('Running image generator script...');
      const output = await runImageGenerator(path.join(tempDir, 'temp_flux_ai.py'), promptFilePath, scriptDir);
      console.log('Image generator script completed');
      
      // Extract the JSON result from the output
      const resultStart = output.indexOf('IMAGE_GENERATION_RESULT:');
      if (resultStart === -1) {
        console.log('Standard JSON result marker not found, looking for URL in output');
        const imageUrl = extractImageUrl(output);
        if (imageUrl) {
          console.log(`Image URL found: ${imageUrl.substring(0, 50)}...`);
          return NextResponse.json({ 
            imageUrl, 
            title: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt 
          });
        } else {
          console.error('Failed to extract image URL from output');
          console.error('Output:', output);
          throw new Error('Failed to parse image URL from output');
        }
      }
      
      console.log('JSON result marker found, parsing result');
      // Extract just the JSON part and handle potential whitespace/newline issues
      const jsonStr = output.substring(resultStart + 'IMAGE_GENERATION_RESULT:'.length).trim();
      let result;
      try {
        // Extract only the first valid JSON object (using compatible regex)
        const jsonMatch = jsonStr.match(/(\{[\s\S]*?\})/);
        if (jsonMatch && jsonMatch[1]) {
          result = JSON.parse(jsonMatch[1]);
          console.log('Result parsed successfully');
        } else {
          throw new Error('Could not extract valid JSON');
        }
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        console.error('Raw JSON string:', jsonStr);
        
        // Fallback to URL extraction if JSON parsing fails
        const imageUrl = extractImageUrl(output);
        if (imageUrl) {
          console.log(`Fallback: Image URL found: ${imageUrl.substring(0, 50)}...`);
          return NextResponse.json({ 
            imageUrl, 
            title: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt 
          });
        } else {
          throw new Error('Failed to parse both JSON and extract URL from output');
        }
      }
      
      return NextResponse.json({ 
        imageUrl: result.imageUrl, 
        width: result.width,
        height: result.height,
        processingTime: result.processingTime,
        title: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt
      });
      
    } catch (error: any) {
      let isPythonError = false;
      let isApiKeyError = false;
      let message = error.message || 'An unexpected error occurred';
      
      console.error('Error during image generation:', message);
      
      // Check for specific error types
      if (message.includes('Python') || 
          message.includes('ModuleNotFound') || 
          message.includes('pip') ||
          message.includes('dependency')) {
        isPythonError = true;
        console.error('Python environment error detected');
      } else if (message.includes('API key') || 
                message.includes('FAL_API_KEY') || 
                message.includes('authentication')) {
        isApiKeyError = true;
        console.error('API key error detected');
      }
      
      return NextResponse.json({
        message,
        isPythonError,
        isApiKeyError,
        details: error.stderr || 'No additional error details available'
      }, { status: 500 });
    } finally {
      // Clean up temp directory
      try {
        if (tempDir && fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
          console.log('Temp directory cleaned up');
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
        // Silently continue if cleanup fails
      }
    }
  } catch (error: any) {
    console.error('Fatal error:', error);
    return NextResponse.json({ 
      message: error.message || 'Server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}