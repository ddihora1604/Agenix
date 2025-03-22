'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAnimation } from './Providers';

const ThemeToggle: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, theme, setTheme } = useTheme();
  const { animationPreference } = useAnimation();
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = () => {
    // Cycle through themes: light -> dark -> system
    let newTheme: string;
    switch (theme) {
      case 'light':
        newTheme = 'dark';
        break;
      case 'dark':
        newTheme = 'system';
        break;
      default:
        newTheme = 'light';
        break;
    }
    
    setIsChanging(true);
    setTheme(newTheme);
    
    // Reset animation state after a brief delay
    setTimeout(() => setIsChanging(false), 600);
  };

  if (!mounted) {
    return (
      <button 
        className="p-2.5 rounded-full bg-secondary/50 shadow-sm" 
        disabled
        aria-label="Loading theme toggle"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-[18px] w-[18px] text-amber-500" />;
      case 'dark':
        return <Moon className="h-[18px] w-[18px] text-blue-400" />;
      default:
        return <Monitor className="h-[18px] w-[18px] text-gray-500 dark:text-gray-400" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode active, click to switch to dark mode';
      case 'dark':
        return 'Dark mode active, click to switch to system theme';
      default:
        return 'System theme active, click to switch to light mode';
    }
  };

  const animationClass = animationPreference === 'reduced' ? '' : isChanging ? 'animate-spin-slow' : 'animate-scale';

  return (
    <button
      onClick={handleThemeChange}
      className={`
        relative p-2.5 rounded-full 
        bg-secondary/50 hover:bg-secondary 
        dark:bg-secondary/30 dark:hover:bg-secondary/50 
        shadow-sm hover:shadow
        transition-all duration-300 ease-out
        ${animationClass}
      `}
      aria-label={getLabel()}
      title={theme === 'light' ? 'Light Mode' : theme === 'dark' ? 'Dark Mode' : 'System Theme'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {getIcon()}
      </div>
    </button>
  );
};

export default ThemeToggle; 