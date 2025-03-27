'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  File, Upload, FileText, RotateCcw, 
  ArrowRight, CheckCircle2, XCircle, 
  Loader2, ChevronDown, ChevronUp, 
  BookOpen, Download, AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useRouter } from 'next/navigation';

// Helper function to parse and format error messages
const formatErrorMessage = (error: string): { title: string; message: string; solution?: string } => {
  // Python environment errors
  if (error.includes('python not found') || error.includes('Python is not installed')) {
    return {
      title: 'Python Environment Issue',
      message: 'Python is not installed or not properly configured.',
      solution: 'Install Python 3.8 or higher and ensure it\'s in your system PATH.'
    };
  }
  
  // Python module errors
  if (error.includes('No module named')) {
    const moduleName = error.match(/No module named '([^']+)'/)?.[1] || 'required module';
    return {
      title: 'Missing Python Module',
      message: `The Python module "${moduleName}" required for document summarization is missing.`,
      solution: `Run "pip install ${moduleName}" in your command line or terminal to install the missing module.`
    };
  }
  
  // API key related errors
  if (error.includes('API key') || error.includes('GOOGLE_API_KEY')) {
    return {
      title: 'API Key Issue',
      message: 'The Google API key required for document summarization is missing or invalid.',
      solution: 'Please contact the administrator to configure a valid API key.'
    };
  }
  
  // Timeout errors
  if (error.includes('timed out') || error.includes('timeout')) {
    return {
      title: 'Processing Timeout',
      message: 'The document took too long to process.',
      solution: 'Please try a smaller document or try again later when the system is less busy.'
    };
  }
  
  // PDF extraction errors
  if (error.includes('extract text') || error.includes('Could not extract')) {
    return {
      title: 'PDF Content Extraction Failed',
      message: 'Unable to extract text from this PDF file.',
      solution: 'The document might be scanned, image-based, or password protected. Please try a different document.'
    };
  }
  
  // Rate limiting or quota issues
  if (error.includes('quota') || error.includes('rate limit')) {
    return {
      title: 'Service Limit Reached',
      message: 'The API usage quota or rate limit has been reached.',
      solution: 'Please try again later when the quota resets.'
    };
  }
  
  // Empty or short summary
  if (error.includes('too short') || error.includes('empty')) {
    return {
      title: 'Empty or Insufficient Content',
      message: 'The document contains insufficient content to generate a good summary.',
      solution: 'Please try a document with more textual content.'
    };
  }
  
  // Handle script not found error 
  if (error.includes('script not found')) {
    return {
      title: 'Document Summarizer Script Not Found',
      message: 'The Python script needed to summarize documents is missing.',
      solution: 'Please make sure the DocSummarizer directory contains the necessary Python scripts.'
    };
  }

  // Memory errors
  if (error.includes('memory') || error.includes('MemoryError')) {
    return {
      title: 'Memory Limit Reached',
      message: 'The document is too large to process with the available memory.',
      solution: 'Try a smaller document or use the advanced options to limit the pages processed.'
    };
  }

  // Default error
  return {
    title: 'Error Processing Document',
    message: error,
    solution: 'Please try again or use a different document.'
  };
};

