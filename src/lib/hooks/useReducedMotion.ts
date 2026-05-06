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
