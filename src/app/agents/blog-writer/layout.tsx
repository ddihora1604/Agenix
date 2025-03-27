'use client';

import React from 'react';
import { BlogWriterStateManager } from './BlogWriterStateManager';

export default function BlogWriterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BlogWriterStateManager />
      {children}
    </>
  );
} 