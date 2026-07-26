'use client';

export function HandleGlyph({ className = 'w-5 h-5', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M12 2C8 6 4 9 4 14a8 8 0 0016 0c0-5-4-8-8-12z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill={filled ? 'currentColor' : 'none'}
        fillOpacity={filled ? 0.15 : 0}
      />
      <circle cx="12" cy="15" r="2" fill="currentColor" />
    </svg>
  );
}
