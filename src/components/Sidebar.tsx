'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Box, 
  Users, 
  Settings, 
  LayoutDashboard,
  Workflow,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  
  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Workflow, label: 'Workflows', path: '/workflows' },
    { icon: Box, label: 'AI Agents', path: '/agents' },
    { icon: Users, label: 'Team', path: '/team' },
    { icon: BookOpen, label: 'Documentation', path: '/documentation' },
    { icon: HelpCircle, label: 'Support', path: '/support' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 transition-all duration-200 transform lg:translate-x-0 -translate-x-full lg:shadow-none shadow-xl">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Agent Store</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link 
                  href={item.path}
                  className={cn(
                    "flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    pathname === item.path 
                      ? "bg-blue-50 text-blue-700 dark:bg-gray-800 dark:text-blue-400" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">DD</div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Darshan Dihora</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;