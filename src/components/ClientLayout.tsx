'use client';

import React from 'react';
import { useReloadHandler } from '@/hooks/useReloadHandler';
import ProfilePanel from './ProfilePanel';
import { useProfilePanel } from '@/hooks/use-profile-panel';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  // Use the reload handler hook to detect page reloads
  useReloadHandler();
  
  // Get profile panel state
  const { isOpen, closeProfilePanel } = useProfilePanel();
  
  return (
    <>
      {children}
      <ProfilePanel isOpen={isOpen} onClose={closeProfilePanel} />
    </>
  );
};

export default ClientLayout; 