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
