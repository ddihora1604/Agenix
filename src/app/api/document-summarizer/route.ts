import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
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
const PYTHON_PATH = 'C:\\Users\\ddihora1604\\AppData\\Local\\Programs\\Python\\Python311\\python.exe';

/**
 * Cleans and formats the summary text for better display
 * 
 * @param text The raw summary text from the Python script
 * @returns Cleaned and formatted summary
 */
function cleanSummaryText(text: string): string {
  // First, try to extract the summary using the distinct markers
  const distinctMarkerRegex = /###SUMMARY_START###\s*([\s\S]+?)\s*###SUMMARY_END###/;
  const distinctMarkerMatch = text.match(distinctMarkerRegex);
  
  if (distinctMarkerMatch && distinctMarkerMatch[1]) {
    return formatSummaryText(distinctMarkerMatch[1].trim());
  }
  
  // If the markers aren't found, try older marker formats for backward compatibility
  const fullMarkerRegex = /DOCUMENT SUMMARY\s*\n=+\s*\n[\s\n]*([\s\S]+?)[\s\n]*\n=+\s*\nEND OF SUMMARY/;
  const fullMarkerMatch = text.match(fullMarkerRegex);
  
  if (fullMarkerMatch && fullMarkerMatch[1]) {
    return formatSummaryText(fullMarkerMatch[1].trim());
  }
  
  // Check if only the start marker exists (output might have been truncated)
  const startMarkerRegex = /###SUMMARY_START###\s*([\s\S]+)/;
  const startMarkerMatch = text.match(startMarkerRegex);
  
  if (startMarkerMatch && startMarkerMatch[1] && startMarkerMatch[1].length > 100) {
    return formatSummaryText(startMarkerMatch[1].trim());
  }
  
  // If no markers found, try to clean the raw output and use it
  const cleanedText = cleanRawOutput(text);
  
  // If the cleaned text seems reasonable, use it
  if (cleanedText.length > 200 && 
      !cleanedText.includes("pydantic") && 
      !cleanedText.includes("Error:") && 
      !cleanedText.includes("module")) {
    return formatSummaryText(cleanedText);
  }
  
  // Last resort: find the largest chunk of text that looks like a summary
  const paragraphs = text.split(/\n{2,}/);
  const candidateParagraphs = paragraphs
    .filter(p => 
      p.length > 100 && 
      !p.includes("Error") && 
      !p.includes("WARNING") && 
      !p.includes("DEBUG") &&
      !p.includes("pydantic") &&
      !p.includes("http") &&
      !p.trim().startsWith("="))
    .sort((a, b) => b.length - a.length);
    
  if (candidateParagraphs.length > 0) {
    return formatSummaryText(candidateParagraphs[0]);
  }
  
  // If we get here, we couldn't find a summary
  return formatSummaryText(text);
}

/**
 * Cleans raw output by removing logs and debug messages
 */
function cleanRawOutput(text: string): string {
  // First remove specific URLs and common technical messages
  let cleanText = text.replace(/For further information visit https:\/\/errors\.pydantic\.dev\/.*$/gm, '');
  cleanText = cleanText.replace(/The script will attempt to run with limited functionality\./g, '');
  cleanText = cleanText.replace(/LangChain integration not available\. Using direct Google Generative AI\.\.\.$/gm, '');
  cleanText = cleanText.replace(/Checking LangChain dependencies\.\.\.$/gm, '');
  cleanText = cleanText.replace(/Warning: Some LangChain dependencies.*$/gm, '');
  cleanText = cleanText.replace(/Warning: langchain-google-genai.*$/gm, '');
  cleanText = cleanText.replace(/={10,}/g, ''); // Remove divider lines with 10 or more = characters
  
  // Remove pydantic-related warnings and deprecation notices
  cleanText = cleanText.replace(/.*LangChainDeprecationWarning:.*$/gm, '');
  cleanText = cleanText.replace(/.*langchain_core\.pydantic_v1.*$/gm, '');
  cleanText = cleanText.replace(/.*pydantic\.v1.*$/gm, '');
  cleanText = cleanText.replace(/.*__modify_schema__.*$/gm, '');
  cleanText = cleanText.replace(/.*SecretStr.*$/gm, '');
  
  // Remove any Python logging messages or debug information
  cleanText = cleanText.replace(/^(INFO|WARNING|DEBUG|ERROR|CRITICAL):.*$/gm, '');
  
  // Remove any lines with technical details like "Extracted X pages"
  cleanText = cleanText.replace(/^(Successfully extracted|Split content into|Creating vector|Generating|Using).*$/gm, '');
  
  // Remove any lines that appear to be part of LangChain or dependency logs
  cleanText = cleanText.replace(/^(Using|Loading|Warning|Document sample|Checking|Processing|Summary length).*$/gm, '');
  
  // Remove any lines that are just command outputs
  cleanText = cleanText.replace(/^(Command completed|Focus areas).*$/gm, '');
  
  // Remove "Processing PDF" and similar messages
  cleanText = cleanText.replace(/^Processing PDF:.*$/gm, '');
  cleanText = cleanText.replace(/^Summary length:.*$/gm, '');
  cleanText = cleanText.replace(/^Focus areas:.*$/gm, '');
  
  // Clean up excess whitespace caused by removing lines
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
  
  return cleanText.trim();
}

