import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

// Use a function to get the UUID v4 implementation
function getUuid() {
  // Using dynamic import to avoid ESM/CJS issues
  const { v4 } = require('uuid');
  return v4;
}

const execPromise = promisify(exec);

// Use the specific Python executable path where dependencies are installed
const PYTHON_PATH = process.platform === 'win32'
  ? 'python'
  : 'python3';

// Increase process timeout to handle large documents
const PROCESS_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

// Custom function to execute Python script with better logging and error handling
async function executePythonScript(scriptPath: string, filePath: string, options: any = {}): Promise<{stdout: string, stderr: string}> {
  return new Promise((resolve, reject) => {
    console.log(`Executing Python script: ${scriptPath} with file: ${filePath}`);
    
    const args = [scriptPath, filePath];
    
    // Add additional arguments if provided
    if (options.summaryLength) {
      args.push('--summary_length', options.summaryLength);
    }
    
    if (options.focusAreas) {
      args.push('--focus_areas', options.focusAreas);
    }
    
    if (options.maxPages) {
      args.push('--max_pages', options.maxPages.toString());
    }
    
    console.log(`Command: ${PYTHON_PATH} ${args.join(' ')}`);
    
    const startTime = Date.now();
    console.log(`Starting Python process at: ${new Date().toISOString()}`);
    
    // Use spawn instead of exec for better handling of large outputs
    // For Windows, properly handle paths with spaces
    const processArgs = process.platform === 'win32' ? 
      args.map(arg => arg.includes(' ') && !arg.startsWith('"') ? `"${arg}"` : arg) : 
      args;
    
    const childProcess = spawn(PYTHON_PATH, processArgs, {
      timeout: PROCESS_TIMEOUT,
      shell: process.platform === 'win32', // Use shell on Windows to handle quoted arguments
      windowsHide: true, // Hide the window to prevent console flashing on Windows
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1'
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    // For capturing just the summary segment
    let summaryContent = '';
    let insideSummaryBlock = false;
    
    // Handle standard output
    childProcess.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      
      // Check for summary markers to extract just the important content
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.includes('###SUMMARY_START###')) {
          insideSummaryBlock = true;
          console.log('Found summary start marker');
          continue; // Skip the marker line itself
        }
        else if (line.includes('###SUMMARY_END###')) {
          insideSummaryBlock = false;
          console.log('Found summary end marker');
          continue; // Skip the marker line itself
        }
        
        // If we're inside the summary section, collect it separately
        if (insideSummaryBlock) {
          summaryContent += line + '\n';
        }
      }
    });
    
    // Handle standard error for debugging output
    childProcess.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      
      // Log error chunks that might contain important information
      if (chunk.includes('ERROR:') || chunk.includes('Exception:')) {
        console.error(`Python error: ${chunk.trim()}`);
      }
    });
    
    // Handle process completion
    childProcess.on('close', (code: number | null) => {
      const duration = (Date.now() - startTime) / 1000;
      // console.log(`Python process completed with code ${code} in ${duration.toFixed(2)}s`);
      
      if (code !== 0) {
        console.error(`Process failed with code ${code}`);
        console.error(`Last stderr lines: ${stderr.split('\n').slice(-5).join('\n')}`);
        reject(new Error(`Process exited with code ${code}`));
      } else {
        // If we extracted summary content specifically, prepend it to stdout
        // so the summary extraction functions will find it first
        if (summaryContent.trim().length > 0) {
          // Add markers to make sure the clean functions can find it
          const enhancedOutput = `###SUMMARY_START###\n${summaryContent}\n###SUMMARY_END###\n${stdout}`;
          resolve({ stdout: enhancedOutput, stderr });
        } else {
          resolve({ stdout, stderr });
        }
      }
    });
    
    // Handle process errors
    childProcess.on('error', (err: Error) => {
      console.error(`Failed to start Python process: ${err}`);
      reject(err);
    });
  });
}

