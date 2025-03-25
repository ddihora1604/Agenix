"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ 
  children,
  ...props
}: {
  children: React.ReactNode
  [key: string]: any 
}) {
  const [mounted, setMounted] = React.useState(false)
  
  // Handle document class for transitions
  React.useEffect(() => {
    // Prevent transitions on initial load
    document.documentElement.classList.add('theme-transition-inactive')
    
    // Enable transitions after mount and a short delay
    const enableTransitionsTimeout = setTimeout(() => {
      document.documentElement.classList.remove('theme-transition-inactive')
      document.documentElement.classList.add('theme-transition-active')
      setMounted(true)
    }, 200)
    
    return () => clearTimeout(enableTransitionsTimeout)
  }, [])
  
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
} 