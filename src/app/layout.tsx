import type { Metadata } from 'next';
import { Bagel_Fat_One, Gabarito } from 'next/font/google';
import './globals.css';
import { WhapProvider } from '@/context/WhapContext';
import { Navbar } from '@/components/Navbar';
import { AuthOnboardingModal } from '@/components/AuthOnboardingModal';

const displayFont = Bagel_Fat_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = Gabarito({
  weight: ['400', '700', '800'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'whap · Cut Clips, Run Pages, Get Paid Per View',
  description:
    'Clip editing marketplace for social page owners and short-form video editors. Pick a campaign, send your cut, and get paid per view.',
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
