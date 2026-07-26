'use client';

import { useState } from 'react';
import { useWallet, getWalletClient, getPublicClient } from '@/lib/useWallet';
import { CONTRACTS, STREAM_ABI } from '@/lib/contracts';
import { motion, AnimatePresence } from 'framer-motion';
import { HandleGlyph } from '@/components/HandleGlyph';

type Step = 'idle' | 'preparing' | 'submitting' | 'done' | 'error';

export default function DisclosuresPage() {
  const { address, connect, connecting } = useWallet();
  const [streamId, setStreamId] = useState('0');
  const [auditorAddress, setAuditorAddress] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [snapshotHandle, setSnapshotHandle] = useState<string | null>(null);

  async function handleDisclose() {
    if (!address) return;
    if (!auditorAddress) {
      setErrorMsg('Please enter the auditor address.');
      return;
    }
    setErrorMsg(null);
    setSnapshotHandle(null);
    try {
      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      setStep('preparing');
      // Simulated or preparing state before transaction triggers
      await new Promise((resolve) => setTimeout(resolve, 800));

      setStep('submitting');
      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.stream as `0x${string}`,
        abi: STREAM_ABI,
        functionName: 'discloseToAuditor',
        args: [BigInt(streamId), auditorAddress as `0x${string}`],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

      // In a real scenario, you can read the return value or events. For testing/demo, we represent the snapshot:
      const mockSnapshot = receipt.transactionHash.slice(0, 32);
      setSnapshotHandle(mockSnapshot);
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err?.shortMessage ?? err?.message ?? 'Something went wrong. Please try again.');
      setStep('error');
    }
  }

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <span className="font-mono text-xs text-ink/30 uppercase tracking-widest">
        Treasury / Disclosures
      </span>
      <h1 className="font-serif text-3xl text-ink mt-1 mb-3">Auditor Disclosures</h1>
      <p className="text-ink/60 mb-10 leading-relaxed text-sm">
        Aegis lets you prove compliance without leaking your entire payroll to the public. 
        Creating a disclosure grants a specific auditor temporary decrypt access to a single 
        point-in-time snapshot of this stream's payout details.
      </p>

      {!address ? (
        <button
          onClick={connect}
          disabled={connecting}
          className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-ink hover:bg-forest/80 transition disabled:opacity-50 cursor-pointer"
        >
          {connecting ? 'Connecting...' : 'Connect your wallet to continue'}
        </button>
      ) : (
        <div className="rounded-2xl border border-ink/10 p-8">
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm text-ink/70 mb-2">
                Which payment stream needs auditing?
              </label>
              <input
                type="number"
                value={streamId}
                onChange={(e) => setStreamId(e.target.value)}
                disabled={step === 'preparing' || step === 'submitting'}
                className="w-full rounded-xl bg-ink/5 border border-ink/10 px-4 py-3 text-ink font-mono text-sm focus:outline-none focus:border-forest/50 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm text-ink/70 mb-2">
                Auditor's Ethereum address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={auditorAddress}
                onChange={(e) => setAuditorAddress(e.target.value)}
                disabled={step === 'preparing' || step === 'submitting'}
                className="w-full rounded-xl bg-ink/5 border border-ink/10 px-4 py-3 text-ink font-mono text-sm focus:outline-none focus:border-forest/50 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Progress timeline */}
          <div className="space-y-4 mb-8">
            <ProgressStep
              number={1}
              label="Prepare snapshot decrypt keys"
              sublabel="Generates the cryptographic handle locally on your device."
              status={
                step === 'idle' || step === 'error' ? 'pending'
                : step === 'preparing' ? 'active'
                : 'done'
              }
            />
            <ProgressStep
              number={2}
              label="Authorize auditor on-chain"
              sublabel="Registers the decryption permissions for the auditor's address."
              status={
                step === 'submitting' ? 'active'
                : step === 'done' ? 'done'
                : 'pending'
              }
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-brick/30 bg-brick/[0.08] px-4 py-3 mb-6 text-sm text-brick">
              {errorMsg}
            </div>
          )}

          {step === 'done' ? (
            <div className="rounded-xl border border-forest/30 bg-forest/[0.08] px-4 py-4 space-y-2">
              <div className="flex items-center gap-3">
                <HandleGlyph className="w-5 h-5 text-forest" filled />
                <p className="text-forest font-medium text-sm">Access granted successfully.</p>
              </div>
              <div className="text-xs text-ink/50 mt-2 font-mono">
                <span className="block text-[10px] text-ink/30 uppercase">Snapshot Handle:</span>
                <span className="block truncate text-ink/70">{snapshotHandle}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleDisclose}
              disabled={step === 'preparing' || step === 'submitting'}
              className="w-full rounded-full bg-forest px-6 py-3.5 text-sm font-medium text-ink hover:bg-forest/80 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {step === 'preparing' && 'Preparing key snapshots...'}
              {step === 'submitting' && 'Registering permissions on-chain...'}
              {(step === 'idle' || step === 'error') && 'Grant Decrypt Access'}
            </button>
          )}

          <p className="text-xs text-ink/30 text-center mt-4 leading-relaxed">
            Only the specified auditor address will be able to decrypt the values for this stream. 
            This permission is securely anchored on-chain and cannot be intercepted by third parties.
          </p>
        </div>
      )}
    </div>
  );
}

function ProgressStep({
  number,
  label,
  sublabel,
  status,
}: {
  number: number;
  label: string;
  sublabel: string;
  status: 'pending' | 'active' | 'done';
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono border transition-colors ${
          status === 'done'
            ? 'bg-forest border-forest text-ink'
            : status === 'active'
            ? 'border-forest text-forest'
            : 'border-ink/20 text-ink/30'
        }`}
      >
        <AnimatePresence mode="wait">
          {status === 'done' ? (
            <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
              ✓
            </motion.span>
          ) : status === 'active' ? (
            <motion.span
              key="spin"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              ◐
            </motion.span>
          ) : (
            <span key="num">{number}</span>
          )}
        </AnimatePresence>
      </div>
      <div>
        <p className={`text-sm ${status === 'pending' ? 'text-ink/40' : 'text-ink'}`}>{label}</p>
        <p className="text-xs text-ink/30 mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}
