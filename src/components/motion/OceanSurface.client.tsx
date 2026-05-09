import { useEffect, useRef } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';

interface Props {
  /** Horizontal position of the sun reflection (0 = left, 1 = right). */
  sunX?: number;
}

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uSunX;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i),                hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p, float t) {
  // 3 octaves is enough to read as water; 5 was overkill and ~2x the work.
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    v += amp * vnoise(p + vec2(t * 0.06 * (fi + 1.0), t * 0.09));
    p *= 2.07;
    amp *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  // gl_FragCoord origin is bottom-left, so uv.y near 1.0 = horizon (top of ocean band).

  // Wave-shaped UV: stretch horizontally so noise reads as long shallow waves
  // rather than blob-noise. Higher vertical scale = denser bands closer to viewer.
  vec2 waveUv = vec2(uv.x * 3.2, (1.0 - uv.y) * 9.5);
  float h = fbm(waveUv, uTime);

  // Base water color: brighter at horizon, medium-clear close to viewer.
  // Sunlit zone is shallow (0-200m); water reads as bright tropical blue,
  // not deep navy. Bottom color (#4A87B0) matches the top of TwilightZone
  // exactly so the section seam is invisible.
  vec3 nearH = vec3(0.79, 0.88, 0.92);  // ~#C9E0EA pale at horizon
  vec3 farH  = vec3(0.29, 0.53, 0.69);  // ~#4A87B0 medium-clear deep view
  vec3 base  = mix(farH, nearH, smoothstep(0.0, 1.0, uv.y));

  // Wave shading: peaks brighter, troughs darker — gives the surface form.
  float waveBright = smoothstep(0.46, 0.64, h) * 0.30 - smoothstep(0.42, 0.22, h) * 0.18;

  // Sun reflection band: bright vertical column under the sun, fading toward viewer.
  float dx = abs(uv.x - uSunX);
  float sunBand = smoothstep(0.18, 0.0, dx);
  sunBand *= smoothstep(0.0, 0.55, uv.y);

  // Sparkles: high-frequency noise gated by the sun band — wave crests catching light.
  float sparkleN = fbm(waveUv * 3.6, uTime * 1.8);
  float sparkle  = smoothstep(0.68, 0.88, sparkleN) * sunBand * 1.6;

  vec3 col = base + waveBright + sunBand * 0.40 + sparkle * vec3(1.0, 0.96, 0.82);
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function OceanSurface({ sunX = 0.5 }: Props) {
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

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes  = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uSun  = gl.getUniformLocation(prog, 'uSunX');

    function resize() {
      // DPR clamped to 1 — the noise field is so chaotic at this scale that
      // retina pixels add no perceptible fidelity, but doubling the fragment
      // shader work is significant.
      const dpr = 1;
      const r = canvas!.getBoundingClientRect();
      canvas!.width  = Math.max(2, Math.round(r.width * dpr));
      canvas!.height = Math.max(2, Math.round(r.height * dpr));
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener('resize', resize);

    // Only render while the canvas is actually on-screen. Saves work when the
    // user has scrolled deep into the page and SunlitZone is no longer visible.
    let visible = true;
    const io = new IntersectionObserver(
      (entries) => { visible = entries[0]?.isIntersecting ?? false; },
      { threshold: 0 },
    );
    io.observe(canvas);

    const start = performance.now();
    let raf = 0;
    function frame(now: number) {
      if (visible) {
        const t = (now - start) / 1000;
        gl!.uniform2f(uRes, canvas!.width, canvas!.height);
        gl!.uniform1f(uTime, t);
        gl!.uniform1f(uSun, sunX);
        gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [full, sunX]);

  if (!full) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
}
