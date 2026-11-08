import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#09090B',
        surface: '#111318',
        elevated: '#181B22',
        inset: '#060709',
        tally: {
          DEFAULT: '#10B981',
          bright: '#34D399',
          muted: 'rgba(16, 185, 129, 0.14)',
        },
        timecode: {
          DEFAULT: '#F59E0B',
          muted: 'rgba(245, 158, 11, 0.14)',
        },
        record: {
          DEFAULT: '#EF4444',
          muted: 'rgba(239, 68, 68, 0.14)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
