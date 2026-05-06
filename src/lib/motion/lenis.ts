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
