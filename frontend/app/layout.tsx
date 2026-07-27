import type { Metadata } from 'next';
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/lib/useWallet';

const fraunces = Fraunces({ 
  subsets: ['latin'], 
  weight: ['400','500','600'], 
  variable: '--font-fraunces' 
});

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter' 
});

const mono = IBM_Plex_Mono({ 
  subsets: ['latin'], 
  weight: ['400','500'], 
  variable: '--font-mono' 
});

export const metadata: Metadata = {
  title: "AEGIS — Confidential Treasury",
  description: "Aegis lets DAOs pay contributors without exposing every salary, grant, and bounty to the entire world.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="bg-base text-ink font-sans min-h-full flex flex-col">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
