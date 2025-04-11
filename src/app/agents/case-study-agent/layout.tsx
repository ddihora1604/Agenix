import React from 'react';
import CaseStudyAgentStateManager from './CaseStudyAgentStateManager';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case Study Agent',
  description: 'Generate professional case studies on any topic with structured content and key insights'
};

export default function CaseStudyAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CaseStudyAgentStateManager />
      {children}
    </>
  );
} 