/**
 * Formats the summary text for better display
 */
function formatSummaryText(text: string): string {
  // Clean up excessive whitespace and newlines
  let formattedText = text
    .replace(/\n{3,}/g, '\n\n')  // Replace 3+ consecutive newlines with just 2
    .replace(/\s+$/gm, '')       // Remove trailing whitespace from each line
    .trim();                      // Trim start/end whitespace
  
  // Fix common formatting issues
  formattedText = formattedText
    .replace(/•/g, '- ')         // Replace bullet points with dashes
    .replace(/(\d+)\)/g, '$1. ') // Replace 1) with 1. for consistent list formatting
    .replace(/\t/g, '  ');       // Replace tabs with spaces
  
  // Ensure proper paragraph formatting with double newlines
  formattedText = formattedText
    .split(/\n{1,}/)                              // Split by any number of newlines
    .filter(para => para.trim().length > 0)       // Remove empty paragraphs
    .join('\n\n');                                // Join with double newlines
  
  return formattedText;
}

// Add this function to check if stdout contains only debug/error information
function isOutputOnlyDebugMessages(text: string): boolean {
  // If the text contains these known debug messages but doesn't contain a substantial summary
  const containsDebugMessages = text.includes('Checking LangChain dependencies') || 
                                text.includes('pydantic') ||
                                text.includes('Warning:') ||
                                text.includes('langchain');
  
  // Check if there's likely a summary (substantial text after all debug messages)
  const debugLines = text.split('\n').filter(line => 
    line.includes('Checking') || 
    line.includes('Warning:') || 
    line.includes('pydantic') ||
    line.includes('langchain') ||
    line.includes('Processing PDF')
  );
  
  // If there are debug messages and they make up most of the content
  return containsDebugMessages && debugLines.length > 5 && text.length < 1000;
}

