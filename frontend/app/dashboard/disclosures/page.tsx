'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, getWalletClient, getPublicClient } from '@/lib/useWallet';
import { CONTRACTS, STREAM_ABI } from '@/lib/contracts';
import { fetchAllStreams, type StreamSummary } from '@/lib/streams';
import { HandleGlyph } from '@/components/HandleGlyph';

interface DisclosureRecord {
  streamId: bigint;
  auditor: `0x${string}`;
  requestedBy: `0x${string}`;
  snapshotHandle: `0x${string}`;
  timestamp: bigint;
}

export default function DisclosuresPage() {
  const { address, connect, connecting } = useWallet();
  const [myStreams, setMyStreams] = useState<StreamSummary[]>([]);
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [auditorAddress, setAuditorAddress] = useState('');
  const [disclosing, setDisclosing] = useState(false);
  const [disclosureStep, setDisclosureStep] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<DisclosureRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadMyStreams = useCallback(async () => {
    if (!address) return;
    try {
      const all = await fetchAllStreams();
      setMyStreams(all.filter((s) => s.sender.toLowerCase() === address.toLowerCase()));
    } catch (err) {
      console.error('Failed to load my streams:', err);
    }
  }, [address]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const publicClient = getPublicClient();
      const logs = await publicClient.getContractEvents({
        address: CONTRACTS.stream as `0x${string}`,
        abi: [{
          type: 'event',
          name: 'DisclosureGranted',
          inputs: [
            { name: 'streamId', type: 'uint256', indexed: true },
            { name: 'auditor', type: 'address', indexed: true },
            { name: 'requestedBy', type: 'address', indexed: true },
            { name: 'snapshotHandle', type: 'bytes32', indexed: false },
            { name: 'timestamp', type: 'uint256', indexed: false },
          ],
        }],
        fromBlock: 0n,
      });
      
      const mapped = logs.map((l) => l.args as unknown as DisclosureRecord);
      setHistory(mapped.reverse());
    } catch (err) {
      console.error('Failed to load history logs:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadMyStreams();
  }, [loadMyStreams]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleDisclose() {
    if (!address || !selectedStreamId || !auditorAddress) {
      setErrorMsg('Please choose a stream and enter an auditor address.');
      return;
    }
    setErrorMsg(null);
    setDisclosing(true);
    setDisclosureStep('submitting');
    try {
      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      const tx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.stream as `0x${string}`,
        abi: STREAM_ABI,
        functionName: 'discloseToAuditor',
        args: [BigInt(selectedStreamId), auditorAddress as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      setDisclosureStep('done');
      setAuditorAddress('');
      await loadHistory();
    } catch (err: any) {
      setErrorMsg(err?.shortMessage ?? err?.message ?? 'Something went wrong.');
      setDisclosureStep('error');
    } finally {
      setDisclosing(false);
    }
  }

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <span className="font-mono text-xs text-ink/30 uppercase tracking-widest">
        Treasury / Disclosures
      </span>
      <h1 className="font-serif text-3xl text-ink mt-1 mb-3">Show an Auditor</h1>
      <p className="text-ink/60 mb-10 leading-relaxed text-sm">
        Sometimes an auditor or regulator needs to verify one specific payment.
        This grants them a frozen snapshot of exactly that number - nothing more,
        and nothing ongoing. This action can't be undone, but it also can't be
        used to see anything beyond this one value.
      </p>

      {!address ? (
        <button
          onClick={connect}
          disabled={connecting}
          className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-ink hover:bg-forest/80 transition mb-12 cursor-pointer"
        >
          {connecting ? 'Connecting...' : 'Connect your wallet to continue'}
        </button>
      ) : myStreams.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 p-8 text-center text-ink/50 mb-12 bg-ink/[0.01]">
          You do not have any streams to disclose yet.
          <br />
          <span className="text-xs text-ink/30 mt-2 block">Create one from the Streams page first.</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink/10 p-8 mb-12 bg-ink/[0.01]">
          <div className="grid gap-5 mb-6">
            <div>
              <label className="block text-sm text-ink/70 mb-2 font-medium">Which payment stream?</label>
              <select
                value={selectedStreamId}
                onChange={(e) => setSelectedStreamId(e.target.value)}
                className="w-full rounded-xl bg-ink/5 border border-ink/10 px-4 py-3 text-ink font-mono text-xs focus:outline-none focus:border-forest/50 cursor-pointer"
              >
                <option value="" className="bg-base text-ink">Select a stream...</option>
                {myStreams.map((s) => (
                  <option key={s.id.toString()} value={s.id.toString()} className="bg-base text-ink font-mono">
                    Stream #{s.id.toString()} - to {s.recipient.slice(0, 6)}...{s.recipient.slice(-4)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-ink/70 mb-2 font-medium">Who's the auditor?</label>
              <input
                type="text"
                placeholder="0x..."
                value={auditorAddress}
                onChange={(e) => setAuditorAddress(e.target.value)}
                className="w-full rounded-xl bg-ink/5 border border-ink/10 px-4 py-3 text-ink font-mono text-xs focus:outline-none focus:border-forest/50"
              />
              <p className="text-xs text-ink/30 mt-2">
                This can be anyone - an accountant, a compliance reviewer, or a
                regulator. They do not need to hold any funds first.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-brick/30 bg-brick/[0.08] px-4 py-3 mb-4 text-sm text-brick">
              {errorMsg}
            </div>
          )}

          {disclosureStep === 'done' ? (
            <div className="rounded-xl border border-gold/30 bg-gold/[0.08] px-4 py-4 flex items-center gap-3">
              <HandleGlyph className="w-5 h-5 text-gold" filled />
              <div>
                <p className="text-gold font-medium text-sm">Snapshot granted.</p>
                <p className="text-ink/50 text-xs mt-0.5">
                  The auditor can now decrypt exactly this one amount - nothing else.
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleDisclose}
              disabled={disclosing}
              className="w-full rounded-full bg-gold/90 px-6 py-3.5 text-sm font-medium text-base hover:bg-gold transition disabled:opacity-60 cursor-pointer"
            >
              {disclosureStep === 'submitting' ? 'Granting disclosure...' : 'Show this payment to the auditor'}
            </button>
          )}
        </div>
      )}

      {/* Public disclosure log - the accountability trail */}
      <div className="rounded-2xl border border-ink/10 overflow-hidden bg-ink/[0.01]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10">
          <span className="text-ink font-medium">Disclosure Log</span>
          <span className="font-mono text-xs text-ink/30">Public - anyone can verify who saw what</span>
        </div>
        {loadingHistory ? (
          <div className="p-8 text-center text-ink/40 text-sm animate-pulse">Loading...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-ink/40 text-sm">No disclosures yet.</div>
        ) : (
          <div className="divide-y divide-ink/5">
            {history.map((d, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <HandleGlyph className="w-4 h-4 text-gold shrink-0" filled />
                <p className="text-sm text-ink/70">
                  Stream #{d.streamId.toString()} shown to{' '}
                  <span className="font-mono text-ink font-medium">{d.auditor.slice(0, 6)}...{d.auditor.slice(-4)}</span>
                  {' '}by <span className="font-mono text-ink/50">{d.requestedBy.slice(0, 6)}...{d.requestedBy.slice(-4)}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
