'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useThemeStore } from '@/store/theme';
import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark, toggleTheme } = useThemeStore();
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    
    // Check if this is a page reload
    const isReload = window.performance && 
      (window.performance.navigation.type === 1 || 
      (performance.getEntriesByType('navigation').length > 0 &&
      (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type === 'reload'));
    
    // If it's a reload and the theme is dark, set it to light
    if (isReload && isDark) {
      toggleTheme();
    }
  }, [isDark, toggleTheme]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  );
}