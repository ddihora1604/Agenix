'use client';

import { ThemeProvider } from 'next-themes';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useThemeStore } from '@/store/theme';
import { SidebarProvider } from '@/hooks/use-sidebar-state';

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
  const { setLightTheme } = useThemeStore();

  useEffect(() => {
    setMounted(true);
    // Remove no-transitions class after mounting
    document.documentElement.classList.remove('no-transitions');
    
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setAnimationPreference(e.matches ? 'reduced' : 'full');
    };
    
    // Ensure light theme is set on first load
    setLightTheme();
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setLightTheme]);

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
    <SidebarProvider>
      <AnimationContext.Provider value={animationContextValue}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={false}
          disableTransitionOnChange={animationPreference === 'reduced'}
        >
          {children}
        </ThemeProvider>
      </AnimationContext.Provider>
    </SidebarProvider>
  );
} 