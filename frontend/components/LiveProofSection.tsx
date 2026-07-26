'use client';
import { motion } from 'framer-motion';
import { HandleGlyph } from './HandleGlyph';

const steps = [
  { n: '01', label: 'Safe wraps treasury funds',
    txFull: '0x4b177d82952c3c40a7b6a3f42db7ae911a7d127f1e590b9421610eeacf511b31',
    txDisplay: '0x4b177d82...eeacf511b31',
    detail: 'Batched approve + wrap + setOperator — executed as one Safe multisig transaction.' },
  { n: '02', label: 'Safe creates a confidential stream',
    txFull: '0xab3627e9b56daf8bd283c641be88bd93449af5fca164c046889ff43d813517ea',
    txDisplay: '0xab3627e9...43d813517ea',
    detail: 'Amount encrypted client-side. Nox proof correctly attributed to the Safe as owner.' },
  { n: '03', label: 'Recipient withdraws vested funds',
    txFull: '0x891aba69fb84865c1e45ffb1aed5a4096f9bf9d872e1ea525b7276eb36476a36',
    txDisplay: '0x891aba69...eb36476a36',
    detail: 'Amount stays encrypted on-chain throughout the entire withdrawal.' },
  { n: '04', label: 'Safe discloses to an auditor',
    txFull: '0x892d9d01f741926999f65ea16be7afec83497dcb7ff45db7e9eb286ad8f71e14',
    txDisplay: '0x892d9d01...b286ad8f71e14',
    detail: 'A freshly generated, zero-balance wallet is granted a frozen snapshot.' },
  { n: '05', label: 'Auditor decrypts, gaslessly',
    txFull: null, txDisplay: null,
    detail: 'The auditor wallet — which never held ETH — decrypts the amount. No transaction needed.' },
];

export default function LiveProofSection() {
  return (
    <section className="bg-base py-32 px-6 border-t border-ink/10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="font-mono text-xs tracking-widest text-gold uppercase">
            Live on Ethereum Sepolia
          </span>
        </div>
        <h2 className="font-serif text-4xl md:text-5xl font-medium text-ink mb-3">
          Not a ledger. A demo.
        </h2>
        <p className="text-ink/60 mb-16 max-w-lg">
          Every step below is a real, independently verifiable transaction —
          click any hash to check it yourself on Etherscan.
        </p>

        <div className="font-mono text-sm border border-ink/10 rounded-2xl overflow-hidden bg-[#080B09]">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-ink/10 bg-ink/[0.02]">
            <span className="w-2.5 h-2.5 rounded-full bg-brick/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-gold/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-forest/60" />
            <span className="ml-3 text-ink/40 text-xs">aegis@sepolia:~$ verify --flow</span>
          </div>

          <div className="divide-y divide-ink/5">
            {steps.map((step, i) => {
              const Wrapper = step.txFull ? motion.a : motion.div;
              return (
                <Wrapper
                  key={step.n}
                  {...(step.txFull
                    ? { href: `https://sepolia.etherscan.io/tx/${step.txFull}`, target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={step.txFull ? { backgroundColor: 'rgba(232,228,219,0.03)' } : {}}
                  className={`block px-5 py-5 ${step.txFull ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-ink/30 text-xs pt-0.5">{step.n}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <HandleGlyph className="w-3.5 h-3.5 text-forest shrink-0" filled />
                        <span className="text-ink/90">{step.label}</span>
                        {step.txDisplay && (
                          <span className="text-gold/70 text-xs truncate">{step.txDisplay} ↗</span>
                        )}
                      </div>
                      <p className="text-ink/40 text-xs mt-1.5 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                </Wrapper>
              );
            })}
          </div>

          <div className="px-5 py-4 border-t border-ink/10 bg-ink/[0.02] flex items-center justify-between">
            <span className="text-ink/40 text-xs">5/5 steps verified</span>
            <span className="text-forest text-xs">✓ status: confirmed</span>
          </div>
        </div>
      </div>
    </section>
  );
}
