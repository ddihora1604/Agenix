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
  // Handle Google API key errors
  if (error.includes('GOOGLE_API_KEY') || error.includes('API key') || error.includes('authentication')) {
    return {
      title: 'Google API Key Missing or Invalid',
      message: 'The application needs a valid Google API key to access the Gemini AI model.',
      solution: 'Add your Google API key to the DocSummarizer/DocSummarizer/.env file. You can get a free API key from https://aistudio.google.com/'
    };
  }
  
  // Handle Python missing module errors
  if (error.includes('Missing Python module:')) {
    const module = error.replace('Missing Python module:', '').trim().split('.')[0];
    return {
      title: 'Missing Python Dependency',
      message: `The required Python module "${module}" is not installed.`,
      solution: `Run the following command in your terminal to install it: pip install ${module}`
    };
  }
  
  // Handle file type errors
  if (error.includes('Only PDF files are supported')) {
    return {
      title: 'Invalid File Type',
      message: 'You can only upload PDF documents for summarization.',
      solution: 'Please select a PDF file and try again.'
    };
  }
  
  // Handle file size errors
  if (error.includes('exceeds 10MB limit')) {
    return {
      title: 'File Size Exceeded',
      message: 'The uploaded file exceeds the maximum size limit of 10MB.',
      solution: 'Please compress the PDF or upload a smaller document.'
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

  // Default error
  return {
    title: 'Error Processing Document',
    message: error,
    solution: 'Please try again or use a different document.'
  };
};

export default function DocumentSummarizerPage() {
  const router = useRouter();
  const { setShowDocumentSummarizer } = useSidebarState();
  // State variables
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [summaryLength, setSummaryLength] = useState<string>('medium');
  const [focusAreas, setFocusAreas] = useState<string>('');
  const [apiKeyExists, setApiKeyExists] = useState<boolean>(false);
  const [apiKeyChecked, setApiKeyChecked] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('summaryLength', summaryLength);
      formData.append('focusAreas', focusAreas);
      
      const response = await fetch('/api/document-summarizer', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to summarize document');
      }
      
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
        
        {/* Only show API key notice if the API key doesn't exist or we're still checking */}
        {(!apiKeyExists && apiKeyChecked) && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-md">
          <b>Note:</b> This feature requires a Google API key. Add your key to <code>DocSummarizer/DocSummarizer/.env</code> before use.
          You can get a free API key from <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>.
        </div>
        )}
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
              {error && formattedError && (
                <div className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <h4 className="font-medium">{formattedError.title}</h4>
                  </div>
                  <p className="ml-7 mb-2">{formattedError.message}</p>
                  {formattedError.solution && (
                    <div className="ml-7 mt-2 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-xs text-gray-600 dark:text-gray-300 mb-1">Suggested Solution:</p>
                      <p className="text-xs text-gray-800 dark:text-gray-200 font-mono">{formattedError.solution}</p>
                    </div>
                  )}
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
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Analyzing Document</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                We're extracting key insights and creating a comprehensive summary of your document. This may take a minute...
              </p>
            </div>
          ) : summary ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Document Summary</h2>
                </div>
                <button
                  onClick={downloadSummary}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download Summary
                </button>
              </div>
              
              <div className="prose dark:prose-invert prose-sm md:prose-base max-w-none flex-1 overflow-y-auto">
                {summary.split('\n\n').map((paragraph, index) => {
                  // Check if this is a heading (starts with # or has all caps)
                  if (paragraph.startsWith('#') || /^[A-Z\s:]+$/.test(paragraph)) {
                    return (
                      <h3 key={index} className="text-lg font-bold mt-6 mb-2 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-1">
                        {paragraph.replace(/^#+\s*/, '')}
                      </h3>
                    );
                  }
                  
                  // Check if this is a list item
                  if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ') || /^\d+\.\s/.test(paragraph.trim())) {
                    return (
                      <ul key={index} className="list-disc pl-6 my-4 space-y-2">
                        {paragraph.split('\n').map((item, itemIndex) => (
                          <li key={`${index}-${itemIndex}`} className="my-1 text-gray-700 dark:text-gray-300">
                            {item.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  
                  // Regular paragraph
                  return (
                    <p key={index} className="my-4 leading-relaxed text-gray-700 dark:text-gray-300">
                      {paragraph}
                    </p>
                  );
                })}
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