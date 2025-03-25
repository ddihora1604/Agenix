'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Box, 
  Settings, 
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { motion } from 'framer-motion';
import { useProfilePanel } from '@/hooks/use-profile-panel';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useSidebarState();
  const { toggleProfilePanel } = useProfilePanel();
  const router = useRouter();
  
  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Box, label: 'AI Agents', path: '/agents' },
    { icon: BookOpen, label: 'Documentation', path: '/documentation' },
    { icon: HelpCircle, label: 'Support', path: '/support' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogoClick = () => {
    if (pathname === '/') {
      // If already on home page, refresh the page
      window.location.href = '/';
    } else {
      // Otherwise navigate to home page
      router.push('/');
    }
  };

  return (
    <motion.aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-white dark:bg-gray-900/95 border-r border-gray-200/80 dark:border-gray-800/80 z-30 backdrop-blur-sm shadow-md",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
      initial={false}
      animate={{ width: sidebarCollapsed ? 80 : 256 }}
      transition={{ 
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1.0] // cubic-bezier easing
      }}
    >
      <div className="flex flex-col h-full bg-gradient-to-b from-transparent via-transparent to-pink-50/30 dark:to-pink-950/20">
        <div className="p-4 border-b border-gray-200/80 dark:border-gray-800/80 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-pink-50/50 dark:from-blue-950/30 dark:to-pink-950/30">
          <motion.div 
            initial={false}
            animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className={cn("overflow-hidden", sidebarCollapsed ? "w-0" : "w-full")}
          >
            {!sidebarCollapsed && (
              <div 
                className="flex items-center cursor-pointer" 
                onClick={handleLogoClick}
              >
                <div className="h-8 flex items-center gap-2">
                  <Image 
                    src="/logo.png" 
                    alt="MercadoVista Logo" 
                    width={30} 
                    height={40} 
                    className="object-contain" 
                    priority
                  />
                  <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-pink-500 to-indigo-600 dark:from-blue-400 dark:via-pink-400 dark:to-indigo-400">MercadoVista</h1>
                </div>
              </div>
            )}
          </motion.div>
          
          <motion.div 
            initial={false}
            animate={{ 
              opacity: sidebarCollapsed ? 1 : 0,
              width: sidebarCollapsed ? 'auto' : 0 
            }}
            transition={{ duration: 0.2 }}
            className={`flex justify-center ${sidebarCollapsed ? 'w-full' : 'w-0'} overflow-hidden`}
          >
            {sidebarCollapsed && (
              <div 
                className="h-10 w-10 flex items-center justify-center cursor-pointer" 
                onClick={handleLogoClick}
              >
                <Image 
                  src="/logo-small.png" 
                  alt="MercadoVista Logo" 
                  width={32} 
                  height={32} 
                  className="object-contain" 
                  priority
                />
              </div>
            )}
          </motion.div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-5 px-2">
          <div className="mb-4 ml-2">
            <p className={cn(
              "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
              sidebarCollapsed && "text-center"
            )}>
              
            </p>
          </div>
          <ul className="space-y-1.5 px-2">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <li key={index}>
                  <Link 
                    href={item.path}
                    className={cn(
                      "flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-gradient-to-r from-blue-50 to-pink-50 dark:from-blue-900/20 dark:to-pink-900/20 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-100/80 dark:border-blue-800/30" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 hover:shadow-sm",
                      sidebarCollapsed && "justify-center",
                      isActive && sidebarCollapsed && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className={cn(
                      "p-1 rounded-lg",
                      isActive ? "bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400",
                      !sidebarCollapsed && "mr-3"
                    )}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                    </div>
                    
                    <motion.span 
                      initial={false}
                      animate={{ 
                        opacity: sidebarCollapsed ? 0 : 1,
                        width: sidebarCollapsed ? 0 : 'auto' 
                      }}
                      transition={{ duration: 0.2 }}
                      className={cn("whitespace-nowrap", 
                        sidebarCollapsed ? "w-0 overflow-hidden" : "w-auto"
                      )}
                    >
                      {!sidebarCollapsed && item.label}
                    </motion.span>
                    {!sidebarCollapsed && isActive && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-pink-500"></div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
          }}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-pink-600 text-white p-1.5 rounded-full shadow-md hover:from-blue-700 hover:to-pink-700 transition-colors z-50"
        >
          <motion.div
            initial={false}
            animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-4 w-4" />
          </motion.div>
        </motion.button>

        <div className="p-4 mt-auto border-t border-gray-200/80 dark:border-gray-800/80 bg-gradient-to-r from-blue-50/50 to-pink-50/50 dark:from-blue-950/30 dark:to-pink-950/30">
          <div 
            className={cn(
              "flex items-center cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/50 p-3 rounded-xl transition-all duration-200 shadow-sm border border-gray-200/60 dark:border-gray-800/60",
              sidebarCollapsed && "justify-center"
            )}
            onClick={toggleProfilePanel}
            title="View Profile"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              DD
            </div>
            
            <motion.div 
              initial={false}
              animate={{ 
                opacity: sidebarCollapsed ? 0 : 1,
                width: sidebarCollapsed ? 0 : 'auto',
                marginLeft: sidebarCollapsed ? 0 : 12
              }}
              transition={{ duration: 0.2 }}
              className={cn(
                "overflow-hidden flex-grow",
                sidebarCollapsed ? "w-0" : "w-auto ml-3"
              )}
            >
              {!sidebarCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Darshan Dihora</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Admin</p>
                  </div>
                  <div className="ml-2 p-1 rounded-full bg-gray-100 dark:bg-gray-800">
                    <Settings className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;