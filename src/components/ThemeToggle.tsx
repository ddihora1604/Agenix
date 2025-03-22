'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

const ThemeToggle: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 transition-colors duration-200">
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 
        hover:bg-gray-200 dark:hover:bg-gray-700 
        transition-all duration-200 ease-in-out"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun 
          className="absolute inset-0 h-5 w-5 text-amber-500 transition-all duration-200 
            transform rotate-0 scale-100 dark:-rotate-90 dark:scale-0" 
        />
        <Moon 
          className="absolute inset-0 h-5 w-5 text-blue-500 transition-all duration-200 
            transform rotate-90 scale-0 dark:rotate-0 dark:scale-100" 
        />
      </div>
    </button>
  );
};

export default ThemeToggle; 