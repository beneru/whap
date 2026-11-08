import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { WhapProvider } from '@/context/WhapContext';
import { Navbar } from '@/components/Navbar';
import { AuthOnboardingModal } from '@/components/AuthOnboardingModal';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'whap · Clip Editing Marketplace for Page Owners & Video Editors',
  description:
    'Connect social page owners (Account Holders) with short-form video editors. Watermarked review queues, locked per-1k view rates, and verified view-snapshot payouts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} dark`}>
      <body className="min-h-screen bg-canvas font-sans text-zinc-100 pb-20 md:pb-10">
        <WhapProvider>
          <Navbar />
          <AuthOnboardingModal />
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </WhapProvider>
      </body>
    </html>
  );
}