// Add this function to format summary text for display
const formatSummaryForDisplay = (summary: string): React.ReactNode => {
  if (!summary) return null;
  
  // More aggressive cleanup of summary text - remove any technical or debug lines
  const cleanedSummary = summary
    .replace(/^DEBUG:[\s\S]*?\n/gm, '') // Remove DEBUG: lines
    .replace(/^INFO:[\s\S]*?\n/gm, '')  // Remove INFO: lines 
    .replace(/^WARNING:[\s\S]*?\n/gm, '') // Remove WARNING: lines
    .replace(/^ERROR:[\s\S]*?\n/gm, '') // Remove ERROR: lines
    .replace(/^\[.*?\][\s\S]*?\n/gm, '') // Remove lines starting with timestamps in brackets
    .replace(/^Processed.*pages/gm, '') // Remove "Processed X pages" lines
    .replace(/^Extracting text.*?\.{3}/gm, '') // Remove "Extracting text" lines
    .replace(/^Generated summary with.*?characters/gm, '') // Remove "Generated summary" lines
    .replace(/^Total processing time:.*?seconds/gm, '') // Remove "Total processing time" lines
    .replace(/^Summary generated in.*?seconds/gm, '') // Remove "Summary generated in" lines
    .replace(/^PDF.*?extraction completed in.*?seconds/gm, '') // Remove PDF extraction timing lines
    .replace(/^Using.*?model/gm, '') // Remove model usage lines
    .replace(/^Python.*?version/gm, '') // Remove Python version lines
    .replace(/^Initializing.*?model/gm, '') // Remove initialization lines
    .replace(/###SUMMARY_START###/, '') // Remove summary start marker
    .replace(/###SUMMARY_END###/, '') // Remove summary end marker
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ consecutive newlines with just two
    .trim();
  
  // Split the summary into paragraphs with more precise handling
  // This helps ensure proper paragraph breaks
  const paragraphs = cleanedSummary
    .split(/\n{2,}/)
    .filter(p => p.trim().length > 0)
    .map(p => p.trim());
  
  // Check if there are structured sections with headers (e.g., "KEY FINDINGS:")
  const hasSections = paragraphs.some(p => /^[A-Z\s]{3,}:/.test(p.trim()));
  
  // Check if there are bullet points
  const hasBulletPoints = paragraphs.some(p => p.trim().match(/^[\s]*[•\-\*]\s/m));
  
  if (hasSections) {
    // Process sections with headers differently
    let currentSection = '';
    let formattedContent: JSX.Element[] = [];
    
    paragraphs.forEach((paragraph, index) => {
      // Check if this paragraph is a header
      if (/^[A-Z\s]{3,}:/.test(paragraph.trim())) {
        currentSection = paragraph.trim();
        formattedContent.push(
          <div key={`section-${index}`} className="mb-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
              {currentSection}
            </h3>
          </div>
        );
      } else if (paragraph.trim().match(/^[\s]*[•\-\*]\s/m)) {
        // This is a bullet point paragraph
        const bulletPoints = paragraph.split(/\n/).filter(line => line.trim());
        
        formattedContent.push(
          <ul key={`list-${index}`} className="list-disc pl-6 space-y-2 mb-5 text-gray-700 dark:text-gray-300">
            {bulletPoints.map((point, i) => {
              // Remove the bullet character
              const cleanPoint = point.trim().replace(/^[•\-\*]\s*/, '');
              return (
                <li key={`point-${index}-${i}`} className="leading-relaxed text-base">
                  {cleanPoint}
                </li>
              );
            })}
          </ul>
        );
      } else if (paragraph.trim()) {
        // Regular paragraph
        formattedContent.push(
          <p key={`para-${index}`} className="text-gray-700 dark:text-gray-300 mb-5 leading-relaxed text-base">
            {paragraph.trim()}
          </p>
        );
      }
    });
    
    return <div className="space-y-1">{formattedContent}</div>;
  } else if (hasBulletPoints) {
    // Handle documents with bullet points but no section headers
    return (
      <div className="space-y-5">
        {paragraphs.map((paragraph, index) => {
          if (paragraph.trim().match(/^[\s]*[•\-\*]\s/m)) {
            // This paragraph contains bullet points
            const bulletPoints = paragraph.split(/\n/).filter(line => line.trim());
            
            return (
              <ul key={`list-${index}`} className="list-disc pl-6 space-y-2 mb-4 text-gray-700 dark:text-gray-300">
                {bulletPoints.map((point, i) => {
                  // Remove the bullet character
                  const cleanPoint = point.trim().replace(/^[•\-\*]\s*/, '');
                  return (
                    <li key={`point-${index}-${i}`} className="leading-relaxed text-base">
                      {cleanPoint}
                    </li>
                  );
                })}
              </ul>
            );
          } else if (paragraph.trim()) {
            // Regular paragraph
            return (
              <p key={`para-${index}`} className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed text-base">
                {paragraph.trim()}
              </p>
            );
          }
          return null;
        })}
      </div>
    );
  }
  
  // For regular summaries with no distinct sections, just return paragraphs
  return (
    <div className="space-y-5">
      {paragraphs.map((paragraph, index) => (
        paragraph.trim() ? (
          <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-5">
            {paragraph.trim()}
          </p>
        ) : null
      ))}
    </div>
  );
};

export default function DocumentSummarizerPage() {
  const router = useRouter();
  const { setShowDocumentSummarizer } = useSidebarState();
  // State variables
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [summaryLength, setSummaryLength] = useState<string>('medium');
  const [focusAreas, setFocusAreas] = useState<string>('');
  const [apiKeyExists, setApiKeyExists] = useState<boolean>(false);
  const [apiKeyChecked, setApiKeyChecked] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingTimer = useRef<NodeJS.Timeout | null>(null);

  // Set sidebar state on component mount and check if API key exists
  useEffect(() => {
    // Check if API key exists
    async function checkApiKey() {
      try {
        const response = await fetch('/api/document-summarizer/check-api-key');
        const data = await response.json();
        setApiKeyExists(data.exists);
      } catch (err) {
        console.error("Error checking API key:", err);
        setApiKeyExists(false);
      } finally {
        setApiKeyChecked(true);
      }
    }
    
    checkApiKey();
    
    // Set document summarizer visible in sidebar
    setShowDocumentSummarizer(true);
    
    // No need to reset showDocumentSummarizer on unmount
    // as we want it to remain persistent like EmailGenerator
  }, [setShowDocumentSummarizer]);

  // Updated effect to simulate processing stages for better user feedback
  useEffect(() => {
    if (isProcessing) {
      // Initial processing stage
      setProcessingStage('Initializing document processor...');
      setProcessingProgress(10);
      
      // Simulate processing stages with realistic timing
      const stages = [
        { stage: 'Extracting text from PDF...', progress: 25, delay: 2000 },
        { stage: 'Analyzing document content...', progress: 50, delay: 5000 },
        { stage: 'Generating comprehensive summary...', progress: 75, delay: 8000 },
        { stage: 'Finalizing results...', progress: 90, delay: 12000 }
      ];
      
      // Clear any existing timer
      if (processingTimer.current) {
        clearTimeout(processingTimer.current);
      }
      
      // Set up the stage transitions
      let currentIndex = 0;
      const advanceStage = () => {
        if (!isProcessing) return; // Stop if no longer processing
        
        if (currentIndex < stages.length) {
          const { stage, progress, delay } = stages[currentIndex];
          setProcessingStage(stage);
          setProcessingProgress(progress);
          currentIndex++;
          
          processingTimer.current = setTimeout(advanceStage, delay);
        }
      };
      
      // Start the stage transitions
      processingTimer.current = setTimeout(advanceStage, 1000);
      
      // Clean up timer on unmount or when processing completes
      return () => {
        if (processingTimer.current) {
          clearTimeout(processingTimer.current);
        }
      };
    } else {
      // Reset progress when processing completes
      setProcessingProgress(0);
    }
  }, [isProcessing]);

  // Handle going back to the agents page
  const handleBackClick = () => {
    router.push('/agents');
  };

  // Function to handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if file is a PDF
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        setFile(null);
        setFileName('');
        return;
      }
      
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        setFile(null);
        setFileName('');
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
      setSummary('');
    }
  };

  // Function to handle file upload and summarization
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to summarize.');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setSummary('');
    setProcessingStage('Initializing document processor...');
    setProcessingProgress(10);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('summaryLength', summaryLength);
      formData.append('focusAreas', focusAreas);
      
      // Set timeout to provide better UX for large files
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout
      
      // Start the request
      console.log('Starting document summarization process...');
      const response = await fetch('/api/document-summarizer', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check for common HTTP status errors
      if (response.status === 413) {
        throw new Error('File too large. Please upload a smaller document.');
      }
      
      if (response.status === 504 || response.status === 524) {
        throw new Error('The request timed out. The document might be too large or complex to process.');
      }
      
      // Parse response data
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Failed to parse server response. The document may be too large.');
      }
      
      // Handle non-200 responses
      if (!response.ok) {
        console.error('API Error:', data.error);
        throw new Error(data.error || `Server error: ${response.status}`);
      }
      
      // Handle empty or malformed summary
      if (!data.summary || data.summary.trim().length < 50) {
        console.warn('Empty or very short summary received:', data.summary);
        throw new Error('Could not generate a meaningful summary. The document might have little extractable text content.');
      }
      
      setSummary(data.summary);
      console.log('Document summarization completed successfully.');
    } catch (err) {
      console.error('Document summarization error:', err);
      
      // Handle abort errors specifically
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('The request was cancelled due to taking too long. Try a smaller document or adjust advanced options.');
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to reset the form
  const resetForm = () => {
    setFile(null);
    setFileName('');
    setSummary('');
    setError('');
    setShowAdvancedOptions(false);
    setSummaryLength('medium');
    setFocusAreas('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Function to download the summary
  const downloadSummary = () => {
    if (!summary) return;
    
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `${fileName.replace('.pdf', '')}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Format error for display
  const formattedError = error ? formatErrorMessage(error) : null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center mb-2">
          <button 
            onClick={handleBackClick}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Back to Agents"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Summarizer</h1>
        </div>
        {/* <p className="text-gray-600 dark:text-gray-300 mt-1">
          Upload a PDF document to generate a comprehensive summary with key insights.
        </p> */}
      </div>
      
      <div className="flex flex-col lg:flex-row flex-1 p-6 gap-6 overflow-y-auto">
        {/* Left Panel - Upload Form */}
        <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              {/* <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Upload Document
              </label> */}
              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer",
                  error ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20" 
                  : file ? "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20" 
                  : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-700"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                />
                
                {file ? (
                  <>
                    <FileText className="h-10 w-10 text-green-500 dark:text-green-400 mb-3" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{fileName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      className="mt-4 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      Change File
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PDF files only (max. 10MB)
                    </p>
                  </>
                )}
              </div>
              
              {/* Enhanced Error Message */}
              {error && (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 max-w-md w-full">
                    <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">
                      {formatErrorMessage(error).title}
                    </h3>
                    <p className="text-red-700 dark:text-red-400 mb-4">
                      {formatErrorMessage(error).message}
                    </p>
                    {formatErrorMessage(error).solution && (
                      <div className="bg-white dark:bg-gray-800 rounded-md p-3 text-sm text-gray-700 dark:text-gray-300 mt-2">
                        <strong>Suggestion:</strong> {formatErrorMessage(error).solution}
                      </div>
                    )}
                    <button
                      onClick={resetForm}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Advanced Options Toggle */}
            <div>
              <button
                type="button"
                className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                <span>Advanced Options</span>
                {showAdvancedOptions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {showAdvancedOptions && (
                <div className="mt-4 space-y-4 animate-in slide-in-from-top duration-200">
                  {/* Summary Length */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Summary Length
                    </label>
                    <select
                      value={summaryLength}
                      onChange={(e) => setSummaryLength(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      disabled={isProcessing}
                    >
                      <option value="short">Short (1-2 paragraphs)</option>
                      <option value="medium">Medium (3-4 paragraphs)</option>
                      <option value="detailed">Detailed (5+ paragraphs)</option>
                    </select>
                  </div>
                  
                  {/* Focus Areas */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Focus Areas (Optional)
                    </label>
                    <textarea
                      value={focusAreas}
                      onChange={(e) => setFocusAreas(e.target.value)}
                      placeholder="Enter specific topics or sections to focus on, separated by commas"
                      rows={3}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!file || isProcessing}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm",
                  (!file || isProcessing) 
                    ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed" 
                    : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    Summarize Document
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
        
        {/* Right Panel - Summary Display */}
        <div className="w-full lg:w-2/3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 overflow-y-auto">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-full max-w-md">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4 mx-auto" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">{processingStage}</h3>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  {processingProgress < 50 ? 
                    "We're extracting and analyzing your document. This may take several minutes for larger files..." :
                    "Almost there! Creating a comprehensive summary of your document..."
                  }
                </p>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-xs text-blue-800 dark:text-blue-300">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Processing time depends on document size and complexity
                  </p>
                </div>
              </div>
            </div>
          ) : summary ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Document Summary</h2>
                </div>
                <button
                  onClick={downloadSummary}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download Summary
                </button>
              </div>
              
              {/* Summary content container with improved styling */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-auto flex-1">
                <div className="p-5 max-h-[calc(100vh-240px)] overflow-y-auto">
                  <div className="prose prose-blue dark:prose-invert max-w-none">
                    {formatSummaryForDisplay(summary)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 dark:text-gray-400">
              <File className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Document Summarized Yet</h3>
              <p className="max-w-md">
                Upload a PDF document and click "Summarize Document" to generate a comprehensive summary with key insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 