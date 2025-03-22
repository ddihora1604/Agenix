import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AnimationOptions = {
  duration?: number; // in ms
  delay?: number; // in ms
  timing?: string; // CSS timing function
  once?: boolean; // animate only once
};

export const createAnimationClasses = (
  type: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'rotate',
  options: AnimationOptions = {}
) => {
  const { 
    duration = 300, 
    delay = 0, 
    timing = 'ease-out',
    once = false
  } = options;
  
  const baseStyle = `transition-all duration-${duration} ${timing} delay-${delay}`;
  
  let animationClass = '';
  switch (type) {
    case 'fade':
      animationClass = 'animate-fade-in';
      break;
    case 'slide-up':
      animationClass = 'animate-slide-up';
      break;
    case 'slide-down':
      animationClass = 'animate-slide-down';
      break;
    case 'slide-right':
      animationClass = 'animate-slide-in-right';
      break;
    case 'slide-left':
      animationClass = 'animate-slide-in-left';
      break;
    case 'scale':
      animationClass = 'animate-scale';
      break;
    case 'rotate':
      animationClass = 'animate-spin-slow';
      break;
  }
  
  return `${baseStyle} ${animationClass}`;
};

// Function to format currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Function to format large numbers
export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Function to create a debounced function
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};

// Function to get contrast text color (light or dark) based on background
export const getContrastColor = (hexColor: string) => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance - using the formula for relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Function to generate a random ID
export const generateId = (length = 8) => {
  return Math.random().toString(36).substring(2, 2 + length);
};