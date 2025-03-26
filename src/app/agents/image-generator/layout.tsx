import React from 'react';
import ImageGeneratorStateManager from './ImageGeneratorStateManager';

export default function ImageGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="image-generator-layout">
      <ImageGeneratorStateManager />
      {children}
    </div>
  );
} 