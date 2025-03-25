import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Generation Agent - MercadoVista',
  description: 'Generate professional business emails with AI assistance',
};

export default function EmailWriterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="email-writer-layout">
      {children}
    </div>
  );
} 