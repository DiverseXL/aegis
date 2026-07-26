'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface EncryptedAmountProps {
  realValue: string;
  finalLabel?: string;
  trigger?: boolean;
}

export function EncryptedAmount({ realValue, finalLabel = 'hidden', trigger = false }: EncryptedAmountProps) {
  const [display, setDisplay] = useState(realValue);
  const [encrypted, setEncrypted] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    const chars = '0123456789';
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      if (ticks < 12) {
        // scramble effect: random digits briefly
        setDisplay(
          realValue.replace(/[0-9]/g, () => chars[Math.floor(Math.random() * chars.length)])
        );
      } else {
        clearInterval(interval);
        setEncrypted(true);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [realValue, trigger]);

  return (
    <span className="font-mono">
      {encrypted ? (
        <motion.span
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          className="text-emerald-400 flex items-center gap-1.5 justify-end"
        >
          {/* Clean SVG Lock Icon instead of emoji */}
          <svg className="w-3.5 h-3.5 text-emerald-400 fill-current" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          {finalLabel}
        </motion.span>
      ) : (
        <span className="text-emerald-400/70">{display}</span>
      )}
    </span>
  );
}
