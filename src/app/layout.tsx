import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Chatbot from '@/components/Chatbot';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Agent Marketplace',
  description: 'A marketplace for AI agents and workflow automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} transition-colors duration-200`}>
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <Navbar />
            <main className="ml-64 pt-16 p-8">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
            <Chatbot />
          </div>
        </Providers>
      </body>
    </html>
  );
}