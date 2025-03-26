'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Loader2, AlertTriangle, CheckCircle2, Terminal, Globe, Search } from 'lucide-react';
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
  
  // Clear error message when the website URL changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [websiteUrl]);

  // Function to format the content for better readability
  const formatContent = (content: string): string => {
    if (!content) return '';
    
    // Replace multiple newlines with two newlines
    let formatted = content.replace(/\n{3,}/g, '\n\n');
    
    return formatted;
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
          setError('OpenAI API key is missing or invalid. Please set up your API key in the .env file.');
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
        
        throw new Error(data.message || 'Failed to analyze website');
      }
      
      // Set website title if available
      if (data.websiteTitle) {
        setWebsiteTitle(data.websiteTitle);
      }
      
      // Set website content
      setWebsiteContent(data.websiteContent);
      setAnalysisComplete(true);
    } catch (err) {
      const errorMessage = (err as Error).message || 'An error occurred while analyzing the website.';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to handle question submission
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      return;
    }
    
    if (!analysisComplete) {
      setError('Please analyze a website first before asking questions.');
      return;
    }
    
    const currentQuestion = question;
    setIsQuerying(true);
    
    try {
      const response = await fetch('/api/web-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          websiteUrl: websiteUrl,
          question: currentQuestion 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get answer');
      }
      
      // Set answer
      setAnswer(data.answer);
      
      // Add to question history
      setQuestionHistory(prev => [...prev, {
        question: currentQuestion,
        answer: data.answer
      }]);
      
      // Clear question input
      setQuestion('');
    } catch (err) {
      const errorMessage = (err as Error).message || 'An error occurred while processing your question.';
      setError(errorMessage);
    } finally {
      setIsQuerying(false);
    }
  };

  // Function to go back to agents page
  const handleBackClick = () => {
    router.push('/agents');
  };

  return (
    <div className="p-6 max-w-9xl mx-auto space-y-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={handleBackClick}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Back to Agents"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Web Crawler with Q&A</h1>
      </div>
      
      {/* Website URL input form */}
      <form onSubmit={handleAnalyzeWebsite} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enter Website URL</h2>
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isAnalyzing}
            />
            <button
              type="submit"
              disabled={isAnalyzing}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>
      </form>

      {/* Loading indicator */}
      {isAnalyzing && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center"
        >
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Analyzing website, please wait...</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">This may take a minute depending on the website size</p>
        </motion.div>
      )}

      {/* Website content output */}
      {websiteContent && !isAnalyzing && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Complete</h2>
            </div>
          </div>
          
          {websiteTitle && (
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
              {websiteTitle}
            </h3>
          )}
          
          <div className="prose dark:prose-invert max-w-none mt-4 mb-6 text-gray-700 dark:text-gray-300 text-sm max-h-60 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <pre className="whitespace-pre-wrap font-sans">
              {formatContent(websiteContent)}
            </pre>
          </div>
          
          {/* Question input form */}
          <form onSubmit={handleAskQuestion} className="mt-6">
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
              Ask a question about this website
            </h3>
            <div className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isQuerying}
              />
              <button
                type="submit"
                disabled={isQuerying || !question.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isQuerying ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
          
          {/* Q&A history */}
          {questionHistory.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                Q&A History
              </h3>
              <div className="space-y-4">
                {questionHistory.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="font-medium text-blue-600 dark:text-blue-400 mb-2">Q: {item.question}</p>
                    <p className="text-gray-700 dark:text-gray-300">A: {item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Latest answer */}
          {answer && isQuerying === false && questionHistory.length === 0 && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
                Answer
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">{answer}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Main Web Crawler Page component with state provider
const WebCrawlerPage: React.FC = () => {
  return (
    <WebCrawlerProvider>
      <WebCrawlerForm />
    </WebCrawlerProvider>
  );
};

export default WebCrawlerPage; 