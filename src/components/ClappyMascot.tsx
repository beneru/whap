'use client';

import React from 'react';

export type ClappyVariant = 'wave' | 'celebrate' | 'empty' | 'lost';

interface ClappyMascotProps {
  variant?: ClappyVariant;
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Original Whap Mascot: Clappy the Clapperboard
 * Flat fills, 2px #13261B ink outline, stubby arms, simple eyes, zero gradients, < 3KB inline SVG.
 */
export function ClappyMascot({
  variant = 'wave',
  size = 112,
  className = '',
  label = 'Clappy the Clapperboard mascot',
}: ClappyMascotProps) {
  const isCelebrate = variant === 'celebrate';
  const isEmpty = variant === 'empty';
  const isLost = variant === 'lost';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      className={className}
    >
      {/* Hard offset ground shadow */}
      <ellipse cx="62" cy="110" rx="34" ry="5" fill="#13261B" />

      {/* Left stubby arm */}
      {isCelebrate ? (
        <path
          d="M24 62 C12 50, 10 38, 16 32 C20 28, 25 34, 26 44"
          fill="#3DDC84"
          stroke="#13261B"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M24 64 C13 64, 10 72, 16 77 C20 80, 24 76, 26 70"
          fill="#3DDC84"
          stroke="#13261B"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {/* Right stubby arm (waves or holds magnifying glass / star) */}
      {variant === 'wave' || isCelebrate ? (
        <path
          d="M96 62 C108 50, 110 36, 103 31 C98 28, 94 35, 94 46"
          fill="#3DDC84"
          stroke="#13261B"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M96 65 C106 66, 109 74, 102 78 C98 80, 95 76, 94 70"
          fill="#3DDC84"
          stroke="#13261B"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {/* Stubby legs / boots */}
      <rect
        x="40"
        y="94"
        width="14"
        height="14"
        rx="6"
        fill="#0F7D43"
        stroke="#13261B"
        strokeWidth="2"
      />
      <rect
        x="66"
        y="94"
        width="14"
        height="14"
        rx="6"
        fill="#0F7D43"
        stroke="#13261B"
        strokeWidth="2"
      />

      {/* Main clapperboard body */}
      <rect
        x="24"
        y="36"
        width="72"
        height="62"
        rx="14"
        fill="#FFFFFF"
        stroke="#13261B"
        strokeWidth="2"
      />

      {/* Mint belly sticker panel */}
      <rect
        x="30"
        y="46"
        width="60"
        height="46"
        rx="10"
        fill="#EEF9F1"
        stroke="#13261B"
        strokeWidth="2"
      />

      {/* Top hinged clapper bar (tilted up when celebrating) */}
      <g transform={isCelebrate ? 'rotate(-10 24 34)' : 'rotate(-4 24 34)'}>
        <rect
          x="22"
          y="20"
          width="76"
          height="16"
          rx="6"
          fill="#3DDC84"
          stroke="#13261B"
          strokeWidth="2"
        />
        {/* Flat diagonal clapper stripes */}
        <polygon
          points="36,20 46,20 38,36 28,36"
          fill="#FFFFFF"
          stroke="#13261B"
          strokeWidth="2"
        />
        <polygon
          points="58,20 68,20 60,36 50,36"
          fill="#FFFFFF"
          stroke="#13261B"
          strokeWidth="2"
        />
        <polygon
          points="80,20 90,20 82,36 72,36"
          fill="#FFFFFF"
          stroke="#13261B"
          strokeWidth="2"
        />
        {/* Hinge bolt */}
        <circle
          cx="29"
          cy="28"
          r="3.5"
          fill="#FFD23F"
          stroke="#13261B"
          strokeWidth="2"
        />
      </g>

      {/* Simple expressive eyes */}
      <circle cx="46" cy="64" r="5" fill="#13261B" />
      <circle cx="44.5" cy="62.5" r="1.5" fill="#FFFFFF" />
      <circle cx="74" cy="64" r="5" fill="#13261B" />
      <circle cx="72.5" cy="62.5" r="1.5" fill="#FFFFFF" />

      {/* Rosy sticker cheeks */}
      <ellipse
        cx="37"
        cy="71"
        rx="4.5"
        ry="2.5"
        fill="#FFD23F"
        stroke="#13261B"
        strokeWidth="1.5"
      />
      <ellipse
        cx="83"
        cy="71"
        rx="4.5"
        ry="2.5"
        fill="#FFD23F"
        stroke="#13261B"
        strokeWidth="1.5"
      />

      {/* Mouth by mood */}
      {isCelebrate && (
        <path
          d="M49 71 C51 81, 69 81, 71 71 Z"
          fill="#FF7A6B"
          stroke="#13261B"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {variant === 'wave' && (
        <path
          d="M50 72 C54 78, 66 78, 70 72"
          stroke="#13261B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
      {isEmpty && (
        <circle
          cx="60"
          cy="74"
          r="3.5"
          fill="#8ED1FC"
          stroke="#13261B"
          strokeWidth="2"
        />
      )}
      {isLost && (
        <path
          d="M52 76 C56 72, 64 72, 68 76"
          stroke="#13261B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}

      {/* Accessory badge on top right */}
      {isCelebrate && (
        <polygon
          points="106,12 109,19 116,19 110,24 112,31 106,27 100,31 102,24 96,19 103,19"
          fill="#FFD23F"
          stroke="#13261B"
          strokeWidth="2"
        />
      )}
      {isLost && (
        <text
          x="98"
          y="24"
          fill="#13261B"
          fontFamily="var(--font-display), cursive"
          fontSize="20"
        >
          ?
        </text>
      )}
    </svg>
  );
}

/**
 * Lightweight inline confetti burst for "clip selected" and "payout paid".
 * Respects prefers-reduced-motion automatically via globals.css.
 */
export function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;

  const pieces = [
    { color: '#3DDC84', tx: '-42px', ty: '-38px', rot: '-85deg' },
    { color: '#FFD23F', tx: '-18px', ty: '-52px', rot: '45deg' },
    { color: '#8ED1FC', tx: '14px', ty: '-48px', rot: '110deg' },
    { color: '#FF7A6B', tx: '40px', ty: '-34px', rot: '-60deg' },
    { color: '#3DDC84', tx: '-34px', ty: '-14px', rot: '130deg' },
    { color: '#FFD23F', tx: '36px', ty: '-12px', rot: '-120deg' },
  ];

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none relative inline-flex items-center justify-center"
    >
      {pieces.map((p, idx) => (
        <span
          key={idx}
          style={
            {
              backgroundColor: p.color,
              '--tx': p.tx,
              '--ty': p.ty,
              '--rot': p.rot,
            } as React.CSSProperties
          }
          className="confetti-piece absolute h-3 w-3 rounded-sm border-2 border-ink"
        />
      ))}
    </span>
  );
}
