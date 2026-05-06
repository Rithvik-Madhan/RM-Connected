# Ocean Explorer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Ocean Explorer site with a cinematic, scroll-driven dive experience: home page descends through four ocean depth zones, blog gets editorial treatment, contact surfaces back up, plus signature interactions (CursorFish, WebGL bioluminescence, easter eggs).

**Architecture:** Astro pages compose zone components. Each zone is its own `.astro` file. Heavy motion (Lenis smooth scroll, GSAP ScrollTrigger, Three.js WebGL scenes) lives in React islands and is lazy-loaded behind `prefers-reduced-motion` and low-power gating. Palette is driven entirely by CSS custom properties on `:root` that GSAP interpolates on scroll. Tailwind tokens reference those custom properties so utility classes "just work" across zones.

**Tech Stack:** Astro 5, React 19, TypeScript, Tailwind 3, GSAP + ScrollTrigger, Lenis, Three.js, Framer Motion, self-hosted Fraunces + General Sans + JetBrains Mono.

**Spec:** `docs/superpowers/specs/2026-05-06-ocean-explorer-redesign-design.md`

**Worktree:** All work happens in `/Users/Rithvik/Dev/RM-Connected-V2-redesign` on branch `feat/ocean-redesign`. Original repo at `/Users/Rithvik/Dev/RM-Connected-V2` is never touched.

**Verification model:** This is a frontend visual project, so most "tests" are explicit browser checks (run dev server, open URL, verify the described behavior). Where logic is testable in isolation (depth-zone math, hooks), unit tests are included.

---

## Phase 1 — Foundation (Tasks 1–10)

### Task 1: Install runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install motion + WebGL deps**

Run from the worktree:
```bash
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign
npm install gsap @studio-freight/lenis three framer-motion
npm install --save-dev @types/three
```

- [ ] **Step 2: Install self-hosted fonts**

```bash
npm install @fontsource-variable/fraunces @fontsource/jetbrains-mono
```

