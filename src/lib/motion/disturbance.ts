/**
 * Shared disturbance bus: anything moving through the water (cursor, fish)
 * emits points here, and the bioluminescence shader brightens plankton
 * around them — the way dinoflagellates flash when agitated.
 *
 * Coordinates are viewport/client space (like clientX/clientY); consumers
 * convert into their own canvas space.
 */
export interface Disturbance {
  cx: number;
  cy: number;
  /** 0..1 peak brightness contribution. */
  strength: number;
  born: number;
  /** Lifetime in ms before the flash fully decays. */
  life: number;
}

const MAX_ACTIVE = 24;
const active: Disturbance[] = [];

export function emitDisturbance(cx: number, cy: number, strength = 1, life = 520): void {
  if (active.length >= MAX_ACTIVE) active.shift();
  active.push({ cx, cy, strength, born: performance.now(), life });
}

/** Prunes dead entries and returns the live list. */
export function activeDisturbances(now: number): Disturbance[] {
  while (active.length && now - active[0].born > active[0].life) active.shift();
  return active;
}
