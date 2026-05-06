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
