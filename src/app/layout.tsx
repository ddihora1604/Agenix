import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { Providers } from '@/components/Providers';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Chatbot from '@/components/Chatbot';
import '@/styles/globals.css';

// Primary font for UI
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Secondary font for headings
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Agent Marketplace',
  description: 'A marketplace for AI agents and workflow automation',
  keywords: 'AI, agents, marketplace, workflow, automation',
  authors: [{ name: 'AI Agent Marketplace Team' }],
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${manrope.variable}`}>
      <body className="font-sans transition-colors duration-300 antialiased">
        <Providers>
          <div className="min-h-screen bg-background">
            <div className="animate-fade-in">
              <Sidebar />
              <Navbar />
              <main className="ml-64 pt-16 p-6 lg:p-8">
                <div className="max-w-7xl mx-auto animate-slide-up">
                  {children}
                </div>
              </main>
              <Chatbot />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}