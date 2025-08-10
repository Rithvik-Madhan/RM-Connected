// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://rithvik-madhan.github.io',
  base: '/RM-Connected',
  integrations: [
    tailwind(),
    react(),
    mdx()
  ],
  output: 'static',
  compressHTML: true
});