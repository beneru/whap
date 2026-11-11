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
 * Modern Professional Whap Visual Emblem
 * Clean geometric film slate, crisp lines, subtle emerald accents.
 * Professional creator tool aesthetic (Linear / Whop inspired).
 */
export function ClappyMascot({
  variant = 'wave',
  size = 112,
  className = '',
  label = 'Whap Creator Emblem',
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
      {/* Ambient soft shadow */}
      <ellipse cx="60" cy="108" rx="38" ry="4" fill="#0F1E15" fillOpacity="0.08" />

      {/* Main slate container */}
      <rect
        x="20"
        y="38"
        width="80"
        height="64"
        rx="12"
        fill="#FFFFFF"
        stroke="#13261B"
        strokeWidth="1.75"
      />

      {/* Subtle interior workspace pane */}
      <rect
        x="26"
        y="44"
        width="68"
        height="52"
        rx="8"
        fill="#EEF9F1"
        stroke="#13261B"
        strokeWidth="1"
        strokeOpacity="0.15"
      />

      {/* Top hinged clapper bar */}
      <g transform={isCelebrate ? 'rotate(-8 20 34)' : 'rotate(-2 20 34)'}>
        <rect
          x="18"
          y="20"
          width="84"
          height="16"
          rx="5"
          fill="#3DDC84"
          stroke="#13261B"
          strokeWidth="1.75"
        />
        {/* Diagonal slate marks */}
        <polygon
          points="32,20 42,20 34,36 24,36"
          fill="#FFFFFF"
          stroke="#13261B"
          strokeWidth="1.5"
        />
        <polygon
          points="54,20 64,20 56,36 46,36"
          fill="#FFFFFF"
          stroke="#13261B"
          strokeWidth="1.5"
        />
        <polygon
          points="76,20 86,20 78,36 68,36"
          fill="#FFFFFF"
          stroke="#13261B"
          strokeWidth="1.5"
        />
        {/* Sleek metallic hinge pin */}
        <circle
          cx="24"
          cy="28"
          r="3"
          fill="#0F7D43"
          stroke="#13261B"
          strokeWidth="1.5"
        />
      </g>

      {/* Center Professional Feature Graphic based on Variant */}
      {variant === 'wave' && (
        <g>
          {/* Circular Play / Wave Emblem */}
          <circle
            cx="60"
            cy="70"
            r="16"
            fill="#FFFFFF"
            stroke="#13261B"
            strokeWidth="1.5"
          />
          {/* Emerald Play Triangle */}
          <polygon
            points="56,62 68,70 56,78"
            fill="#0F7D43"
          />
          {/* Signal / Soundwave lines */}
          <line x1="82" y1="65" x2="82" y2="75" stroke="#13261B" strokeWidth="2" strokeLinecap="round" />
          <line x1="86" y1="62" x2="86" y2="78" stroke="#3DDC84" strokeWidth="2" strokeLinecap="round" />
          <line x1="38" y1="65" x2="38" y2="75" stroke="#13261B" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="62" x2="34" y2="78" stroke="#3DDC84" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {isCelebrate && (
        <g>
          {/* Emerald Checkmark Badge */}
          <circle
            cx="60"
            cy="70"
            r="18"
            fill="#3DDC84"
            stroke="#13261B"
            strokeWidth="1.75"
          />
          <path
            d="M52 70 L57 75 L68 64"
            fill="none"
            stroke="#13261B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Accent diamond sparkles */}
          <polygon
            points="98,22 101,29 108,32 101,35 98,42 95,35 88,32 95,29"
            fill="#FFD23F"
            stroke="#13261B"
            strokeWidth="1.25"
          />
        </g>
      )}

      {isEmpty && (
        <g>
          {/* Clean Film Reel Outline */}
          <circle
            cx="60"
            cy="70"
            r="16"
            fill="#FFFFFF"
            stroke="#13261B"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle cx="60" cy="70" r="5" fill="#8ED1FC" stroke="#13261B" strokeWidth="1.25" />
          <line x1="48" y1="88" x2="72" y2="88" stroke="#13261B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
        </g>
      )}

      {isLost && (
        <g>
          {/* Clean Search / Missing Indicator */}
          <circle
            cx="58"
            cy="68"
            r="13"
            fill="#FFFFFF"
            stroke="#13261B"
            strokeWidth="1.75"
          />
          <line
            x1="67"
            y1="77"
            x2="75"
            y2="85"
            stroke="#13261B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text
            x="54"
            y="73"
            fill="#13261B"
            fontFamily="var(--font-display), sans-serif"
            fontWeight="bold"
            fontSize="14"
          >
            ?
          </text>
        </g>
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
          className="confetti-piece absolute h-2.5 w-2.5 rounded-full border border-border"
        />
      ))}
    </span>
  );
}
