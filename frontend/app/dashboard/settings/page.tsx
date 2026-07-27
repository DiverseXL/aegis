'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/lib/useWallet';
import { CONTRACTS } from '@/lib/contracts';

export default function SettingsPage() {
  const { address, connect, connecting, disconnect, switchWallet } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Avoid hydration mismatch by waiting until client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted) {
    return (
      <div className="p-10 max-w-3xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-ink/10 w-1/4 rounded-md"></div>
        <div className="h-4 bg-ink/10 w-2/3 rounded-md"></div>
        <div className="h-40 bg-ink/10 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-3xl mx-auto space-y-8">
      <div>
        <span className="font-mono text-xs text-ink/30 uppercase tracking-widest">
          Treasury / Settings
        </span>
        <h1 className="font-serif text-3xl text-ink mt-1 mb-3">Settings</h1>
        <p className="text-ink/60 leading-relaxed text-sm">
          Customize your layout theme, switch connected accounts, and review deployed Sepolia contracts.
        </p>
      </div>

      {/* Card 1: Appearance */}
      <div className="rounded-2xl border border-ink/10 p-6 bg-ink/[0.01] space-y-4">
        <h2 className="font-serif text-lg font-medium text-ink">Appearance</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">Theme Settings</p>
            <p className="text-xs text-ink/40">Toggle between Light and Dark interface modes.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-full bg-forest text-ink text-xs font-medium cursor-pointer shadow-sm">
              Dark
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-full border border-ink/10 text-ink/30 text-xs font-medium cursor-not-allowed"
              title="Coming soon"
            >
              Light
            </button>
          </div>
        </div>
        <p className="text-xs text-ink/30 mt-2 font-mono">
          Light mode is in development — dark mode only for now.
        </p>
      </div>

      {/* Card 2: Wallet */}
      <div className="rounded-2xl border border-ink/10 p-6 bg-ink/[0.01] space-y-4">
        <h2 className="font-serif text-lg font-medium text-ink">Wallet Management</h2>
        
        {!address ? (
          <div className="text-center py-4">
            <button
              onClick={connect}
              disabled={connecting}
              className="rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-ink hover:bg-forest/80 transition cursor-pointer"
            >
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-ink/40 mb-1.5">Connected Address</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="font-mono text-xs bg-ink/5 px-3.5 py-2.5 rounded-xl border border-ink/10 text-ink break-all flex-1">
                  {address}
                </span>
                <button
                  onClick={handleCopy}
                  className="rounded-xl border border-ink/20 hover:bg-ink/5 px-4 py-2.5 text-xs font-medium text-ink transition cursor-pointer shrink-0"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={switchWallet}
                className="rounded-full border border-forest/30 hover:bg-forest/10 px-5 py-2.5 text-xs font-medium text-forest transition cursor-pointer"
              >
                Switch Wallet
              </button>
              <button
                onClick={disconnect}
                className="rounded-full border border-brick/30 hover:bg-brick/10 px-5 py-2.5 text-xs font-medium text-brick transition cursor-pointer"
              >
                Disconnect
              </button>
            </div>

            <p className="text-xs text-ink/30 mt-2 font-mono">
              Disconnect clears your session in Aegis. Your wallet extension may still show as connected until you disconnect it there too.
            </p>
          </div>
        )}
      </div>

      {/* Card 3: Network & Contracts */}
      <div className="rounded-2xl border border-ink/10 p-6 bg-ink/[0.01] space-y-4">
        <h2 className="font-serif text-lg font-medium text-ink">Network & Contracts</h2>
        <div className="divide-y divide-ink/5 text-xs font-mono">
          <div className="py-2.5 flex justify-between gap-4 flex-wrap">
            <span className="text-ink/40">Network</span>
            <span className="text-ink">Ethereum Sepolia</span>
          </div>
          <div className="py-2.5 flex flex-col gap-1">
            <span className="text-ink/40">AegisVault Address</span>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACTS.vault}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest hover:underline break-all"
            >
              {CONTRACTS.vault}
            </a>
          </div>
          <div className="py-2.5 flex flex-col gap-1">
            <span className="text-ink/40">AegisStream Address</span>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACTS.stream}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest hover:underline break-all"
            >
              {CONTRACTS.stream}
            </a>
          </div>
          <div className="py-2.5 flex flex-col gap-1">
            <span className="text-ink/40">NoxCompute Address</span>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACTS.noxCompute}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest hover:underline break-all"
            >
              {CONTRACTS.noxCompute}
            </a>
          </div>
        </div>
      </div>

      {/* Card 4: About */}
      <div className="rounded-2xl border border-ink/10 p-6 bg-ink/[0.01] space-y-4 text-sm leading-relaxed">
        <h2 className="font-serif text-lg font-medium text-ink">About Project</h2>
        <p className="text-ink/60">
          Aegis is a secure linear payment streaming protocol utilizing Nox confidential compute to encrypt vesting amounts on-chain while keeping transaction trails auditable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-2 font-mono text-xs">
          <a
            href="https://github.com/DiverseXL/aegis"
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:underline"
          >
            GitHub Repository
          </a>
          <a
            href="https://github.com/DiverseXL/aegis/blob/main/aegis/feedback.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:underline"
          >
            Feedback Notes (feedback.md)
          </a>
        </div>
        <div className="pt-4 border-t border-ink/5 text-xs text-ink/30 font-mono">
          Aegis - built for the iExec WTF Hackathon Summer Edition
        </div>
      </div>
    </div>
  );
}
