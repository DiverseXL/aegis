'use client';

export function GrassSilhouette({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 200"
      preserveAspectRatio="none"
      className={className}
      fill="none"
    >
      {/* Base uneven ground line */}
      <path
        d="M0,140 C120,120 200,150 320,130 C440,110 520,145 640,125
           C760,105 860,140 980,120 C1100,100 1200,135 1320,115
           C1380,105 1410,120 1440,110 L1440,200 L0,200 Z"
        fill="#0B0F0D"
      />

      {/* Layer of taller grass blades, varying height/curve, scattered along the ridge */}
      {Array.from({ length: 48 }).map((_, i) => {
        const x = (i / 48) * 1440 + (i % 3) * 8;
        const baseY = 100 + Math.sin(i * 0.7) * 25 + (i % 5) * 6;
        const height = 30 + ((i * 37) % 60);
        const curve = (i % 2 === 0 ? 1 : -1) * (8 + (i % 15));
        return (
          <path
            key={i}
            d={`M${x},${baseY} Q${x + curve},${baseY - height / 2} ${x + curve * 0.6},${baseY - height}`}
            stroke="#0B0F0D"
            strokeWidth={2.5 + (i % 3)}
            strokeLinecap="round"
          />
        );
      })}

      {/* A few small leaf shapes tucked among the blades for texture variety */}
      {[180, 460, 780, 1050, 1300].map((x, i) => (
        <ellipse
          key={`leaf-${i}`}
          cx={x}
          cy={95 + (i % 2) * 10}
          rx={14}
          ry={7}
          fill="#0B0F0D"
          transform={`rotate(${i % 2 === 0 ? 30 : -25} ${x} ${95 + (i % 2) * 10})`}
        />
      ))}
    </svg>
  );
}
