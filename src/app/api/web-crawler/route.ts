import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Helper function to run a command and get its output
async function runCommand(command: string, args: string[], options: any = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    // Special handling for Windows PowerShell
    let proc;
    if (process.platform === 'win32') {
      // For Windows, use process.spawn with shell:true to ensure PowerShell compatibility
      proc = spawn(command, args, {
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

// Ensure Python dependencies are installed for web crawler
async function ensurePythonDependencies(scriptDir: string): Promise<boolean> {
  try {
    // First verify Python is installed
    const pythonInstalled = await verifyPythonInstallation();
    if (!pythonInstalled) {
      throw new Error('Python is not properly installed or accessible');
    }
    
    // Check for requirements.txt in the webcrawler directory
    const requirementsPath = path.join(scriptDir, 'requirements.txt');
    
    // Define required packages with explicit versions for stability
    // Updated to include all required packages for the web crawler
    const requiredPackages = [
      "langchain>=0.1.0",
      "langchain-community>=0.0.10", 
      "langchain-google-genai>=0.0.5",
      "google-generativeai>=0.3.0",
      "faiss-cpu>=1.7.4",
      "beautifulsoup4>=4.12.2",
      "lxml>=4.9.3",
      "python-dotenv>=1.0.0",
      "requests>=2.25.0"
    ];

    console.log("Installing Python dependencies for web crawler...");
    
    // Run pip command directly - more reliable than using a Python script
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    try {
      // First attempt with pip
      console.log("Trying with pip install...");
      await runCommand('pip', ['install', '--user', '--no-cache-dir', ...requiredPackages], { 
        cwd: scriptDir,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });
      console.log("Pip install successful");
      return true;
    } catch (pipError) {
      console.log("Pip install failed, trying with python -m pip...");
      
      try {
        // Second attempt with python -m pip
        await runCommand(pythonCommand, ['-m', 'pip', 'install', '--user', '--no-cache-dir', ...requiredPackages], { 
          cwd: scriptDir,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        });
        console.log("Python -m pip install successful");
        return true;
      } catch (pythonPipError: any) {
        console.error("Both pip installation methods failed:", pythonPipError);
        throw new Error(`Failed to install Python dependencies: ${pythonPipError.message}`);
      }
    }
    
  } catch (error: any) {
    console.error("Python dependency installation error:", error);
    // Rethrow with enhanced info
    throw new Error(`Python dependency error: ${error.message}`);
  }
}

// Analyze a website using the web crawler script
export async function POST(req: NextRequest) {
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
      // Install dependencies first as a separate step
      const depsInstalled = await ensurePythonDependencies(scriptDir);
      if (!depsInstalled) {
        throw new Error('Failed to install required Python dependencies');
      }
      
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      
      // Create a temporary file to store the website URL
      const tempFile = path.join(os.tmpdir(), 'website_url.txt');
      fs.writeFileSync(tempFile, websiteUrl);
      
      console.log(`Running Python script: ${scriptPath} with URL from ${tempFile}`);
      
      // Prepare command arguments based on whether it's an analysis or a question
      const args = question 
        ? [scriptPath, tempFile, '--question', question]
        : [scriptPath, tempFile];
      
      // Add PYTHONPATH to the environment to ensure modules can be found
      const env = {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1',
        // Add current directory and site-packages to Python path
        PYTHONPATH: `${scriptDir}:${process.env.PYTHONPATH || ''}`
      };
      
      // Run the Python script with longer timeout and enhanced environment
      const output = await runCommand(pythonCommand, args, {
        cwd: scriptDir,
        env,
        // Increase timeout for larger websites (5 minutes)
        timeout: 5 * 60 * 1000
      });
      
      // Clean up the temporary file
      fs.unlinkSync(tempFile);
      
      // Parse the output
      if (question) {
        // This is a question request
        return NextResponse.json({
          success: true,
          answer: output.trim()
        });
      } else {
        // This is an analysis request
        // Try to extract website title (first line after "Analyzing website:")
        const titleMatch = output.match(/Analyzing website:[\s\S]*?Title: (.*)/);
        const websiteTitle = titleMatch ? titleMatch[1].trim() : "Website Analysis";
        
        return NextResponse.json({
          success: true,
          websiteContent: output.trim(),
          websiteTitle
        });
      }
    } catch (runError: any) {
      console.error('Error running web crawler script:', runError);
      
      // Check if output contains module not found errors
      const errorOutput = runError.stderr || runError.message || '';
      
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
   pip install --user ${missingModule}
3. If that fails, try:
   python -m pip install --user ${missingModule}
4. Restart your application server
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
   pip install --user langchain langchain-community langchain-google-genai google-generativeai faiss-cpu beautifulsoup4 lxml python-dotenv requests
4. If that fails, try:
   python -m pip install --user langchain langchain-community langchain-google-genai google-generativeai faiss-cpu beautifulsoup4 lxml python-dotenv requests
5. Restart your application server
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
Please set up your OpenAI API key:

1. Get a free API key from https://platform.openai.com/api-keys
2. Create or edit the .env file in the webcrawler directory
3. Add this line: OPENAI_API_KEY=your_api_key_here
4. Restart your application server
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
   pip install --user langchain langchain-community langchain-google-genai google-generativeai faiss-cpu beautifulsoup4 lxml python-dotenv requests
4. If that fails, try:
   python -m pip install --user langchain langchain-community langchain-google-genai google-generativeai faiss-cpu beautifulsoup4 lxml python-dotenv requests
5. Restart your application server
`
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: false,
      message: error.message || 'An error occurred while analyzing the website' 
    }, { status: 500 });
  }
}