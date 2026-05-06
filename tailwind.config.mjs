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
        // Legacy compat — kept only so unmodified blog/contact pages still build.
        // Removed by Phase 5/6 once legacy templates are migrated.
        ocean: {
          50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8',
          500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e',
        },
        sand: {
          50: '#fefdf8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15',
          500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f',
        },
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
