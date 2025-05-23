'use client';

import React, { useEffect } from 'react';
import { ArrowLeft, Send, Loader2, AlertTriangle, CheckCircle2, Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { useEmailWriterStore } from '@/store/email-writer-store';

const EmailWriterPage: React.FC = () => {
  const router = useRouter();
  const { setShowEmailGenerator } = useSidebarState();
  
  // Use the Zustand store
  const {
    emailPrompt, 
    generatedEmail, 
    isGenerating, 
    error, 
    apiKeyMissing, 
    successMessage, 
    pythonError, 
    retryCount, 
    isCopied
  } = useEmailWriterStore();
  
  // Define setter functions
  const setEmailPrompt = (value: string) => {
    useEmailWriterStore.setState({ emailPrompt: value });
  };
  
  const setGeneratedEmail = (value: string) => {
    useEmailWriterStore.setState({ generatedEmail: value });
  };
  
  const setIsGenerating = (value: boolean) => {
    useEmailWriterStore.setState({ isGenerating: value });
  };
  
  const setError = (value: string | null) => {
    useEmailWriterStore.setState({ error: value });
  };
  
  const setApiKeyMissing = (value: boolean) => {
    useEmailWriterStore.setState({ apiKeyMissing: value });
  };
  
  const setSuccessMessage = (value: string | null) => {
    useEmailWriterStore.setState({ successMessage: value });
  };
  
  const setPythonError = (value: boolean) => {
    useEmailWriterStore.setState({ pythonError: value });
  };
  
  const setRetryCount = (value: number) => {
    useEmailWriterStore.setState({ retryCount: value });
  };
  
  const setIsCopied = (value: boolean) => {
    useEmailWriterStore.setState({ isCopied: value });
  };
  
  // Helper function to update multiple states at once
  const updateMultipleStates = (updates: Partial<any>) => {
    useEmailWriterStore.setState(updates);
  };

  useEffect(() => {
    // Clear error and success messages when the email prompt changes
    if (error || successMessage) {
      updateMultipleStates({
        error: null,
        successMessage: null,
        apiKeyMissing: false,
        pythonError: false
      });
    }
  }, [emailPrompt, error, successMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailPrompt.trim()) {
      setError('Please enter a description for your email.');
      return;
    }
    
    updateMultipleStates({
      error: null,
      apiKeyMissing: false,
      pythonError: false,
      successMessage: null,
      isGenerating: true
    });
    
    try {
      const response = await fetch('/api/email-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: emailPrompt }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check for API key related errors
        if (data.isApiKeyError) {
          setApiKeyMissing(true);
          throw new Error('Google API key is missing or invalid. Please set up your API key in the .env file.');
        }
        
        // Check for Python installation errors - use the setupRequired flag if available
        if (data.setupRequired || data.isPythonError || (data.message && (
          data.message.includes('python') || 
          data.message.includes('Python') ||
          data.message.includes('ModuleNotFound') ||
          data.message.includes('No module named')
        ))) {
          setPythonError(true);
          throw new Error(data.message || 'Python installation or dependency issue. Please check your Python installation.');
        }
        
        // Check for Pydantic compatibility issues
        if (data.isPydanticError || (data.message && (
          data.message.includes('Pydantic') ||
          data.message.includes('pydantic') ||
          data.message.includes('compatibility')
        ))) {
          // These issues usually resolve after a refresh
          setError("Compatibility issue detected. Please try your request again, as we've updated the compatibility settings.");
          // Reset retry count because it's a fixable issue
          setRetryCount(0);
          throw new Error(data.message || 'Compatibility issue detected');
        }
        
        throw new Error(data.message || 'Failed to generate email');
      }
      
      // If we reach here, email was generated successfully
      updateMultipleStates({
        generatedEmail: data.emailContent,
        successMessage: 'Email generated successfully!',
        retryCount: 0
      });
    } catch (err) {
      const errorMessage = (err as Error).message || 'An error occurred while generating the email.';
      if (!apiKeyMissing && !pythonError) {
        setError(errorMessage);
      }
      
      // Only increment retry count for non-setup issues
      if (!apiKeyMissing && !pythonError) {
        setRetryCount(retryCount + 1);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to reset the form and try again
  const handleReset = () => {
    updateMultipleStates({
      error: null,
      apiKeyMissing: false,
      pythonError: false,
      retryCount: 0
    });
  };

  // Handle going back to the agents page
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Professional Email Writer</h1>
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
            This feature requires a Google API key for Gemini 1.5 Flash to function. 
            Please follow these steps to set up your API key:
          </p>
          <ol className="text-amber-700 dark:text-amber-300 text-sm list-decimal ml-5 space-y-1">
            <li>Get a Google API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
            <li>Open the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">.env</code> file in the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">Email_Generator_Agent</code> folder</li>
            <li>Replace <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">your-google-api-key-here</code> with your actual API key</li>
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
            This feature requires Python and some dependencies to be installed. 
            Please follow these steps:
          </p>
          <ol className="text-blue-700 dark:text-blue-300 text-sm list-decimal ml-5 space-y-1">
            <li>Make sure <a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" className="underline">Python 3.8+</a> is installed and added to your PATH</li>
            <li>Close all running Python processes and terminals</li>
            <li>Run the following command in a new terminal window to install dependencies:</li>
            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded block mt-1 whitespace-pre-wrap">pip install --user langchain==0.1.9 langchain-google-genai==0.0.11 python-dotenv==1.0.1 colorama==0.4.6 google-generativeai{'>'}=0.3.0</code></li>
            <li>If the above command fails, try: <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded block mt-1 whitespace-pre-wrap">python -m pip install --user --no-cache-dir langchain==0.1.9 langchain-google-genai==0.0.11 python-dotenv==1.0.1 colorama==0.4.6 google-generativeai{'>'}=0.3.0</code></li>
            <li>Restart your application</li>
          </ol>
          {retryCount > 1 && (
            <div className="mt-4 bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
              <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">Still having issues?</p>
              <ul className="text-blue-700 dark:text-blue-300 text-sm list-disc ml-5 mt-2 space-y-1">
                <li>Make sure you don't have any Python processes running that might lock files</li>
                <li>Check if your Python installation has write permissions</li>
                <li>Try running the command as administrator</li>
                <li>Try restarting your computer and then trying again</li>
                <li>Ensure Python is in your system PATH by running <code className="bg-blue-200 dark:bg-blue-800 px-1 py-0.5 rounded">python --version</code> in a command prompt</li>
              </ul>
            </div>
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
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          {/* <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Describe the email you want to generate
          </h2> */}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              {/* <label 
                htmlFor="emailPrompt" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Details
              </label> */}
              <textarea
                id="emailPrompt"
                value={emailPrompt}
                onChange={(e) => setEmailPrompt(e.target.value)}
                placeholder="Please provide details for your email, including its purpose, recipient, key points, deadlines or attachments, preferred tone (formal, friendly, urgent, etc.), and your name and role (if relevant) to generate a well-structured email."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-h-[1px]"
                rows={2}
              />
              {error && !apiKeyMissing && !pythonError && retryCount <= 2 && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-start">
                  <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  {error}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isGenerating || !emailPrompt.trim()}
              className="px-5 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generate Email
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      {generatedEmail && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Generated Email
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="email-content prose dark:prose-invert max-w-none">
                {generatedEmail.split('\n').map((line, index) => {
                  // Format subject line
                  if (line.toLowerCase().startsWith('subject:')) {
                    return (
                      <h3 key={index} className="text-gray-900 dark:text-white font-medium my-2">
                        {line}
                      </h3>
                    );
                  }
                  
                  // Format date with time
                  if ((/^\w+,\s+\w+\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}:\d{2}\s+(AM|PM)$/).test(line.trim()) || 
                      (/^\w+,\s+\w+\s+\d{1,2},\s+\d{4}$/).test(line.trim()) || 
                      (/^\d{1,2}\/\d{1,2}\/\d{4}$/).test(line.trim()) ||
                      (/^\d{1,2}\s+\w+\s+\d{4}$/).test(line.trim()) ||
                      line.includes(' at ') && (line.includes('AM') || line.includes('PM'))) {
                    return (
                      <p key={index} className="text-gray-500 dark:text-gray-400 text-sm my-1 font-medium">
                        {line}
                      </p>
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
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedEmail);
                  setSuccessMessage('Email copied to clipboard!');
                  setIsCopied(true);
                  setTimeout(() => setSuccessMessage(null), 3000);
                  setTimeout(() => setIsCopied(false), 5000);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors duration-300 ${
                  isCopied 
                    ? "bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700" 
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                }`}
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EmailWriterPage; 