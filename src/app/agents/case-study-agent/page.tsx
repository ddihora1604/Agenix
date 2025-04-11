'use client';

import React, { useEffect } from 'react';
import { ArrowLeft, Send, Loader2, AlertTriangle, CheckCircle2, Terminal, BookOpen, FileText, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useCaseStudyAgentStore } from '@/store/case-study-agent-store';
import { Markdown } from '@/components/Markdown';

const CaseStudyAgentPage: React.FC = () => {
  const router = useRouter();
  const { setCaseStudyAgent } = useSidebarState();
  
  // Use the Zustand store
  const {
    topic,
    contextUrl,
    generatedOutline,
    generatedCaseStudy,
    isProcessing,
    error,
    apiKeyMissing,
    pythonError,
    successMessage,
    retryCount,
    warnings
  } = useCaseStudyAgentStore();
  
  // Update sidebar state when component mounts
  useEffect(() => {
    setCaseStudyAgent?.(true);
    return () => setCaseStudyAgent?.(false);
  }, [setCaseStudyAgent]);
  
  // Clear error and success messages when inputs change
  useEffect(() => {
    if (error || successMessage) {
      useCaseStudyAgentStore.setState({
        error: null,
        successMessage: null,
        apiKeyMissing: false,
        pythonError: false,
        rateLimitExceeded: false
      });
    }
  }, [topic, contextUrl, error, successMessage]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      useCaseStudyAgentStore.setState({ error: 'Please enter a case study topic' });
      return;
    }
    
    useCaseStudyAgentStore.setState({
      error: null,
      apiKeyMissing: false,
      pythonError: false,
      rateLimitExceeded: false,
      successMessage: null,
      warnings: [],
      isProcessing: true
    });
    
    try {
      console.time('case-study-agent-api-call');
      const response = await fetch('/api/case-study-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          contextUrl: contextUrl.trim() ? contextUrl : undefined
        }),
      });
      console.timeEnd('case-study-agent-api-call');
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check for specific error types
        if (data.isApiKeyError) {
          if (data.isRateLimit) {
            useCaseStudyAgentStore.setState({ rateLimitExceeded: true });
            throw new Error('Google API rate limit exceeded. Please try again later or check your API usage quotas.');
          } else {
            useCaseStudyAgentStore.setState({ apiKeyMissing: true });
            throw new Error(`API key is missing or invalid. ${data.details ? `Details: ${data.details}` : 'Please set up your API key in the .env file.'}`);
          }
        }
        
        if (data.isTimeout) {
          throw new Error('The operation timed out. This could be due to slow processing or missing API keys.');
        }
        
        if (data.isPythonError) {
          useCaseStudyAgentStore.setState({ pythonError: true });
          
          // Include more specific error message if available
          if (data.missingModule) {
            throw new Error(`Python dependency missing: ${data.missingModule}. Please run: pip install -r CaseStudyAgent/requirements.txt`);
          } else {
            throw new Error(data.message || 'Python installation or dependency issue. Please check your Python installation.');
          }
        }
        
        throw new Error(data.message || 'Failed to generate case study');
      }
      
      // If we reach here, processing was successful
      useCaseStudyAgentStore.setState({
        generatedOutline: data.outline || null,
        generatedCaseStudy: data.caseStudy || null,
        warnings: data.warnings || [],
        successMessage: 'Case study generated successfully!',
        retryCount: 0
      });
      
      // Scroll to results if any were generated
      if (data.outline || data.caseStudy) {
        setTimeout(() => {
          const results = document.getElementById('case-study-results');
          if (results) {
            results.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
      
    } catch (err) {
      const errorMessage = (err as Error).message || 'An error occurred while generating the case study.';
      if (!apiKeyMissing && !pythonError) {
        useCaseStudyAgentStore.setState({ error: errorMessage });
      }
      
      // Only increment retry count for non-setup issues
      if (!apiKeyMissing && !pythonError) {
        useCaseStudyAgentStore.setState({ retryCount: retryCount + 1 });
      }
    } finally {
      useCaseStudyAgentStore.setState({ isProcessing: false });
    }
  };
  
  // Function to reset the form and try again
  const handleReset = () => {
    useCaseStudyAgentStore.setState({
      error: null,
      apiKeyMissing: false,
      pythonError: false,
      retryCount: 0
    });
  };
  
  // Handle going back to the dashboard page
  const handleBackClick = () => {
    router.push('/dashboard');
  };
  
  return (
    <div className="p-6 max-w-9xl mx-auto space-y-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={handleBackClick}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BookOpen className="mr-3 h-6 w-6 text-purple-600 dark:text-purple-400" />
          Case Study Agent
        </h1>
      </div>
      
      {/* Rate Limit Error */}
      {useCaseStudyAgentStore.getState().rateLimitExceeded && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-amber-800 dark:text-amber-400 font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            API Rate Limit Exceeded
          </h3>
          <p className="text-amber-700 dark:text-amber-300 text-sm mb-2">
            The Google API rate limit has been exceeded. This is a common issue with free API keys.
          </p>
          <ol className="text-amber-700 dark:text-amber-300 text-sm list-decimal ml-5 space-y-1">
            <li>Wait a few minutes before trying again</li>
            <li>Consider upgrading to a paid Google AI API plan if you need higher limits</li>
            <li>Check your usage quotas in the <a href="https://console.cloud.google.com/apis/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
          </ol>
        </motion.div>
      )}
      
      {apiKeyMissing && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-amber-800 dark:text-amber-400 font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            API Key Required
          </h3>
          <p className="text-amber-700 dark:text-amber-300 text-sm mb-2">
            This feature requires a Google API key for Gemini 1.5 Pro to function. 
            Please follow these steps to set up your API key:
          </p>
          <ol className="text-amber-700 dark:text-amber-300 text-sm list-decimal ml-5 space-y-1">
            <li>Get a Google API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
            <li>Open the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">.env</code> file in the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">CaseStudyAgent</code> folder</li>
            <li>Add or update: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">GOOGLE_API_KEY=your-google-api-key-here</code></li>
            <li>Restart the application</li>
          </ol>
        </motion.div>
      )}
      
      {/* Display warnings if any */}
      {warnings && warnings.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-blue-800 dark:text-blue-400 font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            Notice
          </h3>
          {warnings.map((warning, index) => (
            <p key={index} className="text-blue-700 dark:text-blue-300 text-sm mb-2">
              {warning}
            </p>
          ))}
        </motion.div>
      )}
      
      {pythonError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-blue-800 dark:text-blue-400 font-medium mb-2">
            <Terminal className="h-5 w-5 mr-2 flex-shrink-0" />
            Python Setup Required
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
            This feature requires Python and some AI dependencies to be installed. 
            Please follow these steps:
          </p>
          
          <ol className="text-blue-700 dark:text-blue-300 text-sm list-decimal ml-5 space-y-1">
            <li>Make sure <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" className="underline">Python 3.8+</a> is installed and added to your PATH</li>
            <li>Navigate to the CaseStudyAgent directory in your terminal</li>
            <li>Run the following commands to install all required dependencies:</li>
            <li>
              <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded block mt-1 whitespace-pre-wrap">
                pip install -r requirements.txt
              </code>
            </li>
            <li>Restart your application</li>
          </ol>
        </motion.div>
      )}
      
      {error && !apiKeyMissing && !pythonError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-red-800 dark:text-red-400 font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            Error
          </h3>
          <p className="text-red-700 dark:text-red-300 text-sm">
            {error}
          </p>
          {retryCount > 0 && (
            <button
              onClick={handleReset}
              className="mt-2 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 px-2 py-1 rounded transition-colors"
            >
              Try Again
            </button>
          )}
        </motion.div>
      )}
      
      {successMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4"
        >
          <p className="flex items-center text-green-700 dark:text-green-300 text-sm">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" />
            {successMessage}
          </p>
        </motion.div>
      )}
      
      {/* Input Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Generate a Case Study
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Case Study Topic or Focus Area <span className="text-red-500">*</span>
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => useCaseStudyAgentStore.setState({ topic: e.target.value })}
              placeholder="E.g., Successful Digital Transformation at Company X, Leadership in Crisis Management, etc."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
          </div>
          
          <div>
            <label htmlFor="contextUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Context URL (Optional)
            </label>
            <div className="flex items-center">
              <div className="relative flex-grow">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  id="contextUrl"
                  type="url"
                  value={contextUrl}
                  onChange={(e) => useCaseStudyAgentStore.setState({ contextUrl: e.target.value })}
                  placeholder="https://example.com/relevant-article"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Optionally provide a URL to an article or page that contains additional context for the case study
            </p>
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isProcessing || !topic.trim()}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                isProcessing || !topic.trim()
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Generate Case Study
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Results Section */}
      {(generatedOutline || generatedCaseStudy) && (
        <div id="case-study-results" className="space-y-6">
          {generatedOutline && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Case Study Outline</h2>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <Markdown content={generatedOutline} />
              </div>
            </div>
          )}
          
          {generatedCaseStudy && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center mb-4">
                <BookOpen className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generated Case Study</h2>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <Markdown content={generatedCaseStudy} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseStudyAgentPage; 