'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

type SidebarContextType = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  showEmailGenerator: boolean;
  setShowEmailGenerator: (show: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Check local storage for persisted sidebar state (collapsed)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  // Make showEmailGenerator persistent by storing in localStorage
  const [showEmailGenerator, setShowEmailGenerator] = useState<boolean>(false);

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

  return (
    <SidebarContext.Provider 
      value={{ 
        sidebarCollapsed, 
        toggleSidebar,
        showEmailGenerator,
        setShowEmailGenerator: persistentSetShowEmailGenerator
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarState must be used within a SidebarProvider');
  }
  return context;
} 