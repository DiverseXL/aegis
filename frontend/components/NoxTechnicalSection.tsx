'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { HandleGlyph } from './HandleGlyph';

export default function NoxTechnicalSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  // Spring animation settings for the hover interactions
  const hoverSpring = {
    type: 'spring',
    stiffness: 300,
    damping: 20,
  };

  return (
    <section
      ref={sectionRef}
      className="bg-[#0D1310] text-ink py-32 px-6 border-t border-ink/10 relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto z-10 relative">
        {/* Eyebrow Label */}
        <span className="block font-mono text-xs tracking-widest text-forest uppercase mb-4">
          BUILT ON NOX
        </span>

        {/* Header Content */}
        <h2 className="font-serif text-4xl md:text-5xl font-medium text-ink mb-4 max-w-2xl">
          A number that exists, but can't be read.
        </h2>
        <p className="font-sans text-ink/60 text-sm md:text-base mb-20 max-w-xl leading-relaxed">
          iExec's Nox protocol lets smart contracts compute on encrypted values directly —
          no one, not even the contract itself, sees the plaintext unless explicitly permitted.
        </p>

        {/* Core Visual Diagram */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-4 mb-24">
          {/* Stage 1: Plaintext value */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-1 flex flex-col items-center w-full"
          >
            <span className="font-mono text-[10px] tracking-wider text-ink/30 uppercase mb-3">
              Stage 01 // Input
            </span>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={hoverSpring}
              className="bg-[#0B0F0D] border border-ink/10 rounded-xl p-5 flex items-center justify-center font-mono text-ink text-lg h-16 w-full shadow-inner relative overflow-hidden cursor-default"
            >
              1,000
            </motion.div>
            <p className="font-sans text-ink/50 text-xs mt-4 text-center max-w-[240px] leading-relaxed">
              A value exists off-chain.
            </p>
          </motion.div>

          {/* Connector 1 */}
          <div className="flex items-center justify-center h-16 shrink-0">
            {/* Desktop Horizontal Arrow */}
            <motion.svg
              initial={{ opacity: 0, scaleX: 0 }}
              animate={isInView ? { opacity: 0.3, scaleX: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.3 }}
              viewBox="0 0 24 24"
              className="w-6 h-6 text-ink/30 shrink-0 mx-2 hidden md:block origin-left"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </motion.svg>
            {/* Mobile Vertical Arrow */}
            <motion.svg
              initial={{ opacity: 0, scaleY: 0 }}
              animate={isInView ? { opacity: 0.3, scaleY: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.3 }}
              viewBox="0 0 24 24"
              className="w-6 h-6 text-ink/30 shrink-0 my-2 md:hidden origin-top"
            >
              <path
                d="M12 5v14M5 12l7 7 7-7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </motion.svg>
          </div>

          {/* Stage 2: Encrypted handle */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex-1 flex flex-col items-center w-full"
          >
            <span className="font-mono text-[10px] tracking-wider text-forest uppercase mb-3">
              Stage 02 // Encrypted
            </span>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={hoverSpring}
              className="bg-[#0B0F0D] border border-ink/10 rounded-xl p-5 flex items-center justify-center gap-2.5 font-mono text-forest text-sm h-16 w-full shadow-inner relative overflow-hidden cursor-default"
            >
              <HandleGlyph className="w-4 h-4 text-forest shrink-0" filled />
              <span className="truncate">0x0000aa36a7...f5eb9</span>
            </motion.div>
            <p className="font-sans text-ink/50 text-xs mt-4 text-center max-w-[240px] leading-relaxed">
              <code className="text-forest font-mono">Nox.fromExternal()</code> converts it into an on-chain handle — a reference to encrypted data, never the value itself.
            </p>
          </motion.div>

          {/* Connector 2 */}
          <div className="flex items-center justify-center h-16 shrink-0">
            {/* Desktop Horizontal Arrow */}
            <motion.svg
              initial={{ opacity: 0, scaleX: 0 }}
              animate={isInView ? { opacity: 0.3, scaleX: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.6 }}
              viewBox="0 0 24 24"
              className="w-6 h-6 text-ink/30 shrink-0 mx-2 hidden md:block origin-left"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </motion.svg>
            {/* Mobile Vertical Arrow */}
            <motion.svg
              initial={{ opacity: 0, scaleY: 0 }}
              animate={isInView ? { opacity: 0.3, scaleY: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.6 }}
              viewBox="0 0 24 24"
              className="w-6 h-6 text-ink/30 shrink-0 my-2 md:hidden origin-top"
            >
              <path
                d="M12 5v14M5 12l7 7 7-7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </motion.svg>
          </div>

          {/* Stage 3: Access-controlled reveal */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex-1 flex flex-col items-center w-full"
          >
            <span className="font-mono text-[10px] tracking-wider text-gold uppercase mb-3">
              Stage 03 // Disclosed
            </span>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={hoverSpring}
              className="bg-[#0B0F0D] border border-ink/10 rounded-xl p-4 flex items-center justify-center gap-2 font-mono text-sm h-16 w-full shadow-inner relative overflow-hidden cursor-default"
            >
              <div className="flex items-center gap-1 text-forest/40 shrink-0">
                <HandleGlyph className="w-3.5 h-3.5 text-forest" filled />
                <span className="hidden lg:inline text-[10px]">0x0000a...eb9</span>
                <span className="inline lg:hidden text-[10px]">0x00...b9</span>
              </div>
              <div className="bg-gold/10 border border-gold/30 text-gold text-[9px] px-2 py-0.5 rounded flex items-center gap-1 font-semibold shrink-0">
                <span>✓ viewer: 0x0Ec6...ce59</span>
              </div>
            </motion.div>
            <p className="font-sans text-ink/50 text-xs mt-4 text-center max-w-[240px] leading-relaxed">
              Only addresses explicitly granted access (via <code className="text-gold font-mono">Nox.allow()</code> / <code className="text-gold font-mono">Nox.addViewer()</code>) can ever decrypt it back to the real number.
            </p>
          </motion.div>
        </div>

        {/* Technical Callouts Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 border-t border-ink/10 pt-16 mb-16">
          {/* Callout 1 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            <h3 className="font-mono text-xs font-semibold text-ink mb-3 uppercase tracking-wider">
              // euint256 arithmetic
            </h3>
            <p className="font-sans text-ink/50 text-xs leading-relaxed">
              Nox.mul() and Nox.div() operate directly on encrypted values — enabling real linear-vesting math without ever exposing the amount.
            </p>
          </motion.div>

          {/* Callout 2 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 1.0 }}
          >
            <h3 className="font-mono text-xs font-semibold text-ink mb-3 uppercase tracking-wider">
              // No revoke, by design
            </h3>
            <p className="font-sans text-ink/50 text-xs leading-relaxed">
              ACL grants are permanent once made. Selective disclosure works by creating a frozen, independently-ACL'd snapshot instead — not by revoking access.
            </p>
          </motion.div>

          {/* Callout 3 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 1.1 }}
          >
            <h3 className="font-mono text-xs font-semibold text-ink mb-3 uppercase tracking-wider">
              // Verified on 3 explorers
            </h3>
            <p className="font-sans text-ink/50 text-xs leading-relaxed">
              Every Aegis contract is verified on Etherscan, Blockscout, and Sourcify — the bytecode matches the public source, exactly.
            </p>
          </motion.div>
        </div>

        {/* Technical Writeup Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="flex justify-center"
        >
          <a
            href="https://github.com/DiverseXL/aegis/blob/main/feedback.md"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm text-forest hover:text-forest/80 transition-colors flex items-center gap-1 group"
          >
            <span>Read our full technical writeup on Nox integration</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
