'use client'

import React from 'react';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import ClientLayout from './ClientLayout';
import { motion } from 'framer-motion';

// Common transition settings to ensure consistent animations
const commonTransition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1.0], // cubic-bezier easing
  immediate: true // Prevents any delay in starting the animation
};

interface SidebarAwareContentProps {
  children: React.ReactNode;
}

export default function SidebarAwareContent({ children }: SidebarAwareContentProps) {
  const { sidebarCollapsed } = useSidebarState();
  
  return (
    <motion.main
      className="pt-16 min-h-screen will-change-auto"
      initial={false}
      animate={{
        marginLeft: sidebarCollapsed ? '80px' : '256px',
        width: `calc(100% - ${sidebarCollapsed ? '80px' : '256px'})`,
      }}
      transition={commonTransition}
      style={{
        transition: `margin-left ${commonTransition.duration}s ${commonTransition.ease}, width ${commonTransition.duration}s ${commonTransition.ease}`
      }}
    >
      <div className="w-full h-full">
        <ClientLayout>
          {children}
        </ClientLayout>
      </div>
    </motion.main>
  );
} 