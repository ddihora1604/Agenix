import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Helper function to run a command and get its output
async function runCommand(command: string, args: string[], options: any = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${command} ${args.join(' ')}`);
    
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
      const output = data.toString();
      console.log(output);
      stdout += output;
    });

    proc.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(error);
      stderr += error;
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
      console.error(`Process error: ${err.message}`);
      (err as any).stderr = stderr;
      (err as any).stdout = stdout;
      reject(err);
    });
  });
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

// Direct Python script execution with safer dependency checking
async function ensurePythonDependencies(scriptDir: string): Promise<void> {
  try {
    console.log('Checking Python dependencies...');
    
    // Define required packages directly
    const requiredPackages = [
      "langchain",
      "langchain_google_genai",
      "python-dotenv",
      "colorama",
      "google-generativeai"
    ];

    // Check which packages need to be installed
    const missingPackages: string[] = [];
    for (const pkg of requiredPackages) {
      const simpleName = pkg.split('-').join('_'); // convert dash to underscore for import
      const isInstalled = await isPythonPackageInstalled(simpleName);
      if (!isInstalled) {
        // Map the import name back to the package name for installation
        const fullPackageName = pkg === "langchain_google_genai" ? "langchain-google-genai==0.0.6" : pkg;
        missingPackages.push(fullPackageName);
      }
    }

    // Only install missing packages
    if (missingPackages.length > 0) {
      console.log(`Installing missing packages: ${missingPackages.join(', ')}`);
      
      // Use --user flag to avoid permission issues
      const pipArgs = ['install', '--user', '--upgrade', ...missingPackages];
      await runCommand('pip', pipArgs, { cwd: scriptDir });
      
      console.log('Dependencies installed successfully');
    } else {
      console.log('All required packages already installed');
    }
  } catch (error) {
    console.warn('Warning: Issues with dependency installation:', error);
    // Continue anyway, as dependencies might be installed but not detected properly
  }
}

// Run the email generator with proper error handling
async function runEmailGenerator(scriptPath: string, promptFile: string, scriptDir: string): Promise<string> {
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
  
  // First run with simple command to check for Python availability
  try {
    console.log('Checking Python installation...');
    await runCommand(pythonCommand, ['--version'], { cwd: scriptDir });
  } catch (error) {
    throw new Error(`Python is not installed or not in PATH: ${(error as Error).message}`);
  }
  
  // Then run the generator script
  try {
    console.log('Running email generator script...');
    return await runCommand(
      pythonCommand,
      [scriptPath, promptFile],
      { cwd: scriptDir }
    );
  } catch (error) {
    // Enhance error with debugging info
    let errorMessage = (error as Error).message;
    if (errorMessage.includes('ModuleNotFoundError')) {
      errorMessage += ' - Try restarting the server after installing Python packages.';
    }
    throw new Error(`Failed to generate email: ${errorMessage}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt parameter' }, 
        { status: 400 }
      );
    }

    // Create a temporary file to store the prompt
    const tempDir = os.tmpdir();
    const promptFile = path.join(tempDir, `email_prompt_${Date.now()}.txt`);
    fs.writeFileSync(promptFile, prompt, 'utf8');

    // Python script paths
    const scriptDir = path.join(process.cwd(), 'Email_Generator_Agent');
    const generatorPath = path.join(scriptDir, 'email_generator.py');
    const envPath = path.join(scriptDir, '.env');
    
    // Check if script exists
    if (!fs.existsSync(generatorPath)) {
      return NextResponse.json(
        { error: 'Email generator script not found', message: `Script not found: ${generatorPath}` }, 
        { status: 404 }
      );
    }
    
    // Check for API key in .env file
    let hasValidApiKey = false;
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const apiKeyMatch = envContent.match(/GOOGLE_API_KEY=([^\s]+)/);
        const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;
        hasValidApiKey = Boolean(apiKey && apiKey !== 'your-google-api-key-here');
      } catch (err) {
        console.warn('Error reading .env file:', err);
      }
    }
    
    // If no valid API key found, return an error immediately
    if (!hasValidApiKey) {
      return NextResponse.json(
        { 
          error: 'Missing or invalid API key', 
          message: 'Google API key is missing or invalid in .env file.',
          isApiKeyError: true
        },
        { status: 400 }
      );
    }
    
    try {
      console.log('Starting email generation process...');
      
      // First, ensure dependencies are installed
      await ensurePythonDependencies(scriptDir);
      
      // Then run the generator script directly with Python
      const output = await runEmailGenerator(generatorPath, promptFile, scriptDir);
      
      // Extract the email content from the output
      const emailContent = extractEmailContent(output);
      
      // Clean up temporary file
      try {
        if (fs.existsSync(promptFile)) {
          fs.unlinkSync(promptFile);
        }
      } catch (e) {
        console.warn('Warning: Failed to delete temporary file:', e);
      }
      
      return NextResponse.json({
        success: true,
        emailContent,
        rawOutput: output
      });
    } catch (error) {
      console.error('Error running email generator:', error);
      
      // Capture and log the full error output
      const errorMsg = (error as Error).message;
      const errorOutput = typeof error === 'object' && error !== null ? 
        (error as any).stderr || errorMsg : 
        errorMsg;
      
      console.error('Full error details:', errorOutput);
      
      // Special handling for specific errors
      const isApiKeyError = 
        errorMsg.includes('API key') || 
        errorMsg.includes('GOOGLE_API_KEY');
      
      // Python installation errors
      const isPythonError = 
        errorMsg.includes('Python is not installed') ||
        errorMsg.includes('not in PATH') ||
        errorMsg.includes('No module named');
      
      // Try to clean up the temp file
      try {
        if (fs.existsSync(promptFile)) {
          fs.unlinkSync(promptFile);
        }
      } catch {}
      
      return NextResponse.json(
        { 
          error: 'Failed to generate email', 
          message: errorOutput,
          isApiKeyError,
          isPythonError,
          details: `Make sure Python is installed and all dependencies are available. The Google API key should be in the .env file.`
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing email generation request:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message }, 
      { status: 500 }
    );
  }
}

