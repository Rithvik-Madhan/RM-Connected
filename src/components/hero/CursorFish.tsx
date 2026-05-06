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
