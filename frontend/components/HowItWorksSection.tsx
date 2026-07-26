'use client';

import { motion } from 'framer-motion';
import { HandleGlyph } from './HandleGlyph';

const steps = [
  { 
    label: 'Wrap', 
    headline: 'Deposit funds, privately.', 
    desc: "Your DAO's treasury converts into a confidential balance. Nobody can see how much is inside — only you and whoever you choose to show." 
  },
  { 
    label: 'Stream', 
    headline: 'Pay contributors, quietly.', 
    desc: 'Salaries, grants, and bounties flow out over time. The payment is fully real and verifiable on-chain — just not the amount.' 
  },
  { 
    label: 'Disclose', 
    headline: "Show auditors exactly what's needed.", 
    desc: 'Grant a compliance reviewer a frozen snapshot of one specific number — nothing more, nothing ongoing, fully logged.' 
  },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-[#0F1712] py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <span className="block font-mono text-xs tracking-widest text-forest uppercase mb-4">
          How It Works
        </span>
        <h2 className="font-serif text-4xl md:text-5xl font-medium text-ink mb-20">
          Three steps. Full privacy.
        </h2>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ x: 8 }}
              className="flex items-start gap-8 py-10 border-t border-ink/10 group cursor-default"
            >
              <div className="flex flex-col items-center pt-1.5">
                <HandleGlyph
                  className="w-6 h-6 text-forest group-hover:text-gold transition-colors duration-300"
                  filled
                />
              </div>
              <div className="flex-1">
                <span className="font-mono text-xs tracking-widest text-ink/40 uppercase">
                  {step.label}
                </span>
                <h3 className="font-sans text-2xl md:text-3xl font-semibold text-ink mt-1 mb-3">
                  {step.headline}
                </h3>
                <p className="text-ink/60 max-w-lg">{step.desc}</p>
              </div>
            </motion.div>
          ))}
          <div className="border-t border-ink/10" />
        </div>
      </div>
    </section>
  );
}
