'use client';

import React from 'react';
import { Search, Bell, LogIn, UserPlus, Info, Mail } from 'lucide-react';
import Link from 'next/link';
import { useSidebarState } from '@/hooks/use-sidebar-state';
import { ModeToggle } from './mode-toggle';
import { cn } from '@/lib/utils';

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

export default function Navbar() {
  const { sidebarCollapsed } = useSidebarState();
  
  return (
    <header className={cn(
      'sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 md:px-6 backdrop-blur transition-colors duration-300',
      sidebarCollapsed ? 'lg:pl-6' : 'lg:pl-6'
    )}>
      {/* Search */}
      <div className="flex-1 md:flex-initial">
        <form className="relative flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            className="h-10 rounded-md border border-input bg-background pl-8 pr-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full md:w-[200px] lg:w-[250px]"
          />
        </form>
      </div>
      
      {/* Nav buttons - hidden on mobile */}
      <div className="hidden md:flex items-center gap-4 ml-auto mr-2">
        {navButtons.map((button) => (
          <Link
            key={button.label}
            href={button.href}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <button.icon className="h-4 w-4" />
            <span>{button.label}</span>
          </Link>
        ))}
      </div>
      
      {/* Theme toggle */}
      <ModeToggle />
      
      {/* Notification */}
      <button className="relative rounded-full h-9 w-9 flex items-center justify-center hover:bg-accent transition-colors">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>
      </button>
    </header>
  );
}