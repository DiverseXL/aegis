'use client';

import { useState } from 'react';
import { useWallet, getWalletClient, getPublicClient } from '@/lib/useWallet';
import { CONTRACTS, MOCK_ERC20_ABI, VAULT_ABI } from '@/lib/contracts';
import { parseUnits } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { HandleGlyph } from '@/components/HandleGlyph';

type Step = 'idle' | 'approving' | 'approved' | 'wrapping' | 'done' | 'error';

export default function WrapPage() {
  const { address, connect, connecting } = useWallet();
  const [amount, setAmount] = useState('100');
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleWrap() {
    if (!address) return;
    setErrorMsg(null);
    try {
      const walletClient = getWalletClient();
      const publicClient = getPublicClient();
      const amountWei = parseUnits(amount, 18);

      setStep('approving');
      const approveTx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.mockUsdc as `0x${string}`,
        abi: MOCK_ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.vault as `0x${string}`, amountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
      setStep('approved');

      setStep('wrapping');
      const wrapTx = await walletClient.writeContract({
        account: address,
        address: CONTRACTS.vault as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'wrap',
        args: [address, amountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: wrapTx });
      setStep('done');
    } catch (err: any) {
      setErrorMsg(err?.shortMessage ?? err?.message ?? 'Something went wrong. Please try again.');
      setStep('error');
    }
  }

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <span className="font-mono text-xs text-ink/30 uppercase tracking-widest">
        Treasury / Wrap Funds
      </span>
      <h1 className="font-serif text-3xl text-ink mt-1 mb-3">Make your treasury private</h1>
      <p className="text-ink/60 mb-10 leading-relaxed text-sm">
        Right now, your tokens sit in a normal, fully public wallet balance -
        anyone can see exactly how much you have. "Wrapping" converts them into
        a private version that only you (or people you choose) can see.
        Nothing leaves your control - it's the same money, just hidden from view.
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
          {/* Amount input */}
          <label className="block text-sm text-ink/70 mb-2">
            How much do you want to make private?
          </label>
          <div className="flex items-center gap-3 mb-8">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={step !== 'idle' && step !== 'error'}
              className="flex-1 rounded-xl bg-ink/5 border border-ink/10 px-4 py-3 text-ink font-mono text-lg focus:outline-none focus:border-forest/50 disabled:opacity-50"
            />
            <span className="font-mono text-ink/40 text-sm">mUSDC</span>
          </div>

          {/* Step-by-step visual progress */}
          <div className="space-y-4 mb-8">
            <ProgressStep
              number={1}
              label="Allow the vault to access your tokens"
              sublabel="A standard permission step - this doesn't move any funds yet."
              status={
                step === 'idle' || step === 'error' ? 'pending'
                : step === 'approving' ? 'active'
                : 'done'
              }
            />
            <ProgressStep
              number={2}
              label="Convert to a private balance"
              sublabel="This is the actual transaction that hides your amount."
              status={
                step === 'wrapping' ? 'active'
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
            <div className="rounded-xl border border-forest/30 bg-forest/[0.08] px-4 py-4 flex items-center gap-3">
              <HandleGlyph className="w-5 h-5 text-forest" filled />
              <div>
                <p className="text-forest font-medium text-sm">Done - your funds are now private.</p>
                <p className="text-ink/50 text-xs mt-0.5">
                  Only you can see this balance. Next: create a payment stream.
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleWrap}
              disabled={step === 'approving' || step === 'wrapping'}
              className="w-full rounded-full bg-forest px-6 py-3.5 text-sm font-medium text-ink hover:bg-forest/80 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {step === 'approving' && 'Step 1 of 2 - waiting for your wallet...'}
              {step === 'wrapping' && 'Step 2 of 2 - wrapping your funds...'}
              {(step === 'idle' || step === 'error') && 'Start - make it private'}
            </button>
          )}

          <p className="text-xs text-ink/30 text-center mt-4">
            You'll be asked to confirm two transactions in your wallet. Both are
            normal and expected - this isn't a mistake or a duplicate charge.
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
