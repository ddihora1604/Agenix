'use client';

import { useEffect } from 'react';
import { useSidebarState } from '@/hooks/use-sidebar-state';

// This is a client component that manages sidebar state
// It doesn't render anything visible
export default function CaseStudyAgentStateManager() {
  const { setCaseStudyAgent, showCaseStudyAgent } = useSidebarState();
  
  // Add a console log to confirm this component is rendering
  console.log("CaseStudyAgentStateManager rendering, current showCaseStudyAgent =", showCaseStudyAgent);
  
  // If the page is loaded and showCaseStudyAgent is false, we'll set it to true
  // This ensures the Case Study Agent is always visible in the sidebar
  useEffect(() => {
    // Only set it to true if it's currently false to avoid unnecessary state updates
    if (!showCaseStudyAgent) {
      console.log("CaseStudyAgentStateManager - Setting showCaseStudyAgent to true");
      setCaseStudyAgent(true);
    }
  }, [setCaseStudyAgent, showCaseStudyAgent]);
  
  // This component doesn't render anything visible
  return null;
} 