/**
 * Extracts the email content from the script output
 */
function extractEmailContent(output: string): string {
  // First check if output is empty or undefined
  if (!output || typeof output !== 'string') {
    return 'No email content was generated. Please check the API key and try again.';
  }
  
  // Look for the email content between the markers
  const startMarker = '========================================== GENERATED EMAIL ==========================================';
  const endMarker = '===================================================================================================';
  
  // Also check for alternate markers that might be used in the Python script
  const altStartMarker = 'GENERATED EMAIL';
  
  // Try finding the primary markers first
  let startIndex = output.indexOf(startMarker);
  
  // If primary markers not found, try alternate ones
  if (startIndex === -1) {
    startIndex = output.indexOf(altStartMarker);
    // If found, adjust to get past the marker text
    if (startIndex !== -1) {
      startIndex = output.indexOf('\n', startIndex) + 1;
    }
  } else {
    // Adjust to get past the marker text for primary marker
    startIndex = startIndex + startMarker.length;
  }
  
  // If no markers found at all, return a reasonable portion of the output
  if (startIndex === -1) {
    // Look for any content that looks like an email (has common email parts)
    const emailRegex = /(Dear|To whom it may concern|Hello|Hi|Subject:|Sincerely|Best regards|Thank you|Regards,)/i;
    const match = output.match(emailRegex);
    
    if (match && match.index !== undefined) {
      // Found something that looks like an email, return from there to the end
      return cleanAndFormatEmail(output.substring(match.index).trim());
    }
    
    // No email-like content found, just return the whole output
    return cleanAndFormatEmail(output.trim());
  }
  
  // Look for end marker
  const endIndex = output.indexOf(endMarker, startIndex);
  
  if (endIndex === -1) {
    // No end marker, return from start to the end of output
    return cleanAndFormatEmail(output.substring(startIndex).trim());
  }
  
  // Return content between markers
  return cleanAndFormatEmail(output.substring(startIndex, endIndex).trim());
}

/**
 * Cleans and formats the extracted email content
 */
function cleanAndFormatEmail(emailContent: string): string {
  // Remove any ANSI color codes
  emailContent = emailContent.replace(/\u001b\[\d+(;\d+)*m/g, '');
  
  // Remove any excessive newlines (more than 2 consecutive)
  emailContent = emailContent.replace(/\n{3,}/g, '\n\n');
  
  // Ensure proper spacing after punctuation
  emailContent = emailContent.replace(/([.!?])(?=\S)/g, '$1 ');
  
  // Remove any hardcoded date (October 26, 2023)
  emailContent = emailContent.replace(/October 26,\s*2023/g, '');
  
  // Ensure paragraphs are properly separated
  const paragraphs = emailContent.split('\n\n');
  const formattedParagraphs = paragraphs.map(p => p.trim()).filter(p => p.length > 0);
  
  // Add proper date format with current date and time
  if (!emailContent.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) && 
      !emailContent.match(/^\w+,\s+\w+\s+\d{1,2},\s+\d{4}/)) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    // Add time to the date format
    const formattedTime = today.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const dateTimeString = `${formattedDate} at ${formattedTime}`;
    
    // Only add date if it doesn't seem to start with one already
    if (!emailContent.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)) {
      emailContent = dateTimeString + '\n\n' + emailContent;
    }
  }
  
  return emailContent;
} 