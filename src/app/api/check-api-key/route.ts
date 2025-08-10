import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Helper function to run commands with proper path handling
function runCommand(command: string, args: string[] = [], options: any = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    // For Windows, quote the command if it contains spaces
    let quotedCommand = command;
    if (process.platform === 'win32' && command.includes(' ') && !command.startsWith('"')) {
      quotedCommand = `"${command}"`;
    }
    
    // Quote arguments that contain spaces for Windows
    const quotedArgs = args.map(arg => arg.includes(' ') ? `"${arg}"` : arg);
    
    const proc = spawn(quotedCommand, quotedArgs, {
      ...options,
      shell: true,
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      // Check if the output indicates success even if code is null or non-zero
      const isSuccess = stdout.includes('All checks passed!') || stdout.includes('Success:');
      
      if (code !== 0 && code !== null && !isSuccess) {
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

export async function GET() {
  try {
    console.log("API key validation: Request received");
    
    // Path to the blog directory and root .env file
    const blogDir = path.join(process.cwd(), 'blog');
    const rootEnvFilePath = path.join(process.cwd(), '.env');
    
    // Check if root .env file exists (prioritize root, fallback to local)
    let envFilePath = rootEnvFilePath;
    if (!fs.existsSync(rootEnvFilePath)) {
      // Fallback to local .env file for backward compatibility
      const localEnvFilePath = path.join(blogDir, '.env');
      if (!fs.existsSync(localEnvFilePath)) {
        console.log("API key validation: No .env file found in root or blog directory");
        return NextResponse.json({ 
          valid: false, 
          error: 'No .env file found. Please create a .env file in the root directory with your API keys.' 
        }, { status: 200 });
      }
      envFilePath = localEnvFilePath;
      console.log("API key validation: Using local blog .env file");
    } else {
      console.log("API key validation: Using root .env file");
    }
    
    // Run the check_api_key.py script
    try {
      const scriptPath = path.join(blogDir, 'check_api_key.py');
      
      // Check if the script exists
      if (!fs.existsSync(scriptPath)) {
        console.log("API key validation: check_api_key.py script not found");
        return NextResponse.json({ valid: false, error: 'Validation script not found' }, { status: 200 });
      }
      
      // Run the script with a timeout using the blog's virtual environment
      const pythonCommand = process.platform === 'win32' ? 
        path.join(blogDir, 'venv', 'Scripts', 'python.exe') : 
        path.join(blogDir, 'venv', 'bin', 'python');
        
      console.log(`Running: ${pythonCommand} "${scriptPath}"`);
      
      const stdout = await runCommand(pythonCommand, [scriptPath], {
        cwd: blogDir,
        timeout: 10000 // 10 second timeout
      });
      
      console.log("Script output:", stdout);
      
      // Check if the script indicated the key is valid
      const isValid = stdout.includes("All checks passed") || 
                      stdout.includes("Success! API key is valid");
      
      return NextResponse.json({ 
        valid: isValid,
        details: isValid ? 'API key is valid' : 'API key validation failed' 
      }, { status: 200 });
      
    } catch (execError: any) {
      console.error("Error executing script:", execError);
      return NextResponse.json({ 
        valid: false, 
        error: 'Error running validation script',
        details: execError.message
      }, { status: 200 });
    }
    
  } catch (error) {
    console.error("API key validation error:", error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Unexpected error during validation'
    }, { status: 500 });
  }
} 