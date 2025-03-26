'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Loader2, AlertTriangle, CheckCircle2, Terminal, Globe, Search, Download, CheckCircle, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { WebCrawlerProvider, useWebCrawlerState } from './WebCrawlerStateManager';
import { cn } from '@/lib/utils';

// URL validation regex
const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Web Crawler Form Component
const WebCrawlerForm: React.FC = () => {
  const router = useRouter();
  const { setShowWebCrawler } = useSidebarState();
  const { 
    websiteUrl, setWebsiteUrl,
    websiteContent, setWebsiteContent,
    question, setQuestion,
    answer, setAnswer,
    isAnalyzing, setIsAnalyzing,
    isQuerying, setIsQuerying,
    websiteTitle, setWebsiteTitle,
    error, setError,
    analysisComplete, setAnalysisComplete
  } = useWebCrawlerState();
  
  const [questionHistory, setQuestionHistory] = useState<{question: string, answer: string}[]>([]);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [longProcessing, setLongProcessing] = useState<boolean>(false);
  
  // Run initialization when the component mounts
  useEffect(() => {
    const initializeWebCrawler = async () => {
      try {
        setIsInitializing(true);
        console.log("Initializing Web Crawler with Q&A Agent...");
        
        const response = await fetch('/api/web-crawler', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add reasonable timeout for initialization
          signal: AbortSignal.timeout(30 * 1000) // 30 seconds timeout
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // Handle initialization errors
          if (data.isPythonError || data.setupRequired) {
            setError(`Setup required: ${data.message}`);
            
            if (data.setupInstructions) {
              setWebsiteContent(`To fix this issue, please follow these steps:\n\n${data.setupInstructions}\n\nAfter completing these steps, refresh this page.`);
            }
            return;
          }
          
          setError(data.message || 'Failed to initialize Web Crawler');
          return;
        }
        
        console.log("Web Crawler initialized successfully");
      } catch (error: any) {
        console.error("Error initializing Web Crawler:", error);
        setError(error.message || 'An error occurred during initialization');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeWebCrawler();
  }, []);
  
  // Clear error message when the website URL changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [websiteUrl]);

  // Function to format the content for better readability
  const formatContent = (content: string): React.ReactNode => {
    if (!content) return null;
    
    // Check if content contains setup instructions
    if (content.includes('To fix this issue, please follow these steps:')) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="text-md font-medium text-yellow-800 dark:text-yellow-400 mb-2">Setup Required</h3>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap font-mono">
              {content}
            </div>
          </div>
        </div>
      );
    }
    
    // Replace multiple newlines with two newlines
    let formatted = content.replace(/\n{3,}/g, '\n\n');
    
    // Try to identify sections if they exist
    const hasSections = formatted.match(/[A-Z\s]{2,}:/);
    
    if (hasSections) {
      // Split by potential section headers
      const sections = formatted.split(/(?=\n[A-Z\s]{2,}:)/g);
      
      return (
        <div className="space-y-6">
          {sections.map((section, index) => {
            // Check if this section has a header
            const headerMatch = section.match(/^(?:\n)?([A-Z\s]{2,}:)([\s\S]*?)(?:\n|$)/);
            
            if (headerMatch) {
              const [_, header, initialContent] = headerMatch;
              const content = section.replace(headerMatch[0], '').trim();
              
              return (
                <div key={index} className="pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">{header}</h3>
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {initialContent.trim() + (initialContent.trim() && content ? '\n\n' : '') + content}
                  </div>
                </div>
              );
            } else {
              return (
                <div key={index} className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {section}
                </div>
              );
            }
          })}
        </div>
      );
    }
    
    // Split by paragraphs
    const paragraphs = formatted.split(/\n\n+/);
    
    if (paragraphs.length > 1) {
      return (
        <div className="space-y-4">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-gray-700 dark:text-gray-300">
              {para}
            </p>
          ))}
        </div>
      );
    }
    
    // Default formatting
    return (
      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
        {formatted}
      </div>
    );
  };

  // Add formatAnswer function after the formatContent function
  const formatAnswer = (answer: string) => {
    if (!answer) return null;
    
    // Clean the answer text
    const cleanAnswer = answer.trim();
    
    // Split by paragraphs for better readability
    const paragraphs = cleanAnswer.split(/\n\n+/);
    
    if (paragraphs.length > 1) {
      return (
        <div className="space-y-4">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      );
    }
    
    return (
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
        {cleanAnswer}
      </div>
    );
  };

  // Function to download website content as TXT
  const downloadContent = () => {
    if (!websiteContent) return;
    
    const blob = new Blob([websiteContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${websiteTitle || 'website-content'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to download Q&A history as TXT
  const downloadQA = () => {
    if (!questionHistory.length) return;
    
    const content = questionHistory.map(item => 
      `Q: ${item.question}\n\nA: ${item.answer}\n\n---\n\n`
    ).join('');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${websiteTitle || 'website'}-qa.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Function to handle website URL submission
  const handleAnalyzeWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL.');
      return;
    }
    
    // Add https:// if not present
    let url = websiteUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      setWebsiteUrl(url);
    }
    
    if (!URL_REGEX.test(url)) {
      setError('Please enter a valid website URL.');
      return;
    }
    
    setError(null);
    setWebsiteContent('');
    setAnswer('');
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setProcessingTime(null);
    
    try {
      const response = await fetch('/api/web-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websiteUrl: url }),
        // Add a longer timeout for larger websites
        signal: AbortSignal.timeout(5 * 60 * 1000) // 5 minutes timeout
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check for API key error
        if (data.isApiKeyError) {
          setError('Google API key is missing or invalid. Please set up your API key in the .env file.');
          return;
        }
        
        // Check for Python installation errors
        if (data.isPythonError || data.setupRequired) {
          // Display a more detailed error with setup instructions
          setError(`Python installation or dependency issue: ${data.message}`);
          
          // If server provided setup instructions, show them to the user
          if (data.setupInstructions) {
            setWebsiteContent(`To fix this issue, please follow these steps:\n\n${data.setupInstructions}\n\nAfter completing these steps, try again.`);
          }
          return;
        }
        
        // Handle specific module error
        if (data.message && data.message.includes('Missing Python module')) {
          setError(`Missing Python module: ${data.message.split(':')[1]?.trim() || 'Unknown module'}`);
          
          // If server provided setup instructions, show them to the user
          if (data.setupInstructions) {
            setWebsiteContent(`To fix this issue, please follow these steps:\n\n${data.setupInstructions}\n\nAfter completing these steps, try again.`);
          }
          return;
        }
        
        // General error
        setError(data.message || 'An error occurred while analyzing the website.');
        return;
      }
      
      setWebsiteContent(data.websiteContent || '');
      setWebsiteTitle(data.websiteTitle || 'Website Analysis');
      setProcessingTime(data.processingTime || null);
      setAnalysisComplete(true);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('Request timed out. The website may be too large or unreachable.');
      } else {
        setError(error.message || 'An error occurred while analyzing the website.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to handle submitting a question
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      return;
    }
    
    if (!analysisComplete) {
      setError('Please analyze a website first before asking questions.');
      return;
    }
    
    setError(null);
    setAnswer('');
    setIsQuerying(true);
    setLongProcessing(false);
    
    // Set a timer to show a message if processing takes too long
    const longProcessingTimer = setTimeout(() => {
      setLongProcessing(true);
    }, 15000); // Show message after 15 seconds
    
    console.log(`[${new Date().toISOString()}] Starting question processing: "${question.trim()}"`);
    
    try {
      console.log(`Sending question to API: "${question.trim()}"`);
      
      const response = await fetch('/api/web-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          websiteUrl: websiteUrl,
          question: question.trim() 
        }),
        // Add a reasonable timeout for question processing (2 minutes)
        signal: AbortSignal.timeout(2 * 60 * 1000)
      });
      
      console.log(`API response status: ${response.status}`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error from API:', data);
        
        // Check if this is a model error
        if (data.isModelError) {
          setError('AI model error: The Gemini model could not be accessed. An administrator needs to update the model version.');
          setWebsiteContent(`To fix this issue, please follow these steps:\n\n${data.setupInstructions || 'Contact your administrator to update the AI model configuration.'}\n\nAfter completing these steps, refresh this page.`);
          return;
        }
        
        setError(data.message || 'An error occurred while processing your question.');
        return;
      }
      
      console.log(`[${new Date().toISOString()}] Successfully received answer from API, length: ${data.answer?.length || 0} chars`);
      
      if (!data.answer || data.answer.trim() === '') {
        console.warn('Empty answer received from API');
        setError('No answer was generated. Please try a different question or try again later.');
        return;
      }
      
      setAnswer(data.answer);
      
      // Add to question history
      const newEntry = {
        question: question.trim(),
        answer: data.answer
      };
      
      setQuestionHistory(prev => [...prev, newEntry]);
      
      // Clear question input
      setQuestion('');
      
    } catch (error: any) {
      console.error('Error processing question:', error);
      
      // Handle specific error cases
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        setError('Request timed out. The question processing took too long. Please try a simpler question or try again later.');
      } else if (error.name === 'SyntaxError') {
        setError('Received invalid response from server. Please try again.');
      } else {
        setError(error.message || 'An error occurred while processing your question.');
      }
    } finally {
      clearTimeout(longProcessingTimer);
      setIsQuerying(false);
      setLongProcessing(false);
    }
  };

  // Function to handle back button click
  const handleBackClick = () => {
    // Reset state and navigate back to agents page
    setShowWebCrawler(false);
    router.push('/agents');
  };

  return (
    <div className="max-w-9xl mx-auto px-4 mb-8">
      {/* Header with Back Button */}
      <div className="flex items-center mb-6 mt-4">
        <button 
          onClick={handleBackClick}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors mr-2"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Web Crawler with Q&A Agent</h1>
      </div>
      
      {/* Display initialization state */}
      {isInitializing && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 relative">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-solid rounded-full"></div>
              <div className="w-16 h-16 border-4 border-t-blue-600 dark:border-t-blue-400 border-solid rounded-full animate-spin absolute top-0"></div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-1">Initializing Web Crawler with Q&A Agent...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Setting up required dependencies</p>
          </div>
        </div>
      )}
      
      {/* Main Content - Only show when not initializing */}
      {!isInitializing && (
        <div className="grid gap-8">
          {/* Website URL Form */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Enter Website URL
            </h2>
            
            <form onSubmit={handleAnalyzeWebsite} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    disabled={isAnalyzing}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing || !websiteUrl.trim()}
                  className={cn(
                    "px-5 py-3 rounded-lg font-medium text-white transition-colors",
                    isAnalyzing
                      ? "bg-blue-400 dark:bg-blue-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                  )}
                >
                  {isAnalyzing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </div>
                  ) : (
                    "Analyze"
                  )}
                </button>
              </div>
            </form>
            
            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Website Content */}
          {(websiteContent || isAnalyzing) && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-indigo-500" />
                  Website Analysis
                </h2>
                
                {websiteContent && (
                  <button 
                    onClick={downloadContent}
                    className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                )}
              </div>
              
              {isAnalyzing ? (
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="mb-4 relative">
                    <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-solid rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-t-blue-600 dark:border-t-blue-400 border-solid rounded-full animate-spin absolute top-0"></div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-1">Analyzing website content...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This may take a minute for larger websites</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  {websiteContent && websiteContent.includes('To fix this issue') ? (
                    // For setup instructions, keep original formatting
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2 w-full">
                      {formatContent(websiteContent)}
                    </div>
                  ) : (
                    // For successful analyses, show simplified content
                    <div className="text-center">
                      <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-full inline-flex">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        {websiteTitle || 'Website Analysis'}
                      </h3>
                      <div className="max-w-lg mx-auto">
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Website content has been successfully loaded and analyzed.
                          You can now ask questions about the website below.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <CheckSquare className="h-4 w-4 text-blue-500" />
                          <span>Ready for Q&A</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {processingTime !== null && (
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Processing time: {processingTime.toFixed(2)} seconds
                </div>
              )}
            </div>
          )}
          
          {/* Q&A Section */}
          {analysisComplete && (
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Search className="h-5 w-5 text-purple-500" />
                  Ask Questions About This Website
                </h2>
                
                {questionHistory.length > 0 && (
                  <button 
                    onClick={downloadQA}
                    className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Q&A
                  </button>
                )}
              </div>
              
              {/* Question Input */}
              <form onSubmit={handleAskQuestion} className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask a question about the website..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600"
                      disabled={isQuerying}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isQuerying || !question.trim()}
                    className={cn(
                      "px-5 py-3 rounded-lg font-medium text-white transition-colors",
                      isQuerying || !question.trim()
                        ? "bg-purple-400 dark:bg-purple-500 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                    )}
                  >
                    {isQuerying ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Ask
                      </div>
                    )}
                  </button>
                </div>
              </form>
              
              {/* Current Answer */}
              {isQuerying && (
                <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative">
                      <div className="h-5 w-5 rounded-full bg-purple-200 dark:bg-purple-700/30 animate-ping absolute"></div>
                      <Loader2 className="h-5 w-5 text-purple-500 animate-spin relative" />
                    </div>
                    <p className="font-medium text-purple-700 dark:text-purple-400">Processing your question...</p>
                  </div>
                  <p className="text-sm text-purple-600 dark:text-purple-300">{question}</p>
                  <div className="mt-3 text-xs text-purple-500/70 dark:text-purple-400/70">
                    This may take a moment as the AI analyzes the website content to find the answer.
                    {longProcessing && (
                      <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-800/30 rounded">
                        <p className="font-medium">Still working...</p>
                        <p>Complex questions about large websites may take longer to process. Please be patient.</p>
                        <div className="mt-2 flex items-center">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-1 rounded-full animate-pulse-width"></div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-purple-700 dark:text-purple-300">
                          <p>If this takes too long:</p>
                          <ul className="list-disc pl-5 space-y-1 mt-1">
                            <li>Try asking a more specific question</li>
                            <li>Break down complex questions into simpler ones</li>
                            <li>Refresh the page and try analyzing the website again</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {answer && (
                <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Answer:</h3>
                      {formatAnswer(answer)}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Question History */}
              {questionHistory.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                    Previous Questions
                  </h3>
                  <div className="space-y-4">
                    {questionHistory.map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">{item.question}</p>
                        <div className="text-sm text-gray-600 dark:text-gray-300 pl-3 border-l-2 border-gray-300 dark:border-gray-700">
                          {formatAnswer(item.answer)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Web Crawler Page Component
const WebCrawlerPage: React.FC = () => {
  return (
    <WebCrawlerProvider>
      <WebCrawlerForm />
    </WebCrawlerProvider>
  );
};

export default WebCrawlerPage; 