// Improved function to extract and clean summary text from script output
function cleanSummaryText(text: string): string {
  // First try to extract summary between markers
  const markerRegex = /###SUMMARY_START###\s*([\s\S]*?)\s*###SUMMARY_END###/;
  const markerMatch = text.match(markerRegex);
  
  if (markerMatch && markerMatch[1] && markerMatch[1].trim().length > 50) {
    return formatSummaryText(markerMatch[1]);
  }
  
  // If no markers or too short content between markers, try another approach
  // Look for a clear summary section after certain patterns
  const summaryIndicators = [
    "SUMMARY:", 
    "Document Summary:", 
    "DETAILED SUMMARY:",
    "Here's a summary of the document:",
    "Summary of the document:"
  ];
  
  let foundSummary = "";
  
  for (const indicator of summaryIndicators) {
    const indicatorIndex = text.indexOf(indicator);
    if (indicatorIndex !== -1) {
      // Extract everything after the indicator
      const afterIndicator = text.substring(indicatorIndex + indicator.length).trim();
      // Only use it if it's substantial (over 100 chars)
      if (afterIndicator.length > 100) {
        foundSummary = afterIndicator;
        break;
      }
    }
  }
  
  if (foundSummary) {
    return formatSummaryText(foundSummary);
  }
  
  // If we still don't have a good summary, use the cleanRawOutput function to get the most usable content
  const cleanedOutput = cleanRawOutput(text);
  if (cleanedOutput && cleanedOutput.length > 100) {
    return formatSummaryText(cleanedOutput);
  }
  
  // Last resort, just remove obvious log lines and return what's left
  return formatSummaryText(text);
}

// Enhanced function to remove technical output and keep content
function cleanRawOutput(text: string): string {
  if (!text) return "";
  
  // Split by lines to process them
  const lines = text.split('\n');
  
  // Filter out technical lines
  const contentLines = lines.filter(line => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) return false;
    
    // Skip Python errors and debug messages
    if (trimmedLine.startsWith("Traceback (most recent call last)")) return false;
    if (/^File ".*", line \d+, in/.test(trimmedLine)) return false;
    if (/^(DEBUG|INFO|WARNING|ERROR):/.test(trimmedLine)) return false;
    
    // Skip progress messages
    if (/^Extracting text from page/.test(trimmedLine)) return false;
    if (/^Processing pages/.test(trimmedLine)) return false;
    if (/^Processed \d+ pages/.test(trimmedLine)) return false;
    if (/^PDF text extraction completed/.test(trimmedLine)) return false;
    if (/^Extracted \d+ characters/.test(trimmedLine)) return false;
    if (/^Using (parallel|sequential) processing/.test(trimmedLine)) return false;
    
    // Skip timestamp messages
    if (/^\[\d{4}-\d{2}-\d{2}/.test(trimmedLine)) return false;
    
    // Skip technical messages
    if (/^Generated summary with \d+ characters/.test(trimmedLine)) return false;
    if (/^Total processing time:/.test(trimmedLine)) return false;
    if (/^Summary generation completed/.test(trimmedLine)) return false;
    if (/^Generating summary/.test(trimmedLine)) return false;
    if (/^Document chunking completed/.test(trimmedLine)) return false;
    if (/^PDF loading completed/.test(trimmedLine)) return false;
    if (/^Vector store creation completed/.test(trimmedLine)) return false;
    if (/^Initializing Gemini model/.test(trimmedLine)) return false;
    if (/^Trying model:/.test(trimmedLine)) return false;
    if (/^Successfully initialized/.test(trimmedLine)) return false;
    if (/^Split content into/.test(trimmedLine)) return false;
    if (/^Document is large/.test(trimmedLine)) return false;
    if (/^Using timeout of/.test(trimmedLine)) return false;
    
    // Skip markers
    if (trimmedLine === "###SUMMARY_START###" || trimmedLine === "###SUMMARY_END###") return false;
    
    return true;
  });
  
  // Join the remaining lines
  return contentLines.join('\n').trim();
}

