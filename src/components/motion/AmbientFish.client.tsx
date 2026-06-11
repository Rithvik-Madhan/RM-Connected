import { useEffect, useRef } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';
import { emitImpulse } from '../../lib/motion/disturbance';

interface Props {
  /**
   * silhouette — small schools passing through sunlit blue water.
   * lantern    — solitary deep-sea fish with glowing photophores.
   */
  variant?: 'silhouette' | 'lantern';
  /** Average seconds between spawn events. */
  spawnEvery?: number;
  /** Allow a rare whale to glide through, far in the background. */
  giant?: boolean;
}

interface Fish {
  kind: 'fish' | 'whale';
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
export default function AmbientFish({ variant = 'silhouette', spawnEvery = 14, giant = false }: Props) {
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

    function makeFish(dir: 1 | -1, baseY: number, depth: number, size: number, speed: number, kind: 'fish' | 'whale' = 'fish'): Fish {
      // Whales are huge and slow — spawn with the nose near the edge so the
      // pass actually happens while someone is watching.
      const off = kind === 'whale' ? size * 0.55 : size * 1.5;
      return {
        kind,
        x: dir === 1 ? -off : W + off,
        y: baseY,
        baseY,
        dir,
        size,
        speed,
        depth,
        phase: Math.random() * Math.PI * 2,
        driftAmp: kind === 'whale' ? 20 + Math.random() * 14 : 8 + Math.random() * 18,
        driftFreq: kind === 'whale' ? 0.08 + Math.random() * 0.06 : 0.15 + Math.random() * 0.2,
        lastEmit: 0,
      };
    }

    function spawnWhale() {
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const size = 380 + Math.random() * 220;
      fish.push(makeFish(dir, H * (0.18 + Math.random() * 0.4), 0.5, size, 16 + Math.random() * 8, 'whale'));
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

    function drawWhale(f: Fish, t: number) {
      // Slow vertical fluke beat — whales swim with an up-down stroke.
      const fl = Math.sin(t * 1.4 + f.phase);
      const s = f.size;
      ctx!.save();
      ctx!.translate(f.x, f.y);
      ctx!.scale(f.dir, 1);
      // Far away: soft-edged and faint. In dark zones the body reads as a
      // shape slightly lighter than the water, lit from the surface.
      ctx!.filter = 'blur(2px)';
      const a = variant === 'silhouette' ? 0.22 : 0.12;
      const color = variant === 'silhouette'
        ? `rgba(10, 28, 42, ${a})`
        : `rgba(140, 172, 198, ${a})`;
      ctx!.fillStyle = color;

      // Body: blunt head, long back, tapering peduncle.
      ctx!.beginPath();
      ctx!.moveTo(s * 0.50, -s * 0.004);
      ctx!.quadraticCurveTo(s * 0.34, -s * 0.088, s * 0.06, -s * 0.088);
      ctx!.quadraticCurveTo(-s * 0.20, -s * 0.080, -s * 0.42, -s * 0.016 + fl * s * 0.014);
      ctx!.lineTo(-s * 0.47, fl * s * 0.022);
      ctx!.quadraticCurveTo(-s * 0.24, s * 0.058 + fl * s * 0.010, s * 0.04, s * 0.080);
      ctx!.quadraticCurveTo(s * 0.36, s * 0.078, s * 0.50, -s * 0.004);
      ctx!.fill();

      // Dorsal hump.
      ctx!.beginPath();
      ctx!.moveTo(-s * 0.10, -s * 0.082);
      ctx!.quadraticCurveTo(-s * 0.14, -s * 0.122, -s * 0.20, -s * 0.078);
      ctx!.closePath();
      ctx!.fill();

      // Pectoral fin sweeping below the body.
      ctx!.beginPath();
      ctx!.moveTo(s * 0.20, s * 0.045);
      ctx!.quadraticCurveTo(s * 0.10, s * 0.16, -s * 0.02, s * 0.185);
      ctx!.quadraticCurveTo(s * 0.07, s * 0.10, s * 0.13, s * 0.052);
      ctx!.closePath();
      ctx!.fill();

      // Fluke: two lobes sweeping vertically with the beat.
      const rx = -s * 0.47;
      const ry = fl * s * 0.022;
      const sweep = fl * s * 0.06;
      ctx!.beginPath();
      ctx!.moveTo(rx, ry);
      ctx!.quadraticCurveTo(rx - s * 0.06, ry - s * 0.050 + sweep, rx - s * 0.135, ry - s * 0.085 + sweep * 1.4);
      ctx!.quadraticCurveTo(rx - s * 0.045, ry + sweep * 0.4, rx - s * 0.135, ry + s * 0.085 + sweep * 1.4);
      ctx!.quadraticCurveTo(rx - s * 0.06, ry + s * 0.050 + sweep, rx, ry);
      ctx!.fill();

      ctx!.filter = 'none';
      ctx!.restore();
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
    // The whale takes its time: one pass a little while into the visit,
    // then only every minute or two.
    let nextWhale = performance.now() + 12000 + Math.random() * 10000;
    let raf = 0;
    let last = performance.now();
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) {
        // Push spawn schedules along so fish don't pile up offscreen.
        if (now > nextSpawn) nextSpawn = now + 1000;
        if (now > nextWhale) nextWhale = now + 5000;
        return;
      }

      if (now > nextSpawn) {
        spawnEvent();
        nextSpawn = now + (spawnEvery * 0.6 + Math.random() * spawnEvery * 0.9) * 1000;
      }
      if (giant && now > nextWhale) {
        if (!fish.some((f) => f.kind === 'whale')) spawnWhale();
        nextWhale = now + 70000 + Math.random() * 50000;
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
        if (f.kind === 'whale') drawWhale(f, t);
        else drawFish(f, t);

        // Push water along the swim path — plankton glow in the wake.
        if (now - f.lastEmit > (f.kind === 'whale' ? 200 : 140)) {
          f.lastEmit = now;
          emitImpulse({
            cx: rect.left + f.x + f.dir * f.size * 0.4,
            cy: rect.top + f.y,
            vx: f.dir * f.speed * (f.kind === 'whale' ? 5 : 2.4),
            vy: 0,
            strength: (f.kind === 'whale' ? 1.0 : 0.7) * f.depth,
            radius: f.kind === 'whale' ? f.size * 0.5 : f.size * 1.1,
          });
        }
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [full, variant, spawnEvery, giant]);

  if (!full) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
