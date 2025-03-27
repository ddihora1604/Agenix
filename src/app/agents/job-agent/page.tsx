'use client';

import React, { useEffect } from 'react';
import { ArrowLeft, Send, Loader2, AlertTriangle, CheckCircle2, Terminal, Briefcase, FileText, Mail, Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useJobAgentStore } from '@/store/job-agent-store';

const JobAgentPage: React.FC = () => {
  const router = useRouter();
  const { setShowJobAgent } = useSidebarState();
  
  // Use the Zustand store
  const {
    jobInput,
    candidateName,
    candidateExperience,
    interviewDate,
    taskType,
    generatedSummary,
    generatedColdEmail,
    generatedInterviewPrep,
    isProcessing,
    error,
    apiKeyMissing,
    pythonError,
    successMessage,
    retryCount,
    isCopied,
    rateLimitExceeded,
    warnings
  } = useJobAgentStore();
  
  // Check if any generated content contains the AVX2 warning
  const hasAvx2Warning = React.useMemo(() => {
    const allContent = [generatedSummary, generatedColdEmail, generatedInterviewPrep].filter(Boolean).join('');
    return allContent.includes('faiss.swigfaiss_avx2') || allContent.includes('AVX2 support');
  }, [generatedSummary, generatedColdEmail, generatedInterviewPrep]);
  
  // Update sidebar state when component mounts
  useEffect(() => {
    setShowJobAgent?.(true);
    return () => setShowJobAgent?.(false);
  }, [setShowJobAgent]);
  
  // Clear error and success messages when inputs change
  useEffect(() => {
    if (error || successMessage) {
      useJobAgentStore.setState({
        error: null,
        successMessage: null,
        apiKeyMissing: false,
        pythonError: false,
        rateLimitExceeded: false
      });
    }
  }, [jobInput, candidateName, candidateExperience, interviewDate, taskType, error, successMessage]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobInput.trim()) {
      useJobAgentStore.setState({ error: 'Please enter a job description URL or text' });
      return;
    }
    
    if ((taskType === 'cold_email' || taskType === 'all') && (!candidateName.trim() || !candidateExperience.trim())) {
      useJobAgentStore.setState({ error: 'Candidate name and experience are required for cold email generation' });
      return;
    }
    
    useJobAgentStore.setState({
      error: null,
      apiKeyMissing: false,
      pythonError: false,
      rateLimitExceeded: false,
      successMessage: null,
      warnings: [],
      isProcessing: true
    });
    
    try {
      console.time('job-agent-api-call');
      const response = await fetch('/api/job-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobInput,
          candidateName,
          candidateExperience,
          interviewDate,
          taskType
        }),
      });
      console.timeEnd('job-agent-api-call');
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check for specific error types
        if (data.isApiKeyError) {
          if (data.isRateLimit) {
            useJobAgentStore.setState({ rateLimitExceeded: true });
            throw new Error('Google API rate limit exceeded. Please try again later or check your API usage quotas.');
          } else {
            useJobAgentStore.setState({ apiKeyMissing: true });
            throw new Error(`API key is missing or invalid. ${data.details ? `Details: ${data.details}` : 'Please set up your API key in the .env file.'}`);
          }
        }
        
        if (data.isTimeout) {
          throw new Error('The operation timed out. This could be due to slow processing or missing API keys.');
        }
        
        if (data.isPythonError) {
          useJobAgentStore.setState({ pythonError: true });
          
          // Include more specific error message if available
          if (data.missingModule) {
            if (data.missingModule === 'faiss-cpu') {
              throw new Error(`Missing AI dependency: faiss-cpu (vector database). Please run: pip install faiss-cpu langchain langchain-core langchain-community`);
            } else {
              throw new Error(`Python dependency missing: ${data.missingModule}. Please run: pip install -r JobAgent/requirements.txt`);
            }
          } else {
            throw new Error(data.message || 'Python installation or dependency issue. Please check your Python installation.');
          }
        }
        
        throw new Error(data.message || 'Failed to process job information');
      }
      
      // If we reach here, processing was successful
      useJobAgentStore.setState({
        generatedSummary: data.summary || null,
        generatedColdEmail: data.coldEmail || null,
        generatedInterviewPrep: data.interviewPrep || null,
        warnings: data.warnings || [],
        successMessage: 'Job information processed successfully!',
        retryCount: 0
      });
      
      // Scroll to results if any were generated
      if (data.summary || data.coldEmail || data.interviewPrep) {
        setTimeout(() => {
          const results = document.getElementById('job-agent-results');
          if (results) {
            results.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
      
    } catch (err) {
      const errorMessage = (err as Error).message || 'An error occurred while processing the job information.';
      if (!apiKeyMissing && !pythonError && !rateLimitExceeded) {
        useJobAgentStore.setState({ error: errorMessage });
      }
      
      // Only increment retry count for non-setup issues
      if (!apiKeyMissing && !pythonError && !rateLimitExceeded) {
        useJobAgentStore.setState({ retryCount: retryCount + 1 });
      }
    } finally {
      useJobAgentStore.setState({ isProcessing: false });
    }
  };
  
  // Function to reset the form and try again
  const handleReset = () => {
    useJobAgentStore.setState({
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
          <Briefcase className="mr-3 h-6 w-6 text-primary" />
          Job Agent
        </h1>
      </div>
      
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
            <li>Open the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">.env</code> file in the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">JobAgent</code> folder</li>
            <li>Add or update: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">GOOGLE_API_KEY=your-google-api-key-here</code></li>
            <li>Restart the application</li>
          </ol>
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
            <li>Close all running Python processes and terminals</li>
            <li>Navigate to the JobAgent directory in your terminal</li>
            <li>Run the following commands to install all required dependencies:</li>
            <li>
              <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded block mt-1 whitespace-pre-wrap">
                pip install -r requirements.txt
              </code>
            </li>
            <li>If you specifically need AI dependencies, run:</li>
            <li>
              <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded block mt-1 whitespace-pre-wrap">
                pip install faiss-cpu langchain langchain-core langchain-community
              </code>
            </li>
            <li>Restart your application</li>
          </ol>
          
          {error && (
            <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/40 rounded-md">
              <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">Error details:</p>
              <pre className="mt-1 text-xs text-blue-600 dark:text-blue-300 whitespace-pre-wrap overflow-x-auto max-h-32 scrollbar-thin">{error}</pre>
            </div>
          )}
        </motion.div>
      )}
      
      {error && error.includes('timed out') && !pythonError && !apiKeyMissing && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-amber-800 dark:text-amber-400 font-medium mb-2">
            <Clock className="h-5 w-5 mr-2 flex-shrink-0" />
            Operation Timed Out
          </h3>
          <p className="text-amber-700 dark:text-amber-300 text-sm mb-2">
            The operation took too long to complete. This could be due to:
          </p>
          <ul className="text-amber-700 dark:text-amber-300 text-sm list-disc ml-5 space-y-1">
            <li>Missing API keys for AI services</li>
            <li>Very large or complex job description</li>
            <li>Limited system resources</li>
          </ul>
          <div className="mt-3">
            <p className="text-amber-700 dark:text-amber-300 text-sm">Try the following:</p>
            <ol className="text-amber-700 dark:text-amber-300 text-sm list-decimal ml-5 space-y-1 mt-1">
              <li>Check that API keys are set in JobAgent/.env file</li>
              <li>Try with a shorter job description</li>
              <li>Ensure Python dependencies are installed: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">pip install -r JobAgent/requirements.txt</code></li>
            </ol>
          </div>
        </motion.div>
      )}
      
      {rateLimitExceeded && (
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
            The Google AI API rate limit has been exceeded. This is often a temporary issue.
          </p>
          <ol className="text-amber-700 dark:text-amber-300 text-sm list-decimal ml-5 space-y-1">
            <li>Wait a few minutes and try again</li>
            <li>The system will automatically use the simplified version in the meantime</li>
            <li>If this persists, you may need to check your Google API quota or upgrade your plan</li>
          </ol>
        </motion.div>
      )}
      
      {/* Performance Warning for AVX2 */}
      {hasAvx2Warning && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-blue-800 dark:text-blue-400 font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            Performance Notice
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
            The Job Agent is running without AVX2 hardware acceleration. This is normal and does not affect functionality, 
            but processing may be slightly slower.
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            For optimal performance on compatible hardware, you can try reinstalling the faiss-cpu package with:
            <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded block mt-1">
              pip uninstall faiss-cpu && pip install faiss-cpu
            </code>
          </p>
        </motion.div>
      )}
      
      {/* Warnings from API */}
      {warnings && warnings.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-blue-800 dark:text-blue-400 font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            Performance Notice
          </h3>
          {warnings.map((warning: string, index: number) => (
            <p key={index} className="text-blue-700 dark:text-blue-300 text-sm mb-2">
              {warning}
            </p>
          ))}
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
      
      {isProcessing && retryCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-yellow-800 dark:text-yellow-400 font-medium mb-2">
            <Loader2 className="h-5 w-5 mr-2 flex-shrink-0 animate-spin" />
            Processing Large Request
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-2">
            Processing this job description might take a bit longer. Large or complex job descriptions
            require more processing time. Please be patient.
          </p>
        </motion.div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Input Job Details
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="jobInput" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Job Description URL or Text
                </label>
                <textarea
                  id="jobInput"
                  value={jobInput}
                  onChange={(e) => useJobAgentStore.setState({ jobInput: e.target.value })}
                  placeholder="Enter a URL to a job listing or paste the job description text here"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor="candidateName" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    id="candidateName"
                    type="text"
                    value={candidateName}
                    onChange={(e) => useJobAgentStore.setState({ candidateName: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label 
                    htmlFor="candidateExperience" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Your Experience
                  </label>
                  <input
                    id="candidateExperience"
                    type="text"
                    value={candidateExperience}
                    onChange={(e) => useJobAgentStore.setState({ candidateExperience: e.target.value })}
                    placeholder="3 years of frontend development experience"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label 
                  htmlFor="interviewDate" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Interview Date (Optional)
                </label>
                <input
                  id="interviewDate"
                  type="text"
                  value={interviewDate}
                  onChange={(e) => useJobAgentStore.setState({ interviewDate: e.target.value })}
                  placeholder="e.g., March 30, 2024"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content to Generate
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={taskType === 'summary'}
                      onChange={() => useJobAgentStore.setState({ taskType: 'summary' })}
                      className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Summary Only</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={taskType === 'cold_email'}
                      onChange={() => useJobAgentStore.setState({ taskType: 'cold_email' })}
                      className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Cold Email Only</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={taskType === 'interview_prep'}
                      onChange={() => useJobAgentStore.setState({ taskType: 'interview_prep' })}
                      className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Interview Prep Only</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={taskType === 'all'}
                      onChange={() => useJobAgentStore.setState({ taskType: 'all' })}
                      className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">All</span>
                  </label>
                </div>
              </div>
            </div>
            
            {error && !apiKeyMissing && !pythonError && !rateLimitExceeded && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-start">
                <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                {error}
              </p>
            )}
            
            <button
              type="submit"
              disabled={isProcessing || !jobInput.trim()}
              className="px-5 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full md:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Results Sections */}
      {(generatedSummary || generatedColdEmail || generatedInterviewPrep) && (
        <div id="job-agent-results">
      {generatedSummary && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Job Description Summary
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="prose dark:prose-invert max-w-none">
                {generatedSummary.split('\n').map((line, index) => (
                  line.trim() === '' ? 
                    <br key={index} /> : 
                    <p key={index} className="my-2">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {generatedColdEmail && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-primary" />
              Cold Email
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="email-content prose dark:prose-invert max-w-none">
                {generatedColdEmail.split('\n').map((line, index) => {
                  // Format subject line
                  if (line.toLowerCase().startsWith('subject:')) {
                    return (
                      <h3 key={index} className="text-gray-900 dark:text-white font-medium my-2">
                        {line}
                      </h3>
                    );
                  }
                  
                  // Format salutation
                  if (line.startsWith('Dear') || line.startsWith('Hello') || line.startsWith('Hi')) {
                    return (
                      <p key={index} className="font-medium my-2">
                        {line}
                      </p>
                    );
                  }
                  
                  // Format signature
                  if (line.startsWith('Sincerely') || 
                      line.startsWith('Best regards') || 
                      line.startsWith('Regards') || 
                      line.startsWith('Thank you') || 
                      line.startsWith('Best') || 
                      line.startsWith('Yours')) {
                    return (
                      <p key={index} className="font-medium my-2">
                        {line}
                      </p>
                    );
                  }
                  
                  // Empty line
                  if (line.trim() === '') {
                    return <br key={index} />;
                  }
                  
                  // Default paragraph
                  return (
                    <p key={index} className="my-1">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {generatedInterviewPrep && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Interview Preparation Guide
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="prose dark:prose-invert max-w-none">
                {generatedInterviewPrep.split('\n').map((line, index) => {
                  // Check if line starts with a number followed by a period (list item)
                  if (/^\d+\.\s/.test(line)) {
                    return (
                      <div key={index} className="ml-4 my-2">
                        <strong>{line.split('.')[0]}.</strong> {line.split('.').slice(1).join('.').trim()}
                      </div>
                    );
                  }
                  
                  // Check if line is a section header
                  if (line.toUpperCase() === line && line.trim() !== '' && line.length > 3) {
                    return <h3 key={index} className="font-bold mt-4 mb-2">{line}</h3>;
                  }
                  
                  // Empty line
                  if (line.trim() === '') {
                    return <br key={index} />;
                  }
                  
                  // Default paragraph
                  return <p key={index} className="my-2">{line}</p>;
                })}
              </div>
            </div>
          </div>
        </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobAgentPage; 