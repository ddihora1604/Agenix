'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

interface SidebarState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  showEmailGenerator: boolean;
  setShowEmailGenerator: (show: boolean) => void;
  showDocumentSummarizer: boolean;
  setShowDocumentSummarizer: (show: boolean) => void;
  showYoutubeSummarizer: boolean;
  setShowYoutubeSummarizer: (show: boolean) => void;
  showWebCrawler: boolean;
  setShowWebCrawler: (show: boolean) => void;
  showImageGenerator: boolean;
  setShowImageGenerator: (show: boolean) => void;
  showBlogWriter: boolean;
  setShowBlogWriter: (show: boolean) => void;
  showJobAgent: boolean;
  setShowJobAgent: (show: boolean) => void;
}

const SidebarContext = React.createContext<SidebarState | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Set default states directly without checking localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [showEmailGenerator, setShowEmailGenerator] = useState<boolean>(false);
  const [showDocumentSummarizer, setShowDocumentSummarizer] = useState(false);
  const [showYoutubeSummarizer, setShowYoutubeSummarizer] = useState(false);
  const [showWebCrawler, setShowWebCrawler] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showBlogWriter, setShowBlogWriter] = useState(false);
  const [showJobAgent, setShowJobAgent] = useState(false);

  const toggleSidebar = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
  };
  
  // Update all the setter functions to remove localStorage persistence
  const persistentSetShowEmailGenerator = (show: boolean) => {
    setShowEmailGenerator(show);
  };
  
  const persistentSetShowDocumentSummarizer = (show: boolean) => {
    setShowDocumentSummarizer(show);
  };
  
  const persistentSetShowYoutubeSummarizer = (show: boolean) => {
    setShowYoutubeSummarizer(show);
  };
  
  const persistentSetShowWebCrawler = (show: boolean) => {
    setShowWebCrawler(show);
  };
  
  const persistentSetShowImageGenerator = (show: boolean) => {
    setShowImageGenerator(show);
  };
  
  const persistentSetShowBlogWriter = (show: boolean) => {
    setShowBlogWriter(show);
  };
  
  const persistentSetShowJobAgent = (show: boolean) => {
    setShowJobAgent(show);
  };

  return (
    <SidebarContext.Provider 
      value={{ 
        sidebarCollapsed, 
        toggleSidebar,
        showEmailGenerator,
        setShowEmailGenerator: persistentSetShowEmailGenerator,
        showDocumentSummarizer,
        setShowDocumentSummarizer: persistentSetShowDocumentSummarizer,
        showYoutubeSummarizer,
        setShowYoutubeSummarizer: persistentSetShowYoutubeSummarizer,
        showWebCrawler,
        setShowWebCrawler: persistentSetShowWebCrawler,
        showImageGenerator,
        setShowImageGenerator: persistentSetShowImageGenerator,
        showBlogWriter,
        setShowBlogWriter: persistentSetShowBlogWriter,
        showJobAgent,
        setShowJobAgent: persistentSetShowJobAgent
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export function useSidebarState() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarState must be used within a SidebarProvider');
  }
  return context;
} 