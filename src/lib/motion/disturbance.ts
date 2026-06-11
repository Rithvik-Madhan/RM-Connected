/**
 * Shared impulse bus: anything moving through the water (fish, whales)
 * pushes on it, and every listening water simulation folds those pushes
 * into its velocity field — plankton then swirl and flash in the wake.
 *
 * Positions are viewport/client space (like clientX/clientY) with y-down
 * velocities; consumers convert into their own simulation space.
 */
export interface Impulse {
  cx: number;
  cy: number;
  /** Velocity in client px/s (y-down, like screen coordinates). */
  vx: number;
  vy: number;
  /** 0..1 multiplier applied by consumers. */
  strength: number;
  /** Splat radius in px. */
  radius: number;
}

const buffers = new Map<symbol, Impulse[]>();

/** Each consumer gets its own queue so multiple simulations can coexist. */
export function createImpulseDrain(): { drain: () => Impulse[]; dispose: () => void } {
  const key = Symbol('impulse-drain');
  buffers.set(key, []);
  return {
    drain() {
      const buf = buffers.get(key);
      if (!buf || buf.length === 0) return [];
      buffers.set(key, []);
      return buf;
    },
    dispose() {
      buffers.delete(key);
    },
  };
}

export function emitImpulse(impulse: Impulse): void {
  for (const buf of buffers.values()) {
    buf.push(impulse);
    if (buf.length > 64) buf.shift();
  }
}
