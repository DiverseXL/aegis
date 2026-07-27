'use client';

import { HandleGlyph } from './HandleGlyph';

export default function Footer() {
  return (
    <footer className="relative bg-base border-t border-ink/10 overflow-hidden min-h-[70vh] flex flex-col justify-between">
      {/* Nav row */}
      <div className="relative z-20 max-w-6xl mx-auto w-full px-8 pt-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HandleGlyph className="w-5 h-5 text-forest" filled />
          <span className="font-serif text-lg font-semibold text-ink">Aegis</span>
        </div>
        <div className="flex gap-6 text-sm">
          <a
            href="https://github.com/DiverseXL/aegis"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink/60 hover:text-forest transition"
          >
            GitHub
          </a>
          <a
            href="https://sepolia.etherscan.io/address/0xb9dC5Aebe33f7b1F74971C0F87164eD018f69C66"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold/70 hover:text-gold transition"
          >
            Etherscan (Vault)
          </a>
          <a
            href="https://github.com/DiverseXL/aegis/blob/main/feedback.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink/60 hover:text-forest transition"
          >
            feedback.md
          </a>
        </div>
      </div>

      {/* Giant wordmark — centered, fills the remaining space */}
      <div className="relative z-0 flex-1 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="font-serif text-[16rem] md:text-[22rem] lg:text-[26rem] text-forest/[0.08] leading-none whitespace-nowrap">
          Aegis
        </span>
      </div>

      {/* Placeholder foreground shape — solid, reliable, matches the base color exactly. */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 md:h-40 z-10 bg-base"
        style={{
          clipPath:
            'polygon(0% 40%, 4% 55%, 8% 35%, 12% 60%, 16% 30%, 20% 65%, 24% 40%, 28% 70%, 32% 45%, 36% 60%, 40% 30%, 44% 65%, 48% 40%, 52% 70%, 56% 35%, 60% 60%, 64% 45%, 68% 30%, 72% 65%, 76% 40%, 80% 55%, 84% 35%, 88% 60%, 92% 45%, 96% 65%, 100% 40%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Bottom copyright row */}
      <div className="relative z-20 max-w-6xl mx-auto w-full px-8 pb-8 flex items-center justify-between text-xs font-mono text-ink/40">
        <span>© 2026 Aegis — built for the iExec WTF Hackathon</span>
        <span>// PRIVATE MONEY · PUBLIC LOGIC</span>
      </div>
    </footer>
  );
}
