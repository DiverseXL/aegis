'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    q: 'Is this audited?',
    a: "No. Aegis is a hackathon submission built on Nox, a new confidential computing protocol. It's tested end-to-end on Sepolia testnet, but has not undergone a professional security audit — treat it as a proof of concept, not production-ready financial infrastructure.",
  },
  {
    q: 'What happens to the money if I lose wallet access?',
    a: "Aegis doesn't custody funds beyond the on-chain vault contract itself — access follows standard wallet or Safe ownership, exactly like any other smart contract.",
  },
  {
    q: 'Can an auditor see everything, forever, once disclosed?',
    a: 'No. Disclosure grants a frozen snapshot of one historical value — not ongoing access to a live, changing balance. See "Built on Nox" above.',
  },
  {
    q: 'Which chains does this support?',
    a: "Ethereum Sepolia currently, matching Nox's confirmed deployment. Mainnet support depends on Nox's own mainnet rollout.",
  },
  {
    q: 'Do recipients need to understand encryption to get paid?',
    a: 'No — recipients connect a normal wallet and withdraw, exactly like any other crypto payment. The encryption is handled entirely underneath.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="bg-base text-ink py-32 px-6 border-t border-ink/10">
      <div className="max-w-2xl mx-auto">
        {/* Eyebrow */}
        <span className="block font-mono text-xs tracking-widest text-forest uppercase mb-4 text-center">
          QUESTIONS
        </span>
        
        {/* Headline */}
        <h2 className="font-serif text-4xl md:text-5xl font-medium text-ink mb-16 text-center">
          Before you ask.
        </h2>

        {/* Accordion List */}
        <div className="border-b border-ink/10">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="border-t border-ink/10 py-5">
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between text-left focus:outline-none group"
                >
                  <span className="font-sans text-ink text-base md:text-lg font-medium group-hover:text-forest transition-colors duration-200">
                    {faq.q}
                  </span>
                  <span className="font-mono text-xl text-forest select-none ml-4 shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                        open: { opacity: 1, height: 'auto', marginTop: 16 },
                        collapsed: { opacity: 0, height: 0, marginTop: 0 }
                      }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <div className="border-l-2 border-forest/30 pl-4 text-ink/60 text-sm leading-relaxed font-sans">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
