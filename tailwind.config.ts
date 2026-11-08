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
        display: ['var(--font-display)', 'cursive'],
        sans: ['var(--font-body)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        btn: '12px',
        card: '20px',
      },
      boxShadow: {
        card: '4px 4px 0 var(--ink)',
        btn: '3px 3px 0 var(--ink)',
        'btn-hover': '4px 4px 0 var(--ink)',
        none: '0 0 0 var(--ink)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.34,1.56,.64,1)',
      },
    },
  },
  plugins: [],
};

export default config;
