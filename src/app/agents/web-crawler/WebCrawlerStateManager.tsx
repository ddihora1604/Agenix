import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WebCrawlerState {
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  websiteContent: string;
  setWebsiteContent: (content: string) => void;
  question: string;
  setQuestion: (question: string) => void;
  answer: string;
  setAnswer: (answer: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  isQuerying: boolean;
  setIsQuerying: (isQuerying: boolean) => void;
  websiteTitle: string;
  setWebsiteTitle: (title: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  analysisComplete: boolean;
  setAnalysisComplete: (complete: boolean) => void;
}

const WebCrawlerContext = createContext<WebCrawlerState | undefined>(undefined);

export const WebCrawlerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteContent, setWebsiteContent] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [websiteTitle, setWebsiteTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  return (
    <WebCrawlerContext.Provider 
      value={{
        websiteUrl,
        setWebsiteUrl,
        websiteContent,
        setWebsiteContent,
        question,
        setQuestion,
        answer,
        setAnswer,
        isAnalyzing,
        setIsAnalyzing,
        isQuerying,
        setIsQuerying,
        websiteTitle,
        setWebsiteTitle,
        error,
        setError,
        analysisComplete,
        setAnalysisComplete
      }}
    >
      {children}
    </WebCrawlerContext.Provider>
  );
};

export const useWebCrawlerState = () => {
  const context = useContext(WebCrawlerContext);
  if (context === undefined) {
    throw new Error('useWebCrawlerState must be used within a WebCrawlerProvider');
  }
  return context;
}; 