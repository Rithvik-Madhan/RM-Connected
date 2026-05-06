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
