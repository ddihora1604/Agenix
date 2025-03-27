import { create } from 'zustand';
import React, { useEffect } from 'react';

interface BlogWriterState {
  showBlogWriter: boolean;
  setShowBlogWriter: (show: boolean) => void;
}

export const useBlogWriterState = create<BlogWriterState>((set) => ({
  showBlogWriter: false,
  setShowBlogWriter: (show) => set({ showBlogWriter: show }),
}));

// This component is used to configure the initial state when the blog writer is loaded
export const BlogWriterStateManager: React.FC = () => {
  const { setShowBlogWriter } = useBlogWriterState();

  // When this component is mounted, set showBlogWriter to true
  // This ensures the agent remains in the sidebar even when navigating away
  useEffect(() => {
    setShowBlogWriter(true);
  }, [setShowBlogWriter]);

  return null;
}; 