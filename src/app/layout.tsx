import type { Metadata } from 'next';
import { Source_Serif_4, Lora } from 'next/font/google';
import { Providers } from '@/components/Providers';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Chatbot from '@/components/Chatbot';
import SidebarAwareContent from '@/components/SidebarAwareContent';
import '@/styles/globals.css';

// Primary font for UI - Source Serif Pro is a classic serif font with excellent readability
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

// Secondary font for headings - Lora is an elegant serif font with professional characteristics
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'MercadoVista',
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
    <html lang="en" suppressHydrationWarning className={`${sourceSerif.variable} ${lora.variable}`}>
      <body className="font-sans transition-colors duration-300 antialiased">
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