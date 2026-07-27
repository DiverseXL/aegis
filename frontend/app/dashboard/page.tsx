'use client';

import { useState, useEffect } from 'react';
import { useWallet, getPublicClient } from '@/lib/useWallet';
import { CONTRACTS, STREAM_ABI } from '@/lib/contracts';
import { formatEther, parseAbiItem } from 'viem';
import { HandleGlyph } from '@/components/HandleGlyph';

export default function DashboardOverview() {
  const { address } = useWallet();
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [streamsCount, setStreamsCount] = useState<string | null>(null);
  const [disclosureCount, setDisclosureCount] = useState<string | null>(null);

  useEffect(() => {
    const publicClient = getPublicClient();

    // Fetch total disclosures count from on-chain event logs (using deployment block to optimize search)
    publicClient.getLogs({
      address: CONTRACTS.stream as `0x${string}`,
      event: parseAbiItem('event DisclosureGranted(uint256 indexed streamId, address indexed auditor, address indexed requestedBy, bytes32 snapshotHandle, uint256 timestamp)'),
      fromBlock: 11251696n,
    })
      .then((logs) => {
        setDisclosureCount(logs.length.toString());
      })
      .catch((err) => console.error('Failed to fetch logs:', err));

    // Fetch total streams count from smart contract
    publicClient.readContract({
      address: CONTRACTS.stream as `0x${string}`,
      abi: STREAM_ABI,
      functionName: 'nextStreamId',
    })
      .then((count) => {
        setStreamsCount(count.toString());
      })
      .catch((err) => console.error('Failed to fetch nextStreamId:', err));

    if (!address) {
      setEthBalance(null);
      return;
    }
    
    // Fetch ETH Balance
    publicClient.getBalance({ address })
      .then((wei) => {
        setEthBalance(Number(formatEther(wei)).toFixed(4));
      })
      .catch((err) => console.error('Failed to fetch balance:', err));
  }, [address]);

  const stats = [
    { label: 'Streams Created', value: streamsCount ?? '0', highlight: false },
    { label: 'Total Wrapped', value: 'Locked', highlight: false },
    { label: 'Active Disclosures', value: disclosureCount ?? '0', highlight: true },
    { label: 'Wallet Balance', value: address ? (ethBalance ? `${ethBalance} ETH` : 'Loading...') : 'Connect Wallet', highlight: false },
  ];

  return (
    <div className="p-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="font-mono text-xs text-ink/30 uppercase tracking-widest">
            Treasury / Overview
          </span>
          <h1 className="font-serif text-3xl text-ink mt-1">Overview</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-forest/30 bg-forest/10 px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse" />
          <span className="font-mono text-xs text-forest">Live - Sepolia</span>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl border border-gold/20 bg-gold/[0.06] px-5 py-4 mb-8 flex items-start gap-3">
        <HandleGlyph className="w-4 h-4 text-gold mt-0.5" filled />
        <p className="text-sm text-ink/70">
          <strong className="text-gold">Testnet mode</strong> - this treasury runs on
          Ethereum Sepolia. All amounts are encrypted on-chain via Nox; only you (and
          anyone you explicitly disclose to) can decrypt your real balance.
        </p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-5 ${
              stat.highlight
                ? 'border-forest/30 bg-forest/[0.06]'
                : 'border-ink/10 bg-ink/[0.02]'
            }`}
          >
            <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">
              {stat.label}
            </span>
            <div className={`text-2xl font-serif mt-1 ${stat.highlight ? 'text-forest' : 'text-ink'}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-2xl border border-ink/10 overflow-hidden bg-ink/[0.01]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
            <span className="text-ink font-medium">Recent Activity</span>
            <button className="rounded-full border border-ink/10 px-3 py-1 text-xs text-ink/50 hover:text-ink transition cursor-pointer">
              View all
            </button>
          </div>
          <div className="p-8 text-center text-ink/40 text-sm">
            No activity yet. Wrap funds to get started.
          </div>
        </div>

        {/* Get started checklist */}
        <div className="rounded-2xl border border-ink/10 p-6 bg-ink/[0.01]">
          <span className="text-ink font-medium">Get Started</span>
          <p className="font-mono text-[10px] tracking-widest text-ink/40 uppercase mt-1 mb-4">
            Three steps to a private treasury
          </p>
          <div className="space-y-4">
            {[
              { n: '01', label: 'Wrap treasury funds', done: false },
              { n: '02', label: 'Authorize AegisStream', done: false },
              { n: '03', label: 'Create a stream', done: false },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-3">
                <span className="font-mono text-xs text-ink/30 pt-0.5">{step.n}</span>
                <span className="text-sm text-ink/70">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
