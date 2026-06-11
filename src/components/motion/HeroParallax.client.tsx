import { useEffect } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';

/**
 * Pointer-driven depth for the hero scene. Any element inside #zone-sunlit
 * with data-plx="<px>" drifts toward (positive) or against (negative) the
 * cursor by that many pixels at full deflection — far layers move more,
 * foreground content counters slightly, and the flat backdrop becomes a
 * scene with depth.
 */
export default function HeroParallax() {
  const full = useFullExperience();

  useEffect(() => {
    if (!full) return;
    if (matchMedia('(pointer: coarse)').matches) return;
    const zone = document.getElementById('zone-sunlit');
    if (!zone) return;
    const layers = Array.from(zone.querySelectorAll<HTMLElement>('[data-plx]')).map((el) => ({
      el,
      f: parseFloat(el.dataset.plx || '0'),
    }));
    if (!layers.length) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    function onMove(e: PointerEvent) {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener('pointermove', onMove, { passive: true });

    let raf = 0;
    let running = true;
    const io = new IntersectionObserver(
      (entries) => { running = entries[0]?.isIntersecting ?? false; },
      { threshold: 0 },
    );
    io.observe(zone);

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      // Critically-damped-ish ease; slow enough to feel like mass.
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      for (const { el, f } of layers) {
        el.style.transform = `translate3d(${(cx * f).toFixed(2)}px, ${(cy * f * 0.55).toFixed(2)}px, 0)`;
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      for (const { el } of layers) el.style.transform = '';
    };
  }, [full]);

  return null;
}
