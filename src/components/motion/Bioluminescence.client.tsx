import { useEffect, useRef } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';
import { createImpulseDrain } from '../../lib/motion/disturbance';

interface Props {
  /** 0..1 — controls particle density. Midnight ~0.4, Abyss ~1.0. */
  intensity?: number;
}

// Coarse velocity field over the viewport. Water you can push.
const GW = 40;
const GH = 24;

const VERT = `
attribute vec2 position;
attribute float aSeed;
attribute float aZ;
attribute float aBoost;
uniform float uTime;
uniform vec2  uRes;
uniform vec2  uViewport;
uniform float uIntensity;
uniform vec2  uParallax;
varying float vSeed;
varying float vAlpha;
varying float vBoost;
varying float vFlare;
void main() {
  vSeed = aSeed;
  vBoost = aBoost;

  // Rare slow flare: each mote occasionally swells bright for a few seconds —
  // the loner dinoflagellate firing on its own.
  vFlare = pow(0.5 + 0.5 * sin(uTime * (0.05 + fract(aSeed * 3.0) * 0.09) + aSeed * 100.0), 32.0);

  // Pointer parallax: far motes (small z) trail the cursor more, giving the
  // field real depth instead of a flat scatter.
  vec2 p = position + uParallax * (1.0 - aZ) * 42.0;

  gl_Position = vec4(p / (uViewport * 0.5), 0.0, 1.0);
  // Size skews small, scales with depth (near = bigger), swells on flare.
  gl_PointSize = (2.0 + pow(fract(aSeed * 31.0), 1.6) * 6.0)
    * uIntensity * mix(0.55, 1.2, aZ) * (uRes.y / 600.0)
    * (1.0 + vFlare * 0.8 + aBoost * 0.35);
  // Twinkle at per-mote frequency, dimmer when farther away.
  vAlpha = (0.7 + 0.3 * (0.5 + 0.5 * sin(uTime * (0.8 + fract(aSeed * 5.0) * 1.4) + aSeed * 9.0)))
    * mix(0.45, 1.0, aZ);
}
`;

const FRAG = `
precision highp float;
varying float vSeed;
varying float vAlpha;
varying float vBoost;
varying float vFlare;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  // Mostly dinoflagellate cyan-blue, some green (site accent), rare warm gold.
  vec3 blue  = vec3(0.30, 0.75, 0.98);
  vec3 green = vec3(0.48, 1.0, 0.69);  // #7BFFB1
  vec3 warm  = vec3(0.96, 0.82, 0.48); // #F4D27A
  float pick = fract(vSeed * 7.0);
  vec3 col = pick < 0.55 ? blue : (pick < 0.88 ? green : warm);
  // Flaring motes whiten toward pale cyan.
  col = mix(col, vec3(0.78, 0.95, 1.0), vFlare * 0.8);
  // Agitated water makes plankton surge electric blue.
  col = mix(col, vec3(0.18, 0.42, 1.0), clamp(vBoost * 0.9, 0.0, 0.9));
  float a = pow(1.0 - d * 2.0, 1.9) * vAlpha * (1.0 + vBoost * 1.6 + vFlare * 2.2);
  gl_FragColor = vec4(col, a);
}
`;

/**
 * Bioluminescent plankton in water that actually moves. Particles ride a
 * coarse velocity field; the cursor stirs it, clicks splash it, scrolling
 * streams it past, fish wakes push it — and motes flash electric blue in
 * proportion to how hard the water around them is being agitated, the way
 * real dinoflagellates fire under shear.
 */
