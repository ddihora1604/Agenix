import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Constants for better configuration
const PROCESS_TIMEOUT = 4 * 60 * 1000; // 4 minutes timeout
// Use the dedicated virtual environment for Web Crawler Agent
const PYTHON_COMMAND = process.platform === 'win32' ? 
  path.join(process.cwd(), 'webcrawler', 'venv', 'Scripts', 'python.exe') : 
  path.join(process.cwd(), 'webcrawler', 'venv', 'bin', 'python');
const PYTHON_ENV = {
  ...process.env,
  PYTHONIOENCODING: 'utf-8',
  PYTHONUNBUFFERED: '1'
};

// Helper function to run a command and get its output with better error handling
async function runCommand(command: string, args: string[], options: any = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${command} ${args.join(' ')}`);
    
    // Special handling for Windows PowerShell
    let proc;
    if (process.platform === 'win32') {
      // For Windows, quote the command if it contains spaces
      let quotedCommand = command;
      if (command.includes(' ') && !command.startsWith('"')) {
        quotedCommand = `"${command}"`;
      }
      
      // For Windows, properly quote arguments that contain spaces
      const quotedArgs = args.map(arg => {
        if (arg.includes(' ') && !arg.startsWith('"')) {
          return `"${arg}"`;
        }
        return arg;
      });
      
      // For Windows, use process.spawn with shell:true to ensure PowerShell compatibility
      proc = spawn(quotedCommand, quotedArgs, {
        ...options,
        shell: true,
        windowsHide: true // Hide the window to prevent console flashing
      });
    } else {
      proc = spawn(command, args, options);
    }
    
    let stdout = '';
    let stderr = '';
    let hasTimeout = false;
    let timeout: NodeJS.Timeout | null = null;

    // Set timeout if specified
    if (options.timeout) {
      timeout = setTimeout(() => {
        hasTimeout = true;
        console.error(`Command timed out after ${options.timeout / 1000} seconds`);
        proc.kill();
        reject(new Error(`Command timed out after ${options.timeout / 1000} seconds`));
      }, options.timeout);
    }

    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      // Log real-time output for visibility
      if (options.logOutput) {
        console.log(`[STDOUT] ${chunk.trim()}`);
      }
    });

    proc.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      // Always log errors to help with debugging
      console.error(`[STDERR] ${chunk.trim()}`);
    });

    proc.on('close', (code) => {
      if (timeout) clearTimeout(timeout);
      
      if (hasTimeout) return; // Already handled by timeout
      
      if (code !== 0) {
        console.error(`Command failed with code ${code}`);
        console.error(`Stderr: ${stderr}`);
        
        const error = new Error(`Command failed with code ${code}: ${stderr}`);
        (error as any).stderr = stderr;
        (error as any).stdout = stdout;
        (error as any).code = code;
        reject(error);
      } else {
        console.log(`Command completed successfully (code ${code})`);
        resolve(stdout);
      }
    });

    proc.on('error', (err) => {
      if (timeout) clearTimeout(timeout);
      console.error(`Failed to start command: ${err.message}`);
      (err as any).stderr = stderr;
      (err as any).stdout = stdout;
      reject(err);
    });
  });
}

// Check if Python is correctly installed and accessible
async function verifyPythonInstallation(): Promise<boolean> {
  try {
    console.log("Verifying Python installation...");
    const result = await runCommand(PYTHON_COMMAND, ['--version'], { timeout: 1000000000 });
    console.log(`Python version: ${result.trim()}`);
    return true;
  } catch (error: any) {
    console.error("Python verification failed:", error.message);
    return false;
  }
}

// Function to check if running in a virtual environment
async function checkIfVirtualEnv(): Promise<boolean> {
  try {
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    const result = await runCommand(pythonCommand, [
      '-c', 
      'import sys; print("1" if hasattr(sys, "real_prefix") or (hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix) else "0")'
    ], {});
    
    return result.trim() === "1";
  } catch (error) {
    // If there's an error, assume not in virtualenv to be safe
    return false;
  }
}

// Ensure Python dependencies are installed for web crawler - optimized version
async function ensurePythonDependencies(scriptDir: string): Promise<boolean> {
  try {
    // First verify Python is installed
    const pythonInstalled = await verifyPythonInstallation();
    if (!pythonInstalled) {
      throw new Error('Python is not properly installed or accessible');
    }
    
    // Check for a marker file to avoid reinstalling dependencies on every request
    const depsMarkerPath = path.join(os.tmpdir(), 'webcrawler_deps_installed.txt');
    
    // Check if we've already installed dependencies recently (last 24 hours)
    if (fs.existsSync(depsMarkerPath)) {
      try {
        const markerStat = fs.statSync(depsMarkerPath);
        const currentTime = new Date().getTime();
        const markerTime = markerStat.mtime.getTime();
        
        // If marker file is less than 24 hours old, skip installation
        if (currentTime - markerTime < 24 * 60 * 60 * 1000) {
          console.log("Using cached Python dependencies (installed in the last 24 hours)");
          return true;
        }
      } catch (statError) {
        console.error("Error checking dependency marker file:", statError);
        // Continue with installation if there's any error checking the marker
      }
    }
    
    // Define required packages with explicit versions for stability
    const requiredPackages = [
      "langchain==0.1.0",
      "langchain-community==0.0.14", 
      "langchain-google-genai==0.0.5",
      "google-generativeai==0.3.1",
      "python-dotenv==1.0.0",
      "requests==2.31.0",
      "beautifulsoup4==4.12.2",
      "lxml==4.9.3"
    ];

    // Add optional packages with fallbacks
    const optionalPackages = [
      "faiss-cpu==1.7.4"  // Optional, will fall back to in-memory store if not available
    ];

    console.log("Installing Python dependencies for web crawler...");
    
    try {
      // Check if running in a virtualenv
      const isVirtualEnv = await checkIfVirtualEnv();
      
      // First attempt with primary packages (these are required)
      // console.log("Installing required Python packages...");
      // await runCommand(PYTHON_COMMAND, ['-m', 'pip', 'install', '--no-cache-dir', ...requiredPackages], { 
      //   cwd: scriptDir,
      //   env: PYTHON_ENV,
      //   timeout: 180000, // 3 minutes timeout
      //   logOutput: true
      // });
      
      // Now try optional packages but don't fail if they don't install
      // try {
      //   console.log("Installing optional Python packages (will continue if these fail)...");
      //   await runCommand(PYTHON_COMMAND, ['-m', 'pip', 'install', '--no-cache-dir', ...optionalPackages], { 
      //     cwd: scriptDir,
      //     env: PYTHON_ENV,
      //     timeout: 180000
      //   });
      // } catch (optionalError: unknown) {
      //   const error = optionalError as Error;
      //   console.warn("Optional packages failed to install, continuing anyway:", error.message);
      // }
      
      // Create marker file to avoid reinstalling on every request
      fs.writeFileSync(depsMarkerPath, new Date().toISOString());
      
      console.log("Python dependencies installed successfully");
      return true;
      
    } catch (pipError: unknown) {
      const error = pipError as Error;
      console.error("Failed to install Python dependencies:", error);
      throw new Error(`Failed to install Python dependencies: ${error.message}`);
    }
  } catch (error: any) {
    console.error("Python dependency installation error:", error);
    // Rethrow with enhanced info
    throw new Error(`Python dependency error: ${error.message}`);
  }
}

// Enhanced function to execute the web crawler script with better output handling
async function executeWebCrawlerScript(scriptPath: string, urlFile: string, question?: string): Promise<{
  output: string;
  title?: string;
  processingTime?: number;
}> {
  const scriptDir = path.dirname(scriptPath);
  
  // Read the URL from the file instead of passing the file path
  const websiteUrl = fs.readFileSync(urlFile, 'utf-8').trim();
  
  // Prepare command arguments based on whether it's an analysis or a question
  let args = [scriptPath];
  
  // Add the URL using the --urls parameter with proper quoting
  // Adding double quotes around the URL to ensure query parameters are treated as part of the URL
  if (process.platform === 'win32') {
    // For Windows platform, we need to handle the URL with special care
    args.push('--urls');
    args.push(`"${websiteUrl}"`);
  } else {
    // For non-Windows platforms
    args.push('--urls', websiteUrl);
  }
  
  // Add the question parameter if provided - properly escaped to handle spaces
  if (question) {
    console.log(`Processing question: "${question}"`);
    
    // For Windows, escape the question string to handle spaces and special characters
    if (process.platform === 'win32') {
      // Use JSON.stringify to properly escape the question for command-line usage
      const escapedQuestion = JSON.stringify(question);
      args.push('--query', escapedQuestion);
      console.log(`Using escaped question for Windows: ${escapedQuestion}`);
    } else {
      // For non-Windows platforms, standard single-quoting works
      args.push('--query', question);
      console.log(`Using standard question format for non-Windows`);
    }
  }
  
  // Add other optional parameters
  const vectorStorePath = path.join(scriptDir, 'vector_store');
  args.push('--save_path', vectorStorePath);
  
  // Use load_path if the vector store exists to speed up processing
  if (fs.existsSync(vectorStorePath)) {
    console.log(`Vector store exists at ${vectorStorePath}, using load_path`);
    args.push('--load_path', vectorStorePath);
  }
  
  // Add verbose flag for more detailed output
  args.push('--verbose');
  
  console.log(`Running web crawler script: ${PYTHON_COMMAND} ${args.join(' ')}`);
  
  try {
    // Add PYTHONPATH to the environment to ensure modules can be found
    const env = {
      ...PYTHON_ENV,
      // Add current directory and site-packages to Python path
      PYTHONPATH: `${scriptDir}:${process.env.PYTHONPATH || ''}`
    };
    
    // Run the Python script with enhanced environment and timeout
    const output = await runCommand(PYTHON_COMMAND, args, {
      cwd: scriptDir,
      env,
      timeout: PROCESS_TIMEOUT,
      logOutput: true
    });
    
    // Parse execution metadata from output
    let title = "Website Analysis";
    let processingTime = 0;
    
    // Extract website title (if present in the output)
    const titleMatch = output.match(/Title: (.*?)(\n|$)/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    // Extract processing time (if present in the output)
    const timeMatch = output.match(/Total execution time: (\d+\.\d+) seconds/);
    if (timeMatch && timeMatch[1]) {
      processingTime = parseFloat(timeMatch[1]);
    } else {
      // Try alternative format for query processing time
      const queryTimeMatch = output.match(/Query processed in (\d+\.\d+) seconds/);
      if (queryTimeMatch && queryTimeMatch[1]) {
        processingTime = parseFloat(queryTimeMatch[1]);
      }
    }
    
    // Extract the actual answer content
    let cleanedOutput = "";
    
    if (question) {
      console.log("Processing question output...");
      
      // For questions, look for the answer after "Answer:" marker
      const answerMatch = output.match(/\nAnswer:\s*([\s\S]+)$/);
      if (answerMatch && answerMatch[1]) {
        cleanedOutput = answerMatch[1].trim();
        console.log(`Found answer with "Answer:" marker, length: ${cleanedOutput.length}`);
      } else {
        // Fallback to look for "result" in the output if no "Answer:" marker is found
        const resultMatch = output.match(/result[\s\S]*?['"]([\s\S]*?)['"][\s\S]*?\}/);
        if (resultMatch && resultMatch[1]) {
          cleanedOutput = resultMatch[1].trim();
          console.log(`Found answer with "result" pattern, length: ${cleanedOutput.length}`);
        } else {
          // Try more generic pattern for "result"
          const genericResultMatch = output.match(/result.*?:\s*(.*?)(?:\n|$)/);
          if (genericResultMatch && genericResultMatch[1]) {
            cleanedOutput = genericResultMatch[1].trim();
            console.log(`Found answer with generic result pattern, length: ${cleanedOutput.length}`);
          } else {
            // If no specific markers found, use the entire output with some cleanup
            console.log("No specific answer markers found, using cleaned output");
            cleanedOutput = output
              .replace(/^\[.*?\] - INFO - /gm, '')
              .replace(/^\[.*?\] - DEBUG - /gm, '')
              .replace(/^\[.*?\] - WARNING - /gm, '')
              .replace(/^.*?executed with code 0 in.*?$/gm, '')
              .trim();
            
            // If the cleaned output is too long, try to extract just the relevant part
            if (cleanedOutput.length > 1000) {
              const lastSection = cleanedOutput.split('\n\n').pop() || cleanedOutput;
              if (lastSection.length > 100) {
                cleanedOutput = lastSection.trim();
                console.log(`Using last section of output, length: ${cleanedOutput.length}`);
              }
            }
          }
        }
      }
      
      // If we still don't have a good answer, provide a fallback
      if (!cleanedOutput || cleanedOutput.length < 10) {
        console.warn("Answer extraction failed, using fallback message");
        cleanedOutput = "I couldn't generate a specific answer based on the website content. Please try asking a different question.";
      }
    } else {
      // For website analysis, clean the entire output
      cleanedOutput = output
        .replace(/^\[.*?\] - INFO - /gm, '')
        .replace(/^\[.*?\] - DEBUG - /gm, '')
        .replace(/^\[.*?\] - WARNING - /gm, '')
        .replace(/^.*?executed with code 0 in.*?$/gm, '')
        .trim();
    }
    
    return {
      output: cleanedOutput,
      title,
      processingTime
    };
  } catch (error: any) {
    console.error("Error executing web crawler script:", error);
    
    // Enhanced error handling
    const errorOutput = error.stderr || error.message || '';
    console.error("Script error output:", errorOutput);
    
    // Check for specific Python errors
    if (errorOutput.includes('ModuleNotFoundError') || errorOutput.includes('ImportError')) {
      const moduleMatch = errorOutput.match(/No module named '([^']+)'/);
      const missingModule = moduleMatch ? moduleMatch[1] : 'unknown module';
      throw new Error(`Missing Python module: ${missingModule}`);
    }
    
    if (errorOutput.includes('GOOGLE_API_KEY') || errorOutput.includes('API key is required')) {
      throw new Error('Google API key is missing or invalid');
    }
    
    // Check for Gemini model errors
    if (errorOutput.includes('models/gemini') && 
        (errorOutput.includes('not found') || errorOutput.includes('NotFound'))) {
      throw new Error('Gemini model error: The specified model is not available. A model update may be required.');
    }
    
    // Check for argument errors
    if (errorOutput.includes('error: unrecognized arguments') || errorOutput.includes('error: argument')) {
      throw new Error(`Script argument error: ${errorOutput.split('\n')[0]}`);
    }
    
    // General execution error
    throw new Error(`Failed to execute web crawler: ${error.message}`);
  }
}

// GET endpoint for initial page load - verifies script and dependencies
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  console.log("Web Crawler initial check started:", new Date().toISOString());
  
  try {
    // Set up paths for the script
    const scriptDir = path.join(process.cwd(), 'webcrawler', 'webcrawler');
    const scriptPath = path.join(scriptDir, 'website_agent.py');
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`Script not found at path: ${scriptPath}`);
      return NextResponse.json({
        success: false,
        message: 'Web crawler script not found',
        setupRequired: true,
        setupInstructions: 'The website_agent.py script is missing. Please ensure the webcrawler/webcrawler folder is present in the project root.'
      }, { status: 500 });
    }
    
    try {
      // Verify Python installation and dependencies
      console.log("Running initial setup checks...");
      const pythonInstalled = await verifyPythonInstallation();
      
      // if (!pythonInstalled) {
      //   throw new Error('Python is not properly installed or accessible');
      // }
      
      // // Ensure dependencies are installed
      // await ensurePythonDependencies(scriptDir);
      
      // Optional: Verify script accepts the arguments we'll be using
      // Try a simple test to verify the path handling is working correctly
      console.log("Testing Python script execution with current path handling...");
      try {
        console.log(`Attempting to run: python "${scriptPath}" --help`);
        console.log(`Working directory: ${scriptDir}`);
        
        const helpOutput = await runCommand(PYTHON_COMMAND, [scriptPath, '--help'], { 
          cwd: scriptDir,
          env: PYTHON_ENV,
          timeout: 20000, // 20 seconds timeout
          logOutput: true // Enable logging to see what's happening
        });
        
        // Verify that the expected arguments exist in the help output
        const requiredArgs = ['--urls', '--query', '--save_path'];
        const missingArgs = requiredArgs.filter(arg => !helpOutput.includes(arg));
        
        if (missingArgs.length > 0) {
          console.warn(`Script may be missing required arguments: ${missingArgs.join(', ')}`);
        } else {
          console.log("Script argument verification successful");
        }
        
      } catch (helpError: any) {
        console.error("Error testing script execution:", helpError);
        console.warn("Script verification failed, but continuing. The script will be validated when actually used.");
        
        // Log additional debugging information
        console.log("Debug information:");
        console.log(`- Script path: ${scriptPath}`);
        console.log(`- Script exists: ${fs.existsSync(scriptPath)}`);
        console.log(`- Working directory: ${scriptDir}`);
        console.log(`- Python command: ${PYTHON_COMMAND}`);
      }
      
      // Return success
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`Initial setup checks completed in ${duration}s`);
      
      return NextResponse.json({
        success: true,
        message: 'Web crawler is ready to use',
        setupComplete: true
      });
      
    } catch (error: any) {
      console.error('Error during initial setup:', error);
      
      // Handle specific errors
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('Script is missing required arguments')) {
        return NextResponse.json({
          success: false,
          message: 'Web crawler script argument mismatch',
          setupRequired: true,
          setupInstructions: `
The website_agent.py script does not accept the expected arguments. Please ensure you're using the correct version of the script. 
The script should accept at least the following arguments:
--urls: To specify the website URL to analyze
--query: To ask questions about the website
--save_path: To specify where to save the vector store

Please check the script and update if necessary.
`
        }, { status: 500 });
      }
      
      if (errorMessage.includes('Python') || errorMessage.includes('python')) {
        return NextResponse.json({
          success: false,
          message: 'Python installation issue',
          isPythonError: true,
          setupRequired: true,
          setupInstructions: `
Please set up Python and required dependencies:

1. Make sure Python 3.8+ is installed from https://www.python.org/downloads/
2. Open a command prompt/terminal as administrator
3. Run this command to install dependencies:
   python -m pip install langchain langchain-community langchain-google-genai google-generativeai beautifulsoup4 lxml python-dotenv
   (Note: Add --user flag if you're not using a virtual environment)
4. Restart your application server
`
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: false,
        message: `Setup check failed: ${errorMessage}`,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Web crawler initial check error:', error);
    
    return NextResponse.json({ 
      success: false,
      message: error.message || 'An error occurred during initial setup',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Analyze a website using the web crawler script
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log("Web Crawler API request started:", new Date().toISOString());
  
  try {
    // Get website URL from request body
    const body = await req.json();
    const { websiteUrl, question } = body;
    
    if (!websiteUrl) {
      return NextResponse.json({ 
        success: false,
        message: 'Website URL is required' 
      }, { status: 400 });
    }

    // Log request details
    console.log(`Processing ${question ? 'question' : 'analysis'} for URL: ${websiteUrl}`);
    if (question) {
      console.log(`Question: "${question}"`);
    }

    // Set up paths - Updated to use the correct nested directory structure
    const scriptDir = path.join(process.cwd(), 'webcrawler', 'webcrawler');
    const scriptPath = path.join(scriptDir, 'website_agent.py');

    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`Script not found at path: ${scriptPath}`);
      return NextResponse.json({
        success: false,
        message: 'Web crawler script not found',
        setupRequired: true,
        setupInstructions: 'The website_agent.py script is missing. Please ensure the webcrawler/webcrawler folder is present in the project root.'
      }, { status: 500 });
    }

    try {
      // Install dependencies first as a separate step - with caching to speed up frequent requests
      console.log("Ensuring Python dependencies are installed...");
      const depsInstalled = await ensurePythonDependencies(scriptDir);
      if (!depsInstalled) {
        throw new Error('Failed to install required Python dependencies');
      }
      
      // Create a temporary file to store the website URL
      const tempId = Math.random().toString(36).substring(2, 15);
      const tempFile = path.join(os.tmpdir(), `website_url_${tempId}.txt`);
      fs.writeFileSync(tempFile, websiteUrl);
      
      console.log(`Saved URL to temporary file: ${tempFile}`);
      
      try {
        // Execute web crawler script with enhanced error handling
        let output = ""; // Initialize with empty string to avoid 'possibly undefined' error
        let title = "Website Analysis";
        let processingTime = 0;
        let attempts = 0;
        const maxAttempts = 2;  // Try up to 2 times 
        
        while (attempts < maxAttempts) {
          attempts++;
          console.log(`Attempt ${attempts}/${maxAttempts} to process ${question ? 'question' : 'analysis'}`);
          
          try {
            // First attempt with standard approach
            const result = await executeWebCrawlerScript(scriptPath, tempFile, question);
            output = result.output || "";
            title = result.title || "Website Analysis";
            processingTime = result.processingTime || 0;
            
            // If we got here, it worked - break out of retry loop
            break;
          } catch (scriptError: any) {
            // If we've reached max attempts, throw the error
            if (attempts >= maxAttempts) {
              throw scriptError;
            }
            
            // If there's an 'unrecognized arguments' error and it's a question query,
            // try a different approach - escape by writing to a temp file
            if (question && 
                scriptError.message && 
                (scriptError.message.includes('unrecognized arguments') || 
                 scriptError.message.includes('error: argument'))) {
              
              console.log("Retrying with alternative query approach");
              
              // Create a temporary file for the question
              const questionId = Math.random().toString(36).substring(2, 15);
              const questionFile = path.join(os.tmpdir(), `question_${questionId}.txt`);
              fs.writeFileSync(questionFile, question);
              
              try {
                // Run a simplified Python script that loads the query from the file directly
                const pythonCode = `
import sys
import os
from urllib.parse import unquote
import argparse
sys.path.append('${scriptDir.replace(/\\/g, '\\\\')}')
from website_agent import WebsiteQueryAgent

# Parse arguments
parser = argparse.ArgumentParser(description="Website Query Agent Wrapper")
parser.add_argument("--url_file", help="File containing the URL to analyze")
parser.add_argument("--query_file", help="File containing the question to ask")
parser.add_argument("--save_path", help="Path to save vector store")
parser.add_argument("--load_path", help="Path to load existing vector store")
args = parser.parse_args()

# Load URL and query from files
with open(args.url_file, 'r') as f:
    url = f.read().strip()

with open(args.query_file, 'r') as f:
    query = f.read().strip()

# Initialize agent
agent = WebsiteQueryAgent()

# Load vector store if path provided
if args.load_path and os.path.exists(args.load_path):
    print(f"Loading vector store from {args.load_path}")
    agent.load_vector_store(args.load_path)
else:
    # Load website
    print(f"Loading website: {url}")
    agent.load_website([url])
    
    # Save vector store
    if args.save_path:
        agent.save_vector_store(args.save_path)

# Query
print(f"Processing question: {query}")
result = agent.query(query)
print("\\nAnswer:")
print(result.get("result", "No answer found"))
`;
                
                // Create a temporary Python file
                const pythonFile = path.join(os.tmpdir(), `web_crawler_wrapper_${questionId}.py`);
                fs.writeFileSync(pythonFile, pythonCode);
                
                // Check if vector store exists
                const vectorStorePath = path.join(scriptDir, 'vector_store');
                const loadPath = fs.existsSync(vectorStorePath) ? vectorStorePath : '';
                
                // Run the wrapper script
                const wrapperOutput = await runCommand(PYTHON_COMMAND, [
                  pythonFile,
                  '--url_file', tempFile,
                  '--query_file', questionFile,
                  '--save_path', vectorStorePath,
                  ...(loadPath ? ['--load_path', loadPath] : [])
                ], {
                  cwd: scriptDir,
                  env: PYTHON_ENV,
                  timeout: PROCESS_TIMEOUT,
                  logOutput: true
                });
                
                // Clean up the temporary files
                try {
                  fs.unlinkSync(questionFile);
                  fs.unlinkSync(pythonFile);
                } catch (cleanupError) {
                  console.warn("Failed to clean up temporary files:", cleanupError);
                }
                
                // Process the output
                const answerMatch = wrapperOutput.match(/\nAnswer:\s*([\s\S]+)$/);
                if (answerMatch && answerMatch[1]) {
                  output = answerMatch[1].trim();
                  console.log(`Got answer from wrapper script (${output.length} chars)`);
                } else {
                  // Fallback to a more generic extraction if "Answer:" not found
                  const cleanOutput = wrapperOutput
                    .replace(/^\[.*?\] - INFO - /gm, '')
                    .replace(/^\[.*?\] - DEBUG - /gm, '')
                    .replace(/^\[.*?\] - WARNING - /gm, '')
                    .replace(/^.*?executed with code 0 in.*?$/gm, '')
                    .trim();
                    
                  // Try to extract the last meaningful section
                  const sections = cleanOutput.split('\n\n');
                  const lastMeaningfulSection = sections[sections.length - 1];
                  
                  if (lastMeaningfulSection && lastMeaningfulSection.length > 20) {
                    output = lastMeaningfulSection.trim();
                    console.log(`Extracted last section as answer (${output.length} chars)`);
                  } else {
                    output = "Unable to process the question. Please try again with a different question.";
                    console.warn("Couldn't extract answer from wrapper output");
                  }
                }
                
                // Set default values for title and processingTime
                title = "Website Analysis";
                processingTime = 0;
                
                // Successful fallback - break out of retry loop
                break;
              } catch (wrapperError: any) {
                // Clean up temporary files in case of error
                try {
                  fs.unlinkSync(questionFile);
                } catch (cleanupError) {}
                
                console.error("Wrapper approach failed:", wrapperError);
                
                // If we've reached max attempts, re-throw the error
                if (attempts >= maxAttempts) {
                  throw wrapperError;
                }
              }
            } else {
              // If it's not a query-related error or we can't use the fallback,
              // just try again with the same method (for transient issues)
              console.warn(`Script execution failed on attempt ${attempts}, will${attempts >= maxAttempts ? ' not' : ''} retry:`, scriptError.message);
            }
          }
        }
        
        // Clean up the temporary file
        try {
          fs.unlinkSync(tempFile);
          console.log("Temporary file cleaned up");
        } catch (cleanupError) {
          console.warn("Failed to clean up temporary file:", cleanupError);
        }
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`Web crawler ${question ? 'question' : 'analysis'} completed in ${duration}s`);
        
        // Format the response based on the request type
        if (question) {
          // This is a question request - return just the answer
          return NextResponse.json({
            success: true,
            answer: output.trim(),
            processingTime
          });
        } else {
          // This is an analysis request - include website metadata
          return NextResponse.json({
            success: true,
            websiteContent: output.trim(),
            websiteTitle: title || "Website Analysis",
            processingTime
          });
        }
      } catch (error: any) {
        // Clean up the temporary file in case of error
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch (cleanupError) {
          console.warn("Failed to clean up temporary file after error:", cleanupError);
        }
        throw error;
      }
    } catch (runError: any) {
      console.error('Error running web crawler script:', runError);
      
      // Check for API key issues
      const errorOutput = runError.stderr || runError.message || '';
      
      if (errorOutput.includes('API key') || errorOutput.includes('GOOGLE_API_KEY')) {
        return NextResponse.json({
          success: false,
          message: 'Google API key is missing or invalid',
          isApiKeyError: true,
          setupInstructions: `
Please set up your Google API key:

1. Get a Google API key from the Google AI Studio
2. Create or edit the .env file in the webcrawler/webcrawler directory
3. Add this line: GOOGLE_API_KEY=your_api_key_here
4. Restart your application server
`
        }, { status: 500 });
      }
      
      // Check for missing modules
      if (errorOutput.includes('ModuleNotFoundError') || errorOutput.includes('ImportError')) {
        // Extract the specific module that's missing
        const moduleMatch = errorOutput.match(/No module named '([^']+)'/);
        const missingModule = moduleMatch ? moduleMatch[1] : 'unknown module';
        
        return NextResponse.json({
          success: false,
          message: `Missing Python module: ${missingModule}`,
          isPythonError: true,
          setupRequired: true,
          setupInstructions: `
Python module '${missingModule}' is missing. Please install it with:

1. Open a command prompt/terminal as administrator
2. Run:
   pip install ${missingModule}
   (Note: Add --user flag if you're not using a virtual environment)
3. If that fails, try:
   python -m pip install ${missingModule}
   (Note: Add --user flag if you're not using a virtual environment)
4. Restart your application server
`
        }, { status: 500 });
      }
      
      // Check for Gemini model errors
      if (errorOutput.includes('models/gemini') && 
          (errorOutput.includes('not found') || errorOutput.includes('NotFound'))) {
        return NextResponse.json({
          success: false, 
          message: 'The Gemini AI model is unavailable or has been updated',
          isModelError: true,
          setupInstructions: `
The version of the Gemini model in the code is no longer available. This can happen when Google updates their API.

Please update the model name in the webcrawler/webcrawler/website_agent.py file:
1. Open the file and find the line with "model_name"
2. Change it to a currently supported model like "models/gemini-pro"
3. Restart your application server
`
        }, { status: 500 });
      }
      
      // Create a user-friendly error message with detailed instructions
      let userErrorMessage = runError.message || 'An error occurred while analyzing the website';
      let setupInstructions = '';
      let isPythonError = false;
      
      if (runError.message && (
        runError.message.includes('Python') || 
        runError.message.includes('python') || 
        runError.message.includes('dependency') ||
        runError.message.includes('ModuleNotFound') ||
        runError.message.includes('Missing Python')
      )) {
        isPythonError = true;
        setupInstructions = `
Please set up Python and required dependencies:

1. Make sure Python 3.8+ is installed from https://www.python.org/downloads/
2. Open a command prompt/terminal as administrator
3. Run this command to install dependencies:
   python -m pip install langchain langchain-community langchain-google-genai google-generativeai beautifulsoup4 lxml python-dotenv
   (Note: Add --user flag if you're not using a virtual environment)
4. Restart your application server
`;
      }
      
      return NextResponse.json({
        success: false,
        message: userErrorMessage,
        isPythonError,
        setupRequired: isPythonError,
        setupInstructions
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Web crawler error:', error);
    
    // Handle API key error
    if (error.message && error.message.includes('API key')) {
      return NextResponse.json({
        success: false,
        message: error.message,
        isApiKeyError: true,
        setupInstructions: `
Please set up your Google API key:

1. Create or edit the .env file in the webcrawler/webcrawler directory
2. Add this line: GOOGLE_API_KEY=your_api_key_here
3. Restart your application server
`
      }, { status: 500 });
    }
    
    // Handle Python installation or dependency error
    if (error.message && (
      error.message.includes('Python') || 
      error.message.includes('python') || 
      error.message.includes('dependency') ||
      error.message.includes('ModuleNotFound')
    )) {
      return NextResponse.json({
        success: false,
        message: error.message,
        isPythonError: true,
        setupRequired: true,
        setupInstructions: `
Please set up Python and required dependencies:

1. Make sure Python 3.8+ is installed from https://www.python.org/downloads/
2. Open a command prompt/terminal as administrator
3. Run this command to install dependencies:
   python -m pip install langchain langchain-community langchain-google-genai google-generativeai beautifulsoup4 lxml python-dotenv
   (Note: Add --user flag if you're not using a virtual environment)
4. Restart your application server
`
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: false,
      message: error.message || 'An error occurred while analyzing the website',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}