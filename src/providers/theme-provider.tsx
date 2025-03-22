'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useThemeStore } from '@/store/theme';
import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark, toggleTheme } = useThemeStore();
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={isDark ? 'dark' : 'light'}
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  );
}