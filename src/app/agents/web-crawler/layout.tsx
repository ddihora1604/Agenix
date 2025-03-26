import React from 'react';

// Define the layout component for the Web Crawler page
export default function WebCrawlerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="w-full h-full">
      {/* Render the Web Crawler page content */}
      {children}
    </section>
  );
} 