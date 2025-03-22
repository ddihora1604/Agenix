'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useAnimation } from './Providers';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  animation?: 'fade' | 'scale' | 'none';
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      animation = 'none',
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const { animationPreference } = useAnimation();
    const shouldAnimate = animationPreference === 'full' && animation !== 'none';

    // Animation classes
    const animationClasses = shouldAnimate
      ? {
          fade: 'animate-fade-in',
          scale: 'animate-scale',
        }[animation] || ''
      : '';
    
    // Variant classes
    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive-hover',
      success: 'bg-success text-success-foreground hover:opacity-90',
    }[variant];
    
    // Size classes
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs rounded-md',
      md: 'h-10 px-4 py-2 text-sm rounded-md',
      lg: 'h-12 px-6 py-3 text-base rounded-lg',
      icon: 'h-10 w-10 rounded-full',
    }[size];
    
    // Width classes
    const widthClasses = fullWidth ? 'w-full' : '';
    
    // Disabled classes
    const isDisabled = disabled || isLoading;
    
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
          variantClasses,
          sizeClasses,
          widthClasses,
          animationClasses,
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!isLoading && leftIcon && (
          <span className={cn('mr-2', { 'mr-0': !children })}>
            {leftIcon}
          </span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className={cn('ml-2', { 'ml-0': !children })}>
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, type ButtonProps }; 