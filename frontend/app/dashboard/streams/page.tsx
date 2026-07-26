'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, getWalletClient, getPublicClient } from '@/lib/useWallet';
import { CONTRACTS, STREAM_ABI } from '@/lib/contracts';
import { fetchAllStreams, type StreamSummary } from '@/lib/streams';
import { parseUnits } from 'viem';
import { createViemHandleClient } from '@iexec-nox/handle';
import { HandleGlyph } from '@/components/HandleGlyph';

export default function StreamsPage() {
  const { address, connect, connecting } = useWallet();
  const [streams, setStreams] = useState<StreamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Create-stream form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('50');
  const [days, setDays] = useState('30');
  const [creating, setCreating] = useState(false);
  const [createStep, setCreateStep] = useState<'idle' | 'encrypting' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllStreams();
      setStreams(data.reverse()); // newest first
    } catch (err) {
      console.error('Failed to load streams:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  async function handleCreate() {
    if (!address || !recipient) {
      setErrorMsg('Please enter a recipient address.');
      return;
    }
    setErrorMsg(null);
    setCreating(true);
    try {
      const walletClient = getWalletClient();
      const publicClient = getPublicClient();
      const amountWei = parseUnits(amount, 18);

      setCreateStep('encrypting');
      const handleClient = await createViemHandleClient(walletClient);
      const { handle, handleProof } = await handleClient.encryptInput(
        amountWei,
        'uint256',
        CONTRACTS.stream as `0x${string}`
      );

      setCreateStep('submitting');
      const startTime = Math.floor(Date.now() / 1000);
      const durationSeconds = Number(days) * 24 * 60 * 60;

      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.stream as `0x${string}`,
        abi: STREAM_ABI,
        functionName: 'createStream',
        args: [
          CONTRACTS.vault as `0x${string}`,
          recipient as `0x${string}`,
          handle,
          handleProof,
          startTime,
          durationSeconds,
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      setCreateStep('done');
      setRecipient('');
      await loadStreams();
    } catch (err: any) {
      setErrorMsg(err?.shortMessage ?? err?.message ?? 'Something went wrong.');
      setCreateStep('error');
    } finally {
      setCreating(false);
    }
  }

  async function handleWithdraw(streamId: bigint) {
    if (!address) return;
    try {
      const walletClient = getWalletClient();
      const publicClient = getPublicClient();
      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.stream as `0x${string}`,
        abi: STREAM_ABI,
        functionName: 'withdraw',
        args: [streamId],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await loadStreams();
    } catch (err: any) {
      alert(err?.shortMessage ?? 'Withdraw failed.');
    }
  }

  function streamStatus(s: StreamSummary): { label: string; color: string } {
    const now = Math.floor(Date.now() / 1000);
    const end = Number(s.startTime) + Number(s.duration);
    if (now < Number(s.startTime)) return { label: 'Not started', color: 'text-ink/40' };
    if (now >= end) return { label: 'Fully vested', color: 'text-forest' };
    return { label: 'Streaming...', color: 'text-gold' };
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <span className="font-mono text-xs text-ink/30 uppercase tracking-widest">
        Treasury / Streams
      </span>
      <h1 className="font-serif text-3xl text-ink mt-1 mb-3">Payment Streams</h1>
      <p className="text-ink/60 mb-10 leading-relaxed text-sm">
        A stream pays someone gradually over time - like a salary, instead of
        one lump sum. Anyone can see that a payment is happening; only the
        recipient can see how much.
      </p>

      {/* Create new stream */}
      {!address ? (
        <button
          onClick={connect}
          disabled={connecting}
          className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-ink hover:bg-forest/80 transition mb-12 cursor-pointer"
        >
          {connecting ? 'Connecting...' : 'Connect your wallet to create a stream'}
        </button>
      ) : (
        <div className="rounded-2xl border border-ink/10 p-8 mb-12">
          <h2 className="text-ink font-medium mb-6">Start a new payment</h2>

          <div className="grid gap-5 mb-6">
            <div>
              <label className="block text-sm text-ink/70 mb-2">Who is getting paid?</label>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full rounded-xl bg-ink/5 border border-ink/10 px-4 py-3 text-ink font-mono text-sm focus:outline-none focus:border-forest/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-ink/70 mb-2">How much (private)?</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl bg-ink/5 border border-ink/10 px-4 py-3 text-ink font-mono text-sm focus:outline-none focus:border-forest/50"
                />
              </div>
              <div>
                <label className="block text-sm text-ink/70 mb-2">Over how many days?</label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full rounded-xl bg-ink/5 border border-ink/10 px-4 py-3 text-ink font-mono text-sm focus:outline-none focus:border-forest/50"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-brick/30 bg-brick/[0.08] px-4 py-3 mb-4 text-sm text-brick">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full rounded-full bg-forest px-6 py-3.5 text-sm font-medium text-ink hover:bg-forest/80 transition disabled:opacity-60 cursor-pointer"
          >
            {createStep === 'encrypting' && 'Encrypting the amount privately...'}
            {createStep === 'submitting' && 'Creating the stream on-chain...'}
            {(createStep === 'idle' || createStep === 'error' || createStep === 'done') && 'Create private payment'}
          </button>
          <p className="text-xs text-ink/30 text-center mt-3">
            The amount is encrypted on your device before it ever reaches the
            blockchain - nobody else ever sees the real number.
          </p>
        </div>
      )}

      {/* Stream list - public activity feed */}
      <div className="rounded-2xl border border-ink/10 overflow-hidden bg-ink/[0.01]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10">
          <span className="text-ink font-medium">All Streams</span>
          <span className="font-mono text-xs text-ink/30">{streams.length} total</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-ink/40 text-sm animate-pulse">Loading...</div>
        ) : streams.length === 0 ? (
          <div className="p-8 text-center text-ink/40 text-sm">No streams yet.</div>
        ) : (
          <div className="divide-y divide-ink/5">
            {streams.map((s) => {
              const status = streamStatus(s);
              const isRecipient = address?.toLowerCase() === s.recipient.toLowerCase();
              return (
                <div key={s.id.toString()} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <HandleGlyph className="w-4 h-4 text-forest shrink-0" filled />
                    <div>
                      <p className="text-sm text-ink font-mono">
                        {s.sender.slice(0, 6)}...{s.sender.slice(-4)}
                        <span className="text-ink/30 mx-2">{"->"}</span>
                        {s.recipient.slice(0, 6)}...{s.recipient.slice(-4)}
                      </p>
                      <p className="text-xs text-ink/40 font-mono mt-0.5">
                        Amount: [Hidden] private · <span className={status.color}>{status.label}</span>
                      </p>
                    </div>
                  </div>
                  {isRecipient && (
                    <button
                      onClick={() => handleWithdraw(s.id)}
                      className="rounded-full border border-forest/30 px-4 py-2 text-xs text-forest hover:bg-forest/10 transition cursor-pointer"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
