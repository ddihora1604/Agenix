import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Document Summarizer | MercadoVista',
  description: 'Analyze and summarize documents, extracting key insights and information',
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function DocumentSummarizerLayout({ children }: LayoutProps) {
  return (
    <div className="h-full">
      {children}
    </div>
  );
} 