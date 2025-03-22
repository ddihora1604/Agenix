'use client';

import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useAnimation } from './Providers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'filled' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  animation?: 'fade' | 'slide-up' | 'scale' | 'none';
  animationDelay?: number;
  withBorder?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      hover = true,
      animation = 'none',
      animationDelay = 0,
      withBorder = true,
      children,
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
          'slide-up': 'animate-slide-up',
          scale: 'animate-scale',
        }[animation] || ''
      : '';
    
    // Size classes
    const sizeClasses = {
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    }[size];
    
    // Variant classes
    const variantClasses = {
      default: 'bg-card text-card-foreground',
      outline: 'bg-transparent border-2 border-border',
      filled: 'bg-primary/5 dark:bg-primary/10',
      ghost: 'bg-transparent',
    }[variant];
    
    // Hover effect
    const hoverClasses = hover
      ? 'transition-all duration-300 hover:shadow-md'
      : '';
    
    // Border
    const borderClasses = withBorder && variant !== 'outline' ? 'border border-border' : '';
    
    // Animation delay
    const delayStyle = shouldAnimate && animationDelay > 0 
      ? { animationDelay: `${animationDelay}ms` } 
      : {};

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg shadow-sm overflow-hidden',
          variantClasses,
          sizeClasses,
          borderClasses,
          hoverClasses,
          animationClasses,
          className
        )}
        style={delayStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-heading text-xl font-semibold leading-tight tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }; 