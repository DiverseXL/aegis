'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { HandleGlyph } from './HandleGlyph';
import { EncryptedAmount } from './EncryptedAmount';

export default function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-base text-ink py-32 px-6 overflow-hidden"
    >
      {/* subtle vertical line grid, ledger-paper reference — unique to this section */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(90deg, #E8E4DB 0px, transparent 1px, transparent 120px)',
      }} />

      <div className="relative max-w-5xl mx-auto z-10">
        <span className="block text-center font-mono text-xs tracking-widest text-brick uppercase mb-4">
          The Problem
        </span>
        <h2 className="text-center font-serif text-4xl md:text-5xl font-medium text-ink mb-4">
          Every payment. Forever public.
        </h2>
        <p className="text-center text-ink/60 max-w-lg mx-auto mb-16">
          Right now, anyone can look up exactly what your DAO paid — who got
          what, and when — going back to day one.
        </p>

        <div className="grid md:grid-cols-2 gap-0 border border-ink/10 rounded-3xl overflow-hidden bg-base/50 backdrop-blur-sm">
          {/* Left: exposed, sharp, ledger-red */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="p-8 bg-brick/[0.07] border-r border-ink/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-lg text-ink/90">Public Blockchain Today</h3>
                <span className="font-mono text-[10px] tracking-wider text-brick uppercase border border-brick/30 rounded-full px-2 py-0.5">
                  Exposed
                </span>
              </div>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between text-ink/70">
                  <span>0x4a2f...9c1e</span><span className="text-brick">12,500 USDC</span>
                </div>
                <div className="flex justify-between text-ink/70">
                  <span>0x8b91...3d02</span><span className="text-brick">8,200 USDC</span>
                </div>
                <div className="flex justify-between text-ink/70">
                  <span>0x1c44...7ae5</span><span className="text-brick">15,000 USDC</span>
                </div>
              </div>
            </div>
            <p className="mt-8 text-xs text-ink/50 leading-relaxed">
              <strong className="text-ink/70">Visible to:</strong> everyone, forever.<br />
              <strong className="text-ink/70">Used for:</strong> front-running, comp disputes, competitor intelligence.
            </p>
          </motion.div>

          {/* Right: private, calm, forest */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="p-8 bg-forest/[0.06] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-lg text-ink/90 flex items-center gap-2">
                  <HandleGlyph className="w-4 h-4 text-forest" filled />
                  With Aegis
                </h3>
                <span className="font-mono text-[10px] tracking-wider text-forest uppercase border border-forest/30 rounded-full px-2 py-0.5">
                  Protected
                </span>
              </div>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between text-ink/70">
                  <span>0x4a2f...9c1e</span>
                  <EncryptedAmount realValue="12,500 USDC" trigger={isInView} />
                </div>
                <div className="flex justify-between text-ink/70">
                  <span>0x8b91...3d02</span>
                  <EncryptedAmount realValue="8,200 USDC" trigger={isInView} />
                </div>
                <div className="flex justify-between text-ink/70">
                  <span>0x1c44...7ae5</span>
                  <EncryptedAmount realValue="15,000 USDC" trigger={isInView} />
                </div>
              </div>
            </div>
            <p className="mt-8 text-xs text-ink/50 leading-relaxed">
              <strong className="text-ink/70">Visible to:</strong> only the recipient — and anyone they choose to show.<br />
              <strong className="text-ink/70">Everything else:</strong> timing, logic, audit trail — stays fully public.
            </p>
          </motion.div>
        </div>

        <p className="text-center mt-10 text-ink/50 text-sm max-w-md mx-auto">
          Same blockchain. Same transparency where it matters. Just not your paycheck.
        </p>
      </div>
    </section>
  );
}
