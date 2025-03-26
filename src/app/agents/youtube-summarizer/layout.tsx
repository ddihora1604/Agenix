import React from 'react';

// Define the layout component for the YouTube Summarizer page
export default function YouTubeSummarizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="w-full h-full">
      {/* Render the YouTube Summarizer page content */}
      {children}
    </section>
  );
} 