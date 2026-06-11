import { useEffect } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';
import { gsap, ScrollTrigger, setupGsap } from '../../lib/motion/gsap';

/**
 * The page's 3D pass, driven by data attributes:
 *
 *   data-depth="0.2"  — decorative layer drifts vertically against scroll
 *                       at 20% of a viewport-crossing; positive = closer
 *                       (moves more), negative = recedes.
 *   data-dolly        — headings dolly in: scale + rise + fade as they
 *                       enter, like surfacing toward the camera.
 *   data-tilt         — cards tilt in 3D toward the cursor on hover.
 */
export default function DepthFx() {
  const full = useFullExperience();

  useEffect(() => {
    if (!full) return;
    setupGsap();

    const killers: Array<() => void> = [];

    // -- Scroll-depth layers --
    document.querySelectorAll<HTMLElement>('[data-depth]').forEach((el) => {
      const d = parseFloat(el.dataset.depth || '0');
      if (!d) return;
      const tween = gsap.fromTo(
        el,
        { y: d * 130 },
        {
          y: -d * 130,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('section') || el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
      killers.push(() => { tween.scrollTrigger?.kill(); tween.kill(); });
    });

    // -- Dolly-in headings --
    document.querySelectorAll<HTMLElement>('[data-dolly]').forEach((el) => {
      const tween = gsap.fromTo(
        el,
        { scale: 0.95, y: 42, autoAlpha: 0 },
        {
          scale: 1,
          y: 0,
          autoAlpha: 1,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
            toggleActions: 'play none none reverse',
          },
        },
      );
      killers.push(() => { tween.scrollTrigger?.kill(); tween.kill(); });
    });

    // -- Pointer tilt on cards (desktop only) --
    if (!matchMedia('(pointer: coarse)').matches) {
      document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
        function onMove(e: PointerEvent) {
          const r = el.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(el, {
            rotationX: -ny * 7,
            rotationY: nx * 9,
            scale: 1.015,
            transformPerspective: 950,
            duration: 0.45,
            ease: 'power2.out',
          });
        }
        function onLeave() {
          gsap.to(el, { rotationX: 0, rotationY: 0, scale: 1, duration: 0.8, ease: 'power3.out' });
        }
        el.addEventListener('pointermove', onMove, { passive: true });
        el.addEventListener('pointerleave', onLeave);
        killers.push(() => {
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerleave', onLeave);
          gsap.set(el, { clearProps: 'transform' });
        });
      });
    }

    ScrollTrigger.refresh();
    return () => { for (const k of killers) k(); };
  }, [full]);

  return null;
}
