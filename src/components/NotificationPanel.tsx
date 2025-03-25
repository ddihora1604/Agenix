'use client';

import React, { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/notifications';
import { formatDistanceToNow } from 'date-fns';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Trash2, Bell, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to identify notification category based on content
const getNotificationCategory = (message: string): string => {
  if (message.includes('agent') || message.includes('Agent') || message.includes('workflow') || message.includes('Workflow')) {
    if (message.includes('would') || message.includes('Consider') || message.includes('benefit')) {
      return 'Agent Insight';
    }
    return 'System Update';
  }
  
  if (message.includes('tip') || message.includes('Did you know') || message.includes('Best practice') || message.includes('Try our')) {
    return 'User Guidance';
  }
  
  return 'General Alert';
};

const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notifications, clearAllNotifications, removeNotification } = useNotificationStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'System Update':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'User Guidance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Agent Insight':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'General Alert':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-16 w-96 max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
          {notifications.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {notifications.length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearAllNotifications}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[60vh]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center gap-3">
            <Bell className="h-10 w-10 opacity-20" />
            <p>No notifications</p>
            <p className="text-xs opacity-70">Notifications about system updates, tips, and agent insights will appear here</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notification) => {
              const category = getNotificationCategory(notification.message);
              const categoryColor = getCategoryBadgeColor(category);
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "p-4 border-b border-gray-200 dark:border-gray-700 flex items-start gap-3",
                    "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  )}
                >
                  <div className="mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", categoryColor)}>
                        {category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {notification.message}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mt-0.5"
                    aria-label="Remove notification"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationPanel; 