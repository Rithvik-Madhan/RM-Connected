import { useEffect, useRef } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';

interface Props {
  /** Max simultaneous bubbles. Default tuned for "just submerged" subtlety. */
  count?: number;
  /** 0..1 overall opacity scale. */
  opacity?: number;
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  /** Rise speed, px/s. Bigger bubbles rise faster — true underwater. */
  vy: number;
  wobbleAmp: number;
  wobbleFreq: number;
  phase: number;
  alpha: number;
}

/**
 * Sparse rising bubbles, sized to its parent container. Spawns below the
 * bottom edge, rises with sinusoidal wobble, fades out near the top — sells
 * the moment of slipping under the surface without demanding attention.
 */
export default function Bubbles({ count = 14, opacity = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const full = useFullExperience();

  useEffect(() => {
    if (!full) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const MAX = isMobile ? Math.ceil(count * 0.6) : count;
    let W = 0;
    let H = 0;
    let dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    const bubbles: Bubble[] = [];
    function spawn(initial = false): Bubble {
      const r = 1.5 + Math.pow(Math.random(), 1.8) * 6.5;
      return {
        x: Math.random() * W,
        // Initial fill scatters through the column; later spawns enter from below.
        y: initial ? Math.random() * H : H + r + Math.random() * H * 0.3,
        r,
        vy: 14 + r * 5 + Math.random() * 10,
        wobbleAmp: 3 + Math.random() * 9,
        wobbleFreq: 0.6 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.10 + Math.random() * 0.22,
      };
    }
    for (let i = 0; i < MAX; i++) bubbles.push(spawn(true));

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => { visible = entries[0]?.isIntersecting ?? false; },
      { threshold: 0 },
    );
    io.observe(canvas);

    let raf = 0;
    let last = performance.now();
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;

      ctx!.clearRect(0, 0, W, H);
      const t = now / 1000;

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        b.y -= b.vy * dt;
        if (b.y < -b.r * 2) {
          bubbles[i] = spawn();
          continue;
        }
        const x = b.x + Math.sin(t * b.wobbleFreq + b.phase) * b.wobbleAmp;
        // Fade out over the top 18% of the column.
        const fade = Math.min(1, Math.max(0, b.y / (H * 0.18)));
        const a = b.alpha * fade * opacity;
        if (a <= 0.004) continue;

        // Shell: bubbles are visible as a bright rim, not a filled disc.
        ctx!.beginPath();
        ctx!.arc(x, b.y, b.r, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(225, 244, 255, ${a})`;
        ctx!.lineWidth = Math.max(0.75, b.r * 0.18);
        ctx!.stroke();
        // Faint interior sheen.
        ctx!.fillStyle = `rgba(225, 244, 255, ${a * 0.18})`;
        ctx!.fill();
        // Specular highlight, upper-left — light comes from the surface.
        ctx!.beginPath();
        ctx!.arc(x - b.r * 0.32, b.y - b.r * 0.36, b.r * 0.22, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${a * 1.6})`;
        ctx!.fill();
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [full, count, opacity]);

  if (!full) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
