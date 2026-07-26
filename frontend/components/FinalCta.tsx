'use client';

import { motion } from 'framer-motion';

export default function FinalCta() {
  const handleLaunch = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById('dashboard');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-[#0B0F0D] text-ink py-32 px-6 border-t border-ink/10 relative overflow-hidden flex flex-col items-center justify-center text-center">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-forest/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl z-10 relative">
        {/* Headline */}
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium text-ink leading-tight mb-4">
          Money is private.
          <br />
          <span className="text-forest">Try it.</span>
        </h2>

        {/* Subhead */}
        <p className="font-sans text-ink/60 text-sm sm:text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
          Live on Ethereum Sepolia. Connect a wallet and see it work.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#dashboard"
            onClick={handleLaunch}
            className="w-full sm:w-auto text-center rounded-full bg-forest px-8 py-4 text-base font-medium text-ink hover:bg-forest/80 transition duration-200"
          >
            Launch App
          </a>
          <a
            href="https://github.com/aegis-confidential/aegis"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto text-center rounded-full border border-ink/20 px-8 py-4 text-base font-medium text-ink hover:bg-ink/10 transition duration-200"
          >
            Read the Code
          </a>
        </div>
      </div>
    </section>
  );
}