(General Sans is added as static woff2 in Task 2 — Fontshare doesn't ship an npm package.)

- [ ] **Step 3: Verify install**

```bash
npm run dev
```

Expected: server starts at `http://localhost:4321` without errors. Stop server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add gsap, lenis, three, framer-motion, self-hosted fonts"
```

---

### Task 2: Self-host General Sans

**Files:**
- Create: `public/fonts/GeneralSans-Variable.woff2`
- Create: `public/fonts/GeneralSans-VariableItalic.woff2`
- Create: `public/fonts/general-sans.css`

- [ ] **Step 1: Download General Sans variable woff2 from Fontshare**

```bash
mkdir -p /Users/Rithvik/Dev/RM-Connected-V2-redesign/public/fonts
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign/public/fonts
curl -L -o GeneralSans-Variable.woff2 \
  "https://api.fontshare.com/v2/fonts/general-sans/files/general-sans-variable.woff2"
curl -L -o GeneralSans-VariableItalic.woff2 \
  "https://api.fontshare.com/v2/fonts/general-sans/files/general-sans-variable-italic.woff2"
ls -la
```

Expected: both files exist, > 50KB each. If the curl URLs change, fall back to manually downloading from `https://www.fontshare.com/fonts/general-sans` (download "Variable" weights only) and place files at the same paths.

- [ ] **Step 2: Write `@font-face` declarations**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/public/fonts/general-sans.css`:

```css
@font-face {
  font-family: 'General Sans';
  src: url('/fonts/GeneralSans-Variable.woff2') format('woff2-variations');
  font-weight: 200 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'General Sans';
  src: url('/fonts/GeneralSans-VariableItalic.woff2') format('woff2-variations');
  font-weight: 200 700;
  font-style: italic;
  font-display: swap;
}
```

- [ ] **Step 3: Commit**

```bash
git add public/fonts/
git commit -m "feat(fonts): self-host General Sans variable"
```

---

### Task 3: Write CSS depth tokens

**Files:**
- Create: `src/styles/tokens.css`

- [ ] **Step 1: Create the tokens file**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/styles/tokens.css`:

```css
/* Depth-zone palette tokens.
 * --d-* = "depth", interpolated by GSAP on home page scroll.
 * Other pages set these to a single zone via [data-zone="..."] on <html>.
 */
:root {
  /* Active zone — interpolated continuously on home, set per-page elsewhere. */
  --d-bg: #A6DDF0;
  --d-bg-2: #E8F6FB;
  --d-fg: #062538;
  --d-fg-muted: #2C4A60;
  --d-accent: #F4D27A;
  --d-accent-2: #7BD8E0;
  --d-rule: rgba(6, 37, 56, 0.08);

  /* Reading column max width */
  --reading-col: 680px;

  /* Type system */
  --font-display: 'Fraunces Variable', 'Fraunces', Georgia, serif;
  --font-body: 'General Sans', 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
}

/* Per-page palette pins. Home does NOT use these — its tokens are scroll-driven.
 * Use on <html data-zone="twilight"> etc. for non-home pages. */
[data-zone="sunlit"] {
  --d-bg: #A6DDF0; --d-bg-2: #E8F6FB;
  --d-fg: #062538; --d-fg-muted: #2C4A60;
  --d-accent: #F4D27A; --d-accent-2: #7BD8E0;
  --d-rule: rgba(6, 37, 56, 0.08);
}
[data-zone="twilight"] {
  --d-bg: #1B5E7E; --d-bg-2: #0E3F58;
  --d-fg: #E8F1F5; --d-fg-muted: #B6C9D4;
  --d-accent: #7BD8E0; --d-accent-2: #F4D27A;
  --d-rule: rgba(232, 241, 245, 0.10);
}
[data-zone="midnight"] {
  --d-bg: #0A1628; --d-bg-2: #06101D;
  --d-fg: #D6DCE5; --d-fg-muted: #8A95A6;
  --d-accent: #7BFFB1; --d-accent-2: #F4D27A;
  --d-rule: rgba(214, 220, 229, 0.08);
}
[data-zone="abyss"] {
  --d-bg: #03060B; --d-bg-2: #03060B;
  --d-fg: #E0DAC8; --d-fg-muted: #8A8473;
  --d-accent: #7BFFB1; --d-accent-2: #F4D27A;
  --d-rule: rgba(224, 218, 200, 0.08);
}
[data-zone="surface"] {
  --d-bg: #F4EDE0; --d-bg-2: #FAF6EE;
  --d-fg: #1A1410; --d-fg-muted: #4A3F36;
  --d-accent: #F4D27A; --d-accent-2: #7BD8E0;
  --d-rule: rgba(26, 20, 16, 0.08);
}

/* Category tints — used on blog cards. */
[data-cat="marine-biology"] { --cat: #1B5E7E; }
[data-cat="diving"]         { --cat: #0E3F58; }
[data-cat="conservation"]   { --cat: #1F6B5C; }
[data-cat="scouting"]       { --cat: #7A5A2E; }
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/tokens.css
git commit -m "feat(styles): add depth-zone CSS custom property tokens"
```

---

### Task 4: Rewrite `tailwind.config.mjs`

**Files:**
- Modify: `tailwind.config.mjs`

- [ ] **Step 1: Replace contents**

Overwrite `/Users/Rithvik/Dev/RM-Connected-V2-redesign/tailwind.config.mjs`:

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.mjs
git commit -m "feat(tailwind): point theme at depth tokens, drop legacy ocean/sand"
```

---

### Task 5: Rewrite `src/styles/global.css`

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace contents**

Overwrite `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/styles/global.css`:

```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@import '@fontsource-variable/fraunces';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';
@import '/fonts/general-sans.css';

@import './tokens.css';

@layer base {
  html {
    font-family: var(--font-body);
    background: var(--d-bg);
    color: var(--d-fg);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  body {
    @apply min-h-screen;
    background: linear-gradient(180deg, var(--d-bg) 0%, var(--d-bg-2) 100%);
    transition: background 600ms ease;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    font-feature-settings: 'ss01', 'ss02';
    letter-spacing: -0.015em;
  }

  ::selection {
    background: var(--d-accent);
    color: var(--d-bg);
  }
}

@layer components {
  .btn-quiet {
    @apply inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-sm tracking-widish uppercase;
    color: var(--d-fg);
    border: 1px solid var(--d-rule);
    transition: border-color 300ms ease, color 300ms ease;
  }
  .btn-quiet:hover {
    border-color: var(--d-accent);
    color: var(--d-accent);
  }

  .meta {
    @apply font-mono text-xs tracking-widish uppercase;
    color: var(--d-fg-muted);
  }

  .reading-col {
    @apply mx-auto px-6;
    max-width: var(--reading-col);
  }
}

@layer utilities {
  .pin-zone {
    /* Helper for zone wrappers: full-viewport block, content centered. */
    @apply relative w-full min-h-screen;
  }

  .text-balance { text-wrap: balance; }
  .text-pretty  { text-wrap: pretty; }
}

/* Hide native cursor on home hero where CursorFish is active. */
html[data-cursor="fish"] body { cursor: none; }
html[data-cursor="fish"] body * { cursor: none; }

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(styles): rewrite global.css around depth tokens + new typography"
```

---

### Task 6: Motion infrastructure — Lenis + GSAP setup

**Files:**
- Create: `src/lib/motion/lenis.ts`
- Create: `src/lib/motion/gsap.ts`

- [ ] **Step 1: Write `lenis.ts`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/lib/motion/lenis.ts`:

```ts
import Lenis from '@studio-freight/lenis';

let instance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return instance;
}

export function startLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  if (instance) return instance;

  instance = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
  });

  function raf(time: number) {
    instance?.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  return instance;
}

export function stopLenis(): void {
  instance?.destroy();
  instance = null;
}
```

- [ ] **Step 2: Write `gsap.ts`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/lib/motion/gsap.ts`:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from './lenis';

let registered = false;

export function setupGsap(): void {
  if (typeof window === 'undefined') return;
  if (registered) return;
  registered = true;

  gsap.registerPlugin(ScrollTrigger);

  // Bridge Lenis -> ScrollTrigger so scroll-driven timelines stay in sync
  // with smooth scroll velocity rather than native scroll events.
  const lenis = getLenis();
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

export { gsap, ScrollTrigger };
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/motion/
git commit -m "feat(motion): add Lenis + GSAP setup with reduced-motion gating"
```

---

### Task 7: Depth zone math — `depth.ts`

**Files:**
- Create: `src/lib/motion/depth.ts`

- [ ] **Step 1: Write the depth utilities**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/lib/motion/depth.ts`:

```ts
export type DepthZone = 'sunlit' | 'twilight' | 'midnight' | 'abyss' | 'surface';

/** Each zone occupies a fraction of total scroll progress on home. Order matters. */
export const ZONE_BOUNDS: Array<{ zone: DepthZone; end: number; depthM: number }> = [
  { zone: 'sunlit',   end: 0.18, depthM: 200   },
  { zone: 'twilight', end: 0.45, depthM: 1000  },
  { zone: 'midnight', end: 0.72, depthM: 4000  },
  { zone: 'abyss',    end: 0.92, depthM: 6000  },
  { zone: 'surface',  end: 1.00, depthM: 0     },
];

export function zoneAtProgress(p: number): DepthZone {
  for (const b of ZONE_BOUNDS) {
    if (p <= b.end) return b.zone;
  }
  return 'surface';
}

/**
 * Map scroll progress 0..1 to a meters reading.
 * Sunlit/Twilight/Midnight/Abyss interpolate down; Surface interpolates back to 0.
 */
export function depthAtProgress(p: number): number {
  let prevEnd = 0;
  let prevDepth = 0;
  for (const b of ZONE_BOUNDS) {
    if (p <= b.end) {
      const local = (p - prevEnd) / Math.max(b.end - prevEnd, 1e-6);
      return Math.round(prevDepth + (b.depthM - prevDepth) * local);
    }
    prevEnd = b.end;
    prevDepth = b.depthM;
  }
  return 0;
}

/** Linear interpolation between two hex colors in OKLCH-like perceptual space.
 * For simplicity here we use sRGB linear-light interpolation; CSS color-mix
 * handles the polished case in tokens.css. */
function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return [r, g, b];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
export function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/** Palette per zone — must match tokens.css [data-zone="…"] blocks. */
export const ZONE_PALETTES: Record<DepthZone, {
  bg: string; bg2: string; fg: string; fgMuted: string; accent: string; accent2: string;
}> = {
  sunlit:   { bg: '#A6DDF0', bg2: '#E8F6FB', fg: '#062538', fgMuted: '#2C4A60', accent: '#F4D27A', accent2: '#7BD8E0' },
  twilight: { bg: '#1B5E7E', bg2: '#0E3F58', fg: '#E8F1F5', fgMuted: '#B6C9D4', accent: '#7BD8E0', accent2: '#F4D27A' },
  midnight: { bg: '#0A1628', bg2: '#06101D', fg: '#D6DCE5', fgMuted: '#8A95A6', accent: '#7BFFB1', accent2: '#F4D27A' },
  abyss:    { bg: '#03060B', bg2: '#03060B', fg: '#E0DAC8', fgMuted: '#8A8473', accent: '#7BFFB1', accent2: '#F4D27A' },
  surface:  { bg: '#F4EDE0', bg2: '#FAF6EE', fg: '#1A1410', fgMuted: '#4A3F36', accent: '#F4D27A', accent2: '#7BD8E0' },
};

export function paletteAtProgress(p: number) {
  let prevEnd = 0;
  let prevZone: DepthZone = 'sunlit';
  for (const b of ZONE_BOUNDS) {
    if (p <= b.end) {
      const local = (p - prevEnd) / Math.max(b.end - prevEnd, 1e-6);
      const a = ZONE_PALETTES[prevZone];
      const c = ZONE_PALETTES[b.zone];
      return {
        bg:      lerpHex(a.bg,      c.bg,      local),
        bg2:     lerpHex(a.bg2,     c.bg2,     local),
        fg:      lerpHex(a.fg,      c.fg,      local),
        fgMuted: lerpHex(a.fgMuted, c.fgMuted, local),
        accent:  lerpHex(a.accent,  c.accent,  local),
        accent2: lerpHex(a.accent2, c.accent2, local),
      };
    }
    prevEnd = b.end;
    prevZone = b.zone;
  }
  return ZONE_PALETTES.surface;
}
```

- [ ] **Step 2: Write a tiny unit test**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/lib/motion/depth.test.ts`:

```ts
// Run with: npx tsx src/lib/motion/depth.test.ts
import { zoneAtProgress, depthAtProgress, paletteAtProgress } from './depth';

function expect(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`FAIL ${label}\n  actual:   ${a}\n  expected: ${e}`);
  console.log(`PASS ${label}`);
}

expect('zoneAtProgress(0)',    zoneAtProgress(0),    'sunlit');
expect('zoneAtProgress(0.3)',  zoneAtProgress(0.3),  'twilight');
expect('zoneAtProgress(0.6)',  zoneAtProgress(0.6),  'midnight');
expect('zoneAtProgress(0.85)', zoneAtProgress(0.85), 'abyss');
expect('zoneAtProgress(1.0)',  zoneAtProgress(1.0),  'surface');

expect('depthAtProgress(0)', depthAtProgress(0), 0);
expect('depthAtProgress(0.18)', depthAtProgress(0.18), 200);
expect('depthAtProgress(0.45)', depthAtProgress(0.45), 1000);

const pal0 = paletteAtProgress(0);
expect('paletteAtProgress(0).bg', pal0.bg, '#a6ddf0');

console.log('All depth tests pass.');
```

- [ ] **Step 3: Run the unit test**

```bash
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign
npx tsx src/lib/motion/depth.test.ts
```

Expected: every line prints `PASS …`, ends with `All depth tests pass.`. If `tsx` is not installed:
```bash
npx --yes tsx src/lib/motion/depth.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/motion/depth.ts src/lib/motion/depth.test.ts
git commit -m "feat(motion): depth-zone math + palette interpolation"
```

---

### Task 8: React hooks — `useReducedMotion`, `useDepthZone`

**Files:**
- Create: `src/lib/hooks/useReducedMotion.ts`
- Create: `src/lib/hooks/useDepthZone.ts`

- [ ] **Step 1: Write `useReducedMotion`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/lib/hooks/useReducedMotion.ts`:

```ts
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

/** Combines reduced-motion + low-power detection. */
export function useFullExperience(): boolean {
  const reduced = useReducedMotion();
  const [low, setLow] = useState(false);
  useEffect(() => {
    const nav = navigator as unknown as {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4;
    const saveData = nav.connection?.saveData === true;
    setLow(lowMemory || saveData);
  }, []);
  return !reduced && !low;
}
```

- [ ] **Step 2: Write `useDepthZone`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/lib/hooks/useDepthZone.ts`:

```ts
import { useEffect, useState } from 'react';
import { zoneAtProgress, depthAtProgress, type DepthZone } from '../motion/depth';

/** Reads scroll progress (0..1) of the document and yields current zone + depth.
 * Updates on scroll. Cheap — no GSAP dependency, suitable for chrome components. */
export function useDepthZone(): { zone: DepthZone; depthM: number; progress: number } {
  const [state, setState] = useState({ zone: 'sunlit' as DepthZone, depthM: 0, progress: 0 });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      setState({ zone: zoneAtProgress(p), depthM: depthAtProgress(p), progress: p });
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', tick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', tick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return state;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/hooks/
git commit -m "feat(hooks): useReducedMotion, useFullExperience, useDepthZone"
```

---

### Task 9: Update `Layout.astro` for new theme + motion bootstrap

**Files:**
- Modify: `src/layouts/Layout.astro`
- Create: `src/components/motion/MotionRoot.client.tsx`

- [ ] **Step 1: Write the motion root client component**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/motion/MotionRoot.client.tsx`:

```tsx
import { useEffect } from 'react';
import { startLenis, stopLenis } from '../../lib/motion/lenis';
import { setupGsap } from '../../lib/motion/gsap';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';

/** Mount once at the root. Boots Lenis + GSAP iff the user wants the full ride. */
export default function MotionRoot() {
  const full = useFullExperience();
  useEffect(() => {
    if (!full) return;
    startLenis();
    setupGsap();
    return () => stopLenis();
  }, [full]);
  return null;
}
```

- [ ] **Step 2: Read current Layout to get the structure**

```bash
cat /Users/Rithvik/Dev/RM-Connected-V2-redesign/src/layouts/Layout.astro
```

- [ ] **Step 3: Rewrite `src/layouts/Layout.astro`**

Replace contents with:

```astro
---
import MotionRoot from '../components/motion/MotionRoot.client';
import '../styles/global.css';

interface Props {
  title?: string;
  description?: string;
  zone?: 'sunlit' | 'twilight' | 'midnight' | 'abyss' | 'surface';
  /** Set true on home so MotionRoot boots Lenis + GSAP scroll-cinema. */
  cinematic?: boolean;
}

const {
  title = 'Rithvik Madhan — Marine biology, diving, scouting',
  description = 'Field notes from above and below the surface. Marine biology, scuba diving, Eagle Scout.',
  zone = 'sunlit',
  cinematic = false,
} = Astro.props;
---
<!doctype html>
<html lang="en" data-zone={zone}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preload" href="/fonts/GeneralSans-Variable.woff2" as="font" type="font/woff2" crossorigin />
    <title>{title}</title>
  </head>
  <body>
    <MotionRoot client:load />
    <slot />
    {cinematic && <slot name="cinematic-overlays" />}
  </body>
</html>
```

- [ ] **Step 4: Smoke test the build**

```bash
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign
npm run dev
```

Open `http://localhost:4321` in a browser. Expected: existing site still renders (because index/contact still reference old components), but now uses new fonts and the body has the sunlit palette underneath the existing components. Some components may look weird because the Tailwind tokens changed — that's expected and resolved in subsequent tasks. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Layout.astro src/components/motion/MotionRoot.client.tsx
git commit -m "feat(layout): wire Layout to depth tokens + MotionRoot bootstrap"
```

---

### Task 10: Foundation smoke checkpoint

**Files:** none (verification only)

- [ ] **Step 1: Sanity check the build**

```bash
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign
npm run build
```

Expected: build succeeds with no TypeScript or import errors. The dist output may have visual regressions on legacy components (Hero, BlogPreview, etc.) — those are rewritten in later phases and can be safely ignored at this checkpoint.

- [ ] **Step 2: Confirm worktree state**

```bash
git -C /Users/Rithvik/Dev/RM-Connected-V2-redesign log --oneline -10
git -C /Users/Rithvik/Dev/RM-Connected-V2-redesign status
```

Expected: clean working tree, several "feat:" commits since the spec.

If anything fails: stop and fix before proceeding to Phase 2. Foundation issues compound.

---

## Phase 2 — Hero: Sunlit + Twilight (Tasks 11–18)

### Task 11: `DiveHero` orchestrator scaffolding

**Files:**
- Create: `src/components/hero/DiveHero.astro`
- Create: `src/components/hero/zones/SunlitZone.astro`
- Create: `src/components/hero/zones/TwilightZone.astro`
- Create: `src/components/hero/zones/MidnightZone.astro`
- Create: `src/components/hero/zones/AbyssZone.astro`
- Create: `src/components/hero/zones/ResurfaceZone.astro`

- [ ] **Step 1: Create empty zone stubs**

Create each zone file with a minimal placeholder. Example for `SunlitZone.astro`:

```bash
mkdir -p /Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/hero/zones
```

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/hero/zones/SunlitZone.astro`:

```astro
---
// Zone 1 — surface, sunlit. Filled in Task 12.
---
<section class="pin-zone" data-zone-name="sunlit" id="zone-sunlit">
  <div class="container mx-auto px-6 flex items-center justify-center min-h-screen">
    <h1 class="font-display text-6xl">Sunlit</h1>
  </div>
</section>
```

Repeat with the same template for `TwilightZone.astro`, `MidnightZone.astro`, `AbyssZone.astro`, `ResurfaceZone.astro` — substituting the `data-zone-name`, the `id`, and the heading text. These are placeholders; each gets filled in in its own task.

- [ ] **Step 2: Write `DiveHero.astro`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/hero/DiveHero.astro`:

```astro
---
import SunlitZone from './zones/SunlitZone.astro';
import TwilightZone from './zones/TwilightZone.astro';
import MidnightZone from './zones/MidnightZone.astro';
import AbyssZone from './zones/AbyssZone.astro';
import ResurfaceZone from './zones/ResurfaceZone.astro';

interface Props {
  achievements: Array<{
    title: string;
    organization: string;
    date: string;
    description: string;
  }>;
  featuredPhotos: Array<{ src: string; alt: string; caption?: string }>;
  featuredPosts: Array<{
    href: string;
    title: string;
    excerpt: string;
    image: string;
    category: string;
    date: string;
    readTime?: string;
  }>;
}

const { achievements, featuredPhotos, featuredPosts } = Astro.props;
---
<div id="dive-root" class="relative">
  <SunlitZone />
  <TwilightZone photos={featuredPhotos} />
  <MidnightZone posts={featuredPosts} />
  <AbyssZone achievements={achievements} />
  <ResurfaceZone />
</div>
```

- [ ] **Step 3: Verify**

```bash
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign && npm run build
```

Expected: build passes. (TwilightZone/MidnightZone/AbyssZone props are referenced but their zone files currently don't accept any props — that's fine because Astro silently ignores unknown attrs on plain HTML, but if the build complains, edit the zone stub frontmatters to accept the props as `any` for now: `const _props = Astro.props as any;`.)

If build fails: add this to each zone frontmatter:
```astro
---
const _ = Astro.props;
---
```

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/
git commit -m "feat(hero): scaffold DiveHero with five zone stubs"
```

---

### Task 12: SunlitZone — name, identity copy, descend prompt

**Files:**
- Modify: `src/components/hero/zones/SunlitZone.astro`

- [ ] **Step 1: Rewrite `SunlitZone.astro`**

Replace contents:

```astro
---
// Zone 1 — Sunlit (0–200m). Surface. Name + identity + descend prompt.
// Caustics shader is mounted by parent in Task 14.
---
<section
  class="pin-zone overflow-hidden"
  data-zone-name="sunlit"
  id="zone-sunlit"
  style="background: linear-gradient(180deg, var(--d-bg) 0%, var(--d-bg-2) 100%);"
>
  <!-- Caustics canvas slot — filled by Caustics.client.tsx in Task 14 -->
  <div id="caustics-slot" class="absolute inset-0 pointer-events-none" aria-hidden="true"></div>

  <div class="relative z-10 container mx-auto px-6 min-h-screen flex flex-col items-center justify-center">
    <p class="meta mb-6 opacity-70">Field notes from above and below the surface</p>

    <h1
      class="font-display text-balance text-center font-light leading-[0.92] tracking-tightish"
      style="font-size: clamp(4rem, 14vw, 16rem); font-variation-settings: 'SOFT' 80, 'WONK' 0;"
    >
      <span class="reveal-letter">R</span><span class="reveal-letter">i</span><span
        class="reveal-letter">t</span><span class="reveal-letter">h</span><span class="reveal-letter"
        >v</span><span class="reveal-letter">i</span><span class="reveal-letter">k</span>
    </h1>

    <p class="mt-8 max-w-xl text-center text-lg sm:text-xl text-balance" style="color: var(--d-fg-muted);">
      Marine biology student. Scuba diver. Eagle Scout. Photographer of the deep — and quietly, of the trail.
    </p>

    <a href="#zone-twilight" class="descend-prompt mt-16 group inline-flex flex-col items-center gap-3" aria-label="Descend to next section">
      <span class="meta opacity-0 group-hover:opacity-100 transition-opacity">Descend</span>
      <svg width="22" height="36" viewBox="0 0 22 36" fill="none" aria-hidden="true">
        <path d="M11 1v30m0 0l-9-9m9 9l9-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
      </svg>
    </a>
  </div>
</section>

<style>
  .reveal-letter {
    display: inline-block;
    opacity: 0;
    transform: translateY(0.4em);
    animation: letter-rise 900ms cubic-bezier(0.19, 1, 0.22, 1) forwards;
  }
  .reveal-letter:nth-child(1) { animation-delay: 80ms; }
  .reveal-letter:nth-child(2) { animation-delay: 180ms; }
  .reveal-letter:nth-child(3) { animation-delay: 260ms; }
  .reveal-letter:nth-child(4) { animation-delay: 340ms; }
  .reveal-letter:nth-child(5) { animation-delay: 420ms; }
  .reveal-letter:nth-child(6) { animation-delay: 500ms; }
  .reveal-letter:nth-child(7) { animation-delay: 580ms; }

  .descend-prompt {
    color: var(--d-fg-muted);
    opacity: 0;
    animation: descend-fade 700ms ease-out 1.6s forwards;
  }
  .descend-prompt svg {
    animation: descend-bob 2.4s ease-in-out infinite 2.5s;
  }

  @keyframes letter-rise {
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes descend-fade {
    to { opacity: 1; }
  }
  @keyframes descend-bob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(6px); }
  }
</style>
```

- [ ] **Step 2: Verify in browser**

Temporarily wire DiveHero into `index.astro` to test in isolation. Open `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/pages/index.astro` and replace the entire file with:

```astro
---
import Layout from '../layouts/Layout.astro';
import DiveHero from '../components/hero/DiveHero.astro';

// Temporary stub data — final wiring happens in Task 26.
const achievements: any[] = [];
const featuredPhotos: any[] = [];
const featuredPosts: any[] = [];
---
<Layout title="Rithvik Madhan" cinematic zone="sunlit">
  <DiveHero {achievements} {featuredPhotos} {featuredPosts} />
</Layout>
```

Then:
```bash
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign && npm run dev
```

Open `http://localhost:4321`. Expected: large "Rithvik" rises in animated, soft Fraunces. Identity copy below. After ~1.6s, "Descend" arrow fades in and bobs gently. Background is the sunlit gradient. Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/zones/SunlitZone.astro src/pages/index.astro
git commit -m "feat(hero): SunlitZone with letter-rise name reveal + descend prompt"
```

---

### Task 13: CursorFish — custom cursor for Sunlit zone only

**Files:**
- Create: `src/components/hero/CursorFish.tsx`
- Modify: `src/components/hero/zones/SunlitZone.astro`

- [ ] **Step 1: Write `CursorFish.tsx`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/hero/CursorFish.tsx`:

```tsx
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';

export default function CursorFish() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { damping: 22, stiffness: 220, mass: 0.6 });
  const sy = useSpring(y, { damping: 22, stiffness: 220, mass: 0.6 });
  const rotation = useMotionValue(0);
  const lastX = useRef(0);
  const sentinelY = useRef(0);

  useEffect(() => {
    if (reduced) return;
    if (matchMedia('(pointer: coarse)').matches) return; // touch devices: no fish

    document.documentElement.dataset.cursor = 'fish';
    setActive(true);

    const sunlit = document.getElementById('zone-sunlit');
    if (!sunlit) return;
    sentinelY.current = sunlit.offsetTop + sunlit.offsetHeight - window.innerHeight * 0.4;

    function move(e: PointerEvent) {
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      // Fish flips horizontally based on movement direction.
      rotation.set(dx < -0.5 ? 180 : dx > 0.5 ? 0 : rotation.get());
      x.set(e.clientX - 20);
      y.set(e.clientY - 12);
    }
    function over(e: PointerEvent) {
      const t = e.target as HTMLElement | null;
      setHovered(!!t?.closest('a, button, [data-cursor-attract]'));
    }
    function scroll() {
      // Disable past Sunlit zone end.
      if (window.scrollY > sentinelY.current) {
        setActive(false);
        document.documentElement.dataset.cursor = '';
      } else if (!active) {
        setActive(true);
        document.documentElement.dataset.cursor = 'fish';
      }
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      window.removeEventListener('scroll', scroll);
      document.documentElement.dataset.cursor = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  if (reduced || !active) return null;

  return (
    <motion.div
      style={{
        x: sx,
        y: sy,
        rotate: rotation,
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: 'multiply',
      }}
      animate={{ scale: hovered ? 1.4 : 1 }}
      transition={{ type: 'spring', damping: 14, stiffness: 240 }}
    >
      <svg width="40" height="24" viewBox="0 0 40 24" aria-hidden="true">
        {/* Body */}
        <path
          d="M2 12 C 8 4, 22 4, 30 12 C 22 20, 8 20, 2 12 Z"
          fill="var(--d-fg)"
          opacity="0.85"
        />
        {/* Tail */}
        <path
          d="M30 12 L 38 6 L 36 12 L 38 18 Z"
          fill="var(--d-fg)"
          opacity="0.85"
        />
        {/* Eye */}
        <circle cx="9" cy="11" r="1.4" fill="var(--d-bg)" />
      </svg>
    </motion.div>
  );
}
```

- [ ] **Step 2: Mount CursorFish in `SunlitZone.astro`**

Open `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/hero/zones/SunlitZone.astro` and add the import + mount. After the existing `---` frontmatter close, but inside `<section>`, add the component. Update the file to:

```astro
---
import CursorFish from '../CursorFish.tsx';
---
<section
  class="pin-zone overflow-hidden"
  data-zone-name="sunlit"
  id="zone-sunlit"
  style="background: linear-gradient(180deg, var(--d-bg) 0%, var(--d-bg-2) 100%);"
>
  <CursorFish client:load />
  <!-- ... rest of Sunlit content unchanged ... -->
```

(Keep all the rest of the existing SunlitZone markup. Only add the import and the `<CursorFish client:load />` line just inside the `<section>`.)

- [ ] **Step 3: Verify in browser**

```bash
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign && npm run dev
```

Open `http://localhost:4321`. Move mouse over hero. Expected: small fish follows cursor with spring delay, faces direction of movement, scales up over the descend arrow link, system cursor is hidden. Scroll past hero — fish disappears, system cursor returns. Refresh with `prefers-reduced-motion: reduce` set in DevTools (Rendering panel) — fish does not appear, normal cursor shows. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/CursorFish.tsx src/components/hero/zones/SunlitZone.astro
git commit -m "feat(hero): CursorFish — spring-following fish cursor on sunlit zone"
```

---

### Task 14: Caustics WebGL background

**Files:**
- Create: `src/components/motion/Caustics.client.tsx`
- Modify: `src/components/hero/zones/SunlitZone.astro`

- [ ] **Step 1: Write `Caustics.client.tsx`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/motion/Caustics.client.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float caustic(vec2 p, float t) {
  float v = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    p += vec2(sin(t * 0.3 + fi), cos(t * 0.27 + fi)) * 0.4;
    v += noise(p * 1.4 + t * 0.18 * (1.0 + fi * 0.1));
  }
  v = pow(v / 4.0, 3.0);
  return v;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float c = caustic(uv * 2.5, uTime * 0.5);
  // Soft warm-white glow over transparent background.
  vec3 col = vec3(c) * vec3(1.0, 0.96, 0.82);
  // Top of viewport gets brighter caustics (closer to "surface").
  float topBoost = smoothstep(0.6, -0.4, uv.y);
  col *= 0.4 + 0.6 * topBoost;
  gl_FragColor = vec4(col, c * 0.55);
}
`;

export default function Caustics() {
  const ref = useRef<HTMLCanvasElement>(null);
  const full = useFullExperience();

  useEffect(() => {
    if (!full) return;
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(s));
      }
      return s;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uRes  = gl.getUniformLocation(prog, 'uRes');

    let raf = 0;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = '100vw';
      canvas!.style.height = '100vh';
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    function frame(now: number) {
      const t = (now - start) / 1000;
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [full]);

  if (!full) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'soft-light', opacity: 0.7 }}
    />
  );
}
```

- [ ] **Step 2: Mount Caustics in `SunlitZone.astro`**

In `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/hero/zones/SunlitZone.astro`, replace the empty `caustics-slot` div with the Caustics component:

Find this block:
```astro
  <!-- Caustics canvas slot — filled by Caustics.client.tsx in Task 14 -->
  <div id="caustics-slot" class="absolute inset-0 pointer-events-none" aria-hidden="true"></div>
