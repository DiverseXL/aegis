'use client';

export default function GlassTransition() {
  return (
    <div className="relative h-40 md:h-56 -mt-24 md:-mt-36 z-20 overflow-hidden pointer-events-none">
      {/* Frosted liquid glass backdrop panel */}
      <div
        className="absolute inset-0 backdrop-blur-3xl bg-gradient-to-b from-white/5 via-emerald-950/20 to-[#0f1712] border-t border-emerald-400/20 shadow-[0_-15px_40px_rgba(16,185,129,0.15)]"
        style={{
          clipPath:
            'polygon(0 45%, 100% 15%, 100% 100%, 0% 100%)',
        }}
      />
      {/* Subtle liquid glow line */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-400/30 to-emerald-500/0 opacity-70"
        style={{
          clipPath: 'polygon(0 44%, 100% 14%, 100% 18%, 0% 48%)',
        }}
      />
    </div>
  );
}
