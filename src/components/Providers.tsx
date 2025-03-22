'use client';

import { ThemeProvider } from 'next-themes';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Animation context for controlling animations throughout the app
type AnimationContextType = {
  isAnimating: boolean;
  setIsAnimating: (value: boolean) => void;
  animationPreference: 'reduced' | 'full';
  setAnimationPreference: (value: 'reduced' | 'full') => void;
};

const AnimationContext = createContext<AnimationContextType>({
  isAnimating: false,
  setIsAnimating: () => {},
  animationPreference: 'full',
  setAnimationPreference: () => {},
});

export const useAnimation = () => useContext(AnimationContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPreference, setAnimationPreference] = useState<'reduced' | 'full'>(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      ? 'reduced' 
      : 'full'
  );

  useEffect(() => {
    setMounted(true);
    // Remove no-transitions class after mounting
    document.documentElement.classList.remove('no-transitions');
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setAnimationPreference(e.matches ? 'reduced' : 'full');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const animationContextValue = {
    isAnimating,
    setIsAnimating,
    animationPreference,
    setAnimationPreference
  };

  // Only show UI after mount to avoid hydration errors with theme
  if (!mounted) {
    return <div className="bg-background min-h-screen" />;
  }

  return (
    <AnimationContext.Provider value={animationContextValue}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem
        disableTransitionOnChange={animationPreference === 'reduced'}
      >
        {children}
      </ThemeProvider>
    </AnimationContext.Provider>
  );
} 