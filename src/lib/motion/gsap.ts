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
