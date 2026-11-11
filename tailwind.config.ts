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
        paper: 'var(--paper)',
        mint: 'var(--mint)',
        sprout: 'var(--sprout)',
        forest: 'var(--forest)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        sun: 'var(--sun)',
        sky: 'var(--sky)',
        coral: 'var(--coral)',
      },
      fontFamily: {
        display: ['var(--font-display)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['var(--font-body)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['var(--font-body)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        btn: '12px',
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 30, 21, 0.04), 0 4px 12px rgba(15, 30, 21, 0.03)',
        btn: '0 1px 2px rgba(15, 30, 21, 0.06)',
        'btn-hover': '0 3px 6px rgba(15, 30, 21, 0.08)',
        subtle: '0 1px 2px rgba(15, 30, 21, 0.04)',
        none: '0 0 0 transparent',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.34,1.56,.64,1)',
      },
    },
  },
  plugins: [],
};

export default config;
