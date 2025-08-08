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
      // For Windows, properly quote arguments that contain spaces
      const quotedArgs = args.map(arg => {
        if (arg.includes(' ') && !arg.startsWith('"')) {
          return `"${arg}"`;
        }
        return arg;
      });
      
      // Use process.spawn with shell:true to ensure PowerShell compatibility
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

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
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

// Check if Python package is installed
async function isPythonPackageInstalled(packageName: string): Promise<boolean> {
  try {
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    // Special handling for langchain_google_genai which might have Pydantic compatibility issues during check
    if (packageName === 'langchain_google_genai') {
      // We'll skip the check and assume it's installed if we've previously installed it
      const localPythonPath = process.env.PYTHONPATH || '';
      const userSitePackages = process.platform === 'win32' ? 
        path.join(os.homedir(), 'AppData', 'Roaming', 'Python', 'Python311', 'site-packages') :
        path.join(os.homedir(), '.local', 'lib', 'python3.11', 'site-packages');
      
      // Look for package files rather than trying to import the package
      const possiblePaths = [
        path.join(userSitePackages, 'langchain_google_genai'),
        path.join(userSitePackages, 'langchain-google-genai.dist-info'),
        path.join(userSitePackages, 'langchain_google_genai.egg-info')
      ];
      
      for (const pkgPath of possiblePaths) {
        if (fs.existsSync(pkgPath)) {
          return true;
        }
      }
      
      // If we don't find it, we'll install it anyway to be safe
      return false;
    }
    
    // For other packages, use the regular check
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

// Direct Python script execution with safer dependency checking
async function ensurePythonDependencies(scriptDir: string): Promise<void> {
  try {
    // First verify Python is installed
    const pythonInstalled = await verifyPythonInstallation();
    if (!pythonInstalled) {
      throw new Error('Python is not properly installed or accessible');
    }
    
    // Define required packages directly
    const requiredPackages = [
      "langchain",
      "langchain_google_genai",
      "python-dotenv",
      "colorama",
      "google-generativeai"
    ];

    // For safety, always ensure langchain-google-genai is installed/updated
    // to avoid the Pydantic compatibility issues
    const packagesToInstall = ["langchain-google-genai==0.0.11"];
    
    // Check which other packages need to be installed
    for (const pkg of requiredPackages) {
      if (pkg !== "langchain_google_genai") { // We already added this one
      const simpleName = pkg.split('-').join('_'); // convert dash to underscore for import
      const isInstalled = await isPythonPackageInstalled(simpleName);
      if (!isInstalled) {
          packagesToInstall.push(pkg);
        }
      }
    }

    // Install packages if needed
    if (packagesToInstall.length > 0) {
      // Check if running in a virtualenv
      const isVirtualEnv = await checkIfVirtualEnv();
      
      // Always use basic install without --user flag to avoid virtualenv issues
      const pipArgs = ['install', '--upgrade', ...packagesToInstall];
      
      try {
        await runCommand('pip', pipArgs, { cwd: scriptDir });
      } catch (pipError) {
        // Try with python -m pip as a fallback
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
        await runCommand(pythonCommand, ['-m', 'pip', ...pipArgs], { cwd: scriptDir });
      }
    }
    
    // Create or update the compatibility patch files
    await ensureCompatibilityFiles(scriptDir);
  } catch (error: any) {
    // Rethrow with enhanced info
    throw new Error(`Python dependency error: ${error.message}`);
  }
}

// Function to check if running in a virtual environment is defined above

// Function to ensure compatibility files exist
async function ensureCompatibilityFiles(scriptDir: string): Promise<void> {
  // Only create these files if they don't already exist
  const pydanticPatchPath = path.join(scriptDir, 'pydantic_patch.py');
  const simplePatchPath = path.join(scriptDir, 'simple_patch.py');
  const versionCompatPath = path.join(scriptDir, 'version_compat.py');
  
  // Check if files exist with correct content
  let needsUpdate = false;
  
  try {
    // Only update if files don't exist
    if (!fs.existsSync(pydanticPatchPath) || 
        !fs.existsSync(simplePatchPath) || 
        !fs.existsSync(versionCompatPath)) {
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      // The files will be created or updated with proper content
      // This is minimal code to check SecretStr issue and patch it
      const simplePatchContent = fs.readFileSync(path.join(process.cwd(), 'Email_Generator_Agent', 'simple_patch.py'), 'utf8');
      fs.writeFileSync(simplePatchPath, simplePatchContent);
      
      const pydanticPatchContent = fs.readFileSync(path.join(process.cwd(), 'Email_Generator_Agent', 'pydantic_patch.py'), 'utf8');
      fs.writeFileSync(pydanticPatchPath, pydanticPatchContent);
      
      const versionCompatContent = fs.readFileSync(path.join(process.cwd(), 'Email_Generator_Agent', 'version_compat.py'), 'utf8');
      fs.writeFileSync(versionCompatPath, versionCompatContent);
    }
  } catch (error: any) {
    throw new Error(`Failed to ensure compatibility files: ${error.message}`);
  }
}

// Run the email generator Python script
async function runEmailGenerator(scriptPath: string, promptFile: string, scriptDir: string): Promise<string> {
  try {
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    // Run the Python script with the prompt file as argument
    // Ensure paths with spaces are properly handled
    return await runCommand(pythonCommand, [scriptPath, promptFile], {
      cwd: scriptDir,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1' // Prevent Python from buffering output
      }
    });
  } catch (error: any) {
    if (error.stderr && error.stderr.includes('ModuleNotFoundError')) {
      // Missing Python module error
      throw new Error(`Missing Python module: ${error.stderr}`);
    } else if (error.stderr && error.stderr.includes('API key')) {
      // API key error
      throw new Error('Google API Key is missing or invalid');
    } else if (error.message.includes('ENOENT') || !error.stderr) {
      // Python not found
      throw new Error('Python is not properly installed or accessible');
    } else {
      // Other errors
      throw new Error(`Failed to run email generator: ${error.message}`);
    }
  }
}

export async function POST(req: NextRequest) {
  let tempDir = '';
  
  try {
    // Get prompt from request body
    const body = await req.json();
    const prompt = body.prompt;
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ message: 'Invalid prompt' }, { status: 400 });
    }

    // Create temp directory for processing
    tempDir = path.join(os.tmpdir(), 'email-generator-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    const promptFilePath = path.join(tempDir, 'prompt.txt');
    
    // Write prompt to temp file
    fs.writeFileSync(promptFilePath, prompt, 'utf8');
    
    // Path to the email generator script
    const scriptDir = path.join(process.cwd(), 'Email_Generator_Agent');
    const scriptPath = path.join(scriptDir, 'email_generator.py');
    
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ message: 'Email generator script not found' }, { status: 500 });
    }
    
    try {
      // Ensure Python is installed with all required dependencies
      await ensurePythonDependencies(scriptDir);
      
      // Run the email generator script
      const output = await runEmailGenerator(scriptPath, promptFilePath, scriptDir);
      
      // Extract and format the email content from the output
      const emailContent = extractEmailContent(output);
      const formattedEmail = cleanAndFormatEmail(emailContent);
      
      // Return the formatted email content
      return NextResponse.json({ emailContent: formattedEmail });
    } catch (error: any) {
      let isPythonError = false;
      let isApiKeyError = false;
      let isPydanticError = false;
      let setupRequired = false;
      let message = error.message || 'An unexpected error occurred';
      
      // Check for specific error types
      if (message.includes('Python') || 
          message.includes('ModuleNotFound') || 
          message.includes('pip') ||
          message.includes('dependency')) {
        isPythonError = true;
        setupRequired = true;
      } else if (message.includes('API key') || 
                message.includes('credentials') || 
                message.includes('authentication')) {
        isApiKeyError = true;
      } else if (message.includes('Pydantic') || 
                message.includes('_modify_schema') || 
                message.includes('SecretStr')) {
        isPydanticError = true;
      }
      
      return NextResponse.json({
        message,
        isPythonError,
        isApiKeyError,
        isPydanticError,
        setupRequired
      }, { status: 500 });
    } finally {
      // Clean up temp directory
      try {
        if (tempDir && fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        // Silently continue if cleanup fails
      }
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}

/**
 * Extracts the email content from the script output
 */
function extractEmailContent(output: string): string {
  // Extract the generated email content from the output
  // Find the markers in the output
  const startMarker = 'GENERATED EMAIL';
  const generateEmailStart = output.indexOf(startMarker);
  
  if (generateEmailStart === -1) {
    // If we don't find the marker, return the entire output
    return output;
  }
  
  // Find the actual content after the equals line
  const contentStart = output.indexOf('\n', generateEmailStart) + 1;
  if (contentStart === 0) {
    return output;
  }
  
  // Extract everything from content start to the end
  let emailContent = output.substring(contentStart).trim();
  
  // Return the content
  return emailContent;
}

/**
 * Cleans and formats the extracted email content
 */
function cleanAndFormatEmail(emailContent: string): string {
  // Clean up any Pydantic or debug messages that might have leaked into the content
  if (!emailContent) return '';
  
  // Remove any debug lines
  let cleanedEmail = emailContent
    .replace(/Debug: .*$/gm, '')
    .replace(/Warning: .*$/gm, '')
    .replace(/Pydantic .*$/gm, '')
    .replace(/^.*pydantic.*$/gm, '')
    .replace(/.*langchain.*$/gm, '')
    .replace(/.*_modify_schema_.*$/gm, '')
    .replace(/For further information.*errors\.pydantic\.dev.*$/gm, '');
    
  // Trim leading/trailing whitespace and normalize newlines
  cleanedEmail = cleanedEmail.trim().replace(/\r\n/g, '\n');
  
  // Ensure consistent paragraph spacing
  cleanedEmail = cleanedEmail.replace(/\n{3,}/g, '\n\n');
  
  // Remove any leading/trailing boilerplate text that might have leaked in
  cleanedEmail = cleanedEmail
    .replace(/^Thank you for using Email Generator AI.*$/m, '')
    .replace(/^Email Generator AI terminated.*$/m, '');
  
  return cleanedEmail;
}