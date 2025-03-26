'use client';

import React, { useState } from 'react';
import { Bell, LogIn, UserPlus, Info, Mail } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { ModeToggle } from './mode-toggle';
import { cn } from '@/lib/utils';
import NotificationPanel from './NotificationPanel';
import { useRandomNotifications } from '@/hooks/useRandomNotifications';
import { useNotificationStore } from '@/store/notifications';
import { motion, AnimatePresence } from 'framer-motion';

const navButtons = [
  {
    label: 'Login',
    icon: LogIn,
    href: '/login',
  },
  {
    label: 'Sign Up',
    icon: UserPlus,
    href: '/signup',
  },
  {
    label: 'About',
    icon: Info,
    href: '/about',
  },
  {
    label: 'Contact',
    icon: Mail,
    href: '/contact',
  },
];

// Map paths to page titles
const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/home': 'Home', 
  '/login': 'Login',
  '/signup': 'Sign Up',
  '/about': 'About Us',
  '/contact': 'Contact Us',
  '/dashboard': 'Dashboard',
  '/marketplace': 'Marketplace',
  '/agents': 'AI Agents',
  '/agents/email-writer': 'Email Generation Agent',
  '/agents/document-summarizer': 'Document Summarizer Agent',
  '/agents/youtube-summarizer': 'YouTube Summarizer Agent',
  '/agents/web-crawler': 'Web Crawler with Q&A Agent',
  '/agents/image-generator': 'Image Generator Agent',
  '/workflow': 'Workflow Builder',
  '/settings': 'Settings',
  '/profile': 'User Profile',
  '/documentation': 'Documentation',
  '/support': 'Support',
};

// Common transition settings to ensure consistent animations
const commonTransition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1.0], // cubic-bezier easing
};

export default function Navbar() {
  const { sidebarCollapsed } = useSidebarState();
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications } = useNotificationStore();
  const pathname = usePathname();
  
  // Determine if current page is home page
  const isHomePage = pathname === '/' || pathname === '/home';
  
  // Get page title based on current path
  const pageTitle = pageTitles[pathname] || 'MercadoVista';
  
  // Use the random notifications hook to generate notifications
  useRandomNotifications();
  
  // Get the count of unread notifications
  const unreadCount = notifications.length;
  
  return (
    <header 
      className="fixed top-0 h-16 z-20 flex items-center gap-4 border-b border-border bg-background/95 backdrop-blur right-0"
      style={{
        left: sidebarCollapsed ? '80px' : '256px',
        width: `calc(100% - ${sidebarCollapsed ? '80px' : '256px'})`,
        transition: `left ${commonTransition.duration}s ${commonTransition.ease}, width ${commonTransition.duration}s ${commonTransition.ease}`
      }}
    >
      <div className="w-full flex items-center px-4 md:px-6 transition-all duration-200">
        {/* Page Title */}
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-foreground transition-all duration-200">{pageTitle}</h1>
        </div>
        
        {/* Flex spacer */}
        <div className="flex-1"></div>
        
        {/* Nav buttons - only shown on Home page and hidden on mobile */}
        {isHomePage && (
          <div className="hidden md:flex items-center gap-4 mr-2">
            {navButtons.map((button) => (
              <Link
                key={button.label}
                href={button.href}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <button.icon className="h-4 w-4 transition-all duration-200" />
                <span className="transition-all duration-200">{button.label}</span>
              </Link>
            ))}
          </div>
        )}
        
        {/* Theme toggle - visible on all pages */}
        <ModeToggle />
        
        {/* Notification - visible on all pages */}
        <div className="relative">
          <button 
            className="relative rounded-full h-9 w-9 flex items-center justify-center hover:bg-accent transition-colors duration-200"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5 text-muted-foreground transition-all duration-200" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 flex items-center justify-center">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white transition-all duration-200">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
            )}
          </button>
          
          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>
      </div>
    </header>
  );
}