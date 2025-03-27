'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Loader2, AlertTriangle, CheckCircle2, Terminal, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBlogWriterState } from './BlogWriterStateManager';

const BlogWriterPage: React.FC = () => {
  const router = useRouter();
  const [blogTopic, setBlogTopic] = useState('');
  const [generatedBlog, setGeneratedBlog] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pythonError, setPythonError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { setShowBlogWriter } = useBlogWriterState();
  const [isCopied, setIsCopied] = useState(false);
  const [apiKeyValidationInProgress, setApiKeyValidationInProgress] = useState(false);

  // Helper function to check the API key without exposing it
  const checkApiKey = async () => {
    try {
      setApiKeyValidationInProgress(true);
      const response = await fetch('/api/check-api-key', {
        method: 'GET',
      });
      
      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error("Error checking API key:", error);
      return false;
    } finally {
      setApiKeyValidationInProgress(false);
    }
  };

  useEffect(() => {
    // Clear error and success messages when the blog topic changes
    if (error || successMessage) {
      setError(null);
      setSuccessMessage(null);
      setApiKeyMissing(false);
      setPythonError(false);
    }
  }, [blogTopic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!blogTopic.trim()) {
      setError('Please enter a topic for your blog.');
      return;
    }
    
    setError(null);
    setApiKeyMissing(false);
    setPythonError(false);
    setSuccessMessage(null);
    setIsGenerating(true);
    
    console.log("Starting blog generation for topic:", blogTopic);
    
    try {
      // First check if the API key is valid
      console.log("Validating API key...");
      const isApiKeyValid = await checkApiKey();
      
      if (!isApiKeyValid) {
        console.error("API key validation failed");
        setApiKeyMissing(true);
        throw new Error('GROQ API key is missing or invalid. Please set up your API key in the .env file.');
      }
      
      console.log("API key validated, sending request to /api/blog-generator");
      const response = await fetch('/api/blog-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: blogTopic }),
      });
      
      console.log("Received response with status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      
      if (!response.ok) {
        // Check for API key related errors
        if (data.isApiKeyError) {
          console.error("API key error detected");
          setApiKeyMissing(true);
          throw new Error('GROQ API key is missing or invalid. Please set up your API key in the .env file.');
        }
        
        // Check for Python installation errors
        if (data.setupRequired || data.isPythonError || (data.message && (
          data.message.includes('python') || 
          data.message.includes('Python') ||
          data.message.includes('ModuleNotFound') ||
          data.message.includes('No module named')
        ))) {
          console.error("Python error detected");
          setPythonError(true);
          throw new Error(data.message || 'Python installation or dependency issue. Please check your Python installation.');
        }
        
        console.error("API error:", data.message);
        throw new Error(data.message || 'Failed to generate blog');
      }
      
      // If we reach here, blog was generated successfully
      console.log("Blog generated successfully");
        setGeneratedBlog(data.blogContent);
        setSuccessMessage('Blog generated successfully!');
        // Reset retry count on success
        setRetryCount(0);
    } catch (err) {
      console.error("Error during blog generation:", err);
      const errorMessage = (err as Error).message || 'An error occurred while generating the blog.';
      if (!apiKeyMissing && !pythonError) {
        setError(errorMessage);
      }
      
      // Only increment retry count for non-setup issues
      if (!apiKeyMissing && !pythonError) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      console.log("Finishing blog generation");
      setIsGenerating(false);
    }
  };

  // Function to reset the form and try again
  const handleReset = () => {
    setError(null);
    setApiKeyMissing(false);
    setPythonError(false);
    setRetryCount(0);
  };

  // Handle going back to the agents page
  const handleBackClick = () => {
    router.push('/agents');
  };

  // Copy content to clipboard
  const copyContent = () => {
    if (!generatedBlog) return;
    
    let blogText = `# ${generatedBlog.title}\n\n`;
    blogText += `${generatedBlog.meta_description}\n\n`;
    
    generatedBlog.sections.forEach((section: any) => {
      blogText += `## ${section.heading}\n\n`;
      blogText += `${section.content}\n\n`;
    });
    
    navigator.clipboard.writeText(blogText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blog Writer Agent</h1>
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
            This feature requires a GROQ API key to function. 
            Please follow these steps to set up your API key:
          </p>
          <ol className="text-amber-700 dark:text-amber-300 text-sm list-decimal ml-5 space-y-1">
            <li>Get a GROQ API key from <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline">GROQ Console</a></li>
            <li>Open the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">.env</code> file in the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">blog</code> folder</li>
            <li>Replace <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">your-groq-api-key-here</code> with your actual API key</li>
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
            <li><code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded block mt-1 whitespace-pre-wrap">pip install --user langchain==0.1.9 langchain-groq python-dotenv rich pydantic</code></li>
            <li>If the above command fails, try: <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded block mt-1 whitespace-pre-wrap">python -m pip install --user --no-cache-dir langchain==0.1.9 langchain-groq python-dotenv rich pydantic</code></li>
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
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center text-green-800 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </motion.div>
      )}
      
      {error && !apiKeyMissing && !pythonError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center text-red-800 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="font-medium">Error: {error}</span>
          </div>
          <button 
            onClick={handleReset}
            className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
          >
            Try again
          </button>
        </motion.div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="order-2 lg:order-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enter Blog Topic</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Provide a topic or description and our AI will create a well-structured blog post
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div className="space-y-4">
                <div>
                  <label htmlFor="blogTopic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blog Topic
                  </label>
                  <textarea
                    id="blogTopic"
                    rows={4}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500"
                    placeholder="Enter a topic for your blog. For example: 'The Future of Artificial Intelligence in Healthcare' or 'Best Practices for Sustainable Living'"
                    value={blogTopic}
                    onChange={(e) => setBlogTopic(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isGenerating || !blogTopic.trim()}
                  className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isGenerating || !blogTopic.trim() 
                      ? 'bg-blue-400 dark:bg-blue-700 cursor-not-allowed' 
                      : 'bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-500'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Generate Blog
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="order-1 lg:order-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Blog</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Your AI-generated blog will appear here
                </p>
              </div>
              
              {generatedBlog && (
                <button
                  onClick={copyContent}
                  className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Copy to clipboard"
                >
                  {isCopied ? (
                    <span className="flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </span>
                  )}
                </button>
              )}
            </div>
            
            <div className="p-5 overflow-auto max-h-[500px]">
              {!generatedBlog && !isGenerating && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Enter a blog topic and click "Generate Blog" to create content
                  </p>
                </div>
              )}
              
              {isGenerating && (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-500 dark:text-blue-400" />
                  <p className="mt-2 text-gray-600 dark:text-gray-300">Generating your blog post...</p>
                </div>
              )}
              
              {generatedBlog && (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{generatedBlog.title}</h1>
                    <p className="text-sm italic text-gray-600 dark:text-gray-400 mt-2">
                      {generatedBlog.meta_description}
                    </p>
                  </div>
                  
                  {generatedBlog.sections.map((section: any, index: number) => (
                    <div key={index} className="mt-6">
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        {section.heading}
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-line">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogWriterPage; 