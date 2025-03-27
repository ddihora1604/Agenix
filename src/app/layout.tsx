import type { Metadata } from 'next';
import { EB_Garamond, Source_Serif_4, Lora } from 'next/font/google';
import { Providers } from '@/components/Providers';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Chatbot from '@/components/Chatbot';
import SidebarAwareContent from '@/components/SidebarAwareContent';
import '@/styles/globals.css';

// Primary font - EB Garamond is a classic, elegant serif font
const garamond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-garamond',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

// Primary font - Source Serif 4 for general UI
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

// Heading font - Lora
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Agenix',
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
    <html lang="en" suppressHydrationWarning className={`${garamond.variable} ${sourceSerif.variable} ${lora.variable} font-sans`}>
      <body className="font-serif transition-colors duration-300 antialiased">
        <Providers>
          <div className="min-h-screen bg-background overflow-hidden">
            <div className="animate-fade-in">
              <Sidebar />
              <Navbar />
              <SidebarAwareContent>
                {children}
              </SidebarAwareContent>
              <Chatbot />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
} 