```

Replace with (and add import to frontmatter):
```astro
---
import CursorFish from '../CursorFish.tsx';
import Caustics from '../../motion/Caustics.client.tsx';
---
<section ...>
  <CursorFish client:load />
  <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
    <Caustics client:visible />
  </div>
  ...
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321`. Expected: subtle rippling light pattern animates across the hero background. Should look like sunlight filtering through shallow water — slow, organic, never harsh. With `prefers-reduced-motion: reduce`, the canvas should not appear at all (full experience returns false). Stop server.

If the caustics look too strong: reduce the `opacity: 0.7` to `0.45`. If they look too weak: raise to `0.85` or change `mix-blend-mode` to `screen`.

- [ ] **Step 4: Commit**

```bash
git add src/components/motion/Caustics.client.tsx src/components/hero/zones/SunlitZone.astro
git commit -m "feat(motion): WebGL caustics background for sunlit zone"
```

---

### Task 15: Reusable scroll utilities — `RevealOnScroll`, `ParallaxImage`

**Files:**
- Create: `src/components/fx/RevealOnScroll.tsx`
- Create: `src/components/fx/ParallaxImage.tsx`

- [ ] **Step 1: Write `RevealOnScroll.tsx`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/fx/RevealOnScroll.tsx`:

```tsx
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

export default function RevealOnScroll({ children, delay = 0, y = 32, className }: Props) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.9, delay, ease: [0.19, 1, 0.22, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Write `ParallaxImage.tsx`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/fx/ParallaxImage.tsx`:

```tsx
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';

interface Props {
  src: string;
  alt: string;
  /** Pixels to translate over the entire scroll-through. Positive = drifts up as you scroll down. */
  amount?: number;
  className?: string;
  imgClassName?: string;
}

export default function ParallaxImage({ src, alt, amount = 80, className, imgClassName }: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        <img src={src} alt={alt} loading="lazy" className={imgClassName} />
      </div>
    );
  }

  return (
    <div ref={ref} className={`overflow-hidden ${className ?? ''}`}>
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ y }}
        className={`w-full h-full object-cover ${imgClassName ?? ''}`}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/fx/
git commit -m "feat(fx): RevealOnScroll + ParallaxImage utilities"
```

---

### Task 16: TwilightZone — featured photography grid

**Files:**
- Modify: `src/components/hero/zones/TwilightZone.astro`

- [ ] **Step 1: Rewrite `TwilightZone.astro`**

Replace contents:

```astro
---
import RevealOnScroll from '../../fx/RevealOnScroll.tsx';
import ParallaxImage from '../../fx/ParallaxImage.tsx';

interface Photo { src: string; alt: string; caption?: string; }
interface Props { photos?: Photo[]; }

const { photos = [] } = Astro.props as Props;
---
<section
  class="pin-zone py-32 overflow-hidden"
  data-zone-name="twilight"
  id="zone-twilight"
  style="background: linear-gradient(180deg, var(--d-bg) 0%, var(--d-bg-2) 100%);"
>
  <div class="container mx-auto px-6">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      <!-- Pinned heading column -->
      <div class="lg:col-span-4 lg:sticky lg:top-32 lg:self-start">
        <p class="meta mb-4">200–1000m · Twilight</p>
        <h2
          class="font-display font-light leading-[0.95] tracking-tightish"
          style="font-size: clamp(2.5rem, 5.6vw, 5rem); font-variation-settings: 'SOFT' 30, 'WONK' 0;"
        >
          What I find<br/>down there.
        </h2>
        <p class="mt-6 text-base sm:text-lg" style="color: var(--d-fg-muted);">
          A small archive of underwater photographs from local shore dives, boat trips, and a couple of trips that paid for themselves in stories.
        </p>
      </div>

      <!-- Photo grid -->
      <div class="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        {photos.map((p, i) => (
          <RevealOnScroll client:visible delay={i * 0.05} className={i % 3 === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}>
            <figure class="group">
              <div class={`relative ${i % 3 === 0 ? 'aspect-[4/3]' : 'aspect-[3/4]'} overflow-hidden rounded-sm`}>
                <ParallaxImage
                  client:visible
                  src={p.src}
                  alt={p.alt}
                  amount={40}
                  className="absolute inset-0"
                  imgClassName="brightness-90 saturate-90 group-hover:brightness-105 group-hover:saturate-100 transition-[filter] duration-700"
                />
              </div>
              {p.caption && (
                <figcaption class="meta mt-3 opacity-80">{p.caption}</figcaption>
              )}
            </figure>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Wire stub photo data into `index.astro`**

Open `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/pages/index.astro` and replace the `featuredPhotos` line:

```astro
---
import Layout from '../layouts/Layout.astro';
import DiveHero from '../components/hero/DiveHero.astro';

const featuredPhotos = [
  { src: '/hero-underwater-shark.jpg', alt: 'Shark from a deep shore dive', caption: 'Catalina · 18m' },
  { src: '/emerald-bay-diving.jpg', alt: 'Emerald Bay dive', caption: 'Emerald Bay · 12m' },
  { src: '/night-diving-light.jpg', alt: 'Night dive light', caption: 'Night dive · 9m' },
  { src: '/hero-dive-boat.jpg', alt: 'Dive boat departure', caption: 'Anacapa · surface' },
];
const achievements: any[] = [];
const featuredPosts: any[] = [];
---
<Layout title="Rithvik Madhan" cinematic zone="sunlit">
  <DiveHero {achievements} {featuredPhotos} {featuredPosts} />
</Layout>
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321`. Scroll past the Sunlit hero. Expected: Twilight section appears with the heading column on the left (sticky on desktop) and the photo grid on the right. Photos fade up as you scroll. Hovering a photo brightens it. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/zones/TwilightZone.astro src/pages/index.astro
git commit -m "feat(hero): TwilightZone — pinned heading + parallax photo grid"
```

---

### Task 17: DepthMeter — fixed bottom-right zone indicator

