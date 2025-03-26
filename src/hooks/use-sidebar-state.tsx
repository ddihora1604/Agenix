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
}

const SidebarContext = React.createContext<SidebarState | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check local storage for persisted sidebar state (collapsed)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  // Make showEmailGenerator persistent by storing in localStorage
  const [showEmailGenerator, setShowEmailGenerator] = useState<boolean>(false);
  const [showDocumentSummarizer, setShowDocumentSummarizer] = useState(false);
  const [showYoutubeSummarizer, setShowYoutubeSummarizer] = useState(false);

  // Load sidebar states from localStorage on mount
  useEffect(() => {
    const storedCollapsedValue = localStorage.getItem('sidebarCollapsed');
    if (storedCollapsedValue !== null) {
      setSidebarCollapsed(storedCollapsedValue === 'true');
    }
    
    // Load showEmailGenerator state from localStorage
    const storedEmailGenValue = localStorage.getItem('showEmailGenerator');
    if (storedEmailGenValue !== null) {
      setShowEmailGenerator(storedEmailGenValue === 'true');
    }
    
    // Load showDocumentSummarizer state from localStorage
    const storedDocSummarizerValue = localStorage.getItem('showDocumentSummarizer');
    if (storedDocSummarizerValue !== null) {
      setShowDocumentSummarizer(storedDocSummarizerValue === 'true');
    }
    
    // Load showYoutubeSummarizer state from localStorage
    const storedYoutubeSummarizerValue = localStorage.getItem('showYoutubeSummarizer');
    if (storedYoutubeSummarizerValue !== null) {
      setShowYoutubeSummarizer(storedYoutubeSummarizerValue === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
    localStorage.setItem('sidebarCollapsed', String(newValue));
  };
  
  // Update the setShowEmailGenerator function to persist state
  const persistentSetShowEmailGenerator = (show: boolean) => {
    setShowEmailGenerator(show);
    localStorage.setItem('showEmailGenerator', String(show));
  };
  
  // Update the setShowDocumentSummarizer function to persist state
  const persistentSetShowDocumentSummarizer = (show: boolean) => {
    setShowDocumentSummarizer(show);
    localStorage.setItem('showDocumentSummarizer', String(show));
  };
  
  // Update the setShowYoutubeSummarizer function to persist state
  const persistentSetShowYoutubeSummarizer = (show: boolean) => {
    setShowYoutubeSummarizer(show);
    localStorage.setItem('showYoutubeSummarizer', String(show));
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
        setShowYoutubeSummarizer: persistentSetShowYoutubeSummarizer
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