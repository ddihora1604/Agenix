'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Loader2, AlertTriangle, CheckCircle2, Terminal, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { YouTubeSummarizerProvider, useYoutubeSummarizerState } from './YouTubeSummarizerStateManager';
import { cn } from '@/lib/utils';

// YouTube video URL validation regex
const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;

// YouTube Embed component
const YouTubeEmbed: React.FC<{ videoId: string }> = ({ videoId }) => {
  return (
    <div className="w-full rounded-lg overflow-hidden shadow-md aspect-video">
      <iframe 
        className="w-full h-full" 
        src={`https://www.youtube.com/embed/${videoId}`} 
        title="YouTube video player" 
        frameBorder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowFullScreen
      ></iframe>
    </div>
  );
};

// YouTube Summarizer Form Component
const YouTubeSummarizerForm: React.FC = () => {
  const router = useRouter();
  const { setShowYoutubeSummarizer } = useSidebarState();
  const { 
    videoUrl, setVideoUrl, 
    summary, setSummary, 
    thumbnailUrl, setThumbnailUrl,
    videoTitle, setVideoTitle
  } = useYoutubeSummarizerState();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [pythonError, setPythonError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Clear error messages when the video URL changes
  useEffect(() => {
    if (error || successMessage) {
      setError(null);
      setSuccessMessage(null);
      setApiKeyMissing(false);
      setPythonError(false);
    }
  }, [videoUrl]);

  // Function to extract video ID from URL
  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Function to format the summary for better readability
  const formatSummary = (text: string): string => {
    if (!text) return '';
    
    // Remove any extra whitespace
    let formatted = text.trim();
    
    // Ensure bullet points are properly formatted
    formatted = formatted.replace(/^[•*-]\s*/gm, '• ');
    
    // Add line breaks between paragraphs if they don't exist
    formatted = formatted.replace(/([^\n])\n([^\n•])/g, '$1\n\n$2');
    
    return formatted;
  };

  // Optimize video ID extraction - debounced to reduce unnecessary processing
  useEffect(() => {
    if (videoUrl && YOUTUBE_URL_REGEX.test(videoUrl)) {
      const extractedId = extractVideoId(videoUrl);
      if (extractedId) {
        setVideoId(extractedId);
      }
    }
  }, [videoUrl]);

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube video URL.');
      return;
    }
    
    if (!YOUTUBE_URL_REGEX.test(videoUrl)) {
      setError('Please enter a valid YouTube URL.');
      return;
    }
    
    // Extract video ID from URL - should already be set by the useEffect above
    const extractedVideoId = videoId || extractVideoId(videoUrl);
    if (!extractedVideoId) {
      setError('Invalid YouTube URL. Please check the URL and try again.');
      return;
    }
    
    await generateSummary(extractedVideoId);
  };

  // Function to generate summary
  const generateSummary = async (videoId: string) => {
    setVideoId(videoId);
    setError(null);
    setApiKeyMissing(false);
    setPythonError(false);
    setSuccessMessage(null);
    setSummary(''); // Clear previous summary
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/youtube-summarizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
        // Add a longer timeout for larger videos
        signal: AbortSignal.timeout(3 * 60 * 1000) // 3 minutes timeout
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check for API key related errors
        if (data.isApiKeyError) {
          setApiKeyMissing(true);
          throw new Error('Google API key is missing or invalid. Please set up your API key in the .env file.');
        }
        
        // Check for Python installation errors
        if (data.isPythonError || data.setupRequired || (data.message && (
          data.message.includes('python') || 
          data.message.includes('Python') ||
          data.message.includes('ModuleNotFound') ||
          data.message.includes('No module named')
        ))) {
          setPythonError(true);
          throw new Error(data.message || 'Python installation or dependency issue. Please check your Python installation.');
        }
        
        throw new Error(data.message || 'Failed to summarize video');
      }
      
      // Set video title if available
      if (data.videoTitle) {
        setVideoTitle(data.videoTitle);
      }
      
      // Set thumbnail URL
      if (data.thumbnailUrl) {
        setThumbnailUrl(data.thumbnailUrl);
      }
      
      // Set summary - format it for better readability
      setSummary(formatSummary(data.summary));
      setSuccessMessage('Video summarized successfully!');
      // Reset retry count on success
      setRetryCount(0);
    } catch (err) {
      const errorMessage = (err as Error).message || 'An error occurred while summarizing the video.';
      if (!apiKeyMissing && !pythonError) {
        setError(errorMessage);
      }
      
      // Only increment retry count for non-setup issues
      if (!apiKeyMissing && !pythonError) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to try again with the same URL
  const handleRetry = () => {
    if (videoId) {
      generateSummary(videoId);
    } else if (videoUrl) {
      const extractedId = extractVideoId(videoUrl);
      if (extractedId) {
        generateSummary(extractedId);
      }
    }
  };

  // Function to reset the form
  const handleReset = () => {
    setError(null);
    setApiKeyMissing(false);
    setPythonError(false);
    setRetryCount(0);
  };

  // Function to go back to agents page
  const handleBackClick = () => {
    router.push('/agents');
  };

  // Function to copy the summary to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">YouTube Video Summarizer</h1>
      </div>
      
      {/* Python Error */}
      {pythonError && !isGenerating && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-blue-800 dark:text-blue-400 font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            Python Setup Required
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
            There's an issue with Python or the required dependencies. The summarizer needs Python and specific packages to run.
          </p>
          <div className="bg-blue-100 dark:bg-blue-800/50 p-3 rounded-md mb-3 whitespace-pre-wrap">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
              <Terminal className="h-4 w-4 mr-1" />
              Setup Instructions
            </h4>
            <div className="text-xs text-blue-700 dark:text-blue-300">
              {error && error.includes("setupInstructions") ? (
                <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
              ) : (
                <ol className="list-decimal pl-4">
                  <li className="mb-1">Make sure Python 3.8+ is installed (<a href="https://www.python.org/downloads/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Download Python</a>)</li>
                  <li className="mb-1">Open a terminal/command prompt and run:</li>
                  <code className="block bg-blue-200 dark:bg-blue-800 p-1 rounded mb-2 text-xs">
                    pip install --user youtube-transcript-api google-generativeai python-dotenv
                  </code>
                  <li>Refresh this page and try again</li>
                </ol>
              )}
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors inline-flex items-center"
          >
            <Play className="w-4 h-4 mr-1" />
            Try Again After Setup
          </button>
        </motion.div>
      )}

      {/* API Key Missing Error */}
      {apiKeyMissing && !isGenerating && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-yellow-800 dark:text-yellow-400 font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            Google API Key Missing
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
            The Google API Key for the Gemini model is missing or invalid. The summarizer requires a valid API key to function.
          </p>
          <div className="bg-yellow-100 dark:bg-yellow-800/50 p-3 rounded-md mb-3 whitespace-pre-wrap">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2 flex items-center">
              <Terminal className="h-4 w-4 mr-1" />
              Setup Instructions
            </h4>
            <div className="text-xs text-yellow-700 dark:text-yellow-300">
              {error && error.includes("setupInstructions") ? (
                <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
              ) : (
                <ol className="list-decimal pl-4">
                  <li className="mb-1">Get a Gemini API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google AI Studio</a></li>
                  <li className="mb-1">Create or edit the <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">.env</code> file in your project root</li>
                  <li className="mb-1">Add the following line: <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">GOOGLE_API_KEY=your_api_key_here</code></li>
                  <li>Restart your development server</li>
                </ol>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* URL input form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enter YouTube Video URL</h2>
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={isGenerating}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </div>
        
        {/* Display the video player if we have a video ID */}
        {videoId && !isGenerating && !error && !apiKeyMissing && !pythonError && (
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
              Video Preview
            </h3>
            <YouTubeEmbed videoId={videoId} />
          </div>
        )}
      </form>

      {/* Loading indicator */}
      {isGenerating && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center"
        >
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Generating summary, please wait...</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">This may take a minute depending on the video length</p>
        </motion.div>
      )}

      {/* Error display with retry button */}
      {error && !isGenerating && !apiKeyMissing && !pythonError && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-red-800 dark:text-red-400 font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            Error
          </h3>
          <p className="text-red-700 dark:text-red-300 text-sm mb-3">
            {error}
          </p>
          <button
            onClick={handleRetry}
            className="px-3 py-1 text-sm bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </motion.div>
      )}

      {/* Summary output */}
      {summary && !isGenerating && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700"
        >
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <p className="text-green-700 dark:text-green-300 text-sm">{successMessage}</p>
            </div>
          )}
          
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Summary</h2>
            <div className="flex space-x-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          {videoTitle && (
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
              {videoTitle}
            </h3>
          )}
          
          <div className="prose dark:prose-invert max-w-none mt-4 text-gray-700 dark:text-gray-300">
            {summary.split('\n').map((line, i) => {
              // Check if line starts with a bullet point
              const isBulletPoint = line.trim().startsWith('•');
              return (
                <React.Fragment key={i}>
                  {line.trim() ? (
                    <p className={cn(
                      "my-1", 
                      isBulletPoint && "pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2.5 before:h-1.5 before:w-1.5 before:bg-blue-600 before:rounded-full dark:before:bg-blue-400"
                    )}>
                      {isBulletPoint ? line.trim().substring(1).trim() : line}
                    </p>
                  ) : <br />}
                </React.Fragment>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Main YouTube Summarizer Page component with state provider
const YouTubeSummarizerPage: React.FC = () => {
  return (
    <YouTubeSummarizerProvider>
      <YouTubeSummarizerForm />
    </YouTubeSummarizerProvider>
  );
};

export default YouTubeSummarizerPage; 