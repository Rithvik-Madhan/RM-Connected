import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Depth tokens — resolve to CSS custom properties so they animate on scroll.
        depth: {
          bg: 'var(--d-bg)',
          'bg-2': 'var(--d-bg-2)',
          fg: 'var(--d-fg)',
          'fg-muted': 'var(--d-fg-muted)',
          accent: 'var(--d-accent)',
          'accent-2': 'var(--d-accent-2)',
          rule: 'var(--d-rule)',
        },
        cat: 'var(--cat)',
      },
      fontFamily: {
        display: ['var(--font-display)', ...defaultTheme.fontFamily.serif],
        sans: ['var(--font-body)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
      },
      maxWidth: {
        reading: 'var(--reading-col)',
      },
      letterSpacing: {
        tightish: '-0.015em',
        widish: '0.04em',
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
};
