'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/useWallet';
import { HandleGlyph } from './HandleGlyph';

export default function Navbar() {
  const { address, connecting, connect } = useWallet();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-base/60 backdrop-blur-xl border-b border-ink/10 py-4 shadow-lg shadow-black/10'
          : 'bg-transparent py-6 border-b border-transparent'
      }`}
    >
      <nav className="flex items-center justify-between px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <HandleGlyph className="w-6 h-6 text-forest" filled />
          <span className="font-serif text-2xl font-medium text-ink tracking-tight">Aegis</span>
        </div>
        
        {!address ? (
          <button
            onClick={connect}
            disabled={connecting}
            className="rounded-full bg-forest px-6 py-2 text-sm font-medium text-ink hover:bg-forest/80 transition disabled:opacity-50 cursor-pointer"
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-[#121c15]/80 backdrop-blur-md border border-emerald-950 px-4 py-2 rounded-full">
            <div className="w-2.5 h-2.5 rounded-full bg-forest animate-pulse" />
            <span className="text-xs font-mono text-ink/90">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        )}
      </nav>
    </div>
  );
}

