import { useEffect, useRef } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';

interface Props {
  /** 0..1 — controls particle density. Midnight ~0.4, Abyss ~1.0. */
  intensity?: number;
}

const VERT = `
attribute vec3 position;
attribute float aSeed;
uniform float uTime;
uniform vec2  uRes;
uniform float uIntensity;
varying float vSeed;
varying float vAlpha;
void main() {
  vSeed = aSeed;
  // Drift slowly upward with horizontal sway.
  float t = uTime * (0.04 + 0.04 * fract(aSeed * 13.0));
  vec3 p = position;
  p.y += mod(t * 60.0 + aSeed * 100.0, 800.0) - 400.0;
  p.x += sin(t * 0.6 + aSeed * 6.28) * 30.0;
  gl_Position = vec4(p.xy / (uRes * 0.5), 0.0, 1.0);
  // Random size, modulated by intensity.
  gl_PointSize = (2.0 + fract(aSeed * 31.0) * 4.0) * uIntensity * (uRes.y / 600.0);
  // Pulse alpha.
  vAlpha = 0.4 + 0.6 * (0.5 + 0.5 * sin(uTime * 1.3 + aSeed * 9.0));
}
`;

const FRAG = `
precision highp float;
varying float vSeed;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  // Soft glowing dot with tinted core (cyan-green vs. warm gold).
  vec3 cool = vec3(0.48, 1.0, 0.69);   // #7BFFB1
  vec3 warm = vec3(0.96, 0.82, 0.48);  // #F4D27A
  vec3 col = mix(cool, warm, step(0.85, fract(vSeed * 7.0)));
  float a = pow(1.0 - d * 2.0, 2.5) * vAlpha;
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
    const COUNT = Math.round((isMobile ? 200 : 700) * intensity);
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

    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uRes  = gl.getUniformLocation(prog, 'uRes');
    const uInt  = gl.getUniformLocation(prog, 'uIntensity');

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

    const start = performance.now();
    let raf = 0;
    function frame(now: number) {
      const t = (now - start) / 1000;
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uInt, intensity);
      gl!.drawArrays(gl!.POINTS, 0, COUNT);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
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
