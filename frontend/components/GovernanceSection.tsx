'use client';

import { motion } from 'framer-motion';
import { HandleGlyph } from './HandleGlyph';

export default function GovernanceSection() {
  return (
    <section className="bg-base text-ink py-24 px-6 border-t border-ink/10 relative overflow-hidden flex items-center justify-center">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl w-full z-10 relative flex flex-col items-center">
        {/* Eyebrow Label */}
        <span className="block font-mono text-xs tracking-widest text-forest uppercase mb-4 text-center">
          GOVERNANCE READY
        </span>

        {/* Header Content */}
        <h2 className="font-serif text-3xl md:text-4xl font-medium text-ink mb-3 text-center">
          Not a single wallet. A real multisig.
        </h2>
        <p className="font-sans text-ink/60 text-xs md:text-sm mb-12 max-w-lg text-center leading-relaxed">
          Aegis doesn't just claim Safe compatibility — every transaction on this page was executed by an actual Gnosis Safe on Sepolia, not a proxied EOA.
        </p>

        {/* Credential Card */}
        <motion.a
          href="https://sepolia.etherscan.io/address/0x1c0780facd4e295439c07fd69104f276de80dfb4"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.01 }}
          animate={{
            borderColor: [
              'rgba(61, 139, 110, 0.15)',
              'rgba(61, 139, 110, 0.3)',
              'rgba(61, 139, 110, 0.15)',
            ],
            boxShadow: [
              '0 0 20px 0px rgba(61, 139, 110, 0.03)',
              '0 0 30px 4px rgba(61, 139, 110, 0.08)',
              '0 0 20px 0px rgba(61, 139, 110, 0.03)',
            ],
          }}
          transition={{
            borderColor: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            boxShadow: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            scale: { type: 'spring', stiffness: 300, damping: 20 },
          }}
          className="w-full bg-[#0D1310]/50 border border-forest/20 rounded-3xl p-8 md:p-10 flex flex-col items-center text-center cursor-pointer select-none backdrop-blur-sm"
        >
          {/* Large HandleGlyph Icon */}
          <div className="mb-6 bg-forest/10 p-3 rounded-2xl border border-forest/20">
            <HandleGlyph className="w-10 h-10 text-forest" filled />
          </div>

          {/* Caps Label */}
          <span className="font-mono text-[10px] tracking-[0.2em] text-ink/40 uppercase mb-2">
            DEPLOYED SAFE · 1-OF-1 MULTISIG
          </span>

          {/* Safe Address */}
          <span className="font-mono text-xs sm:text-sm md:text-base text-ink hover:text-forest transition-colors duration-200 break-all mb-8 max-w-full">
            0x1c0780faCD4E295439c07FD69104f276de80DFB4
          </span>

          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-4 md:gap-8 border-t border-b border-ink/5 py-4 w-full mb-8 font-mono text-[10px] md:text-xs text-ink/70">
            <span>2 batched transactions</span>
            <span className="h-4 w-[1px] bg-ink/10" />
            <span>1 confidential stream created</span>
            <span className="h-4 w-[1px] bg-ink/10" />
            <span>0 code changes to Safe itself</span>
          </div>

          {/* Supporting Sentence */}
          <p className="font-sans text-ink/50 text-xs max-w-lg leading-relaxed">
            Any DAO's existing Safe can create and hold confidential streams — no new contracts, no forked code, no custom module required.
          </p>
        </motion.a>
      </div>
    </section>
  );
}