export default function Bioluminescence({ intensity = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const full = useFullExperience();

  useEffect(() => {
    if (!full) return;
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) console.error(gl!.getShaderInfoLog(s));
      return s;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const isMobile = window.innerWidth < 768;
    const COUNT = Math.round((isMobile ? 280 : 1100) * intensity);

    // Particle state lives on the CPU now — positions advect through the
    // flow field each frame and re-upload (a 1100-particle copy is cheap).
    let VW = window.innerWidth;   // particle space extents (CSS px)
    let VH = window.innerHeight;
    const pos    = new Float32Array(COUNT * 2);
    const seeds  = new Float32Array(COUNT);
    const zs     = new Float32Array(COUNT);
    const boosts = new Float32Array(COUNT);
    const drift  = new Float32Array(COUNT);  // upward base speed px/s
    for (let i = 0; i < COUNT; i++) {
      pos[i * 2 + 0] = (Math.random() - 0.5) * VW;
      pos[i * 2 + 1] = (Math.random() - 0.5) * VH;
      seeds[i] = Math.random();
      zs[i] = 0.35 + Math.pow(Math.random(), 1.4) * 0.65;
      drift[i] = 5 + Math.random() * 9;
    }

    function makeBuffer(data: Float32Array, attr: string, size: number, dynamic = false) {
      const buf = gl!.createBuffer();
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
      gl!.bufferData(gl!.ARRAY_BUFFER, data, dynamic ? gl!.DYNAMIC_DRAW : gl!.STATIC_DRAW);
      const loc = gl!.getAttribLocation(prog, attr);
      gl!.enableVertexAttribArray(loc);
      gl!.vertexAttribPointer(loc, size, gl!.FLOAT, false, 0, 0);
      return buf;
    }
    const posBuf = makeBuffer(pos, 'position', 2, true);
    makeBuffer(seeds, 'aSeed', 1);
    makeBuffer(zs, 'aZ', 1);
    const boostBuf = makeBuffer(boosts, 'aBoost', 1, true);

    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uRes  = gl.getUniformLocation(prog, 'uRes');
    const uView = gl.getUniformLocation(prog, 'uViewport');
    const uInt  = gl.getUniformLocation(prog, 'uIntensity');
    const uPar  = gl.getUniformLocation(prog, 'uParallax');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      VW = window.innerWidth;
      VH = window.innerHeight;
      canvas!.width = VW * dpr;
      canvas!.height = VH * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener('resize', resize);

    // ---- Velocity field ----
    const fvx = new Float32Array(GW * GH);
    const fvy = new Float32Array(GW * GH);
    const tmpx = new Float32Array(GW * GH);
    const tmpy = new Float32Array(GW * GH);

    /** Splat a velocity impulse into the field. Particle-space coords (+y up). */
    function splat(px: number, py: number, vx: number, vy: number, radius: number) {
      // Map particle space (origin center) to grid indices.
      const gx = ((px + VW / 2) / VW) * GW;
      const gy = ((py + VH / 2) / VH) * GH;
      const gr = Math.max(1.5, (radius / VW) * GW);
      const x0 = Math.max(0, Math.floor(gx - gr * 2));
      const x1 = Math.min(GW - 1, Math.ceil(gx + gr * 2));
      const y0 = Math.max(0, Math.floor(gy - gr * 2));
      const y1 = Math.min(GH - 1, Math.ceil(gy + gr * 2));
      for (let yy = y0; yy <= y1; yy++) {
        for (let xx = x0; xx <= x1; xx++) {
          const dx = xx - gx;
          const dy = yy - gy;
          const w = Math.exp(-(dx * dx + dy * dy) / (gr * gr));
          const idx = yy * GW + xx;
          fvx[idx] += vx * w;
          fvy[idx] += vy * w;
        }
      }
    }

    /** Bilinear sample of the field at a particle-space point. */
    function sample(px: number, py: number, out: { x: number; y: number }) {
      const gx = Math.min(GW - 1.001, Math.max(0, ((px + VW / 2) / VW) * GW - 0.5));
      const gy = Math.min(GH - 1.001, Math.max(0, ((py + VH / 2) / VH) * GH - 0.5));
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = gx - x0;
      const fy = gy - y0;
      const i00 = y0 * GW + x0;
      const i10 = i00 + 1;
      const i01 = i00 + GW;
      const i11 = i01 + 1;
      out.x = (fvx[i00] * (1 - fx) + fvx[i10] * fx) * (1 - fy) + (fvx[i01] * (1 - fx) + fvx[i11] * fx) * fy;
      out.y = (fvy[i00] * (1 - fx) + fvy[i10] * fx) * (1 - fy) + (fvy[i01] * (1 - fx) + fvy[i11] * fx) * fy;
    }

    function stepField(dt: number) {
      const decay = Math.exp(-dt * 1.7);
      // One neighbor-mix pass spreads momentum outward — a poor man's
      // diffusion that makes pushes bloom like swirls instead of staying
      // as hard-edged stamps.
      for (let y = 0; y < GH; y++) {
        for (let x = 0; x < GW; x++) {
          const i = y * GW + x;
          const xm = x > 0 ? i - 1 : i;
          const xp = x < GW - 1 ? i + 1 : i;
          const ym = y > 0 ? i - GW : i;
          const yp = y < GH - 1 ? i + GW : i;
          tmpx[i] = (fvx[i] * 0.72 + (fvx[xm] + fvx[xp] + fvx[ym] + fvx[yp]) * 0.07) * decay;
          tmpy[i] = (fvy[i] * 0.72 + (fvy[xm] + fvy[xp] + fvy[ym] + fvy[yp]) * 0.07) * decay;
        }
      }
      fvx.set(tmpx);
      fvy.set(tmpy);
    }

    // ---- Stirring: cursor, click splash, scroll stream, fish wakes ----
    /** Convert a client-space point to particle space. The buffer is
     * viewport-sized but CSS-stretched over the whole section, so we map
     * through normalized section coordinates — this keeps cursor position
     * and displayed plankton aligned at any scroll depth in the zone. */
    let rect = canvas.getBoundingClientRect();
    function toParticle(cx: number, cy: number): { x: number; y: number } | null {
      if (cy < rect.top - 100 || cy > rect.bottom + 100) return null;
      return {
        x: ((cx - rect.left) / rect.width - 0.5) * VW,
        y: -((cy - rect.top) / rect.height - 0.5) * VH,
      };
    }

    let lastMx = 0;
    let lastMy = 0;
    let lastMt = 0;
    function onMove(e: PointerEvent) {
      rect = canvas!.getBoundingClientRect();
      const p = toParticle(e.clientX, e.clientY);
      const now = performance.now();
      if (p && lastMt) {
        const dt = Math.min((now - lastMt) / 1000, 0.1);
        if (dt > 0.001) {
          const vx = (e.clientX - lastMx) / dt;
          const vy = -((e.clientY - lastMy) / dt);
          const speed = Math.hypot(vx, vy);
          if (speed > 1) {
            const clamped = Math.min(speed, 1400) / speed;
            splat(p.x, p.y, vx * clamped * 0.35, vy * clamped * 0.35, 60 + Math.min(speed, 1400) * 0.04);
          }
        }
      }
      lastMx = e.clientX;
      lastMy = e.clientY;
      lastMt = now;
    }
    function onDown(e: PointerEvent) {
      rect = canvas!.getBoundingClientRect();
      const p = toParticle(e.clientX, e.clientY);
      if (!p) return;
      // Radial splash — water shoved outward from the impact point.
      for (let k = 0; k < 10; k++) {
        const ang = (k / 10) * Math.PI * 2;
        splat(p.x + Math.cos(ang) * 26, p.y + Math.sin(ang) * 26,
              Math.cos(ang) * 520, Math.sin(ang) * 520, 46);
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });

    // Scrolling streams the whole water column past you.
    let lastScrollY = window.scrollY;
    let scrollBias = 0;
    function onScroll() {
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      // Scroll down -> water streams upward past the viewer.
      scrollBias += dy * 1.6;
      scrollBias = Math.max(-900, Math.min(900, scrollBias));
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // Fish and whale wakes arrive through the shared impulse bus.
    const drain = createImpulseDrain();

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => { visible = entries[0]?.isIntersecting ?? false; },
      { threshold: 0 },
    );
    io.observe(canvas);

    const start = performance.now();
    const flow = { x: 0, y: 0 };
    let parX = 0;
    let parY = 0;
    let parTx = 0;
    let parTy = 0;
    function onPar(e: PointerEvent) {
      parTx = (e.clientX / window.innerWidth) * 2 - 1;
      parTy = -((e.clientY / window.innerHeight) * 2 - 1);
    }
    window.addEventListener('pointermove', onPar, { passive: true });

    let raf = 0;
    let lastFrame = performance.now();
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      if (!visible) {
        // Keep the bus drained so impulses don't pile up while offscreen.
        drain.drain();
        scrollBias = 0;
        return;
      }
      const t = (now - start) / 1000;

      // Fold external wakes into the field.
      rect = canvas!.getBoundingClientRect();
      for (const imp of drain.drain()) {
        const p = toParticle(imp.cx, imp.cy);
        if (p) splat(p.x, p.y, imp.vx * imp.strength, -imp.vy * imp.strength, imp.radius);
      }

      stepField(dt);
      scrollBias *= Math.exp(-dt * 2.4);

      // Advect particles, light them by local water speed.
      for (let i = 0; i < COUNT; i++) {
        const z = zs[i];
        let px = pos[i * 2 + 0];
        let py = pos[i * 2 + 1];
        sample(px, py, flow);
        const fxv = flow.x * z;
        const fyv = (flow.y + scrollBias) * z;
        px += (Math.sin(t * 0.6 + seeds[i] * 6.28) * 6 + fxv) * dt;
        py += (drift[i] + fyv) * dt;

        // Wrap with margin so re-entry isn't visible.
        const mx = VW / 2 + 30;
        const my = VH / 2 + 30;
        if (px > mx) px -= VW + 60; else if (px < -mx) px += VW + 60;
        if (py > my) py -= VH + 60; else if (py < -my) py += VH + 60;
        pos[i * 2 + 0] = px;
        pos[i * 2 + 1] = py;

        // Shear-triggered glow: rises fast with water speed, fades slow.
        const speed = Math.hypot(fxv, fyv - scrollBias * z * 0.85);
        const target = Math.min(speed / 230, 1);
        boosts[i] += (target > boosts[i] ? 0.5 : 0.045) * (target - boosts[i]);
      }

      // Eased pointer parallax.
      parX += (parTx - parX) * 0.05;
      parY += (parTy - parY) * 0.05;

      gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuf);
      gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, pos);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, boostBuf);
      gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, boosts);

      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uView, VW, VH);
      gl!.uniform1f(uInt, intensity);
      gl!.uniform2f(uPar, parX, parY);
      gl!.drawArrays(gl!.POINTS, 0, COUNT);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      drain.dispose();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointermove', onPar);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, [full, intensity]);

  if (!full) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
