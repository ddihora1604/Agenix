import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';

// Cache script path to avoid repeated file existence checks
let cachedScriptPath: string | null = null;

// Define common Python dependencies that might be missing
const KNOWN_DEPENDENCIES: Record<string, string> = {
  'langchain': 'langchain',
  'langchain_core': 'langchain-core',
  'langchain_community': 'langchain-community',
  'dotenv': 'python-dotenv',
  'google': 'google-api-python-client',
  'google_api_core': 'google-api-core',
  'langchain_google_genai': 'langchain-google-genai'
};

// Define the return type for executeScript
type ScriptExecutionResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
};

// For script not found case
type ScriptNotFoundResult = {
  success: false;
  error: string;
  status: number;
};

/**
 * Execute the Python script with the given parameters
 */
async function executeScript(params: {
  topic: string;
  contextUrl?: string;
}): Promise<ScriptExecutionResult | ScriptNotFoundResult> {
  const { topic, contextUrl } = params;
  
  // Find the casestudy.py script
  let scriptPath: string | null = cachedScriptPath;
  if (!scriptPath) {
    const possiblePaths = [
      path.join(process.cwd(), 'CaseStudyAgent', 'CaseStudyAgent', 'casestudy.py'),
      path.join(process.cwd(), 'CaseStudyAgent', 'casestudy.py')
    ];
    
    for (const path of possiblePaths) {
      try {
        await fs.access(path);
        scriptPath = path;
        cachedScriptPath = path; // Cache for future requests
        console.log(`Case Study Agent script found and cached at: ${scriptPath}`);
        break;
      } catch (error) {
        console.error(`Case Study Agent script not found at: ${path}`);
      }
    }
  }
  
  if (!scriptPath) {
    console.error('No Case Study Agent script found in any expected location');
    return {
      success: false,
      error: 'Case Study Agent script not found. Please check the installation.',
      status: 500
    };
  }
  
  // Build the command arguments
  const args = [
    scriptPath,
    topic
  ];
  
  // Add context URL if provided
  if (contextUrl) {
    args.push('--context', contextUrl);
  }
  
  let stdout = '';
  let stderr = '';
  let timedOut = false;
  
  console.log(`Executing command: python ${args.join(' ')}`);
  console.time('python-execution');
  
  // Determine which Python command to use
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
  
  // Execute the Python script
  const pythonProcess = spawn(pythonCommand, args);
  
  // Set up a timeout (180 seconds - increased for LLM processing and potential rate limiting)
  const timeout = setTimeout(() => {
    console.error('Python process timed out after 180 seconds');
    timedOut = true;
    pythonProcess.kill();
  }, 180000);
  
  // Collect output
  pythonProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    stdout += chunk;
  });
  
  pythonProcess.stderr.on('data', (data) => {
    const chunk = data.toString();
    console.error(`Python stderr: ${chunk}`);
    stderr += chunk;
  });
  
  // Wait for the process to finish
  const exitCode = await new Promise<number>((resolve) => {
    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);
      resolve(code ?? 1);
    });
  });
  
  console.timeEnd('python-execution');
  console.log(`Python process exited with code ${exitCode}`);
  
  // Return execution result
  return {
    success: exitCode === 0 && !timedOut,
    stdout,
    stderr,
    exitCode,
    timedOut
  };
}

// Define the return type for processOutput
type ProcessedOutput = {
  json: any;
  status: number;
};

/**
 * Process the output from the script execution
 */
