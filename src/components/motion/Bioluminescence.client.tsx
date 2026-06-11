import { useEffect, useRef } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';
import { emitDisturbance, activeDisturbances } from '../../lib/motion/disturbance';

interface Props {
  /** 0..1 — controls particle density. Midnight ~0.4, Abyss ~1.0. */
  intensity?: number;
}

const TRAIL_MAX = 24;
const TRAIL_LIFE_MS = 520;
const TRAIL_RADIUS = 90;
const TRAIL_MIN_DIST = 5;

const VERT = `
attribute vec3 position;
attribute float aSeed;
uniform float uTime;
uniform vec2  uRes;
uniform vec2  uViewport;
uniform float uIntensity;
uniform vec3  uTrail[${TRAIL_MAX}];
varying float vSeed;
varying float vAlpha;
varying float vBoost;
varying float vFlare;
void main() {
  vSeed = aSeed;
  // Drift slowly upward with horizontal sway.
  float t = uTime * (0.04 + 0.04 * fract(aSeed * 13.0));
  vec3 p = position;
  p.y += mod(t * 60.0 + aSeed * 100.0, 800.0) - 400.0;
  p.x += sin(t * 0.6 + aSeed * 6.28) * 30.0;

  // Cursor disturbance trail: each active point brightens nearby plankton
  // and gently pushes them outward, mimicking dinoflagellate agitation.
  float boost = 0.0;
  for (int i = 0; i < ${TRAIL_MAX}; i++) {
    vec3 tr = uTrail[i];
    if (tr.z > 0.0) {
      vec2 d = p.xy - tr.xy;
      float dist = length(d);
      float falloff = 1.0 - smoothstep(0.0, ${TRAIL_RADIUS.toFixed(1)}, dist);
      float contrib = falloff * tr.z;
      boost += contrib;
      if (dist > 0.001) {
        p.xy += (d / dist) * contrib * 1.5;
      }
    }
  }
  // Clamp low so overlapping trail points form an even aura instead of
  // bright cores — the goal is many small shimmers, not a few hot ones.
  vBoost = clamp(boost, 0.0, 1.0);

  // Rare slow flare: each mote occasionally swells bright for a few seconds —
  // the loner dinoflagellate firing on its own.
  vFlare = pow(0.5 + 0.5 * sin(uTime * (0.05 + fract(aSeed * 3.0) * 0.09) + aSeed * 100.0), 32.0);

  // Particles live in CSS-pixel coordinates; map to clip space using the
  // CSS viewport so they reach edge-to-edge on retina displays.
  gl_Position = vec4(p.xy / (uViewport * 0.5), 0.0, 1.0);
  // Size still uses physical pixels for crisp rendering on retina.
  // Size distribution skews small — many faint motes, few large ones — and
  // flaring motes swell slightly. Activated (trail) plankton stay the same
  // size; only their brightness and color change, producing an "aura"
  // instead of bloated hot dots.
  gl_PointSize = (2.0 + pow(fract(aSeed * 31.0), 1.6) * 6.0) * uIntensity * (uRes.y / 600.0) * (1.0 + vFlare * 0.8);
  // Twinkle at per-mote frequency — uniform pulsing reads as artificial.
  vAlpha = 0.7 + 0.3 * (0.5 + 0.5 * sin(uTime * (0.8 + fract(aSeed * 5.0) * 1.4) + aSeed * 9.0));
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
  // Boosted (agitated) particles surge toward electric bioluminescent blue.
  col = mix(col, vec3(0.18, 0.42, 1.0), clamp(vBoost * 0.85, 0.0, 0.9));
  float a = pow(1.0 - d * 2.0, 1.9) * vAlpha * (1.0 + vBoost * 1.4 + vFlare * 2.2);
  gl_FragColor = vec4(col, a);
}
`;

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
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * window.innerWidth;
      positions[i * 3 + 1] = (Math.random() - 0.5) * window.innerHeight;
      positions[i * 3 + 2] = 0;
      seeds[i] = Math.random();
    }
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    const seedBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    const aSeed = gl.getAttribLocation(prog, 'aSeed');
    gl.enableVertexAttribArray(aSeed);
    gl.vertexAttribPointer(aSeed, 1, gl.FLOAT, false, 0, 0);

    const uTime  = gl.getUniformLocation(prog, 'uTime');
    const uRes   = gl.getUniformLocation(prog, 'uRes');
    const uView  = gl.getUniformLocation(prog, 'uViewport');
    const uInt   = gl.getUniformLocation(prog, 'uIntensity');
    const uTrail = gl.getUniformLocation(prog, 'uTrail[0]');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener('resize', resize);

    // ---- Cursor disturbance trail ----
    // Cursor emissions go through the shared bus (client coordinates), the
    // same channel ambient fish use, so everything agitates plankton alike.
    let lastEmitX = 0;
    let lastEmitY = 0;
    let mouseInside = false;
    const trailData = new Float32Array(TRAIL_MAX * 3);

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom;
      if (!inside) { mouseInside = false; return; }

      if (!mouseInside) {
        lastEmitX = e.clientX; lastEmitY = e.clientY;
        mouseInside = true;
        return;
      }

      const dx = e.clientX - lastEmitX;
      const dy = e.clientY - lastEmitY;
      if (dx * dx + dy * dy >= TRAIL_MIN_DIST * TRAIL_MIN_DIST) {
        emitDisturbance(e.clientX, e.clientY, 1, TRAIL_LIFE_MS);
        lastEmitX = e.clientX; lastEmitY = e.clientY;
      }
    }
    function onLeave() { mouseInside = false; }
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);

    // Pause shader work when the abyss zone is offscreen. The cursor trail
    // mouse listener stays attached because emissions are ~free anyway.
    let visible = true;
    const io = new IntersectionObserver(
      (entries) => { visible = entries[0]?.isIntersecting ?? false; },
      { threshold: 0 },
    );
    io.observe(canvas);

    const start = performance.now();
    let raf = 0;
    function frame(now: number) {
      if (!visible) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const t = (now - start) / 1000;

      // Pull live disturbances (cursor + fish) off the bus, convert from
      // client space to particle space (origin at canvas center, +y up),
      // and pack into the uniform array.
      const live = activeDisturbances(now);
      const rect = canvas!.getBoundingClientRect();
      for (let i = 0; i < TRAIL_MAX; i++) {
        if (i < live.length) {
          const d = live[i];
          const age = (now - d.born) / d.life;
          // Quick onset, ease-out fade.
          const onset = Math.min(age / 0.08, 1);
          const decay = age >= 1 ? 0 : (1 - age) * (1 - age);
          trailData[i * 3 + 0] = (d.cx - rect.left) - rect.width / 2;
          trailData[i * 3 + 1] = -((d.cy - rect.top) - rect.height / 2);
          trailData[i * 3 + 2] = onset * decay * d.strength;
        } else {
          trailData[i * 3 + 0] = 0;
          trailData[i * 3 + 1] = 0;
          trailData[i * 3 + 2] = 0;
        }
      }

      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uView, window.innerWidth, window.innerHeight);
      gl!.uniform1f(uInt, intensity);
      gl!.uniform3fv(uTrail, trailData);
      gl!.drawArrays(gl!.POINTS, 0, COUNT);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
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
