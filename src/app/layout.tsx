import type { Metadata } from 'next';
import { Bricolage_Grotesque, Gabarito } from 'next/font/google';
import './globals.css';
import { WhapProvider } from '@/context/WhapContext';
import { Navbar } from '@/components/Navbar';
import { AuthOnboardingModal } from '@/components/AuthOnboardingModal';

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['600', '700', '800'],
});

const bodyFont = Gabarito({
  weight: ['400', '500', '700', '800'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'whap · Short-Form Video Clip Marketplace',
  description:
    'Connect social page owners with short-form video editors. Watermarked review queues, locked per-1k view rates, and verified view payouts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen bg-paper font-body text-ink pb-24 md:pb-12">
        <WhapProvider>
          <Navbar />
          <AuthOnboardingModal />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </WhapProvider>
      </body>
    </html>
  );
}
