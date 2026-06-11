import { useEffect, useRef } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';
import { emitDisturbance } from '../../lib/motion/disturbance';

interface Props {
  /**
   * silhouette — small schools passing through sunlit blue water.
   * lantern    — solitary deep-sea fish with glowing photophores.
   */
  variant?: 'silhouette' | 'lantern';
  /** Average seconds between spawn events. */
  spawnEvery?: number;
}

interface Fish {
  x: number;
  y: number;
  baseY: number;
  dir: 1 | -1;
  /** Body length in px. */
  size: number;
  speed: number;
  /** 0.45..1 — far fish are smaller, slower, fainter. */
  depth: number;
  phase: number;
  driftAmp: number;
  driftFreq: number;
  lastEmit: number;
}

/**
 * Occasional fish crossing the section — schools of silhouettes in the
 * twilight, lone glowing lanternfish further down. Fish emit into the
 * shared disturbance bus, so deep-zone plankton flash as they pass.
 */
export default function AmbientFish({ variant = 'silhouette', spawnEvery = 14 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const full = useFullExperience();

  useEffect(() => {
    if (!full) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width = Math.max(2, Math.round(W * dpr));
      canvas!.height = Math.max(2, Math.round(H * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const isMobile = window.innerWidth < 768;
    const fish: Fish[] = [];

    function makeFish(dir: 1 | -1, baseY: number, depth: number, size: number, speed: number): Fish {
      return {
        x: dir === 1 ? -size * 1.5 : W + size * 1.5,
        y: baseY,
        baseY,
        dir,
        size,
        speed,
        depth,
        phase: Math.random() * Math.PI * 2,
        driftAmp: 8 + Math.random() * 18,
        driftFreq: 0.15 + Math.random() * 0.2,
        lastEmit: 0,
      };
    }

    function spawnEvent() {
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const depth = 0.45 + Math.random() * 0.55;
      const baseY = H * (0.12 + Math.random() * 0.7);
      if (variant === 'silhouette') {
        // A loose school: shared heading, individual jitter.
        const n = (isMobile ? 2 : 3) + Math.floor(Math.random() * (isMobile ? 2 : 4));
        const size = (26 + Math.random() * 22) * depth;
        const speed = (34 + Math.random() * 26) * depth;
        for (let i = 0; i < n; i++) {
          const f = makeFish(
            dir,
            baseY + (Math.random() - 0.5) * size * 4,
            depth * (0.9 + Math.random() * 0.2),
            size * (0.8 + Math.random() * 0.4),
            speed * (0.92 + Math.random() * 0.16),
          );
          f.x -= dir * i * (size * (1.2 + Math.random()));
          fish.push(f);
        }
      } else {
        const size = (34 + Math.random() * 26) * depth;
        fish.push(makeFish(dir, baseY, depth, size, (22 + Math.random() * 16) * depth));
      }
    }

    function drawFish(f: Fish, t: number) {
      const sw = Math.sin(t * (3.2 + f.speed * 0.04) + f.phase);
      const s = f.size;
      ctx!.save();
      ctx!.translate(f.x, f.y);
      ctx!.scale(f.dir, 1);

      const silhouette = variant === 'silhouette';
      const bodyAlpha = silhouette
        ? 0.34 * f.depth
        : 0.22 * f.depth;
      const bodyColor = silhouette
        ? `rgba(9, 26, 40, ${bodyAlpha})`
        : `rgba(150, 180, 205, ${bodyAlpha})`;

      // Body: teardrop with a gently swinging rear half.
      ctx!.beginPath();
      ctx!.moveTo(s * 0.5, 0);
      ctx!.quadraticCurveTo(s * 0.18, -s * 0.20, -s * 0.22, -s * 0.07 + sw * s * 0.02);
      ctx!.quadraticCurveTo(-s * 0.38, -s * 0.025 + sw * s * 0.035, -s * 0.44, sw * s * 0.05);
      ctx!.quadraticCurveTo(-s * 0.38, s * 0.025 + sw * s * 0.035, -s * 0.22, s * 0.07 + sw * s * 0.02);
      ctx!.quadraticCurveTo(s * 0.18, s * 0.20, s * 0.5, 0);
      ctx!.fillStyle = bodyColor;
      ctx!.fill();

      // Tail fin, sweeping opposite the body's bend.
      const tx = -s * 0.44;
      const ty = sw * s * 0.05;
      ctx!.beginPath();
      ctx!.moveTo(tx, ty);
      ctx!.quadraticCurveTo(tx - s * 0.14, ty - s * 0.13 - sw * s * 0.07, tx - s * 0.22, ty - s * 0.11 - sw * s * 0.09);
      ctx!.quadraticCurveTo(tx - s * 0.10, ty - sw * s * 0.05, tx - s * 0.22, ty + s * 0.11 - sw * s * 0.09);
      ctx!.quadraticCurveTo(tx - s * 0.14, ty + s * 0.13 - sw * s * 0.07, tx, ty);
      ctx!.fillStyle = bodyColor;
      ctx!.fill();

      // Dorsal fin.
      ctx!.beginPath();
      ctx!.moveTo(s * 0.08, -s * 0.14);
      ctx!.quadraticCurveTo(-s * 0.06, -s * 0.30, -s * 0.16, -s * 0.10);
      ctx!.closePath();
      ctx!.fill();

      if (!silhouette) {
        // Photophores: a row of cyan lights along the lower flank.
        const glow = 0.55 * f.depth;
        ctx!.fillStyle = `rgba(110, 220, 255, ${glow})`;
        ctx!.shadowColor = 'rgba(110, 220, 255, 0.9)';
        ctx!.shadowBlur = s * 0.12;
        for (let i = 0; i < 5; i++) {
          const px = s * (0.30 - i * 0.16);
          ctx!.beginPath();
          ctx!.arc(px, s * 0.085, s * 0.022, 0, Math.PI * 2);
          ctx!.fill();
        }
        // Eye-light near the head.
        ctx!.beginPath();
        ctx!.arc(s * 0.36, -s * 0.02, s * 0.035, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(170, 240, 255, ${0.8 * f.depth})`;
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      ctx!.restore();
    }

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => { visible = entries[0]?.isIntersecting ?? false; },
      { threshold: 0 },
    );
    io.observe(canvas);

    // First school shows up shortly after the zone comes into view, so the
    // moment of arrival doesn't go unrewarded; afterwards spawns are sparse.
    let nextSpawn = performance.now() + 1800 + Math.random() * 1500;
    let raf = 0;
    let last = performance.now();
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) {
        // Push spawn schedule along so fish don't pile up offscreen.
        if (now > nextSpawn) nextSpawn = now + 1000;
        return;
      }

      if (now > nextSpawn) {
        spawnEvent();
        nextSpawn = now + (spawnEvery * 0.6 + Math.random() * spawnEvery * 0.9) * 1000;
      }

      ctx!.clearRect(0, 0, W, H);
      const t = now / 1000;
      const rect = canvas!.getBoundingClientRect();

      for (let i = fish.length - 1; i >= 0; i--) {
        const f = fish[i];
        f.x += f.dir * f.speed * dt;
        f.y = f.baseY + Math.sin(t * f.driftFreq + f.phase) * f.driftAmp;
        if ((f.dir === 1 && f.x > W + f.size * 2) || (f.dir === -1 && f.x < -f.size * 2)) {
          fish.splice(i, 1);
          continue;
        }
        drawFish(f, t);

        // Agitate plankton along the path (head position, client coords).
        if (now - f.lastEmit > 140) {
          f.lastEmit = now;
          emitDisturbance(
            rect.left + f.x + f.dir * f.size * 0.4,
            rect.top + f.y,
            0.6 * f.depth,
            620,
          );
        }
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [full, variant, spawnEvery]);

  if (!full) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
