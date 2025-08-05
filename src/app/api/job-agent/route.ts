import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';

// Cache script path to avoid repeated file existence checks
let cachedScriptPath: string | null = null;
let cachedLiteScriptPath: string | null = null;

// Define common Python dependencies that might be missing
const KNOWN_DEPENDENCIES: Record<string, string> = {
  'faiss': 'faiss-cpu',
  'faiss.swigfaiss_avx2': 'faiss-cpu',
  'langchain': 'langchain',
  'langchain_core': 'langchain-core',
  'langchain_text_splitters': 'langchain-text-splitters',
  'langchain_community': 'langchain-community',
  'PyPDF2': 'PyPDF2',
  'bs4': 'beautifulsoup4',
  'dotenv': 'python-dotenv'
};

// Flag to determine if we should try the lite version based on past failures
let shouldTryLiteVersion = false;

// Define the return type for executeScript
type ScriptExecutionResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  useLiteVersion: boolean;
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
  jobInput: string;
  candidateName?: string;
  candidateExperience?: string;
  interviewDate?: string;
  taskType: string;
  useLiteVersion: boolean;
}): Promise<ScriptExecutionResult | ScriptNotFoundResult> {
  const { jobInput, candidateName, candidateExperience, interviewDate, taskType, useLiteVersion } = params;
  
  // Choose which script to use - full or lite version
  let scriptPath: string | null = null;
  
  if (useLiteVersion) {
    // Use the cached lite script path or find it
    scriptPath = cachedLiteScriptPath;
    if (!scriptPath) {
      const possibleLitePaths = [
        path.join(process.cwd(), 'JobAgent', 'JobAgent_lite.py'),
        path.join(process.cwd(), 'JobAgent', 'JobAgent', 'JobAgent_lite.py')
      ];
      
      for (const path of possibleLitePaths) {
        try {
          await fs.access(path);
          scriptPath = path;
          cachedLiteScriptPath = path; // Cache for future requests
          console.log(`Lite script found and cached at: ${scriptPath}`);
          break;
        } catch (error) {
          console.error(`Lite script not found at: ${path}`);
        }
      }
    }
  } else {
    // Use the cached script path or find it
    scriptPath = cachedScriptPath;
    if (!scriptPath) {
      const possiblePaths = [
        path.join(process.cwd(), 'JobAgent', 'JobAgent', 'JobAgent.py'),
        path.join(process.cwd(), 'JobAgent', 'JobAgent.py')
      ];
      
      for (const path of possiblePaths) {
        try {
          await fs.access(path);
          scriptPath = path;
          cachedScriptPath = path; // Cache for future requests
          console.log(`Script found and cached at: ${scriptPath}`);
          break;
        } catch (error) {
          console.error(`Script not found at: ${path}`);
        }
      }
    }
  }
  
  if (!scriptPath) {
    console.error('No JobAgent script found in any expected location');
    return {
      success: false,
      error: 'JobAgent script not found. Please check the installation.',
      status: 500
    };
  }
  
  // Build the command arguments
  const args = [
    scriptPath,
    jobInput,
    '--task', taskType
  ];
  
  // Add optional arguments if they exist
  if (candidateName) {
    args.push('--candidate-name', candidateName);
  }
  
  if (candidateExperience) {
    args.push('--candidate-exp', candidateExperience);
  }
  
  if (interviewDate) {
    args.push('--interview-date', interviewDate);
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
  
  // Set up a timeout (90 seconds - increased for LLM processing)
  const timeout = setTimeout(() => {
    console.error('Python process timed out after 90 seconds');
    timedOut = true;
    pythonProcess.kill();
  }, 90000);
  
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
    timedOut,
    useLiteVersion
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
function processOutput(result: ScriptExecutionResult, taskType: string): ProcessedOutput {
  const { success, stdout, stderr, exitCode, timedOut, useLiteVersion } = result;
  
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
  
  // Special case: If faiss successfully loaded despite AVX2 support being missing, don't consider it an error
  // This is a common warning that doesn't actually prevent functionality
  const avx2Warning = stderr.includes("Could not load library with AVX2 support") && 
                      stderr.includes("No module named 'faiss.swigfaiss_avx2'");
  const faissSuccess = stderr.includes("Successfully loaded faiss");
  
  // If we have the AVX2 warning but faiss loaded successfully, we should not treat this as an error
  const ignorableFaissWarning = avx2Warning && faissSuccess;
  
  // Check for missing dependencies, with special handling for faiss
  if ((stderr.includes('ModuleNotFoundError') || stderr.includes('No module named')) && !ignorableFaissWarning) {
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
    
    // Special handling for faiss which requires specific installation instructions
    if (missingModule.includes('faiss') && !ignorableFaissWarning) {
      return {
        json: {
          message: `Missing Python dependency: faiss-cpu. This is a machine learning dependency for vector operations.`,
          isPythonError: true,
          setupRequired: true,
          missingModule: 'faiss-cpu',
          installInstructions: 'pip install faiss-cpu langchain langchain-core langchain-community (Note: Add --user flag if you\'re not using a virtual environment)'
        },
        status: 500
      };
    }
    
    return {
      json: {
        message: `Missing Python dependency: ${packageToInstall || missingModule}. Please run: pip install -r JobAgent/requirements.txt (Note: Add --user flag if you're not using a virtual environment)`,
        isPythonError: true,
        setupRequired: true,
        missingModule: packageToInstall || missingModule
      },
      status: 500
    };
  }
  
  // Check for rate limit errors from Google API
  if (stderr.includes('You exceeded your current quota') || 
      stderr.includes('ResourceExhausted: 429')) {
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
  
  // Check for API key errors
  if (stderr.includes('GOOGLE_API_KEY environment variable not set') || 
      stderr.includes('API key not available') ||
      stderr.includes('API key invalid') ||
      stderr.includes('API key not found') ||
      stderr.includes('OPENAI_API_KEY') ||
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
  
  // Override success for special case with ignorable warnings
  if (ignorableFaissWarning && exitCode === 0) {
    console.log("Ignoring faiss AVX2 warning as faiss loaded successfully");
    result.success = true;
  }
  
  if (!success) {
    return {
      json: { message: `Process exited with code ${exitCode}: ${stderr}` },
      status: 500
    };
  }
  
  // Parse the results from stdout
  const results = {
    summary: '',
    coldEmail: '',
    interviewPrep: '',
    warnings: [] as string[]
  };
  
  // Add warning information if we have ignorable warnings
  if (ignorableFaissWarning) {
    results.warnings.push("Using standard faiss library without AVX2 optimization. This is normal but may be slightly slower.");
  }
  
  // Check if stdout is empty
  if (!stdout.trim()) {
    return {
      json: { message: 'The script executed but produced no output. Check the script implementation.' },
      status: 500
    };
  }
  
  // Extract the summary section
  const summaryMatch = stdout.match(/JOB DESCRIPTION SUMMARY\n={80}\n\n([\s\S]*?)(?=\n={80}|$)/);
  if (summaryMatch && summaryMatch[1]) {
    results.summary = summaryMatch[1].trim();
  }
  
  // Extract the cold email section
  const emailMatch = stdout.match(/COLD EMAIL\n={80}\n\n([\s\S]*?)(?=\n={80}|$)/);
  if (emailMatch && emailMatch[1]) {
    results.coldEmail = emailMatch[1].trim();
  }
  
  // Extract the interview prep section
  const prepMatch = stdout.match(/INTERVIEW PREPARATION GUIDE\n={80}\n\n([\s\S]*?)(?=\n={80}|$)/);
  if (prepMatch && prepMatch[1]) {
    results.interviewPrep = prepMatch[1].trim();
  }
  
  // If we couldn't extract any structured content, just return the raw output
  if (!results.summary && !results.coldEmail && !results.interviewPrep) {
    if (taskType === 'summary' || taskType === 'all') {
      results.summary = stdout.trim();
    } else if (taskType === 'cold_email') {
      results.coldEmail = stdout.trim();
    } else if (taskType === 'interview_prep') {
      results.interviewPrep = stdout.trim();
    }
  }
  
  // If we used the lite version, add a note to the results
  if (useLiteVersion) {
    const liteModeMessage = "[Note: Using simplified mode. For full AI analysis, please install all requirements: pip install -r JobAgent/requirements.txt (Add --user flag if you're not using a virtual environment)]";
    
    if (results.summary) {
      results.summary = `${liteModeMessage}\n\n${results.summary}`;
    }
    if (results.coldEmail) {
      results.coldEmail = `${liteModeMessage}\n\n${results.coldEmail}`;
    }
    if (results.interviewPrep) {
      results.interviewPrep = `${liteModeMessage}\n\n${results.interviewPrep}`;
    }
  }
  
  return {
    json: results,
    status: 200
  };
}

export async function POST(request: Request) {
  try {
    console.time('job-agent-request');
    // Read the request body once and extract parameters
    const requestData = await request.json();
    const { jobInput, candidateName, candidateExperience, interviewDate, taskType } = requestData;
    
    // Perform input validation
    if (!jobInput) {
      return NextResponse.json(
        { message: 'Job description URL or text is required' },
        { status: 400 }
      );
    }
    
    // Additional validation for cold_email task
    if ((taskType === 'cold_email' || taskType === 'all') && (!candidateName || !candidateExperience)) {
      return NextResponse.json(
        { message: 'Candidate name and experience are required for cold email generation' },
        { status: 400 }
      );
    }
    
    // First try with full version (if not already flagged to use lite version)
    let result = await executeScript({
      jobInput,
      candidateName,
      candidateExperience,
      interviewDate,
      taskType,
      useLiteVersion: shouldTryLiteVersion
    });
    
    // Check if the script was not found
    if ('error' in result) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status }
      );
    }
    
    // If there was an error with the full version and we haven't tried lite yet,
    // try again with the lite version
    if (!result.success && !result.useLiteVersion) {
      // Check stderr exists before using it
      const stderr = result.stderr || '';
      
      // Check for ignorable faiss AVX2 warning
      const avx2Warning = stderr.includes("Could not load library with AVX2 support") && 
                         stderr.includes("No module named 'faiss.swigfaiss_avx2'");
      const faissSuccess = stderr.includes("Successfully loaded faiss");
      const ignorableFaissWarning = avx2Warning && faissSuccess;
      
      // Don't fallback for ignorable faiss warning with successful exit code
      const shouldFallback = (result.timedOut || 
                           stderr.includes('ModuleNotFoundError') || 
                           stderr.includes('No module named') ||
                           stderr.includes('You exceeded your current quota') ||
                           stderr.includes('ResourceExhausted: 429')) && 
                           !(ignorableFaissWarning && result.exitCode === 0);
      
      if (shouldFallback) {
        console.log('Attempting to use lite version due to issues with full version');
        shouldTryLiteVersion = true; // Set global flag for future requests
        
        // Try again with lite version
        const liteResult = await executeScript({
          jobInput,
          candidateName,
          candidateExperience,
          interviewDate,
          taskType,
          useLiteVersion: true
        });
        
        // Check if the lite script was not found
        if ('error' in liteResult) {
          return NextResponse.json(
            { message: liteResult.error },
            { status: liteResult.status }
          );
        }
        
        // Use the lite version result
        result = liteResult;
      } else if (ignorableFaissWarning && result.exitCode === 0) {
        // For ignorable warnings with successful exit code, override success flag
        console.log("Continuing with full version despite faiss AVX2 warning as faiss loaded successfully");
        result.success = true;
      }
    }
    
    // Process the final output
    const processedResult = processOutput(result, taskType);
    console.timeEnd('job-agent-request');
    
    return NextResponse.json(processedResult.json, { status: processedResult.status });
    
  } catch (error) {
    console.error('Error processing Job Agent request:', error);
    return NextResponse.json(
      { message: `An error occurred: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}