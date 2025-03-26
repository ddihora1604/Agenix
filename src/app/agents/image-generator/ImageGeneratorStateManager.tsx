'use client';

import { useEffect } from 'react';
import { useSidebarState } from '@/hooks/use-sidebar-state';

// This is a client component that manages sidebar state
// It doesn't render anything visible
export default function ImageGeneratorStateManager() {
  const { setShowImageGenerator, showImageGenerator } = useSidebarState();
  
  // Add a console log to confirm this component is rendering
  console.log("ImageGeneratorStateManager rendering, current showImageGenerator =", showImageGenerator);
  
  // If the page is loaded and showImageGenerator is false, we'll set it to true
  // This ensures the Image Generator Agent is always visible in the sidebar
  useEffect(() => {
    // Only set it to true if it's currently false to avoid unnecessary state updates
    if (!showImageGenerator) {
      console.log("ImageGeneratorStateManager - Setting showImageGenerator to true");
      setShowImageGenerator(true);
    }
  }, [setShowImageGenerator, showImageGenerator]);
  
  // This component doesn't render anything visible
  return null;
} 