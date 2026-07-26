'use client';

import Link from 'next/link';
import { HandleGlyph } from '@/components/HandleGlyph';
import { useWallet } from '@/lib/useWallet';

const navItems = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Wrap', href: '/dashboard/wrap' },
  { label: 'Streams', href: '/dashboard/streams' },
  { label: 'Disclosures', href: '/dashboard/disclosures' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { address, connecting, connect } = useWallet();

  return (
    <div className="min-h-screen bg-base flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-ink/10 flex flex-col p-6">
        <div className="flex items-center gap-2 mb-10">
          <HandleGlyph className="w-6 h-6 text-forest" filled />
          <span className="font-serif text-xl font-medium text-ink">Aegis</span>
        </div>

        <span className="font-mono text-[10px] tracking-widest text-ink/30 uppercase mb-3">
          Treasury
        </span>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm text-ink/60 hover:text-ink hover:bg-ink/5 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-ink/10">
          {!address ? (
            <button
              onClick={connect}
              disabled={connecting}
              className="w-full rounded-full bg-forest px-4 py-2.5 text-sm font-medium text-ink hover:bg-forest/80 transition disabled:opacity-50 cursor-pointer"
            >
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-ink/10 px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
              <span className="font-mono text-xs text-ink/60">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-[#0a0e0c]">{children}</div>
    </div>
  );
}
