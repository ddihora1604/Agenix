import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Professional Email Writer - MercadoVista',
  description: 'Craft professional business emails for various contexts',
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