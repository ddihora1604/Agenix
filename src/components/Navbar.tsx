'use client';

import React, { useState } from 'react';
import { Bell, Moon, Sun, Search, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useThemeStore } from '@/store/theme';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';
import NotificationPanel from './NotificationPanel';
import { useNotificationStore } from '@/store/notifications';

const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const { toggleTheme } = useThemeStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { notifications } = useNotificationStore();
  const hasUnreadNotifications = notifications.length > 0;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-20 transition-colors duration-200">
      <div className="h-full flex items-center justify-between px-4 md:px-6 lg:pl-64">
        <div className="flex lg:hidden">
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-gray-700 dark:text-gray-300"
          >
            {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        <div className="flex-1 max-w-xl mx-auto lg:mx-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search agents, workflows, or documentation..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
                "hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200",
                "relative"
              )}
            >
              <Bell className="h-5 w-5" />
              {hasUnreadNotifications && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            {showNotifications && (
              <NotificationPanel onClose={() => setShowNotifications(false)} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;