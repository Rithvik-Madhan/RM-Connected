export type DepthZone = 'sunlit' | 'twilight' | 'midnight' | 'abyss' | 'surface';

/** Each zone occupies a fraction of total scroll progress on home. Order matters. */
export const ZONE_BOUNDS: Array<{ zone: DepthZone; end: number; depthM: number }> = [
  { zone: 'sunlit',   end: 0.18, depthM: 200   },
  { zone: 'twilight', end: 0.45, depthM: 1000  },
  { zone: 'midnight', end: 0.72, depthM: 4000  },
  { zone: 'abyss',    end: 0.92, depthM: 6000  },
  { zone: 'surface',  end: 1.00, depthM: 0     },
];

export function zoneAtProgress(p: number): DepthZone {
  for (const b of ZONE_BOUNDS) {
    if (p <= b.end) return b.zone;
  }
  return 'surface';
}

/**
 * Map scroll progress 0..1 to a meters reading.
 * Sunlit/Twilight/Midnight/Abyss interpolate down; Surface interpolates back to 0.
 */
export function depthAtProgress(p: number): number {
  let prevEnd = 0;
  let prevDepth = 0;
  for (const b of ZONE_BOUNDS) {
    if (p <= b.end) {
      const local = (p - prevEnd) / Math.max(b.end - prevEnd, 1e-6);
      return Math.round(prevDepth + (b.depthM - prevDepth) * local);
    }
    prevEnd = b.end;
    prevDepth = b.depthM;
  }
  return 0;
}

/** Linear interpolation between two hex colors in OKLCH-like perceptual space.
 * For simplicity here we use sRGB linear-light interpolation; CSS color-mix
 * handles the polished case in tokens.css. */
function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return [r, g, b];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
export function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/** Palette per zone — must match tokens.css [data-zone="…"] blocks. */
export const ZONE_PALETTES: Record<DepthZone, {
  bg: string; bg2: string; fg: string; fgMuted: string; accent: string; accent2: string;
}> = {
  sunlit:   { bg: '#A6DDF0', bg2: '#E8F6FB', fg: '#062538', fgMuted: '#2C4A60', accent: '#F4D27A', accent2: '#7BD8E0' },
  twilight: { bg: '#1B5E7E', bg2: '#0E3F58', fg: '#E8F1F5', fgMuted: '#B6C9D4', accent: '#7BD8E0', accent2: '#F4D27A' },
  midnight: { bg: '#0A1628', bg2: '#06101D', fg: '#D6DCE5', fgMuted: '#8A95A6', accent: '#7BFFB1', accent2: '#F4D27A' },
  abyss:    { bg: '#03060B', bg2: '#03060B', fg: '#E0DAC8', fgMuted: '#8A8473', accent: '#7BFFB1', accent2: '#F4D27A' },
  surface:  { bg: '#F4EDE0', bg2: '#FAF6EE', fg: '#1A1410', fgMuted: '#4A3F36', accent: '#F4D27A', accent2: '#7BD8E0' },
};

export function paletteAtProgress(p: number) {
  let prevEnd = 0;
  let prevZone: DepthZone = 'sunlit';
  for (const b of ZONE_BOUNDS) {
    if (p <= b.end) {
      const local = (p - prevEnd) / Math.max(b.end - prevEnd, 1e-6);
      const a = ZONE_PALETTES[prevZone];
      const c = ZONE_PALETTES[b.zone];
      return {
        bg:      lerpHex(a.bg,      c.bg,      local),
        bg2:     lerpHex(a.bg2,     c.bg2,     local),
        fg:      lerpHex(a.fg,      c.fg,      local),
        fgMuted: lerpHex(a.fgMuted, c.fgMuted, local),
        accent:  lerpHex(a.accent,  c.accent,  local),
        accent2: lerpHex(a.accent2, c.accent2, local),
      };
    }
    prevEnd = b.end;
    prevZone = b.zone;
  }
  return ZONE_PALETTES.surface;
}
