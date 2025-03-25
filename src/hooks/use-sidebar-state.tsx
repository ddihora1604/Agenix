import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useSidebarState = create<SidebarState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false, // Default is expanded
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      setSidebarCollapsed: (collapsed) => set({ 
        sidebarCollapsed: collapsed 
      }),
    }),
    {
      name: 'sidebar-state',
    }
  )
); 