**Files:**
- Create: `src/components/hero/DepthMeter.tsx`
- Modify: `src/components/hero/DiveHero.astro`

- [ ] **Step 1: Write `DepthMeter.tsx`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/hero/DepthMeter.tsx`:

```tsx
import { useDepthZone } from '../../lib/hooks/useDepthZone';
import { ZONE_BOUNDS } from '../../lib/motion/depth';

const ZONE_LABEL: Record<string, string> = {
  sunlit:   'Sunlit · Epipelagic',
  twilight: 'Twilight · Mesopelagic',
  midnight: 'Midnight · Bathypelagic',
  abyss:    'Abyss · Abyssopelagic',
  surface:  'Resurface',
};

export default function DepthMeter() {
  const { zone, depthM, progress } = useDepthZone();

  function jumpTo(z: string) {
    const el = document.getElementById(`zone-${z}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <aside
      className="hidden md:flex fixed z-40 bottom-6 right-6 flex-col items-end gap-3 select-none pointer-events-none"
      aria-label="Current depth"
    >
      <div className="meta opacity-60 pointer-events-auto">{ZONE_LABEL[zone]}</div>
      <div
        className="font-mono tabular-nums text-3xl pointer-events-auto"
        style={{ color: 'var(--d-accent)' }}
      >
        {zone === 'surface' ? '↑' : `${depthM.toLocaleString()}m`}
      </div>
      <div className="flex gap-1.5 pointer-events-auto">
        {ZONE_BOUNDS.map((b) => {
          const active = zone === b.zone;
          return (
            <button
              key={b.zone}
              onClick={() => jumpTo(b.zone)}
              aria-label={`Jump to ${b.zone}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: active ? 28 : 12,
                background: active ? 'var(--d-accent)' : 'var(--d-fg-muted)',
                opacity: active ? 1 : 0.4,
              }}
            />
          );
        })}
      </div>
      {/* Hidden scrollbar for screen readers — does not render visibly. */}
      <span className="sr-only">Scroll progress: {Math.round(progress * 100)}%</span>
    </aside>
  );
}
```

- [ ] **Step 2: Mount in `DiveHero.astro`**

Add the import and mount in `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/hero/DiveHero.astro`:

```astro
---
import SunlitZone from './zones/SunlitZone.astro';
import TwilightZone from './zones/TwilightZone.astro';
import MidnightZone from './zones/MidnightZone.astro';
import AbyssZone from './zones/AbyssZone.astro';
import ResurfaceZone from './zones/ResurfaceZone.astro';
import DepthMeter from './DepthMeter.tsx';

interface Props { /* unchanged */ }
const { achievements, featuredPhotos, featuredPosts } = Astro.props;
---
<div id="dive-root" class="relative">
  <DepthMeter client:idle />
  <SunlitZone />
  <TwilightZone photos={featuredPhotos} />
  <MidnightZone posts={featuredPosts} />
  <AbyssZone achievements={achievements} />
  <ResurfaceZone />
</div>
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321`. Expected: bottom-right shows "Sunlit · Epipelagic" with depth `0m`. As you scroll, the depth ticks up and the active dot moves. Click a dot — page scrolls smoothly to that zone. Hidden on mobile (md breakpoint). Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/DepthMeter.tsx src/components/hero/DiveHero.astro
git commit -m "feat(hero): DepthMeter — live zone indicator + jump nav"
```

---

### Task 18: ScrollProgress — top thin glowing line

**Files:**
- Create: `src/components/motion/ScrollProgress.tsx`
- Modify: `src/components/hero/DiveHero.astro`

- [ ] **Step 1: Write `ScrollProgress.tsx`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/motion/ScrollProgress.tsx`:

```tsx
import { useDepthZone } from '../../lib/hooks/useDepthZone';

export default function ScrollProgress() {
  const { progress } = useDepthZone();
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 z-50 h-[2px] pointer-events-none"
      style={{
        width: `${Math.min(100, progress * 100)}%`,
        background: 'linear-gradient(90deg, transparent, var(--d-accent))',
        boxShadow: '0 0 12px var(--d-accent)',
        transition: 'width 80ms linear',
      }}
    />
  );
}
```

- [ ] **Step 2: Mount in `DiveHero.astro`**

Add the import + mount alongside DepthMeter. The relevant block becomes:

```astro
import DepthMeter from './DepthMeter.tsx';
import ScrollProgress from '../motion/ScrollProgress.tsx';
---
<div id="dive-root" class="relative">
  <ScrollProgress client:idle />
  <DepthMeter client:idle />
  ...
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open and scroll. Expected: a 2px line at the very top grows from left to right as you scroll, glowing in the current zone's accent color. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/components/motion/ScrollProgress.tsx src/components/hero/DiveHero.astro
git commit -m "feat(motion): ScrollProgress — glowing top progress line"
```

---

## Phase 3 — Midnight, Abyss, WebGL bioluminescence (Tasks 19–24)

### Task 19: Scroll-driven palette interpolation (the "depth-scroll" effect)

**Files:**
- Create: `src/components/motion/PaletteScroll.client.tsx`
- Modify: `src/components/hero/DiveHero.astro`

- [ ] **Step 1: Write `PaletteScroll.client.tsx`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/motion/PaletteScroll.client.tsx`:

```tsx
import { useEffect } from 'react';
import { paletteAtProgress } from '../../lib/motion/depth';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';

/** Continuously updates :root depth tokens to match scroll progress. */
export default function PaletteScroll() {
  const full = useFullExperience();
  useEffect(() => {
    let raf = 0;
    function tick() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      const pal = paletteAtProgress(p);
      const root = document.documentElement.style;
      root.setProperty('--d-bg',       pal.bg);
      root.setProperty('--d-bg-2',     pal.bg2);
      root.setProperty('--d-fg',       pal.fg);
      root.setProperty('--d-fg-muted', pal.fgMuted);
      root.setProperty('--d-accent',   pal.accent);
      root.setProperty('--d-accent-2', pal.accent2);
      raf = 0;
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(tick); }
    tick();
    if (full) {
      // Lenis is running; scroll fires frequently. No throttle needed beyond rAF.
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', tick);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', tick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [full]);
  return null;
}
```

- [ ] **Step 2: Mount in `DiveHero.astro`**

Add import + mount alongside the others:

