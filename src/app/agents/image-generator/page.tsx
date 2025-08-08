'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Loader2, AlertTriangle, CheckCircle2, Terminal, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import Image from 'next/image';

const ImageGeneratorPage: React.FC = () => {
  const router = useRouter();
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [generatedImageTitle, setGeneratedImageTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [falBalanceError, setFalBalanceError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pythonError, setPythonError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const { setShowImageGenerator } = useSidebarState();

  // Track if component is mounted
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // Clear error and success messages when the image prompt changes
    if (error || successMessage) {
      setError(null);
      setSuccessMessage(null);
      setApiKeyMissing(false);
      setFalBalanceError(false);
      setPythonError(false);
    }
  }, [imagePrompt]);

  // Create a memoized submit handler to avoid recreating this function on every render
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imagePrompt.trim()) {
      setError('Please enter a description for your image.');
      return;
    }
    
    // Reset all states
    setError(null);
    setApiKeyMissing(false);
    setPythonError(false);
    setSuccessMessage(null);
    setIsGenerating(true);
    setGeneratedImageUrl('');
    setImageLoaded(false);
    setImageLoadError(false);
    setProcessingTime(null);
    
    // Record start time for performance tracking
    const startTime = performance.now();
    
    try {
      console.log('Submitting image generation request...');
      const response = await fetch('/api/image-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      
      const data = await response.json();
      
      // Calculate total request time
      const requestTime = (performance.now() - startTime) / 1000;
      console.log(`Image generation request completed in ${requestTime.toFixed(2)} seconds`);
      
      if (!response.ok) {
        // Check for FAL API balance errors
        if (data.isFalBalanceError) {
          console.error('FAL balance error:', data.message);
          setFalBalanceError(true);
          throw new Error('FAL API account has insufficient balance. Please top up your balance at fal.ai/dashboard/billing to continue generating images.');
        }
        
        // Check for API key related errors
        if (data.isApiKeyError) {
          console.error('API key error:', data.message);
          setApiKeyMissing(true);
          throw new Error('FAL API key is missing or invalid. Please set up your API key in the .env file.');
        }
        
        // Check for Python installation errors
        if (data.isPythonError || (data.message && (
          data.message.includes('python') || 
          data.message.includes('Python') ||
          data.message.includes('ModuleNotFound') ||
          data.message.includes('No module named')
        ))) {
          console.error('Python error:', data.message, data.details);
          setPythonError(true);
          throw new Error(data.message || 'Python installation or dependency issue. Please check your Python installation.');
        }
        
        console.error('Image generation failed:', data.message, data.details);
        throw new Error(data.message || 'Failed to generate image');
      }
      
      // Successfully generated the image
      console.log('Image generation successful:', data);
      setGeneratedImageUrl(data.imageUrl);
      setGeneratedImageTitle(data.title || imagePrompt);
      setProcessingTime(data.processingTime || requestTime);
      setSuccessMessage('Image generated successfully!');
      
    } catch (err: any) {
      console.error('Error during image generation:', err);
      setRetryCount(prev => prev + 1);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      if (isMounted) {
        setIsGenerating(false);
      }
    }
  }, [imagePrompt, isMounted]);

  // Retry image generation
  const handleRetry = useCallback(() => {
    if (imagePrompt.trim()) {
      // Create a synthetic event
      const event = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(event);
    }
  }, [handleSubmit, imagePrompt]);

  // Handle back button click
  const handleBackClick = useCallback(() => {
    router.push('/agents');
  }, [router]);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageLoadError(false);
  }, []);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageLoaded(false);
    setImageLoadError(true);
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Image Generator Agent</h1>
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
            This feature requires a FAL API key to function. 
            Please follow these steps to set up your API key:
          </p>
          <ol className="text-amber-700 dark:text-amber-300 text-sm list-decimal ml-5 space-y-1">
            <li>Get a FAL API key from <a href="https://www.fal.ai/" target="_blank" rel="noopener noreferrer" className="underline">FAL.ai</a></li>
            <li>Create a <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">.env</code> file in the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">Fluxai/Fluxai</code> folder if it doesn't exist</li>
            <li>Add the line <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">FAL_API_KEY=your-fal-api-key-here</code> with your actual API key</li>
            <li>Restart the application</li>
          </ol>
        </motion.div>
      )}

      {falBalanceError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-red-800 dark:text-red-400 font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            Insufficient Balance
          </h3>
          <p className="text-red-700 dark:text-red-300 text-sm mb-3">
            Your FAL API account has insufficient balance to generate images. 
            Please top up your account to continue using this feature.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a 
              href="https://www.fal.ai/dashboard/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Top Up Balance
            </a>
            <button
              onClick={() => {
                setFalBalanceError(false);
                setError(null);
              }}
              className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md transition-colors"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {pythonError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-amber-800 dark:text-amber-400 font-medium mb-2">
            <Terminal className="h-5 w-5 mr-2 flex-shrink-0" />
            Python Environment Setup Required
          </h3>
          <p className="text-amber-700 dark:text-amber-300 text-sm mb-2">
            This feature requires Python and some dependencies. Please follow these steps:
          </p>
          <ol className="text-amber-700 dark:text-amber-300 text-sm list-decimal ml-5 space-y-1">
            <li>Ensure Python 3.8 or higher is installed on your system</li>
            <li>Navigate to the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">Fluxai/Fluxai</code> folder</li>
            <li>For automatic setup, run: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">node setup.js</code> and follow the prompts</li>
            <li>Or for manual setup, run: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">pip install -r requirement.txt</code></li>
            <li>Restart the application after completing the setup</li>
          </ol>
          <p className="text-amber-700 dark:text-amber-300 text-sm mt-2">
            For detailed instructions, please check the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">README.md</code> file in the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">Fluxai/Fluxai</code> folder.
          </p>
        </motion.div>
      )}
      
      {successMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4"
        >
          <h3 className="flex items-center text-green-800 dark:text-green-400 font-medium">
            <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
            {successMessage}
          </h3>
          {processingTime && (
            <p className="text-green-700 dark:text-green-300 text-sm mt-1">
              Processing time: {processingTime.toFixed(2)} seconds
            </p>
          )}
        </motion.div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <textarea
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image you want to generate in detail. Be specific about style, content, colors, mood, etc."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-h-[120px]"
                rows={4}
              />
              {error && !apiKeyMissing && !falBalanceError && !pythonError && retryCount <= 2 && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-start">
                  <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  {error}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isGenerating || !imagePrompt.trim()}
                className="flex-1 px-5 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </button>
              
              {generatedImageUrl && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isGenerating || !imagePrompt.trim()}
                  className="px-3 py-2.5 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Regenerate with same prompt"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {generatedImageUrl && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {generatedImageTitle}
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="relative w-full aspect-square max-w-xl mx-auto">
                {!imageLoaded && !imageLoadError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                )}
                
                {imageLoadError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-red-500">
                    <AlertTriangle className="h-8 w-8 mb-2" />
                    <p className="text-sm">Failed to load image</p>
                    <button
                      onClick={handleRetry}
                      className="mt-3 px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                )}
                
                <Image 
                  src={generatedImageUrl}
                  alt={generatedImageTitle}
                  fill
                  className={`object-contain rounded-md transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  sizes="(max-width: 768px) 100vw, 600px"
                  priority
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              <a 
                href={generatedImageUrl}
                target="_blank"
                rel="noopener noreferrer" 
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                View Full Size
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ImageGeneratorPage; 