export async function POST(request: NextRequest) {
  let tempDir = '';
  
  try {
    // Get UUID v4 function when needed
    const uuidv4 = getUuid();
    // Create temp directory for file processing
    tempDir = path.join(os.tmpdir(), 'docsummarizer-' + uuidv4());
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Get form data with the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const summaryLength = formData.get('summaryLength') as string || 'medium';
    const focusAreas = formData.get('focusAreas') as string || '';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }
    
    // Save file to temp directory
    const filePath = path.join(tempDir, file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, fileBuffer);
    
    // Path to the Python script
    const scriptPath = path.join(process.cwd(), 'DocSummarizer', 'DocSummarizer', 'pdf_summarizer.py');
    
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ error: 'Document summarizer script not found' }, { status: 500 });
    }
    
    // Execute Python script
    let summaryLengthFlag = '';
    switch (summaryLength) {
      case 'short':
        summaryLengthFlag = '--summary_length brief';
        break;
      case 'medium':
        summaryLengthFlag = '--summary_length standard';
        break;
      case 'detailed':
        summaryLengthFlag = '--summary_length comprehensive';
        break;
      default:
        summaryLengthFlag = '--summary_length standard';
    }
    
    let focusAreasFlag = '';
    if (focusAreas) {
      focusAreasFlag = `--focus_areas "${focusAreas}"`;
    }
    
    const command = `"${PYTHON_PATH}" "${scriptPath}" "${filePath}" ${summaryLengthFlag} ${focusAreasFlag}`;
    
    try {
      // Use a different execute approach that properly separates stderr and stdout
      const { stdout, stderr } = await execPromise(command, {
        // Set maximum buffer size to avoid truncation
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        // Add a timeout to prevent hanging processes
        timeout: 300000, // 5 minutes timeout
        // Ensure environment variables are passed to child process
        env: { 
          ...process.env, 
          PYTHONIOENCODING: 'utf-8',
          // Add PYTHONUNBUFFERED to ensure Python doesn't buffer output
          PYTHONUNBUFFERED: '1'
        }
      });
      
      // First check stderr for errors, as the Python script writes errors to stderr
      if (stderr && stderr.includes('ERROR:')) {
        // Extract the specific error message from stderr
        const errorMatch = stderr.match(/ERROR:\s*(.+?)(?:\n|$)/);
        if (errorMatch && errorMatch[1]) {
          throw new Error(errorMatch[1].trim());
        }
        
        // If no specific error message found, check for standard error patterns
        if (stderr.includes('ModuleNotFoundError')) {
          const missingModule = stderr.match(/No module named '([^']+)'/);
          if (missingModule && missingModule[1]) {
            throw new Error(`Missing Python module: ${missingModule[1]}. Please install it with pip.`);
          }
        }
        
        // Check for API key errors
        if (stderr.includes('GOOGLE_API_KEY') || stderr.includes('API key')) {
          throw new Error('Google API Key is missing or invalid. Please add a valid API key to your .env file.');
        }
        
        // Generic error fallback
        throw new Error('An error occurred during PDF processing. Check the Python script output for details.');
      }
      
      // Extract the summary from the output
      let summary = stdout.trim();
      
      // If output starts with "Error:", it's an error message from the direct API method
      if (summary.startsWith('Error:')) {
        throw new Error(summary.substring(7));
      }
      
      // If the stdout only contains debug messages with no actual summary, treat it as an error
      if (isOutputOnlyDebugMessages(summary)) {
        throw new Error('Failed to generate a summary. The document may be empty or unreadable.');
      }
      
      // Clean and format the summary text
      summary = cleanSummaryText(summary);
      
      // If after cleaning there's no content, return an error
      if (!summary.trim()) {
        throw new Error('Could not extract a meaningful summary from the document.');
      }
      
      return NextResponse.json({ summary });
    } catch (execError) {
      // Try to extract meaningful error message from stderr if available
      let detailedError = execError instanceof Error ? execError.message : 'Failed to process document';
      
      if (execError instanceof Error && 'stderr' in execError && typeof execError.stderr === 'string') {
        const stderr = execError.stderr as string;
        
        // Check for specific error patterns in stderr
        if (stderr.includes('ERROR:')) {
          const errorMatch = stderr.match(/ERROR:\s*(.+?)(?:\n|$)/);
          if (errorMatch && errorMatch[1]) {
            detailedError = errorMatch[1].trim();
          }
        }
        // Check for Google API key errors
        else if (stderr.includes('GOOGLE_API_KEY') || 
            stderr.includes('google.api_core.exceptions.InvalidArgument') ||
            stderr.includes('API key not valid')) {
          detailedError = 'Google API Key is missing or invalid. Please add a valid API key to your .env file.';
        }
        // Check for other common errors in the stderr
        else if (stderr.includes('Error:')) {
          const errorLine = stderr.split('Error:')[1]?.split('\n')[0]?.trim();
          if (errorLine) {
            detailedError = errorLine;
          }
        }
      }
      
      throw new Error('Failed to process document: ' + detailedError);
    }
  } catch (error) {
    // Create a user-friendly error message
    let userErrorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    // Sanitize the error message to remove technical details
    userErrorMessage = userErrorMessage
      .replace(/Error: Failed to process document: Error: /g, '')
      .replace(/Error: Failed to process document: /g, '');
    
    // Ensure error message doesn't contain technical jargon
    if (userErrorMessage.includes('pydantic') || 
        userErrorMessage.includes('JSON schema') || 
        userErrorMessage.includes('traceback')) {
      userErrorMessage = 'An error occurred while processing the document. Please try again or contact support.';
    }
    
    return NextResponse.json(
      { error: userErrorMessage },
      { status: 500 }
    );
  } finally {
    // Clean up temp files
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        // Silently continue if cleanup fails
      }
    }
  }
} 