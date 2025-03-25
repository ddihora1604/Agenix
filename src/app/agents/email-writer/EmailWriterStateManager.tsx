'use client';

import { useEffect } from 'react';
import { useSidebarState } from '@/hooks/use-sidebar-state';

// This is a client component that manages sidebar state
// It doesn't render anything visible
export default function EmailWriterStateManager() {
  const { setShowEmailGenerator, showEmailGenerator } = useSidebarState();
  
  // Add a console log to confirm this component is rendering
  console.log("EmailWriterStateManager rendering, current showEmailGenerator =", showEmailGenerator);
  
  // If the page is loaded and showEmailGenerator is false, we'll set it to true
  // This ensures the Email Generation Agent is always visible in the sidebar
  useEffect(() => {
    // Only set it to true if it's currently false to avoid unnecessary state updates
    if (!showEmailGenerator) {
      console.log("EmailWriterStateManager - Setting showEmailGenerator to true");
      setShowEmailGenerator(true);
    }
  }, [setShowEmailGenerator, showEmailGenerator]);
  
  // This component doesn't render anything visible
  return null;
} 