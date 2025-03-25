"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  
  // Only show toggle after mounting to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Create the flash effect when theme changes
  const createFlashEffect = (newTheme: string) => {
    const flashElement = document.createElement('div')
    flashElement.className = `theme-switch-flash to-${newTheme}`
    document.body.appendChild(flashElement)
    
    // Remove flash element after animation
    setTimeout(() => {
      if (document.body.contains(flashElement)) {
        document.body.removeChild(flashElement)
      }
    }, 400)
  }
  
  const handleThemeChange = (newTheme: string) => {
    createFlashEffect(newTheme)
    setTheme(newTheme)
  }

  // Get the icon based on current theme
  const getThemeIcon = () => {
    if (!mounted) return null
    
    if (theme === 'dark') {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="moon-icon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute"
          >
            <Moon className="h-[1.2rem] w-[1.2rem] text-slate-50" />
          </motion.div>
        </AnimatePresence>
      )
    }
    
    if (theme === 'light') {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="sun-icon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500" />
          </motion.div>
        </AnimatePresence>
      )
    }
    
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="system-icon"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          <Laptop className="h-[1.2rem] w-[1.2rem]" />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 rounded-full relative bg-background border-muted-foreground/20"
        >
          <motion.div 
            className="relative h-[1.2rem] w-[1.2rem] overflow-hidden"
            layout
          >
            {getThemeIcon()}
          </motion.div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="animate-scale">
        <DropdownMenuItem 
          onClick={() => handleThemeChange("light")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Sun className="h-4 w-4 text-amber-500" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange("dark")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Moon className="h-4 w-4 text-blue-400" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleThemeChange("system")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Laptop className="h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 