// Improved function to format the summary text for better readability
function formatSummaryText(text: string): string {
  if (!text) return "";
  
  // Remove markers if present
  text = text.replace(/###SUMMARY_START###/g, "")
             .replace(/###SUMMARY_END###/g, "");
  
  // Normalize bullet points to use consistent style
  text = text.replace(/^\s*[•\-\*]\s+/gm, "• ");
  
  // Remove any remaining debug or technical lines
  text = text.replace(/^(Using|Generated|Generating|Processing|Initializing|Successfully|Document|Created|Started).*$/gm, "");
  
  // Handle section headers more carefully
  // First, ensure they have proper capitalization and format
  const sectionHeaderRegex = /^([A-Z][A-Z\s]+):(?:\s*)(.*)$/gm;
  text = text.replace(sectionHeaderRegex, (match, header, content) => {
    // If content follows the header on the same line, separate it
    if (content && content.trim()) {
      return `\n${header}:\n\n${content.trim()}`;
    }
    return `\n${header}:\n`;
  });
  
  // Normalize section headers for better formatting
  text = text.replace(/^([A-Z][A-Z\s]+):\s*$/gm, "\n$1:\n");
  
  // Remove excessive whitespace and ensure good paragraph breaks
  text = text.replace(/\n{3,}/g, "\n\n")        // Replace 3+ consecutive newlines with just 2
             .replace(/\s+$/gm, "")             // Remove trailing whitespace from each line
             .replace(/^\s+/gm, "");            // Remove leading whitespace from each line
  
  // Ensure proper spacing around bullet points
  text = text.replace(/(?<!\n)• /g, "\n• ");
  
  // Ensure section headers have proper spacing
  text = text.replace(/([A-Z][A-Z\s]+):\n\n/g, "$1:\n");
  
  // Ensure bullet points in the same list stay together
  text = text.replace(/• (.*)\n\n• /g, "• $1\n• ");
  
  // Add breaks between paragraphs for better readability
  const sentenceEndingRegex = /\.(?=\s+[A-Z])/g;
  text = text.replace(sentenceEndingRegex, ".\n\n");
  
  // Final cleanup of multiple newlines
  text = text.replace(/\n{3,}/g, "\n\n");
  
  return text.trim();
}

// Function to detect if output only contains debug/technical messages
function isOutputOnlyDebugMessages(text: string): boolean {
  // Remove all debug, info, and error messages
  const cleaned = text.replace(/^(DEBUG|INFO|WARNING|ERROR):.*\n/gm, '')
                     .replace(/^\[.*?\].*\n/gm, '')
                     .replace(/^Processed.*pages.*\n/gm, '')
                     .replace(/^Extracting text.*\n/gm, '')
                     .replace(/^(Using|Generated|Total|Summary|PDF|Vector|Processing|Document|Created|Initialized|Trying|Successfully|Split).*\n/gm, '')
                     .trim();
  
  // If there's almost nothing left, it was probably all debug messages
  return cleaned.length < 100;
}

// Check if API key exists
export async function GET(request: NextRequest) {
  try {
    // Path to the .env file in the DocSummarizer folder
    const envFilePath = path.join(process.cwd(), 'DocSummarizer', 'DocSummarizer', '.env');
    
    // Check if .env file exists
    const envFileExists = fs.existsSync(envFilePath);
    
    if (envFileExists) {
      // Read the .env file
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      
      // Check if GOOGLE_API_KEY is in the file
      const apiKeyExists = envContent.includes('GOOGLE_API_KEY');
      
      return NextResponse.json({ exists: apiKeyExists });
    } else {
      return NextResponse.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking API key:', error);
    return NextResponse.json({ exists: false });
  }
}

export async function POST(request: NextRequest) {
  let tempDir = '';
  
  try {
    console.log("Document summarizer started");
    
    // Get UUID v4 function when needed
    const uuidv4 = getUuid();
    // Create temp directory for file processing
    tempDir = path.join(os.tmpdir(), 'docsummarizer-' + uuidv4());
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Get form data with the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Parse summary options with fallbacks
    const summaryLength = formData.get('summaryLength') as string || 'medium';
    const focusAreas = formData.get('focusAreas') as string || '';
    const maxPages = formData.get('maxPages') ? parseInt(formData.get('maxPages') as string) : undefined;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }
    
    // Check file size (limit to 20MB)
    const fileSizeMB = file.size / (1024 * 1024);
    console.log(`Processing file: ${file.name}, Size: ${fileSizeMB.toFixed(2)}MB`);
    
    if (fileSizeMB > 20) {
      return NextResponse.json({ 
        error: 'File size exceeds 20MB limit. Please upload a smaller file.' 
      }, { status: 400 });
    }
    
    // Save file to temp directory
    const filePath = path.join(tempDir, file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, fileBuffer);
    
    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'DocSummarizer', 'DocSummarizer', 'pdf_summarizer.py');
    
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`Document summarizer script not found at path: ${scriptPath}`);
      return NextResponse.json({ error: 'Document summarizer script not found' }, { status: 500 });
    }
    
    // Map summary length from UI to script options
    let summaryLengthFlag = '';
    switch (summaryLength) {
      case 'short':
        summaryLengthFlag = 'brief';
        break;
      case 'medium':
        summaryLengthFlag = 'standard';
        break;
      case 'detailed':
        summaryLengthFlag = 'comprehensive';
        break;
      default:
        summaryLengthFlag = 'standard';
    }
    
    // Execute Python script with our custom function
    try {
      console.log(`Starting PDF summarization for ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
      console.log(`Options: length=${summaryLengthFlag}, focus=${focusAreas || 'none'}, maxPages=${maxPages || 'all'}`);
      
      // Execute with more robust handling
      const { stdout, stderr } = await executePythonScript(
        scriptPath, 
        filePath, 
        {
          summaryLength: summaryLengthFlag,
          focusAreas: focusAreas,
          maxPages: maxPages
        }
      );
      
      // Check for errors in stderr or stdout
      if (stderr && (
        stderr.includes('Error:') || 
        stderr.includes('Exception:') || 
        stderr.includes('Traceback') ||
        stderr.includes('ModuleNotFoundError')
      )) {
        console.error("Script executed with errors:");
        
        // Extract detailed error message
        let detailedError = 'Failed to process document. See logs for details.';
        
        if (stderr.includes('GOOGLE_API_KEY not found')) {
          detailedError = 'Google API Key is missing. Please add a valid API key to your .env file.';
        }
        else if (stderr.includes('GOOGLE_API_KEY') || stderr.includes('API key not valid')) {
          detailedError = 'Google API Key is missing or invalid. Please add a valid API key to your .env file.';
        }
        else if (stderr.includes('quota') || stderr.includes('rate limit')) {
          detailedError = 'Google API quota or rate limit exceeded. Please try again later.';
        }
        else if (stderr.includes('timeout') || stderr.toLowerCase().includes('timed out')) {
          detailedError = 'The summarization process timed out. Please try a smaller document or try again later.';
        }
        else if (stderr.includes('Error:')) {
          const errorLine = stderr.split('Error:')[1]?.split('\n')[0]?.trim();
          if (errorLine) {
            detailedError = errorLine;
          }
        }
        
        throw new Error(detailedError);
      }
      
      // Clean and format the summary
      let cleanedSummary = '';
      try {
        cleanedSummary = cleanSummaryText(stdout);
        console.log(`Successfully extracted and formatted summary (${cleanedSummary.length} chars)`);
        
        // Check if the cleaned summary is too short
        if (cleanedSummary.length < 50) {
          console.warn('Summary output is too short:', cleanedSummary);
          // Try again with less aggressive cleaning
          cleanedSummary = cleanRawOutput(stdout);
          if (cleanedSummary.length < 50) {
            throw new Error('The generated summary is too short or empty. The document might not contain enough text content to summarize.');
          }
        }
        
      } catch (cleaningError) {
        console.error('Error formatting summary:', cleaningError);
        // Check if we still have some output we can return
        if (stdout.length > 100) {
          // Use raw output with basic cleanup
          cleanedSummary = stdout.replace(/\n{3,}/g, '\n\n').trim();
          console.log('Using minimally processed output for summary');
        } else {
          throw new Error('Could not extract a meaningful summary from the document.');
        }
      }
      
      return NextResponse.json({ summary: cleanedSummary });
      
    } catch (error: any) {
      console.error("Error processing document:", error);
      
      // Get error message
      let errorMessage = error.message || 'Failed to process document';
      
      // Check for specific error patterns
      if (errorMessage.includes('EPERM') || errorMessage.includes('permission')) {
        errorMessage = 'Permission error: cannot access the document or Python executable.';
      }
      
      if (errorMessage.includes('ENOENT') && errorMessage.includes('python')) {
        errorMessage = 'Python is not properly installed or accessible from this application.';
      } else if (errorMessage.includes('ENOENT')) {
        errorMessage = 'Required file not found. Please check application setup.';
      }
      
      if (errorMessage.includes('timeout')) {
        errorMessage = 'The process timed out. The document may be too large or complex.';
      }
      
      if (errorMessage.includes('ModuleNotFoundError')) {
        const moduleMatch = errorMessage.match(/No module named '([^']+)'/);
        const missingModule = moduleMatch ? moduleMatch[1] : 'unknown module';
        errorMessage = `Missing Python module: ${missingModule}. Please install it with pip (add --user flag if you're not using a virtual environment).`;
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    } finally {
      // Clean up temp directory
      if (tempDir && fs.existsSync(tempDir)) {
        try {
          // Delete temp files
          fs.rmSync(tempDir, { recursive: true, force: true });
          console.log(`Cleaned up temp directory: ${tempDir}`);
        } catch (cleanupError) {
          console.error("Error cleaning up temp directory:", cleanupError);
        }
      }
    }
  } catch (error: any) {
    console.error("Document summarizer request error:", error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