```astro
import PaletteScroll from '../motion/PaletteScroll.client.tsx';
---
<div id="dive-root" class="relative">
  <PaletteScroll client:load />
  <ScrollProgress client:idle />
  <DepthMeter client:idle />
  ...
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321`. Scroll slowly. Expected: background and text colors gradually transition from sunlit teal-blue toward dark blue → near-black → black, then back up to dawn cream as you reach footer area. (Midnight/Abyss/Surface sections aren't filled in yet, but the body itself recolors.) Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/components/motion/PaletteScroll.client.tsx src/components/hero/DiveHero.astro
git commit -m "feat(motion): scroll-driven palette interpolation across depth zones"
```

---

### Task 20: MidnightZone — featured blog posts

**Files:**
- Modify: `src/components/hero/zones/MidnightZone.astro`

- [ ] **Step 1: Rewrite `MidnightZone.astro`**

Replace contents:

```astro
---
import RevealOnScroll from '../../fx/RevealOnScroll.tsx';

interface Post {
  href: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  readTime?: string;
}
interface Props { posts?: Post[]; }
const { posts = [] } = Astro.props as Props;
---
<section
  class="pin-zone py-32 overflow-hidden"
  data-zone-name="midnight"
  id="zone-midnight"
>
  <div class="container mx-auto px-6">
    <div class="max-w-2xl mb-20">
      <p class="meta mb-4">1000–4000m · Midnight</p>
      <h2
        class="font-display font-light leading-[0.95] tracking-tightish"
        style="font-size: clamp(2.5rem, 5.6vw, 5rem); font-variation-settings: 'SOFT' 30;"
      >
        Field notes,<br/>quietly written.
      </h2>
      <p class="mt-6 text-lg" style="color: var(--d-fg-muted);">
        The marine biology side of things — research, blog posts, dispatches from coursework and curiosity.
      </p>
    </div>

    <div class="space-y-20">
      {posts.map((post, i) => (
        <RevealOnScroll client:visible delay={i * 0.08}>
          <a href={post.href} class="group grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div class="md:col-span-5 aspect-[4/3] overflow-hidden rounded-sm">
              <img
                src={post.image}
                alt=""
                loading="lazy"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                style="filter: brightness(0.7) saturate(0.8);"
              />
            </div>
            <div class="md:col-span-7">
              <p class="meta mb-4">
                <span style="color: var(--d-accent);">{post.category}</span>
                <span class="opacity-50 mx-2">·</span>
                <span>{post.date}</span>
                {post.readTime && <><span class="opacity-50 mx-2">·</span><span>{post.readTime}</span></>}
              </p>
              <h3
                class="font-display font-light leading-[1.05]"
                style="font-size: clamp(1.6rem, 3.2vw, 2.8rem);"
              >
                {post.title}
              </h3>
              <p class="mt-4 text-base sm:text-lg max-w-prose" style="color: var(--d-fg-muted);">
                {post.excerpt}
              </p>
              <span class="meta mt-6 inline-block transition-colors" style="color: var(--d-accent);">
                Read →
              </span>
            </div>
          </a>
        </RevealOnScroll>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Wire stub post data into `index.astro`**

Update `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/pages/index.astro` `featuredPosts`:

```ts
const featuredPosts = [
  {
    href: '/blog/1',
    title: 'On wonder, and what brought me to the water.',
    excerpt: 'A first essay on why marine biology became the through-line of everything I do — and why I keep going back down.',
    image: '/emerald-bay-diving.jpg',
    category: 'Marine Biology',
    date: '2025',
  },
  {
    href: '/blog/3',
    title: 'Notes from a night dive at La Jolla.',
    excerpt: 'Things only show themselves when the sun is gone. A short field log from a summer night dive.',
    image: '/night-diving-light.jpg',
    category: 'Diving',
    date: '2025',
  },
  {
    href: '/blog/5',
    title: 'Sequoia, after the fire.',
    excerpt: 'A backpacking trip through a forest that was learning to come back. Notes on conservation, slowness, and the privilege of access.',
    image: '/sequoia-misty.jpg',
    category: 'Conservation',
    date: '2024',
  },
];
```

(Leave `achievements: any[] = [];` in place — Task 22 fills it.)

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Scroll into Midnight zone. Expected: dark near-black background, three editorial post cards laid out as image+title+excerpt rows. Hover image → it scales subtly. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/zones/MidnightZone.astro src/pages/index.astro
git commit -m "feat(hero): MidnightZone — three featured posts in editorial layout"
```

---

### Task 21: Bioluminescence WebGL particle scene

**Files:**
- Create: `src/components/motion/Bioluminescence.client.tsx`
- Modify: `src/components/hero/zones/MidnightZone.astro`
- Modify: `src/components/hero/zones/AbyssZone.astro`

- [ ] **Step 1: Write `Bioluminescence.client.tsx`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/motion/Bioluminescence.client.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';

interface Props {
  /** 0..1 — controls particle density. Midnight ~0.4, Abyss ~1.0. */
  intensity?: number;
}

const VERT = `
attribute vec3 position;
attribute float aSeed;
uniform float uTime;
uniform vec2  uRes;
uniform float uIntensity;
varying float vSeed;
varying float vAlpha;
void main() {
  vSeed = aSeed;
  // Drift slowly upward with horizontal sway.
  float t = uTime * (0.04 + 0.04 * fract(aSeed * 13.0));
  vec3 p = position;
  p.y += mod(t * 60.0 + aSeed * 100.0, 800.0) - 400.0;
  p.x += sin(t * 0.6 + aSeed * 6.28) * 30.0;
  gl_Position = vec4(p.xy / (uRes * 0.5), 0.0, 1.0);
  // Random size, modulated by intensity.
  gl_PointSize = (2.0 + fract(aSeed * 31.0) * 4.0) * uIntensity * (uRes.y / 600.0);
  // Pulse alpha.
  vAlpha = 0.4 + 0.6 * (0.5 + 0.5 * sin(uTime * 1.3 + aSeed * 9.0));
}
`;

const FRAG = `
precision highp float;
varying float vSeed;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  // Soft glowing dot with tinted core (cyan-green vs. warm gold).
  vec3 cool = vec3(0.48, 1.0, 0.69);   // #7BFFB1
  vec3 warm = vec3(0.96, 0.82, 0.48);  // #F4D27A
  vec3 col = mix(cool, warm, step(0.85, fract(vSeed * 7.0)));
  float a = pow(1.0 - d * 2.0, 2.5) * vAlpha;
  gl_FragColor = vec4(col, a);
}
`;

export default function Bioluminescence({ intensity = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const full = useFullExperience();

  useEffect(() => {
    if (!full) return;
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) console.error(gl!.getShaderInfoLog(s));
      return s;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const isMobile = window.innerWidth < 768;
    const COUNT = Math.round((isMobile ? 200 : 700) * intensity);
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * window.innerWidth;
      positions[i * 3 + 1] = (Math.random() - 0.5) * window.innerHeight;
      positions[i * 3 + 2] = 0;
      seeds[i] = Math.random();
    }
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    const seedBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const aSeed = gl.getAttribLocation(prog, 'aSeed');
    gl.enableVertexAttribArray(aSeed);
    gl.vertexAttribPointer(aSeed, 1, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uRes  = gl.getUniformLocation(prog, 'uRes');
    const uInt  = gl.getUniformLocation(prog, 'uIntensity');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    let raf = 0;
    function frame(now: number) {
      const t = (now - start) / 1000;
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uInt, intensity);
      gl!.drawArrays(gl!.POINTS, 0, COUNT);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [full, intensity]);

  if (!full) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
```

- [ ] **Step 2: Mount in MidnightZone**

In `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/hero/zones/MidnightZone.astro`, add the import and a Bioluminescence layer behind the content. Final structure:

```astro
---
import RevealOnScroll from '../../fx/RevealOnScroll.tsx';
import Bioluminescence from '../../motion/Bioluminescence.client.tsx';
// ... existing types/Props ...
---
<section class="pin-zone py-32 overflow-hidden relative" data-zone-name="midnight" id="zone-midnight">
  <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
    <Bioluminescence client:visible intensity={0.4} />
  </div>
  <div class="container mx-auto px-6 relative z-10">
    <!-- existing content -->
  </div>
</section>
```

- [ ] **Step 3: Mount in AbyssZone (placeholder for now)**

The AbyssZone is still a stub — wire Bioluminescence in now so we can verify both. Update `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/hero/zones/AbyssZone.astro`:

```astro
---
import Bioluminescence from '../../motion/Bioluminescence.client.tsx';
const _ = Astro.props;
---
<section class="pin-zone py-32 overflow-hidden relative" data-zone-name="abyss" id="zone-abyss"
  style="background: var(--d-bg);">
  <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
    <Bioluminescence client:visible intensity={1.0} />
  </div>
  <div class="container mx-auto px-6 relative z-10">
    <h2 class="font-display text-6xl">Abyss</h2>
  </div>
</section>
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Scroll into Midnight. Expected: faint glowing particles drift slowly behind the post cards, mostly cool cyan-green with occasional warm gold flecks. Scroll into Abyss — particle density visibly increases. With reduced motion, no canvas appears. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/components/motion/Bioluminescence.client.tsx \
        src/components/hero/zones/MidnightZone.astro \
        src/components/hero/zones/AbyssZone.astro
git commit -m "feat(motion): WebGL bioluminescence particle scene"
```

---

### Task 22: AbyssZone — achievements as bioluminescent discoveries

**Files:**
- Modify: `src/components/hero/zones/AbyssZone.astro`

- [ ] **Step 1: Rewrite `AbyssZone.astro`**

Replace contents:

```astro
---
import Bioluminescence from '../../motion/Bioluminescence.client.tsx';

interface Achievement {
  title: string;
  organization: string;
  date: string;
  description: string;
}
interface Props { achievements?: Achievement[]; }
const { achievements = [] } = Astro.props as Props;
---
<section
  class="pin-zone py-40 overflow-hidden relative"
  data-zone-name="abyss"
  id="zone-abyss"
  style="background: var(--d-bg);"
>
  <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
    <Bioluminescence client:visible intensity={1.0} />
  </div>

  <div class="container mx-auto px-6 relative z-10">
    <div class="max-w-2xl mb-24">
      <p class="meta mb-4">4000m+ · Abyss</p>
      <h2
        class="font-display font-light leading-[0.95] tracking-tightish"
        style="font-size: clamp(2.5rem, 5.6vw, 5rem); font-variation-settings: 'SOFT' 80, 'WONK' 18;"
      >
        And what's<br/>shaped me down here.
      </h2>
      <p class="mt-6 text-lg" style="color: var(--d-fg-muted);">
        Things you find when you've gone deep enough — recognitions, milestones, the slow accumulation of being shown up.
      </p>
    </div>

    <ol class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
      {achievements.map((a, i) => (
        <li class="abyss-discovery group" data-cursor-attract style={`--ai: ${i};`}>
          <div class="flex items-start gap-5">
            <span
              class="abyss-glow flex-none mt-2"
              aria-hidden="true"
            ></span>
            <div>
              <h3
                class="font-display font-light leading-tight"
                style="font-size: clamp(1.5rem, 2.6vw, 2.2rem);"
              >
                {a.title}
              </h3>
              <p class="meta mt-2">
                <span>{a.organization}</span>
                <span class="opacity-50 mx-2">·</span>
                <span>{a.date}</span>
              </p>
              <p class="mt-4 max-w-md" style="color: var(--d-fg-muted);">
                {a.description}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  </div>
</section>

<style>
  .abyss-glow {
    width: 14px;
    height: 14px;
    border-radius: 9999px;
    background: var(--d-accent);
    box-shadow: 0 0 12px var(--d-accent), 0 0 28px var(--d-accent);
    animation: abyss-pulse 3.4s ease-in-out infinite;
    animation-delay: calc(var(--ai, 0) * 0.4s);
  }
  .group:hover .abyss-glow {
    box-shadow: 0 0 18px var(--d-accent), 0 0 40px var(--d-accent);
  }
  /* Scout-related items get the warm gold glow */
  .abyss-discovery:nth-child(2) .abyss-glow,
  .abyss-discovery:nth-child(3) .abyss-glow {
    background: var(--d-accent-2);
    box-shadow: 0 0 12px var(--d-accent-2), 0 0 28px var(--d-accent-2);
  }
  @keyframes abyss-pulse {
    0%, 100% { opacity: 0.55; transform: scale(0.92); }
    50%      { opacity: 1.0;  transform: scale(1.08); }
  }
</style>
```

- [ ] **Step 2: Wire achievements into `index.astro`**

Update `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/pages/index.astro` `achievements` to:

```ts
const achievements = [
  { title: 'Advanced Open Water Diver', organization: 'PADI', date: '2025', description: 'Deep diving, underwater navigation, peak performance buoyancy, and underwater naturalist specialties.' },
  { title: 'First Class Scout', organization: 'Boy Scouts of America', date: '2025', description: 'A year of service, leadership, and outdoor skills.' },
  { title: 'Mile Swim Award', organization: 'BSA', date: '2025', description: '34 consecutive laps at 5:30 AM at over 5000 ft of elevation.' },
  { title: 'District Honor Band', organization: 'ABCUSD', date: '2024 & 2025', description: 'Two-time flute section leader.' },
];
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Scroll into Abyss. Expected: near-black background with bioluminescent particles drifting. Heading. Below: 4 achievements, each with a softly pulsing dot to its left. The 2nd and 3rd glow warm gold (scout-related); 1st and 4th glow cyan-green. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/components/hero/zones/AbyssZone.astro src/pages/index.astro
git commit -m "feat(hero): AbyssZone — achievements as pulsing bioluminescent discoveries"
```

---

### Task 23: KelpCorner — hand-drawn corner ornaments

**Files:**
- Create: `src/components/motion/KelpCorner.astro`
- Modify: `src/components/hero/zones/AbyssZone.astro`

- [ ] **Step 1: Write `KelpCorner.astro`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/motion/KelpCorner.astro`:

```astro
---
interface Props {
  position: 'tl' | 'tr' | 'bl' | 'br';
  variant?: 'kelp' | 'spore';
}
const { position, variant = 'kelp' } = Astro.props as Props;

const transformByPos: Record<string, string> = {
  tl: 'top-0 left-0',
  tr: 'top-0 right-0 scale-x-[-1]',
  bl: 'bottom-0 left-0 scale-y-[-1]',
  br: 'bottom-0 right-0 scale-x-[-1] scale-y-[-1]',
};
---
<svg
  class:list={['absolute pointer-events-none opacity-25 mix-blend-screen', transformByPos[position]]}
  width="180" height="240" viewBox="0 0 180 240"
  fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"
  style="color: var(--d-accent); transform-origin: top left;"
  aria-hidden="true"
>
  {variant === 'kelp' && (
    <>
      <!-- Loose hand-drawn kelp strands -->
      <path d="M 18 240 Q 22 180 30 140 T 24 60 Q 30 30 18 8" />
      <path d="M 46 240 Q 50 200 56 170 T 50 110 Q 60 80 50 50 Q 60 30 50 14" />
      <path d="M 80 240 Q 84 220 86 200 T 80 150 Q 90 130 78 100" />
      <!-- Leaves on first strand -->
      <path d="M 24 200 Q 14 196 8 200" />
      <path d="M 30 160 Q 40 156 46 160" />
      <path d="M 26 110 Q 16 106 10 110" />
      <path d="M 30 70 Q 42 66 50 70" />
      <!-- Leaves on second strand -->
      <path d="M 50 215 Q 60 211 66 215" />
      <path d="M 54 175 Q 44 171 38 175" />
      <path d="M 56 130 Q 68 126 76 130" />
      <!-- Tiny barnacles -->
      <circle cx="36" cy="232" r="1.2" fill="currentColor" />
      <circle cx="42" cy="236" r="0.9" fill="currentColor" />
      <circle cx="62" cy="234" r="1.0" fill="currentColor" />
    </>
  )}
  {variant === 'spore' && (
    <>
      <!-- Drifting spore-like dots -->
      <circle cx="20" cy="40"  r="1.6" fill="currentColor" />
      <circle cx="60" cy="20"  r="1.0" fill="currentColor" />
      <circle cx="100" cy="60" r="1.2" fill="currentColor" />
      <circle cx="40" cy="100" r="0.8" fill="currentColor" />
      <circle cx="120" cy="120" r="1.4" fill="currentColor" />
      <circle cx="30" cy="160" r="1.0" fill="currentColor" />
      <circle cx="80" cy="180" r="0.9" fill="currentColor" />
      <circle cx="140" cy="200" r="1.2" fill="currentColor" />
    </>
  )}
</svg>
```

- [ ] **Step 2: Mount in AbyssZone**

In `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/hero/zones/AbyssZone.astro`, add KelpCorner imports and four corners. Add to frontmatter:

```astro
import KelpCorner from '../../motion/KelpCorner.astro';
```

Inside `<section>` after the Bioluminescence wrapper but before the content `<div class="container...">`:

```astro
  <KelpCorner position="tl" />
  <KelpCorner position="tr" variant="spore" />
  <KelpCorner position="bl" variant="spore" />
  <KelpCorner position="br" />
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Scroll into Abyss. Expected: subtle hand-drawn kelp/spore SVG ornaments in all four corners, glowing in accent green, never tiled, very low opacity so they don't overpower content. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/components/motion/KelpCorner.astro src/components/hero/zones/AbyssZone.astro
git commit -m "feat(motion): KelpCorner hand-drawn ornaments in abyss corners"
```

---

### Task 24: ResurfaceZone + new Footer with buoy easter egg

**Files:**
- Modify: `src/components/hero/zones/ResurfaceZone.astro`
- Create: `src/components/chrome/Footer.astro`
- Create: `src/components/chrome/BuoyEgg.tsx`

- [ ] **Step 1: Write `BuoyEgg.tsx`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/chrome/BuoyEgg.tsx`:

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';

export default function BuoyEgg() {
  const [running, setRunning] = useState(false);
  const reduced = useReducedMotion();

  return (
    <>
      <button
        onClick={() => setRunning(true)}
        aria-label="Easter egg: buoy"
        className="font-mono text-xs opacity-70 hover:opacity-100 transition-opacity"
        style={{ color: 'var(--d-fg-muted)' }}
      >
        ©
      </button>
      <AnimatePresence>
        {running && !reduced && (
          <motion.div
            initial={{ x: '110vw', y: 0 }}
            animate={{ x: '-15vw', y: [0, -10, 0, -8, 0, -12, 0] }}
            exit={{ opacity: 0 }}
            transition={{ x: { duration: 8, ease: 'linear' }, y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
            onAnimationComplete={() => setRunning(false)}
            style={{ position: 'fixed', bottom: '8vh', right: 0, zIndex: 30, pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <svg width="56" height="80" viewBox="0 0 56 80" fill="none">
              <line x1="28" y1="0" x2="28" y2="40" stroke="var(--d-fg-muted)" stroke-width="1" stroke-dasharray="2 3" />
              <ellipse cx="28" cy="48" rx="20" ry="14" fill="#D94B3A" />
              <rect x="8" y="46" width="40" height="3" fill="#fff" />
              <ellipse cx="28" cy="62" rx="22" ry="6" fill="rgba(255,255,255,0.18)" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Write `Footer.astro`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/chrome/Footer.astro`:

```astro
---
import BuoyEgg from './BuoyEgg.tsx';
---
<footer class="relative z-10 py-20 px-6" style="background: transparent;">
  <div class="container mx-auto max-w-5xl">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
      <div>
        <p class="meta mb-3">Resurface</p>
        <h3 class="font-display font-light text-3xl leading-tight">
          Stay in touch.
        </h3>
        <p class="mt-3 max-w-xs" style="color: var(--d-fg-muted);">
          The most reliable way to reach me is email — I read everything.
        </p>
      </div>
      <nav class="flex flex-col gap-2 font-sans">
        <a href="/" class="hover:underline">Home</a>
        <a href="/blog" class="hover:underline">Writing</a>
        <a href="/contact" class="hover:underline">Contact</a>
      </nav>
      <div class="flex flex-col gap-2 font-sans" style="color: var(--d-fg-muted);">
        <a href="mailto:rithvikbruh@gmail.com" class="hover:underline" style="color: var(--d-fg);">rithvikbruh@gmail.com</a>
        <a href="https://github.com" class="hover:underline">GitHub</a>
        <a href="https://www.instagram.com" class="hover:underline">Instagram</a>
      </div>
    </div>
    <div class="mt-16 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t" style="border-color: var(--d-rule);">
      <p class="meta opacity-70">Made on the California coast.</p>
      <div class="flex items-center gap-3">
        <BuoyEgg client:visible />
        <span class="meta opacity-70">Rithvik Madhan · 2026</span>
      </div>
    </div>
  </div>
</footer>
```

- [ ] **Step 3: Rewrite `ResurfaceZone.astro`**

Replace contents:

```astro
---
import Footer from '../../chrome/Footer.astro';
---
<section
  class="pin-zone pt-32 relative overflow-hidden"
  data-zone-name="surface"
  id="zone-surface"
>
  <div class="container mx-auto px-6 max-w-3xl text-center pb-12">
    <p class="meta mb-4">Surface</p>
    <h2
      class="font-display font-light leading-[1.0] tracking-tightish text-balance"
      style="font-size: clamp(2.2rem, 4.6vw, 4rem); font-variation-settings: 'SOFT' 90, 'WONK' 0;"
    >
      Thanks for going down there with me.
    </h2>
    <p class="mt-6 text-base sm:text-lg" style="color: var(--d-fg-muted);">
      Most of what's worth knowing is hard to see from the surface. I'll keep going under and writing it back up. If you'd like to come along, you know where to find me.
    </p>
  </div>

  <Footer />
</section>
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Scroll all the way to footer. Expected: background transitions to dawn cream, calm "Thanks for going down there with me" heading, then footer with three columns and a `©` glyph next to the year. Click the `©` — a small red buoy drifts across the bottom of the screen from right to left, bobbing gently. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/components/chrome/ src/components/hero/zones/ResurfaceZone.astro
git commit -m "feat(chrome): ResurfaceZone + Footer with buoy easter egg"
```

---

## Phase 4 — Site chrome + nav (Tasks 25–26)

### Task 25: Nav (replaces Header)

**Files:**
- Create: `src/components/chrome/Nav.astro`
- Delete: `src/components/Header.astro`

- [ ] **Step 1: Write `Nav.astro`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/chrome/Nav.astro`:

```astro
---
const path = Astro.url.pathname;
const isHome = path === '/' || path === '';
---
<header
  id="site-nav"
  class:list={['fixed top-0 left-0 right-0 z-40 transition-all duration-500',
    isHome ? 'bg-transparent' : 'backdrop-blur-md']}
  style={isHome ? '' : 'background: color-mix(in oklab, var(--d-bg) 80%, transparent);'}
>
  <div class="container mx-auto px-6 flex items-center justify-between py-5">
    <a href="/" class="font-display text-xl tracking-tightish" style="font-variation-settings: 'SOFT' 50;" aria-label="Home">
      <svg width="20" height="20" viewBox="0 0 20 20" class="inline mr-2" aria-hidden="true">
        <path d="M2 12 Q 6 8 10 12 T 18 12" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" />
      </svg>
      Rithvik
    </a>

    <nav class="hidden md:flex items-center gap-8 font-sans text-sm tracking-widish uppercase">
      <a href="/" class="hover:opacity-100 transition-opacity" style={path === '/' ? '' : 'opacity: 0.7;'}>Home</a>
      <a href="/blog" class="hover:opacity-100 transition-opacity" style={path.startsWith('/blog') ? '' : 'opacity: 0.7;'}>Writing</a>
      <a href="/contact" class="hover:opacity-100 transition-opacity" style={path === '/contact' ? '' : 'opacity: 0.7;'}>Contact</a>
    </nav>

    <button
      id="nav-mobile-toggle"
      class="md:hidden p-2"
      aria-label="Open menu"
      aria-expanded="false"
      aria-controls="nav-mobile"
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M3 7h16M3 15h16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
      </svg>
    </button>
  </div>

  <div id="nav-mobile" class="md:hidden hidden border-t" style="border-color: var(--d-rule); background: var(--d-bg);">
    <nav class="container mx-auto px-6 py-6 flex flex-col gap-4 font-sans tracking-widish uppercase text-sm">
      <a href="/">Home</a>
      <a href="/blog">Writing</a>
      <a href="/contact">Contact</a>
    </nav>
  </div>
</header>

<script>
  const toggle = document.getElementById('nav-mobile-toggle');
  const menu = document.getElementById('nav-mobile');
  toggle?.addEventListener('click', () => {
    const open = menu?.classList.toggle('hidden') === false;
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Add backdrop-blur after scrolling past 80px on home.
  const nav = document.getElementById('site-nav');
  function updateNav() {
    if (!nav) return;
    if (window.scrollY > 80) {
      nav.style.background = 'color-mix(in oklab, var(--d-bg) 80%, transparent)';
      nav.classList.add('backdrop-blur-md');
    } else if (location.pathname === '/' || location.pathname === '') {
      nav.style.background = 'transparent';
      nav.classList.remove('backdrop-blur-md');
    }
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
</script>
```

- [ ] **Step 2: Wire Nav into `Layout.astro`**

Open `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/layouts/Layout.astro` and add the Nav inside `<body>`, before the slot:

```astro
import Nav from '../components/chrome/Nav.astro';
...
<body>
  <MotionRoot client:load />
  <Nav />
  <slot />
</body>
```

- [ ] **Step 3: Delete legacy `Header.astro`**

```bash
rm /Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/Header.astro
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:4321`. Expected: thin transparent nav over hero. Scroll past 80px — nav gains a blurred translucent background tinted to the current zone. Mobile (resize to <768px): hamburger toggles a column menu. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/components/chrome/Nav.astro src/layouts/Layout.astro
git rm src/components/Header.astro
git commit -m "feat(chrome): new transparent-on-hero Nav, retire legacy Header"
```

---

### Task 26: Wire `index.astro` final composition + delete legacy

**Files:**
- Modify: `src/pages/index.astro`
- Delete: `src/components/Hero.astro`
- Delete: `src/components/BlogPreview.astro`
- Delete: `src/components/Welcome.astro`

- [ ] **Step 1: Final `index.astro`**

Confirm `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/pages/index.astro` matches:

```astro
---
import Layout from '../layouts/Layout.astro';
import DiveHero from '../components/hero/DiveHero.astro';

const featuredPhotos = [
  { src: '/hero-underwater-shark.jpg', alt: 'Shark from a deep shore dive', caption: 'Catalina · 18m' },
  { src: '/emerald-bay-diving.jpg', alt: 'Emerald Bay dive', caption: 'Emerald Bay · 12m' },
  { src: '/night-diving-light.jpg', alt: 'Night dive light', caption: 'Night dive · 9m' },
  { src: '/hero-dive-boat.jpg', alt: 'Dive boat departure', caption: 'Anacapa · surface' },
];

const featuredPosts = [
  { href: '/blog/1', title: 'On wonder, and what brought me to the water.', excerpt: 'A first essay on why marine biology became the through-line of everything I do — and why I keep going back down.', image: '/emerald-bay-diving.jpg', category: 'Marine Biology', date: '2025' },
  { href: '/blog/3', title: 'Notes from a night dive at La Jolla.', excerpt: 'Things only show themselves when the sun is gone. A short field log from a summer night dive.', image: '/night-diving-light.jpg', category: 'Diving', date: '2025' },
  { href: '/blog/5', title: 'Sequoia, after the fire.', excerpt: 'A backpacking trip through a forest that was learning to come back. Notes on conservation, slowness, and the privilege of access.', image: '/sequoia-misty.jpg', category: 'Conservation', date: '2024' },
];

const achievements = [
  { title: 'Advanced Open Water Diver', organization: 'PADI', date: '2025', description: 'Deep diving, underwater navigation, peak performance buoyancy, and underwater naturalist specialties.' },
  { title: 'First Class Scout', organization: 'Boy Scouts of America', date: '2025', description: 'A year of service, leadership, and outdoor skills.' },
  { title: 'Mile Swim Award', organization: 'BSA', date: '2025', description: '34 consecutive laps at 5:30 AM at over 5000 ft of elevation.' },
  { title: 'District Honor Band', organization: 'ABCUSD', date: '2024 & 2025', description: 'Two-time flute section leader.' },
];
---
<Layout title="Rithvik Madhan — Marine biology, diving, scouting" cinematic zone="sunlit">
  <DiveHero {achievements} {featuredPhotos} {featuredPosts} />
</Layout>
```

- [ ] **Step 2: Delete legacy components**

```bash
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign
rm src/components/Hero.astro src/components/BlogPreview.astro src/components/Welcome.astro
# Keep src/components/PhotoCard.astro and src/components/Footer.astro for now —
# the new chrome/Footer.astro replaces the latter, but the legacy file is unreferenced
# after Task 25 already changed Layout. Check:
grep -rn "from '../components/Footer'" src/ || echo "no refs"
grep -rn "from '../../components/Footer'" src/ || echo "no refs"
# If "no refs", remove:
rm src/components/Footer.astro
# Likewise PhotoCard:
grep -rn "from '../components/PhotoCard'" src/ || echo "no refs"
rm src/components/PhotoCard.astro
```

- [ ] **Step 3: Build + verify**

```bash
npm run build
npm run dev
```

Open `http://localhost:4321` and scroll the entire page. Expected: smooth descent through Sunlit → Twilight → Midnight → Abyss → Surface, palette interpolating continuously, depth meter ticking, scroll progress glowing, no broken imports. Stop server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: retire legacy Hero/BlogPreview/Welcome/Footer/PhotoCard"
```

---

## Phase 5 — Blog system (Tasks 27–31)

### Task 27: BlogCard component

**Files:**
- Create: `src/components/blog/BlogCard.astro`

- [ ] **Step 1: Write `BlogCard.astro`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/blog/BlogCard.astro`:

```astro
---
interface Props {
  href: string;
  title: string;
  excerpt: string;
  image: string;
  category: 'Marine Biology' | 'Diving' | 'Conservation' | 'Scouting';
  date: string;
}
const { href, title, excerpt, image, category, date } = Astro.props as Props;

const slug = category.toLowerCase().replace(' ', '-');
---
<a
  href={href}
  data-cat={slug}
  class="group block relative"
>
  <div class="aspect-[4/3] overflow-hidden rounded-sm bg-depth-bg-2">
    <img
      src={image}
      alt=""
      loading="lazy"
      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
    />
    <span
      class="absolute top-4 left-4 meta px-2.5 py-1 rounded-full"
      style="background: color-mix(in oklab, var(--cat) 70%, transparent); color: var(--d-bg);"
    >
      {category}
    </span>
  </div>
  <div class="mt-5">
    <h3
      class="font-display font-light leading-[1.1] transition-colors group-hover:text-[var(--cat)]"
      style="font-size: clamp(1.4rem, 2.4vw, 2rem);"
    >
      {title}
    </h3>
    <p class="mt-3 text-base max-w-prose" style="color: var(--d-fg-muted);">
      {excerpt}
    </p>
    <p class="meta mt-4">{date}</p>
  </div>
</a>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/blog/BlogCard.astro
git commit -m "feat(blog): BlogCard with category tinting"
```

---

### Task 28: BlogIndex page (`/blog`)

**Files:**
- Create: `src/pages/blog/index.astro`

- [ ] **Step 1: Write the blog index page**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/pages/blog/index.astro`:

```astro
---
import Layout from '../../layouts/Layout.astro';
import BlogCard from '../../components/blog/BlogCard.astro';

// Until content collections are introduced, the index lives here as a literal list.
// Update entries when adding/removing posts in src/pages/blog/[N].astro.
const POSTS = [
  { href: '/blog/1', title: 'On wonder, and what brought me to the water.', excerpt: 'A first essay on why marine biology became the through-line.', image: '/emerald-bay-diving.jpg', category: 'Marine Biology' as const, date: '2025-09' },
  { href: '/blog/2', title: 'Becoming an Eagle Scout.', excerpt: 'A year-long project, written down before I forgot what it felt like.', image: '/scouting-journey-cover.jpg', category: 'Scouting' as const, date: '2025-07' },
  { href: '/blog/3', title: 'Notes from a night dive at La Jolla.', excerpt: 'Things only show themselves when the sun is gone.', image: '/night-diving-light.jpg', category: 'Diving' as const, date: '2025-06' },
  { href: '/blog/4', title: 'A backpacking week in Sequoia.', excerpt: 'Stars, fog, and a tree that has outlived empires.', image: '/sequoia-stars.jpg', category: 'Conservation' as const, date: '2024-08' },
  { href: '/blog/5', title: 'Sequoia, after the fire.', excerpt: 'A forest learning to come back.', image: '/sequoia-misty.jpg', category: 'Conservation' as const, date: '2024-07' },
];

const featured = POSTS[0];
const rest = POSTS.slice(1);

const categories: Array<'All' | typeof POSTS[number]['category']> = ['All', 'Marine Biology', 'Diving', 'Conservation', 'Scouting'];
---
<Layout title="Writing — Rithvik Madhan" zone="twilight" description="Essays and field notes on marine biology, diving, scouting, and conservation.">
  <main class="pt-32 pb-32 min-h-screen">
    <div class="container mx-auto px-6 max-w-6xl">
      <header class="mb-16">
        <p class="meta mb-3">Writing</p>
        <h1
          class="font-display font-light leading-[0.95] tracking-tightish max-w-3xl"
          style="font-size: clamp(2.6rem, 6vw, 5.6rem); font-variation-settings: 'SOFT' 60, 'WONK' 0;"
        >
          Field notes from above and below the surface.
        </h1>
      </header>

      <section class="mb-20">
        <a href={featured.href} class="group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div class="lg:col-span-7 aspect-[16/10] overflow-hidden rounded-sm">
            <img src={featured.image} alt="" loading="eager" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          </div>
          <div class="lg:col-span-5" data-cat={featured.category.toLowerCase().replace(' ','-')}>
            <p class="meta mb-3">
              <span style="color: var(--cat);">{featured.category}</span>
              <span class="opacity-50 mx-2">·</span>
              <span>{featured.date}</span>
            </p>
            <h2
              class="font-display font-light leading-[1.0] tracking-tightish"
              style="font-size: clamp(2rem, 3.6vw, 3.4rem);"
            >
              {featured.title}
            </h2>
            <p class="mt-4 text-base sm:text-lg max-w-prose" style="color: var(--d-fg-muted);">
              {featured.excerpt}
            </p>
            <span class="meta mt-6 inline-block" style="color: var(--cat);">Read latest →</span>
          </div>
        </a>
      </section>

      <nav class="flex flex-wrap items-center gap-x-8 gap-y-3 mb-12 border-t pt-8" style="border-color: var(--d-rule);" aria-label="Filter by category">
        {categories.map((c) => (
          <button
            class="filter-tab meta py-1 hover:text-[var(--d-accent)] transition-colors"
            data-filter={c === 'All' ? 'all' : c.toLowerCase().replace(' ','-')}
            aria-pressed={c === 'All' ? 'true' : 'false'}
          >
            {c}
          </button>
        ))}
      </nav>

      <ul class="grid grid-cols-1 md:grid-cols-2 gap-12">
        {rest.map((p) => (
          <li class="post-item" data-cat={p.category.toLowerCase().replace(' ','-')}>
            <BlogCard {...p} />
          </li>
        ))}
      </ul>
    </div>
  </main>
</Layout>

<style>
  .filter-tab[aria-pressed="true"] {
    color: var(--d-accent);
    text-decoration: underline;
    text-underline-offset: 6px;
  }
</style>

<script>
  const tabs = document.querySelectorAll<HTMLButtonElement>('.filter-tab');
  const items = document.querySelectorAll<HTMLLIElement>('.post-item');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.filter!;
      tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.filter === target)));
      items.forEach((li) => {
        const show = target === 'all' || li.dataset.cat === target;
        (li as HTMLElement).style.display = show ? '' : 'none';
      });
    });
  });
</script>
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Open `http://localhost:4321/blog`. Expected: editorial magazine layout with featured hero post, category filter row, 2-column grid of remaining posts. Click filter tabs — non-matching cards hide. Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "feat(blog): editorial /blog index with category filtering"
```

---

### Task 29: BlogLayout for individual posts

**Files:**
- Create: `src/layouts/BlogLayout.astro`

- [ ] **Step 1: Write `BlogLayout.astro`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/layouts/BlogLayout.astro`:

```astro
---
import Layout from './Layout.astro';

interface Props {
  title: string;
  excerpt?: string;
  category: 'Marine Biology' | 'Diving' | 'Conservation' | 'Scouting';
  date: string;
  heroImage?: string;
  heroAlt?: string;
}
const { title, excerpt, category, date, heroImage, heroAlt = '' } = Astro.props as Props;
const catSlug = category.toLowerCase().replace(' ', '-');
const zone = category === 'Scouting' || category === 'Conservation' ? 'twilight' : 'twilight';
---
<Layout title={`${title} — Rithvik Madhan`} description={excerpt} zone={zone}>
  <article data-cat={catSlug} class="pt-32 pb-32 min-h-screen">
    <div class="container mx-auto px-6">
      <header class="reading-col mb-12">
        <a href="/blog" class="meta inline-block mb-8 hover:text-[var(--d-accent)] transition-colors">← Back to writing</a>
        <p class="meta mb-3">
          <span style="color: var(--cat);">{category}</span>
          <span class="opacity-50 mx-2">·</span>
          <span>{date}</span>
        </p>
        <h1
          class="font-display font-light leading-[1.02] tracking-tightish text-balance"
          style="font-size: clamp(2.2rem, 5vw, 4.4rem); font-variation-settings: 'SOFT' 50;"
        >
          {title}
        </h1>
        {excerpt && (
          <p class="mt-6 text-lg sm:text-xl max-w-prose" style="color: var(--d-fg-muted);">
            {excerpt}
          </p>
        )}
      </header>

      {heroImage && (
        <figure class="max-w-5xl mx-auto mb-16 aspect-[16/9] overflow-hidden rounded-sm">
          <img src={heroImage} alt={heroAlt} loading="eager" class="w-full h-full object-cover" />
        </figure>
      )}

      <div class="reading-col post-body">
        <slot />
      </div>
    </div>
  </article>
</Layout>

<style is:global>
  .post-body {
    font-size: clamp(1.05rem, 1.15vw, 1.18rem);
    line-height: 1.7;
    color: var(--d-fg);
  }
  .post-body > p:first-of-type::first-letter {
    font-family: var(--font-display);
    float: left;
    font-size: 4.6em;
    line-height: 0.85;
    margin: 0.04em 0.08em -0.05em -0.04em;
    color: var(--cat);
    font-weight: 300;
    font-variation-settings: 'SOFT' 80;
  }
  .post-body p { margin: 0 0 1.4em; }
  .post-body h2 {
    font-family: var(--font-display);
    font-weight: 300;
    font-size: clamp(1.6rem, 2.4vw, 2.2rem);
    margin: 2.2em 0 0.6em;
    line-height: 1.15;
  }
  .post-body h3 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(1.2rem, 1.6vw, 1.5rem);
    margin: 2em 0 0.5em;
  }
  .post-body blockquote {
    margin: 2em 0;
    padding: 0.4em 1.4em;
    border-left: 2px solid var(--cat);
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1.25em;
    color: var(--d-fg);
  }
  .post-body img,
  .post-body .full-bleed {
    border-radius: 2px;
    margin: 2em 0;
  }
  .post-body .full-bleed {
    /* Break out of the reading column */
    width: min(100vw, 1100px);
    margin-left: 50%;
    transform: translateX(-50%);
  }
  .post-body a {
    color: var(--cat);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .post-body ul, .post-body ol {
    margin: 0 0 1.4em 1.2em;
  }
  .post-body li { margin-bottom: 0.5em; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/BlogLayout.astro
git commit -m "feat(blog): BlogLayout for long-form editorial post pages"
```

---

### Task 30: Migrate blog posts 1–5 to BlogLayout

**Files:**
- Modify: `src/pages/blog/1.astro`
- Modify: `src/pages/blog/2.astro`
- Modify: `src/pages/blog/3.astro`
- Modify: `src/pages/blog/4.astro`
- Modify: `src/pages/blog/5.astro`

- [ ] **Step 1: Inspect each post to capture title/category/date/body**

```bash
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign
for f in src/pages/blog/{1,2,3,4,5}.astro; do
  echo "=== $f ==="; head -50 "$f"
done
```

For each post, identify: title, category, date, hero image, body content (everything inside the article body wrapper). The exact source varies post-to-post; the rule is: **preserve all text and image content verbatim**. Only the chrome (Layout, Header, Footer, intro card) is being swapped.

- [ ] **Step 2: For each post file, replace its frontmatter + chrome with BlogLayout**

The new structure for each `src/pages/blog/N.astro` is:

```astro
---
import BlogLayout from '../../layouts/BlogLayout.astro';
---
<BlogLayout
  title="<existing post title>"
  excerpt="<existing post intro/dek if available, else 1 sentence summary>"
  category="<one of: Marine Biology | Diving | Conservation | Scouting — match the post topic>"
  date="<YYYY-MM>"
  heroImage="<existing hero image path from public/>"
  heroAlt="<existing alt text>"
>
  <!-- BODY: paste the existing prose here, stripped of the old chrome.
       Keep <p>, <h2>, <h3>, <blockquote>, <img>, <ul>, <ol> tags.
       Wrap any image you want to break out of the reading column in:
       <figure class="full-bleed"><img …/></figure> -->
</BlogLayout>
```

Repeat for posts 1 through 5. Match category mapping from the index in Task 28:
- 1: Marine Biology
- 2: Scouting
- 3: Diving
- 4: Conservation
- 5: Conservation

If a post has no hero image, omit `heroImage`/`heroAlt`. If a post body has additional `<style>` rules, move them inside the BlogLayout — they'll cascade because BlogLayout uses `is:global` for body styles.

- [ ] **Step 3: Verify each post in browser**

```bash
npm run dev
```

Visit `/blog/1`, `/blog/2`, `/blog/3`, `/blog/4`, `/blog/5`. Expected: each post renders with editorial layout — narrow centered column, drop cap on first paragraph, category-tinted heading, "← Back to writing" link at top going to `/blog`. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog/1.astro src/pages/blog/2.astro src/pages/blog/3.astro src/pages/blog/4.astro src/pages/blog/5.astro
git commit -m "feat(blog): migrate posts 1–5 to new BlogLayout"
```

---

### Task 31: Konami code easter egg (drifting shark)

**Files:**
- Create: `src/components/chrome/KonamiShark.tsx`
- Modify: `src/layouts/Layout.astro`

- [ ] **Step 1: Write `KonamiShark.tsx`**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/chrome/KonamiShark.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';

const SEQUENCE = [
  'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
  'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
  'b','a',
];

export default function KonamiShark() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);

  useEffect(() => {
    let progress = 0;
    function onKey(e: KeyboardEvent) {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === SEQUENCE[progress]) {
        progress++;
        if (progress === SEQUENCE.length) {
          setActive(true);
          progress = 0;
        }
      } else {
        progress = k === SEQUENCE[0] ? 1 : 0;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (reduced) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ x: '-30vw' }}
          animate={{ x: '110vw' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 9, ease: 'linear' }}
          onAnimationComplete={() => setActive(false)}
          style={{ position: 'fixed', top: '40vh', left: 0, zIndex: 50, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <svg width="220" height="80" viewBox="0 0 220 80" fill="none">
            {/* Stylized shark silhouette */}
            <path
              d="M10 50 C 50 20, 130 20, 170 44 L 195 30 L 200 44 L 215 38 L 205 56 L 200 60 L 175 56 C 150 70, 60 72, 10 50 Z"
              fill="rgba(0,0,0,0.85)"
            />
            <path d="M120 30 L 130 10 L 138 32" fill="rgba(0,0,0,0.85)" />
            <circle cx="40" cy="44" r="1.6" fill="white" />
            <path d="M22 50 L 14 56" stroke="rgba(0,0,0,0.85)" stroke-width="3" />
            <path d="M20 52 L 30 56" stroke="rgba(0,0,0,0.85)" stroke-width="2" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Mount globally in `Layout.astro`**

In `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/layouts/Layout.astro`, add:

```astro
import KonamiShark from '../components/chrome/KonamiShark.tsx';
...
<body>
  <MotionRoot client:load />
  <KonamiShark client:idle />
  <Nav />
  <slot />
</body>
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Open any page. Type the Konami sequence (↑↑↓↓←→←→ B A). Expected: a small shark silhouette swims across the viewport from left to right over ~9 seconds, then disappears. Sequence resets after each trigger. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/components/chrome/KonamiShark.tsx src/layouts/Layout.astro
git commit -m "feat(chrome): konami-code shark easter egg"
```

---

## Phase 6 — Contact + 404 (Tasks 32–33)

### Task 32: Contact page rewrite

**Files:**
- Modify: `src/pages/contact.astro`

- [ ] **Step 1: Read existing contact**

```bash
cat /Users/Rithvik/Dev/RM-Connected-V2-redesign/src/pages/contact.astro
```

(If it has form-handling JS, preserve the form action target — only the chrome and styling change.)

- [ ] **Step 2: Rewrite `contact.astro`**

Replace contents with:

```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Say hi — Rithvik Madhan" zone="sunlit" description="Get in touch.">
  <main class="pt-32 pb-32 min-h-screen flex items-center">
    <div class="container mx-auto px-6 max-w-2xl text-center">
      <p class="meta mb-4">Surface · Contact</p>
      <h1
        class="font-display font-light leading-[0.98] tracking-tightish"
        style="font-size: clamp(3rem, 8vw, 7rem); font-variation-settings: 'SOFT' 80, 'WONK' 0;"
      >
        Say hi.
      </h1>
      <p class="mt-6 text-base sm:text-lg" style="color: var(--d-fg-muted);">
        Email is the most reliable way to reach me. For everything else, the form below works too — replies come within a few days.
      </p>

      <form
        action="https://formspree.io/f/your-form-id"
        method="POST"
        class="mt-14 text-left grid grid-cols-1 gap-6"
      >
        <label class="grid gap-2">
          <span class="meta">Name</span>
          <input
            name="name"
            required
            type="text"
            class="bg-transparent border-b py-2 outline-none focus:border-[var(--d-accent)] transition-colors"
            style="border-color: var(--d-rule); color: var(--d-fg);"
          />
        </label>
        <label class="grid gap-2">
          <span class="meta">Email</span>
          <input
            name="email"
            required
            type="email"
            class="bg-transparent border-b py-2 outline-none focus:border-[var(--d-accent)] transition-colors"
            style="border-color: var(--d-rule); color: var(--d-fg);"
          />
        </label>
        <label class="grid gap-2">
          <span class="meta">Message</span>
          <textarea
            name="message"
            required
            rows="4"
            class="bg-transparent border-b py-2 outline-none focus:border-[var(--d-accent)] transition-colors resize-none"
            style="border-color: var(--d-rule); color: var(--d-fg);"
          ></textarea>
        </label>
        <button
          type="submit"
          class="send-btn justify-self-start mt-4 inline-flex items-center gap-3 font-sans tracking-widish uppercase text-sm py-2 group"
        >
          <span>Send</span>
          <svg width="32" height="10" viewBox="0 0 32 10" fill="none" aria-hidden="true">
            <path d="M2 5 Q 8 1, 14 5 T 26 5" stroke="currentColor" stroke-width="1.4" fill="none" />
            <path d="M22 1 L 30 5 L 22 9" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  </main>
</Layout>

<style>
  .send-btn { color: var(--d-fg); transition: color 300ms ease; }
  .send-btn:hover { color: var(--d-accent); }
  .send-btn svg path { transition: stroke 300ms ease; }
</style>
```

> ℹ️ Replace `https://formspree.io/f/your-form-id` with the existing form action from the previous contact page if one is set.

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Open `/contact`. Expected: sunlit palette, large "Say hi." Fraunces heading, three minimal underline-only fields, "Send" button with wave underline that highlights on hover. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/pages/contact.astro
git commit -m "feat(contact): rewrite as calm sunlit form"
```

---

### Task 33: 404 page — "Lost at sea"

**Files:**
- Create: `src/pages/404.astro`

- [ ] **Step 1: Write the 404**

Create `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/pages/404.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Lost at sea — 404" zone="abyss" description="You've drifted off the map.">
  <main class="min-h-screen flex items-center justify-center">
    <div class="container mx-auto px-6 max-w-xl text-center">
      <p class="meta mb-6 opacity-70">404 · Lost at sea</p>

      <svg
        width="80" height="120" viewBox="0 0 80 120"
        class="mx-auto buoy"
        fill="none" stroke-width="1.4" stroke-linecap="round"
        aria-hidden="true"
      >
        <line x1="40" y1="0" x2="40" y2="56" stroke="var(--d-fg-muted)" stroke-dasharray="2 4" />
        <ellipse cx="40" cy="68" rx="28" ry="20" fill="#D94B3A" stroke="none" />
        <rect x="12" y="66" width="56" height="4" fill="#fff" />
        <ellipse cx="40" cy="92" rx="32" ry="6" fill="rgba(255,255,255,0.18)" stroke="none" />
        <line x1="40" y1="48" x2="40" y2="56" stroke="var(--d-accent)" />
      </svg>

      <h1
        class="mt-10 font-display font-light leading-[1.02] tracking-tightish text-balance"
        style="font-size: clamp(2rem, 4.6vw, 3.4rem); font-variation-settings: 'SOFT' 80;"
      >
        You've drifted off the map.
      </h1>
      <p class="mt-4" style="color: var(--d-fg-muted);">
        There's nothing here but cold water.
      </p>
      <a
        href="/"
        class="mt-10 inline-flex items-center gap-3 meta hover:text-[var(--d-accent)] transition-colors"
      >
        <span>↑</span><span>Resurface</span>
      </a>
    </div>
  </main>
</Layout>

<style>
  .buoy {
    animation: bob 3.6s ease-in-out infinite;
  }
  @keyframes bob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(8px); }
  }
</style>
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Visit any unknown route, e.g. `http://localhost:4321/does-not-exist`. Expected: dark abyss palette, bobbing red buoy, "You've drifted off the map." headline, "↑ Resurface" link back home. Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat(404): lost-at-sea page with bobbing buoy"
```

---

## Phase 7 — Polish, performance, accessibility (Tasks 34–37)

### Task 34: Reduced-motion audit

**Files:** verification + targeted fixes

- [ ] **Step 1: Enable reduced-motion in DevTools**

Open Chrome DevTools → Rendering panel (`Cmd+Shift+P` → "Show Rendering"). Set "Emulate CSS media feature prefers-reduced-motion" to "reduce".

- [ ] **Step 2: Reload home**

```bash
npm run dev
```

Visit `http://localhost:4321` with reduced-motion enabled.

Expected:
- No CursorFish; system cursor visible.
- No caustics canvas (full-experience returns false).
- No bioluminescence canvas.
- Native scroll (Lenis disabled).
- Letter-rise on the name still happens (CSS animation, made instant by the reduced-motion CSS rule in `global.css`).
- Palette tokens snap per-zone instead of interpolating. Palette interpolation IS disabled because PaletteScroll's full-experience branch is false — verify this by scrolling: background should remain at sunlit (it stops updating).

If palette stays sunlit but text becomes unreadable in dark zones because the body isn't recoloring: that's a real issue. Fix by changing `PaletteScroll.client.tsx` to still snap to discrete zones under reduced motion. See Step 4.

- [ ] **Step 3: Verify all egg / cursor / WebGL components honor reduced-motion**

Run through this checklist with reduced-motion still on:
- [ ] CursorFish does not render
- [ ] Caustics canvas does not render
- [ ] Bioluminescence canvas does not render
- [ ] BuoyEgg button still clickable, animation does not run
- [ ] KonamiShark sequence still triggers, but the shark does not animate (component returns null when reduced)
- [ ] Lenis is not active (test: scrolling feels native)

- [ ] **Step 4 (only if needed): Make PaletteScroll snap discretely under reduced-motion**

If Step 2 revealed unreadable text in dark zones, modify `/Users/Rithvik/Dev/RM-Connected-V2-redesign/src/components/motion/PaletteScroll.client.tsx`:

Change the `if (full) { ... }` block. Replace the entire return body with:

```tsx
useEffect(() => {
  let raf = 0;
  function tick() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    if (full) {
      const pal = paletteAtProgress(p);
      const root = document.documentElement.style;
      root.setProperty('--d-bg', pal.bg);
      root.setProperty('--d-bg-2', pal.bg2);
      root.setProperty('--d-fg', pal.fg);
      root.setProperty('--d-fg-muted', pal.fgMuted);
      root.setProperty('--d-accent', pal.accent);
      root.setProperty('--d-accent-2', pal.accent2);
    } else {
      // Snap by zone instead of interpolating.
      const zone = ['sunlit','twilight','midnight','abyss','surface'][
        p > 0.92 ? 4 : p > 0.72 ? 3 : p > 0.45 ? 2 : p > 0.18 ? 1 : 0
      ];
      document.documentElement.dataset.zone = zone;
    }
    raf = 0;
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(tick); }
  tick();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', tick);
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', tick);
    if (raf) cancelAnimationFrame(raf);
  };
}, [full]);
```

Re-verify: with reduced motion, scroll past each zone — the body should snap to a new palette as you cross each boundary, no smooth interpolation but always readable.

- [ ] **Step 5: Commit (if changes were made)**

```bash
git add src/components/motion/PaletteScroll.client.tsx
git commit -m "fix(motion): snap palette by zone under reduced-motion"
```

(If no changes were needed, skip this commit.)

---

### Task 35: Mobile audit

**Files:** verification + targeted fixes

- [ ] **Step 1: Toggle to mobile viewport in DevTools**

Open `http://localhost:4321` and switch DevTools to a mobile preset (iPhone 12, 390×844).

- [ ] **Step 2: Walk the home page**

Expected:
- [ ] Hero name is readable, doesn't overflow horizontally
- [ ] CursorFish does not render (touch device — pointer is coarse)
- [ ] Twilight grid drops to single column
- [ ] Photos load lazily and don't blow out the layout
- [ ] Midnight post cards stack image-on-top, text-below
- [ ] Abyss achievements stack to single column
- [ ] Footer stacks to single column
- [ ] DepthMeter is hidden (`hidden md:flex` in `DepthMeter.tsx`)
- [ ] Bioluminescence renders with reduced particle count

- [ ] **Step 3: Walk other pages on mobile**

- [ ] `/blog` — featured hero stacks image above text, grid drops to 1 column
- [ ] `/blog/N` — body column has comfortable padding (the `px-6` on `reading-col` should handle this)
- [ ] `/contact` — form fits, no horizontal scroll
- [ ] `/404` — buoy + text fit centered
- [ ] Nav hamburger toggles menu

- [ ] **Step 4: Fix any layout issues found**

Common fixes:
- Horizontal scroll → add `overflow-x-hidden` to `<body>` in `Layout.astro`
- Text too large on mobile → check `clamp()` minimum values on display sizes
- Tap targets too small → ensure interactive elements are at least 44x44px

If fixes were applied, commit:

```bash
git add -A
git commit -m "fix(responsive): mobile layout adjustments"
```

---

### Task 36: Performance + bundle audit

**Files:** verification + targeted fixes

- [ ] **Step 1: Production build**

```bash
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign
npm run build
```

Expected: build succeeds with no errors. Note the dist size summary printed at the end.

- [ ] **Step 2: Inspect bundle sizes**

```bash
du -sh dist
ls -lah dist/_astro/*.js | sort -k 5 -h
```

Expected key bundles:
- Three.js chunk: < 200KB gzipped
- GSAP + Lenis chunk: < 80KB gzipped
- Initial page JS: < 80KB gzipped

If a chunk is over budget:
- Three.js → check that `Bioluminescence.client.tsx` and `Caustics.client.tsx` are using **only** `webgl` raw API, not high-level Three.js classes (revisit imports).
- GSAP → only `gsap` core + `ScrollTrigger` plugin should be imported, no other plugins.
- Initial JS → use `client:visible` or `client:idle` rather than `client:load` on heavy islands. Caustics and Bioluminescence should be `client:visible`. CursorFish must be `client:load` because the page-load reveal needs immediate availability — that's fine as it's tiny.

- [ ] **Step 3: Run Lighthouse on production preview**

```bash
npm run preview
```

In a separate terminal/Chrome, open `http://localhost:4321/` and run a Lighthouse audit (DevTools → Lighthouse panel → Mobile + Desktop, Performance + Accessibility + Best Practices + SEO).

Expected (per spec section 4.4):
- Desktop performance ≥ 90
- Mobile performance ≥ 80
- Accessibility = 100 (or document each violation)

- [ ] **Step 4: Fix any blockers**

Common issues + fixes:
- Largest Contentful Paint (LCP) on hero image → ensure Sunlit caustics have `loading="eager"` is unnecessary because they're shaders; the LCP element on home is likely the name text, which is typography-only.
- Cumulative Layout Shift (CLS) → make sure all `<img>` tags have explicit width/height OR the parent has `aspect-ratio`. Twilight grid uses `aspect-[4/3]` and `aspect-[3/4]` — verify those are enforced.
- Unused CSS → not a blocker if Tailwind is purging properly (verify `dist/_astro/*.css` is reasonable size, < 30KB).

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "perf: address Lighthouse findings (CLS, LCP)"
```

(Skip if no fixes were needed.)

---

### Task 37: Final pass + cleanup

**Files:** verification + tidy

- [ ] **Step 1: Verify worktree state**

```bash
cd /Users/Rithvik/Dev/RM-Connected-V2-redesign
git status
git log --oneline | head -50
```

Expected: clean working tree (no uncommitted changes), commit history reads as a coherent feature build.

- [ ] **Step 2: Verify the original repo is still pristine**

```bash
git -C /Users/Rithvik/Dev/RM-Connected-V2 status
git -C /Users/Rithvik/Dev/RM-Connected-V2 log --oneline | head -3
```

Expected: only the pre-existing `M src/pages/blog/1.astro` modification, last commit is still `Add new blog posts and remove read time`.

- [ ] **Step 3: Browser smoke test — full walk-through**

```bash
npm run dev
```

Walk through every route:
- [ ] `/` — full descent, all five zones, palette interpolates, depth meter, scroll progress, CursorFish on hero, caustics on hero, bioluminescence in midnight + abyss, kelp corners in abyss, footer with `©` egg
- [ ] `/blog` — editorial layout, filter works
- [ ] `/blog/1`, `/blog/2`, `/blog/3`, `/blog/4`, `/blog/5` — each renders, drop cap works, "Back to writing" returns to `/blog`
- [ ] `/contact` — sunlit form
- [ ] `/does-not-exist` — 404 page with bobbing buoy
- [ ] Konami code anywhere → shark drifts across

Stop server.

- [ ] **Step 4: Final commit (if any tweaks)**

```bash
git status
```

If clean: nothing to commit, you're done. If not:

```bash
git add -A
git commit -m "polish: final QA tweaks"
```

- [ ] **Step 5: Summary log**

```bash
git -C /Users/Rithvik/Dev/RM-Connected-V2-redesign log --oneline main..HEAD | wc -l
git -C /Users/Rithvik/Dev/RM-Connected-V2-redesign diff --stat main..HEAD | tail -5
```

This prints the number of commits on the redesign branch and the file/line totals. Useful for the eventual PR description.

---

## Done

The site has been redesigned in the `feat/ocean-redesign` branch in the worktree at `/Users/Rithvik/Dev/RM-Connected-V2-redesign`. Original main repo is untouched.

To merge when ready:
```bash
git -C /Users/Rithvik/Dev/RM-Connected-V2 merge feat/ocean-redesign --no-ff
```

To throw the worktree away:
```bash
git -C /Users/Rithvik/Dev/RM-Connected-V2 worktree remove ../RM-Connected-V2-redesign
git -C /Users/Rithvik/Dev/RM-Connected-V2 branch -D feat/ocean-redesign
```
