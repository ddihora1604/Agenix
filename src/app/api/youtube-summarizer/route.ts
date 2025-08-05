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

// Check if Python package is installed
async function isPythonPackageInstalled(packageName: string): Promise<boolean> {
  try {
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    const command = `${pythonCommand} -c "import ${packageName.split('==')[0].split('>=')[0]}; print('Package found')"`;
    
    const { stdout, stderr } = await new Promise<{stdout: string, stderr: string}>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        resolve({ stdout, stderr });
      });
    });
    
    return stdout.includes('Package found');
  } catch (error) {
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

// Ensure Python dependencies are installed
async function ensurePythonDependencies(scriptDir: string): Promise<boolean> {
  try {
    // First verify Python is installed
    const pythonInstalled = await verifyPythonInstallation();
    if (!pythonInstalled) {
      throw new Error('Python is not properly installed or accessible');
    }
    
    // Define required packages with explicit versions for stability
    const requiredPackages = [
      "youtube-transcript-api==0.6.1",
      "google-generativeai>=0.3.0",
      "python-dotenv==1.0.0"
    ];

    console.log("Installing Python dependencies directly...");
    
    // Run pip command directly - more reliable than using a Python script
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    try {
      // Check if running in a virtualenv
      const isVirtualEnv = await checkIfVirtualEnv();
      
      // First attempt with pip
      console.log("Trying with pip install...");
      await runCommand('pip', ['install', '--no-cache-dir', ...requiredPackages], { 
        cwd: scriptDir,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });
      console.log("Pip install successful");
      return true;
    } catch (pipError) {
      console.log("Pip install failed, trying with python -m pip...");
      
      try {
        // Check if running in a virtualenv (again, in case the first check didn't run)
        const isVirtualEnv = await checkIfVirtualEnv();
        
        // Second attempt with python -m pip
        await runCommand(pythonCommand, ['-m', 'pip', 'install', '--no-cache-dir', ...requiredPackages], { 
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

// Run the YouTube summarizer Python script
async function runYouTubeSummarizer(scriptPath: string, videoUrl: string, scriptDir: string): Promise<string> {
  try {
    // Install dependencies first as a separate step
    // We do this before running the script rather than letting the script detect missing dependencies
    const depsInstalled = await ensurePythonDependencies(scriptDir);
    if (!depsInstalled) {
      throw new Error('Failed to install required Python dependencies');
    }
    
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    // Create a temporary file to store the video URL
    const tempFile = path.join(os.tmpdir(), 'youtube_url.txt');
    fs.writeFileSync(tempFile, videoUrl);
    
    console.log(`Running Python script: ${scriptPath} with URL from ${tempFile}`);
    
    // Get the user's site packages directory for the PYTHONPATH
    // This helps Python find the installed packages
    let sitePackagesPath = '';
    
    try {
      const { stdout } = await new Promise<{stdout: string, stderr: string}>((resolve, reject) => {
        exec(`${pythonCommand} -m site --user-site`, (error, stdout, stderr) => {
          if (error) {
            console.warn("Could not determine user site packages:", error);
            resolve({ stdout: '', stderr: stderr });
          } else {
            resolve({ stdout, stderr });
          }
        });
      });
      sitePackagesPath = stdout.trim();
      console.log("Using site packages path:", sitePackagesPath);
    } catch (e) {
      console.warn("Error getting site packages path:", e);
      // Use default paths as fallback
      sitePackagesPath = process.platform === 'win32' ? 
        path.join(os.homedir(), 'AppData', 'Roaming', 'Python', 'Python311', 'site-packages') :
        path.join(os.homedir(), '.local', 'lib', 'python3.x', 'site-packages');
    }
    
    // Run the Python script with the video URL
    const output = await runCommand(pythonCommand, [scriptPath, tempFile], {
      cwd: scriptDir,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1', // Prevent Python from buffering output
        // Add the site packages path to PYTHONPATH to ensure dependencies are found
        PYTHONPATH: sitePackagesPath + (process.env.PYTHONPATH ? path.delimiter + process.env.PYTHONPATH : '')
      },
      // Increase timeout for longer videos (5 minutes)
      timeout: 5 * 60 * 1000
    });
    
    // Clean up the temporary file
    fs.unlinkSync(tempFile);
    
    // Check for error messages in the output
    if (output.includes("Error: Missing required packages")) {
      const missingPackages = output.match(/Missing required packages: (.*?)[\r\n]/);
      if (missingPackages && missingPackages[1]) {
        throw new Error(`Missing Python packages: ${missingPackages[1]}`);
      } else {
        throw new Error("Missing Python packages detected in the output");
      }
    }
    
    return output;
  } catch (error: any) {
    console.error("Error running YouTube summarizer:", error);
    
    if (error.stderr && error.stderr.includes('ModuleNotFoundError')) {
      // Missing Python module error - provide more details
      throw new Error(`Missing Python module: ${error.stderr}`);
    } else if (error.stderr && error.stderr.includes('API key')) {
      // API key error
      throw new Error('Google API Key is missing or invalid');
    } else if (error.message.includes('ENOENT') || !error.stderr) {
      // Python not found
      throw new Error('Python is not properly installed or accessible');
    } else {
      // Other errors
      throw new Error(`Failed to run YouTube summarizer: ${error.message}`);
    }
  }
}

// Extract video ID from URL
function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Generate YouTube thumbnail URL from video ID
function generateThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Parse summary output
function parseSummaryOutput(output: string): { summary: string, videoTitle?: string } {
  try {
    // Try to find JSON output between markers
    const jsonMatch = output.match(/RESULT_JSON_START\s*([\s\S]*?)\s*RESULT_JSON_END/);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        const jsonResult = JSON.parse(jsonMatch[1].trim());
        
        if (jsonResult.success) {
          return {
            summary: jsonResult.summary,
            videoTitle: jsonResult.title || ''
          };
        } else if (jsonResult.error) {
          throw new Error(jsonResult.error);
        }
      } catch (jsonError) {
        console.error("Error parsing JSON result:", jsonError);
        // Fall back to regex parsing if JSON parsing fails
      }
    }
    
    // Fall back to the old method of parsing output if JSON is not found
    // Extract title if present
    let videoTitle = '';
    const titleMatch = output.match(/Title: (.+)$/m);
    if (titleMatch && titleMatch[1]) {
      videoTitle = titleMatch[1].trim();
    }
    
    // Extract summary
    let summary = output;
    
    // Clean up the summary by removing unnecessary lines
    summary = summary.replace(/^(Processing video ID|Extracting transcript|Transcript extracted successfully).+$/gm, '');
    summary = summary.replace(/^=+$/gm, '');
    summary = summary.replace(/^(YouTube Transcript to Detailed Notes Converter|DETAILED NOTES:|Processing video ID:).+$/gm, '');
    summary = summary.replace(/^Generating summary\.\.\.$/m, '');
    summary = summary.replace(/RESULT_JSON_START[\s\S]*RESULT_JSON_END/g, '');
    
    // Clean up extra whitespace
    summary = summary.trim().replace(/\n{3,}/g, '\n\n');
    
    return { summary, videoTitle };
  } catch (error) {
    console.error("Error parsing summary output:", error);
    return { 
      summary: "Could not parse summary output. Raw output: " + output.substring(0, 200) + "..." 
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get video URL from request body
    const body = await req.json();
    const videoUrl = body.videoUrl;
    
    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json({ message: 'Invalid video URL' }, { status: 400 });
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ message: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Generate thumbnail URL
    const thumbnailUrl = generateThumbnailUrl(videoId);

    // Set up paths
    const scriptDir = path.join(process.cwd(), 'YTSummarizer', 'YTSummarizer');
    const scriptPath = path.join(scriptDir, 'ytsummarizer.py');

    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ 
        message: 'YouTube summarizer script not found',
        setupRequired: true,
        setupInstructions: 'The YouTube summarizer script is missing. Please ensure the YTSummarizer folder is present in the project root.'
      }, { status: 500 });
    }

    try {
      // Run the script - dependency installation is now handled inside runYouTubeSummarizer
      const output = await runYouTubeSummarizer(scriptPath, videoUrl, scriptDir);
      
      // Parse the output
      const { summary, videoTitle } = parseSummaryOutput(output);

      // Return the summary and thumbnail
      return NextResponse.json({ 
        summary, 
        thumbnailUrl, 
        videoId,
        videoTitle
      });
    } catch (runError: any) {
      console.error('Error running script:', runError);
      
      // Create a user-friendly error message with detailed instructions
      let userErrorMessage = runError.message || 'An error occurred while summarizing the video';
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
   pip install youtube-transcript-api google-generativeai python-dotenv
   (Note: Add --user flag if you're not using a virtual environment)
4. If that fails, try:
   python -m pip install youtube-transcript-api google-generativeai python-dotenv
   (Note: Add --user flag if you're not using a virtual environment)
5. Restart your application server
`;
      }
      
      return NextResponse.json({
        message: userErrorMessage,
        isPythonError,
        setupRequired: isPythonError,
        setupInstructions
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('YouTube summarizer error:', error);
    
    // Handle API key error
    if (error.message && error.message.includes('API key')) {
      return NextResponse.json({
        message: error.message,
        isApiKeyError: true,
        setupInstructions: `
Please set up your Google Gemini API key:

1. Get a free API key from https://makersuite.google.com/app/apikey
2. Create or edit the .env file in your project root
3. Add this line: GOOGLE_API_KEY=your_api_key_here
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
        message: error.message,
        isPythonError: true,
        setupRequired: true,
        setupInstructions: `
Please set up Python and required dependencies:

1. Make sure Python 3.8+ is installed from https://www.python.org/downloads/
2. Open a command prompt/terminal as administrator
3. Run this command:
   pip install youtube-transcript-api google-generativeai python-dotenv
   (Note: Add --user flag if you're not using a virtual environment)
4. If that fails, try:
   python -m pip install youtube-transcript-api google-generativeai python-dotenv
   (Note: Add --user flag if you're not using a virtual environment)
5. Restart your application server
`
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: error.message || 'An error occurred while summarizing the video' 
    }, { status: 500 });
  }
}