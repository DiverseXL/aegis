'use client';

import Navbar from './Navbar';
import { HandleGlyph } from './HandleGlyph';

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-base">
      <video 
        autoPlay 
        muted 
        loop 
        playsInline 
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-base/50" />
      <Navbar />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center pt-16">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-forest/30 bg-forest/10 px-4 py-1.5 text-xs tracking-widest text-forest uppercase font-mono">
          <HandleGlyph className="w-3.5 h-3.5" />
          Built on iExec Nox · Ethereum Sepolia
        </span>

        <h1 className="max-w-5xl font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-medium text-ink leading-[0.95] tracking-tight">
          Money is private.
          <br />
          <span className="text-forest">The logic isn&apos;t.</span>
        </h1>

        <p className="mt-8 max-w-xl text-lg md:text-xl text-ink/70">
          Aegis lets DAOs pay contributors without exposing every salary,
          grant, and bounty to the entire world — forever.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <a 
            href="/dashboard" 
            className="rounded-full bg-forest px-8 py-4 text-base font-medium text-ink hover:bg-forest/80 transition inline-block"
          >
            Launch App
          </a>
          <a 
            href="https://github.com/aegis-confidential/aegis"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-ink/20 px-8 py-4 text-base font-medium text-ink hover:bg-ink/10 transition inline-block"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
