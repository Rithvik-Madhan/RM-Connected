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
