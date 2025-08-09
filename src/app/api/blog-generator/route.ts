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

// Check if Python package is installed
async function isPythonPackageInstalled(packageName: string): Promise<boolean> {
  try {
    // Use the dedicated virtual environment for Blog Generator
    const pythonCommand = process.platform === 'win32' ? 
      path.join(process.cwd(), 'blog', 'venv', 'Scripts', 'python.exe') : 
      path.join(process.cwd(), 'blog', 'venv', 'bin', 'python');
    
    // Special handling for langchain_groq which might have Pydantic compatibility issues during check
    if (packageName === 'langchain_groq') {
      // We'll skip the check and assume it's installed if we've previously installed it
      const venvSitePackages = process.platform === 'win32' ? 
        path.join(process.cwd(), 'blog', 'venv', 'Lib', 'site-packages') :
        path.join(process.cwd(), 'blog', 'venv', 'lib', 'python3.11', 'site-packages');
      
      // Look for package files rather than trying to import the package
      const possiblePaths = [
        path.join(venvSitePackages, 'langchain_groq'),
        path.join(venvSitePackages, 'langchain-groq.dist-info'),
        path.join(venvSitePackages, 'langchain_groq.egg-info')
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
    const command = `"${pythonCommand}" -c "import ${packageName.split('==')[0].split('>=')[0]}; print('Package found')"`;
    
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
    // Use the dedicated virtual environment for Blog Generator
    const pythonCommand = process.platform === 'win32' ? 
      path.join(process.cwd(), 'blog', 'venv', 'Scripts', 'python.exe') : 
      path.join(process.cwd(), 'blog', 'venv', 'bin', 'python');
    
    const { stdout } = await new Promise<{stdout: string, stderr: string}>((resolve, reject) => {
      exec(`"${pythonCommand}" --version`, (error, stdout, stderr) => {
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

// Direct Python script execution with safer dependency checking
async function ensurePythonDependencies(scriptDir: string): Promise<void> {
  try {
    // First verify Python is installed
    const pythonInstalled = await verifyPythonInstallation();
    if (!pythonInstalled) {
      throw new Error('Python is not properly installed or accessible');
    }
    
    // Define required packages directly for blog.py
    const requiredPackages = [
      "langchain",
      "langchain_groq",
      "python-dotenv",
      "rich",
      "pydantic"
    ];

    // For safety, always ensure langchain-groq is installed/updated
    const packagesToInstall = ["langchain-groq"];
    
    // Check which other packages need to be installed
    for (const pkg of requiredPackages) {
      if (pkg !== "langchain_groq") { // We already added this one
        const simpleName = pkg.split('-').join('_'); // convert dash to underscore for import
        const isInstalled = await isPythonPackageInstalled(simpleName);
        if (!isInstalled) {
          packagesToInstall.push(pkg);
        }
      }
    }

    // Install packages if needed
    if (packagesToInstall.length > 0) {
      // Use the virtual environment pip
      const pipCommand = process.platform === 'win32' ? 
        path.join(scriptDir, 'venv', 'Scripts', 'pip.exe') : 
        path.join(scriptDir, 'venv', 'bin', 'pip');
      
      const pipArgs = ['install', '--upgrade', ...packagesToInstall];
      
      try {
        await runCommand(pipCommand, pipArgs, { cwd: scriptDir });
      } catch (pipError) {
        // Try with python -m pip as a fallback using virtual environment python
        const pythonCommand = process.platform === 'win32' ? 
          path.join(scriptDir, 'venv', 'Scripts', 'python.exe') : 
          path.join(scriptDir, 'venv', 'bin', 'python');
        await runCommand(pythonCommand, ['-m', 'pip', ...pipArgs], { cwd: scriptDir });
      }
    }
  } catch (error: any) {
    // Rethrow with enhanced info
    throw new Error(`Python dependency error: ${error.message}`);
  }
}

// Function to check if running in a virtual environment
async function checkIfVirtualEnv(): Promise<boolean> {
  try {
    // Use the dedicated virtual environment for Blog Generator
    const pythonCommand = process.platform === 'win32' ? 
      path.join(process.cwd(), 'blog', 'venv', 'Scripts', 'python.exe') : 
      path.join(process.cwd(), 'blog', 'venv', 'bin', 'python');
    
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

// Function to run the blog generator script
async function runBlogGenerator(scriptPath: string, topicFile: string, scriptDir: string): Promise<string> {
  try {
    // Use the dedicated virtual environment for Blog Generator
    const pythonCommand = process.platform === 'win32' ? 
      path.join(scriptDir, 'venv', 'Scripts', 'python.exe') : 
      path.join(scriptDir, 'venv', 'bin', 'python');
    
    // Load environment variables from blog's .env file
    const envPath = path.join(scriptDir, '.env');
    const envVars: { [key: string]: string | undefined } = { ...process.env };
    
    try {
      const fs = await import('fs');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envLines = envContent.split('\n');
        
        for (const line of envLines) {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
              envVars[key.trim()] = valueParts.join('=').trim();
            }
          }
        }
        console.log('Blog Generator API: Loaded environment variables from .env file');
      } else {
        console.warn('Blog Generator API: .env file not found at', envPath);
      }
    } catch (envError) {
      console.warn('Blog Generator API: Error loading .env file:', envError);
    }
    
    // Execute the script with the topic file as input and environment variables
    const output = await runCommand(
      pythonCommand, 
      [scriptPath, topicFile], 
      { 
        cwd: scriptDir,
        env: envVars
      }
    );
    
    return output;
  } catch (error: any) {
    console.error('Error executing blog generator:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("Blog Generator API: Request received");
    const { topic } = await req.json();
    
    if (!topic || topic.trim() === '') {
      console.error("Blog Generator API: Missing topic");
      return NextResponse.json({ message: 'A blog topic is required' }, { status: 400 });
    }

    console.log(`Blog Generator API: Processing topic: "${topic.substring(0, 50)}${topic.length > 50 ? '...' : ''}"`);

    // Create a temporary file with the topic
    const tempDir = path.join(process.cwd(), 'blog');
    const topicFile = path.join(tempDir, 'temp_topic.txt');
    
    // Ensure directory exists
    if (!fs.existsSync(tempDir)) {
      console.log(`Creating directory: ${tempDir}`);
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Path to the blog.py script
    const scriptPath = path.join(tempDir, 'blog.py');
    console.log(`Blog script path: ${scriptPath}`);
    
    // Check if blog.py exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`blog.py not found at ${scriptPath}`);
      return NextResponse.json({ 
        message: 'The blog.py file is missing. Please ensure it is placed in the blog directory.', 
        error: 'File not found: blog.py',
        setupRequired: true
      }, { status: 404 });
    }
    
    // Write topic to file
    fs.writeFileSync(topicFile, topic);
    console.log(`Topic written to: ${topicFile}`);
    
    // Check if the API key is present before running dependencies
    const envFilePath = path.join(tempDir, '.env');
    let apiKeyPresent = false;
    let apiKeyContent = '';
    
    if (fs.existsSync(envFilePath)) {
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      apiKeyContent = envContent;
      
      // More specific check for valid API key
      apiKeyPresent = envContent.includes('GROQ_API_KEY=') && 
                     !envContent.includes('GROQ_API_KEY=your-groq-api-key-here') &&
                     !envContent.includes('GROQ_API_KEY=""') &&
                     !envContent.includes('GROQ_API_KEY=\'\'') &&
                     envContent.match(/GROQ_API_KEY=[\w\-]+/) !== null;
    }
    
    console.log('API key present:', apiKeyPresent);
    
    if (!apiKeyPresent) {
      console.error('Blog generator API: GROQ API key is missing or invalid');
      // Add more detailed logging about the API key format
      console.log('API key validation checks:');
      if (fs.existsSync(envFilePath)) {
        const envContent = fs.readFileSync(envFilePath, 'utf8');
        console.log('- .env file exists: YES');
        console.log('- Contains GROQ_API_KEY=: ', envContent.includes('GROQ_API_KEY='));
        console.log('- Contains default template value: ', envContent.includes('GROQ_API_KEY=your-groq-api-key-here'));
        console.log('- Contains empty value: ', 
                    envContent.includes('GROQ_API_KEY=""') || 
                    envContent.includes('GROQ_API_KEY=\'\''));
        console.log('- Matches expected format: ', envContent.match(/GROQ_API_KEY=[\w\-]+/) !== null);
        // Show masked key for security
        const keyMatch = envContent.match(/GROQ_API_KEY=([\w\-]+)/);
        if (keyMatch && keyMatch[1]) {
          const key = keyMatch[1];
          const maskedKey = key.length > 8 ? 
            `${key.substring(0, 4)}...${key.substring(key.length-4)}` : 
            '***';
          console.log('- Key format: ', maskedKey, `(length: ${key.length})`);
        }
      } else {
        console.log('- .env file exists: NO');
      }
      console.log('Current .env content:', apiKeyContent.replace(/GROQ_API_KEY=[\w\-]+/, 'GROQ_API_KEY=REDACTED'));
      return NextResponse.json({ 
        message: 'GROQ API key is missing or invalid', 
        isApiKeyError: true,
        details: 'Please add a valid GROQ API key to the .env file in the blog folder'
      }, { status: 400 });
    }
    
    // Ensure Python dependencies are installed
    console.log('Ensuring Python dependencies');
    await ensurePythonDependencies(tempDir);
    
    // Create a modified version of blog.py for API use
    const apiBlogScriptPath = path.join(tempDir, 'api_blog.py');
    console.log('Creating modified script for API use');
    
    // Modify the script to read the topic from a file and output in JSON
    const modifiedScript = `
import sys
import json
from blog import BlogGenerator
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

async def main():
    # Get API key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print(json.dumps({"error": "GROQ API key not found"}))
        return
    
    # Read topic from file
    topic_file = sys.argv[1]
    with open(topic_file, 'r') as f:
        topic = f.read().strip()
    
    # Generate blog
    generator = BlogGenerator(api_key)
    try:
        blog_post = await generator.generate_blog(
            topic=topic,
            style="technical",  # Default values
            tone="informative",
            length="medium"
        )
        
        # Print the blog post as JSON
        print(json.dumps(blog_post))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    asyncio.run(main())
`;
    
    fs.writeFileSync(apiBlogScriptPath, modifiedScript);
    
    // Execute the blog generator script
    console.log('Executing the blog generator script');
    const output = await runBlogGenerator(apiBlogScriptPath, topicFile, tempDir);
    console.log('Blog generator script execution completed');
    
    // Parse the JSON output from the script
    let blogContent;
    try {
      console.log('Parsing JSON output');
      // Find the JSON part in the output
      console.log('Raw output:', output);
      const jsonMatch = output.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        console.log('Matched JSON string:', jsonStr.substring(0, 100) + '...');
        blogContent = JSON.parse(jsonStr);
        console.log('Successfully parsed JSON');
      } else {
        console.error('No JSON pattern found in output');
        throw new Error('Could not parse JSON from output');
      }
      
      // Check if the parsed content contains an error
      if (blogContent && blogContent.error) {
        console.error('Error in blog content:', blogContent.error);
        return NextResponse.json({
          message: `Error from Python script: ${blogContent.error}`,
          error: blogContent.error
        }, { status: 500 });
      }
    } catch (parseError: unknown) {
      console.error('Error parsing blog output:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      return NextResponse.json({ 
        message: 'Failed to parse blog output', 
        error: errorMessage 
      }, { status: 500 });
    }
    
    // Clean up temporary files
    try {
      fs.unlinkSync(topicFile);
      fs.unlinkSync(apiBlogScriptPath);
      console.log('Temporary files cleaned up');
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }
    
    console.log('Returning blog content to client');
    return NextResponse.json({ blogContent });
  } catch (error: any) {
    console.error('Blog Generator API error:', error);
    
    // Check for specific error types
    const errorMessage = error.message || 'An unexpected error occurred';
    const isPythonError = errorMessage.includes('Python') || 
                         errorMessage.includes('pip') || 
                         errorMessage.includes('module');
    
    const isApiKeyError = errorMessage.includes('API key') || 
                         errorMessage.includes('GROQ');
    
    return NextResponse.json({
      message: errorMessage,
      isPythonError,
      isApiKeyError,
      setupRequired: isPythonError,
      stack: error.stack
    }, { status: 500 });
  }
}