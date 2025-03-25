import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { resetAppState } from '@/utils/resetProjectData';

export const useReloadHandler = () => {
  const router = useRouter();
  const hasLoaded = useRef(false);
  
  useEffect(() => {
    // Check if this is a page reload (not navigation)
    // performance.navigation is deprecated but still widely supported
    const isReload = window.performance && 
      (window.performance.navigation.type === 1 || 
      // For newer browsers using Navigation Timing API
      (performance.getEntriesByType('navigation').length > 0 &&
      (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type === 'reload'));
      
    // Only run on reload and when component has not already handled a load
    if (isReload && !hasLoaded.current) {
      // Mark as handled
      hasLoaded.current = true;
      
      // Reset app state and get home route
      const homeRoute = resetAppState();
      
      // Redirect to home page
      router.push(homeRoute);
    }
    
    // Mark as loaded on first render to avoid false reload detection
    if (!hasLoaded.current) {
      hasLoaded.current = true;
    }
  }, [router]);
}; 