import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function GET() {
  try {
    console.log("API key validation: Request received");
    
    // Path to the blog directory
    const blogDir = path.join(process.cwd(), 'blog');
    const envFilePath = path.join(blogDir, '.env');
    
    // Check if .env file exists
    if (!fs.existsSync(envFilePath)) {
      console.log("API key validation: .env file not found");
      return NextResponse.json({ valid: false, error: '.env file not found' }, { status: 200 });
    }
    
    // Run the check_api_key.py script
    try {
      const scriptPath = path.join(blogDir, 'check_api_key.py');
      
      // Check if the script exists
      if (!fs.existsSync(scriptPath)) {
        console.log("API key validation: check_api_key.py script not found");
        return NextResponse.json({ valid: false, error: 'Validation script not found' }, { status: 200 });
      }
      
      // Run the script with a timeout
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      console.log(`Running: ${pythonCommand} ${scriptPath}`);
      
      const { stdout, stderr } = await execPromise(`${pythonCommand} ${scriptPath}`, {
        cwd: blogDir,
        timeout: 10000 // 10 second timeout
      });
      
      console.log("Script output:", stdout);
      
      if (stderr) {
        console.error("Script error:", stderr);
      }
      
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