function processOutput(result: ScriptExecutionResult): ProcessedOutput {
  const { success, stdout, stderr, exitCode, timedOut } = result;
  
  // Handle timeout case specifically
  if (timedOut) {
    return {
      json: {
        message: 'The operation timed out. This could be due to slow processing or missing AI model API keys.',
        isTimeout: true
      },
      status: 500
    };
  }
  
  // Check for rate limit errors from Google API (enhanced detection)
  if (
    stderr.includes('You exceeded your current quota') || 
    stderr.includes('ResourceExhausted: 429') ||
    stderr.includes('exceeded your current quota') ||
    stderr.includes('API rate limit') ||
    stderr.includes('retry_delay')
  ) {
    return {
      json: {
        message: 'Google API rate limit exceeded. Please try again later or check your API usage quotas.',
        isApiKeyError: true,
        isRateLimit: true,
        details: 'Your Google AI API quota has been exceeded. This may be a temporary issue or you may need to upgrade your API plan.'
      },
      status: 429
    };
  }
  
  // Check for missing dependencies
  if (stderr.includes('ModuleNotFoundError') || stderr.includes('No module named')) {
    // Try to extract the actual missing module name
    let missingModule = 'required module';
    let packageToInstall = '';
    
    if (stderr.includes('No module named')) {
      // Extract the module name from the error message
      const matches = stderr.match(/No module named ['"]([^'"]+)['"]/);
      if (matches && matches.length > 1) {
        missingModule = matches[1];
        
        // Map to the correct pip package if it's a known dependency
        const baseModule = missingModule.split('.')[0]; // Get the base module name (before any dots)
        packageToInstall = KNOWN_DEPENDENCIES[missingModule] || KNOWN_DEPENDENCIES[baseModule] || missingModule;
      }
    }
    
    console.error(`Missing Python dependency: ${missingModule} (package: ${packageToInstall})`);
    
    return {
      json: {
        message: `Missing Python dependency: ${packageToInstall || missingModule}. Please run: pip install -r CaseStudyAgent/requirements.txt`,
        isPythonError: true,
        setupRequired: true,
        missingModule: packageToInstall || missingModule
      },
      status: 500
    };
  }
  
  // Check for API key errors
  if (stderr.includes('GOOGLE_API_KEY environment variable not set') || 
      stderr.includes('API key not available') ||
      stderr.includes('API key invalid') ||
      stderr.includes('API key not found') ||
      stderr.includes('api_key')) {
    return {
      json: { 
        message: 'API key is missing or invalid', 
        isApiKeyError: true,
        details: stderr
      },
      status: 500
    };
  }
  
  // Additional check for successful execution despite non-zero exit code
  // This can happen when there are warnings but the case study was still generated
  const hasOutput = stdout.includes('OUTLINE:') || stdout.includes('CASE STUDY:');
  
  if (!success && !hasOutput) {
    return {
      json: { message: `Process exited with code ${exitCode}: ${stderr}` },
      status: 500
    };
  }
  
  // Parse the results from stdout
  const results = {
    outline: '',
    caseStudy: '',
    warnings: [] as string[]
  };
  
  // Add rate limit warning if detected in stderr but process still completed
  if (stderr.includes('ResourceExhausted') || stderr.includes('exceeded your current quota')) {
    results.warnings.push('Rate limiting was encountered during generation. The result may be incomplete or less optimal.');
  }
  
  // Check if stdout is empty
  if (!stdout.trim()) {
    return {
      json: { message: 'The script executed but produced no output. Check the script implementation.' },
      status: 500
    };
  }
  
  // Extract the outline section
  const outlineMatch = stdout.match(/OUTLINE:\n-{80}\n([\s\S]*?)(?=\n-{80}|$)/);
  if (outlineMatch && outlineMatch[1]) {
    results.outline = outlineMatch[1].trim();
  }
  
  // Extract the case study section
  const caseStudyMatch = stdout.match(/CASE STUDY:\n-{80}\n([\s\S]*?)(?=\n-{80}|$)/);
  if (caseStudyMatch && caseStudyMatch[1]) {
    results.caseStudy = caseStudyMatch[1].trim();
  }
  
  // If we couldn't extract any structured content, just return the raw output
  if (!results.outline && !results.caseStudy) {
    results.caseStudy = stdout.trim();
  }
  
  return {
    json: results,
    status: 200
  };
}

export async function POST(request: Request) {
  try {
    console.time('case-study-agent-request');
    // Read the request body once and extract parameters
    const requestData = await request.json();
    const { topic, contextUrl } = requestData;
    
    // Perform input validation
    if (!topic) {
      return NextResponse.json(
        { message: 'Topic is required for case study generation' },
        { status: 400 }
      );
    }
    
    // Execute the script
    const result = await executeScript({
      topic,
      contextUrl
    });
    
    // Check if the script was not found
    if ('error' in result) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status }
      );
    }
    
    // Process the output
    const { json, status } = processOutput(result);
    
    console.timeEnd('case-study-agent-request');
    return NextResponse.json(json, { status });
    
  } catch (error) {
    console.error('Error processing case study request:', error);
    return NextResponse.json(
      { message: (error as Error).message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 