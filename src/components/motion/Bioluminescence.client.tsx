import { useEffect, useRef } from 'react';
import { useFullExperience } from '../../lib/hooks/useReducedMotion';
import { createImpulseDrain } from '../../lib/motion/disturbance';

interface Props {
  /** 0..1 — scales how much glow interactions inject. */
  intensity?: number;
}

/**
 * Bioluminescent water as an actual fluid. A WebGL2 stable-fluids solver
 * (velocity + pressure projection) advects a glowing dye field: the cursor
 * stirs real currents, clicks splash, scrolling pulls the column, fish
 * wakes glow — and because the light is a continuous medium rather than
 * particles, agitation makes it swirl and bloom like the long-exposure
 * dinoflagellate photos, never tearing holes in the field.
 */

const QUAD_VERT = `
attribute vec2 a;
varying vec2 vUv;
void main() {
  vUv = a * 0.5 + 0.5;
  gl_Position = vec4(a, 0.0, 1.0);
}
`;

const ADVECT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVel;
uniform sampler2D uSrc;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * texture2D(uVel, vUv).xy;
  gl_FragColor = uDissipation * texture2D(uSrc, coord);
}
`;

const SPLAT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec3 uValue;
uniform float uRadius;
uniform float uAspect;
void main() {
  vec2 d = vUv - uPoint;
  d.x *= uAspect;
  float g = exp(-dot(d, d) / uRadius);
  gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + uValue * g, 1.0);
}
`;

const DIVERGENCE_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float l = texture2D(uVel, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uVel, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture2D(uVel, vUv - vec2(0.0, uTexel.y)).y;
  float t = texture2D(uVel, vUv + vec2(0.0, uTexel.y)).y;
  gl_FragColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}
`;

const PRESSURE_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
void main() {
  float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float div = texture2D(uDivergence, vUv).x;
  gl_FragColor = vec4((l + r + b + t - div) * 0.25, 0.0, 0.0, 1.0);
}
`;

const GRADIENT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uVel;
uniform vec2 uTexel;
void main() {
  float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  vec2 vel = texture2D(uVel, vUv).xy - 0.5 * vec2(r - l, t - b);
  gl_FragColor = vec4(vel, 0.0, 1.0);
}
`;

const DISPLAY_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uDye;
uniform float uTime;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float d = texture2D(uDye, vUv).x;
  // Long-exposure dinoflagellate ramp: deep ocean blue blooming through
  // electric blue into pale foam-cyan where the water is most agitated.
  vec3 deep = vec3(0.02, 0.09, 0.28);
  vec3 electric = vec3(0.10, 0.42, 1.00);
  vec3 foam = vec3(0.62, 0.92, 1.00);
  vec3 col = deep * smoothstep(0.0, 0.22, d);
  col = mix(col, electric, smoothstep(0.18, 0.85, d));
  col = mix(col, foam, smoothstep(0.8, 1.7, d));
  // Granular sparkle inside the glow — the sand-glitter from the shore shots.
  float tw = hash(floor(vUv * vec2(720.0, 420.0)) + floor(uTime * 2.5));
  col += step(0.992, tw) * smoothstep(0.06, 0.5, d) * vec3(0.7, 0.92, 1.0);
  float a = clamp(d * 1.5, 0.0, 0.92);
  gl_FragColor = vec4(col * a, a);
}
`;

interface DoubleFBO {
  read: { tex: WebGLTexture; fbo: WebGLFramebuffer };
  write: { tex: WebGLTexture; fbo: WebGLFramebuffer };
  swap: () => void;
  w: number;
  h: number;
  texel: [number, number];
}

export default function Bioluminescence({ intensity = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const full = useFullExperience();

  useEffect(() => {
    if (!full) return;
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true });
    if (!gl) return;
    if (!gl.getExtension('EXT_color_buffer_float')) return;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) console.error(gl!.getShaderInfoLog(s));
      return s;
    }
    const vert = compile(gl.VERTEX_SHADER, QUAD_VERT);
    function program(fragSrc: string) {
      const p = gl!.createProgram()!;
      gl!.attachShader(p, vert);
      gl!.attachShader(p, compile(gl!.FRAGMENT_SHADER, fragSrc));
      gl!.bindAttribLocation(p, 0, 'a');
      gl!.linkProgram(p);
      const uniforms: Record<string, WebGLUniformLocation> = {};
      const n = gl!.getProgramParameter(p, gl!.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const name = gl!.getActiveUniform(p, i)!.name;
        uniforms[name] = gl!.getUniformLocation(p, name)!;
      }
      return { p, u: uniforms };
    }
    const advect = program(ADVECT_FRAG);
    const splat = program(SPLAT_FRAG);
    const divergence = program(DIVERGENCE_FRAG);
    const pressure = program(PRESSURE_FRAG);
    const gradient = program(GRADIENT_FRAG);
    const display = program(DISPLAY_FRAG);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND);

    function makeFBO(w: number, h: number, internal: number, format: number) {
      const tex = gl!.createTexture()!;
      gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, internal, w, h, 0, format, gl!.HALF_FLOAT, null);
      const fbo = gl!.createFramebuffer()!;
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      return { tex, fbo };
    }
    function makeDouble(w: number, h: number, internal: number, format: number): DoubleFBO {
      const d = {
        read: makeFBO(w, h, internal, format),
        write: makeFBO(w, h, internal, format),
        swap() { const t = d.read; d.read = d.write; d.write = t; },
        w, h,
        texel: [1 / w, 1 / h] as [number, number],
      };
      return d;
    }

    const SIM_W = 144;
    const isMobile = window.innerWidth < 768;
    const DYE_W = isMobile ? 360 : 560;
    let aspect = 1;
    let vel!: DoubleFBO;
    let dye!: DoubleFBO;
    let prs!: DoubleFBO;
    let div!: { tex: WebGLTexture; fbo: WebGLFramebuffer };
    let simH = 80;
    let dyeH = 300;

    function allocate() {
      const rectNow = canvas!.getBoundingClientRect();
      aspect = rectNow.width / Math.max(rectNow.height, 1);
      simH = Math.max(48, Math.round(SIM_W / aspect));
      dyeH = Math.max(160, Math.round(DYE_W / aspect));
      vel = makeDouble(SIM_W, simH, gl!.RG16F, gl!.RG);
      dye = makeDouble(DYE_W, dyeH, gl!.R16F, gl!.RED);
      prs = makeDouble(SIM_W, simH, gl!.R16F, gl!.RED);
      div = makeFBO(SIM_W, simH, gl!.R16F, gl!.RED);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const r = canvas!.getBoundingClientRect();
      canvas!.width = Math.max(2, Math.round(r.width * dpr));
      canvas!.height = Math.max(2, Math.round(r.height * dpr));
    }
    resize();
    allocate();
    window.addEventListener('resize', resize);

    function blit(target: { fbo: WebGLFramebuffer } | null, w: number, h: number) {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, target ? target.fbo : null);
      gl!.viewport(0, 0, w, h);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    }
    function bindTex(unit: number, tex: WebGLTexture) {
      gl!.activeTexture(gl!.TEXTURE0 + unit);
      gl!.bindTexture(gl!.TEXTURE_2D, tex);
    }

    // ---- Force queue (uv space, y up) ----
    interface Force { x: number; y: number; vx: number; vy: number; dye: number; radius: number }
    const forces: Force[] = [];
    function pushForce(f: Force) {
      if (forces.length < 14) forces.push(f);
    }

    let rect = canvas.getBoundingClientRect();
    function toUv(cx: number, cy: number): { x: number; y: number } | null {
      if (cy < rect.top - 80 || cy > rect.bottom + 80) return null;
      return { x: (cx - rect.left) / rect.width, y: 1 - (cy - rect.top) / rect.height };
    }

    let lastMx = 0;
    let lastMy = 0;
    let lastMt = 0;
    function onMove(e: PointerEvent) {
      rect = canvas!.getBoundingClientRect();
      const p = toUv(e.clientX, e.clientY);
      const now = performance.now();
      if (p && lastMt) {
        const dtm = Math.min((now - lastMt) / 1000, 0.1);
        if (dtm > 0.001) {
          let vx = (e.clientX - lastMx) / rect.width / dtm;
          let vy = -((e.clientY - lastMy) / rect.height) / dtm;
          const speed = Math.hypot(vx, vy);
          if (speed > 0.02) {
            // The cursor is a quiet visitor, not the main event: a faint
            // trace that proves the water is alive, well below the ambient
            // currents in brightness and push.
            const k = Math.min(speed, 0.5) / speed;
            vx *= k; vy *= k;
            pushForce({
              x: p.x, y: p.y, vx: vx * 0.22, vy: vy * 0.22,
              dye: Math.min(0.02 + speed * 0.10, 0.13) * intensity,
              radius: 0.0024,
            });
          }
        }
      }
      lastMx = e.clientX; lastMy = e.clientY; lastMt = now;
    }
    function onDown(e: PointerEvent) {
      rect = canvas!.getBoundingClientRect();
      const p = toUv(e.clientX, e.clientY);
      if (!p) return;
      // Soft bloom at the impact point with a mild outward push — a touch,
      // not a detonation.
      pushForce({ x: p.x, y: p.y, vx: 0, vy: 0, dye: 0.22 * intensity, radius: 0.004 });
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2;
        pushForce({
          x: p.x + Math.cos(ang) * 0.02, y: p.y + Math.sin(ang) * 0.02,
          vx: Math.cos(ang) * 0.14, vy: Math.sin(ang) * 0.14,
          dye: 0.06 * intensity, radius: 0.003,
        });
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });

    let lastScrollY = window.scrollY;
    function onScroll() {
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      const vy = Math.max(-1.4, Math.min(1.4, dy * 0.004));
      if (Math.abs(vy) < 0.04) return;
      for (const x of [0.25, 0.5, 0.75]) {
        pushForce({ x, y: 0.5, vx: 0, vy, dye: 0.012 * intensity, radius: 0.06 });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    const drain = createImpulseDrain();

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => { visible = entries[0]?.isIntersecting ?? false; },
      { threshold: 0 },
    );
    io.observe(canvas);

    // Ambient currents carry the scene (the cursor only whispers): four
    // glow-fronts wander on incommensurate orbits like surge working a
    // beach, and a broad band drifts through on a slow period, so the
    // water visibly breathes on its own.
    function ambient(t: number) {
      for (let i = 0; i < 4; i++) {
        const ph = i * 1.9;
        // Each front patrols its own neighborhood so the glow stays spread
        // across the scene instead of pooling into one bright mass.
        const cx = 0.18 + 0.64 * ((i * 0.318 + 0.13) % 1);
        const cy = 0.30 + 0.40 * ((i * 0.471 + 0.29) % 1);
        const x = cx + 0.16 * Math.sin(t * (0.057 + i * 0.012) + ph) * Math.cos(t * 0.041 + ph * 1.7);
        const y = cy + 0.14 * Math.sin(t * (0.047 + i * 0.009) + ph * 1.3);
        const vx = Math.cos(t * (0.057 + i * 0.012) + ph) * 0.26;
        const vy = Math.cos(t * (0.047 + i * 0.009) + ph * 1.3) * 0.20;
        pushForce({ x, y, vx, vy, dye: 0.008 * intensity, radius: 0.045 });
      }
      // The surge: a wide luminous front that crosses every ~50s, the
      // "wave rolling in" from the long-exposure beach photos.
      const sx = (t * 0.02 + 0.1) % 1.2 - 0.1;
      pushForce({
        x: sx, y: 0.42 + 0.18 * Math.sin(t * 0.11),
        vx: 0.10, vy: 0.03 * Math.sin(t * 0.23),
        dye: 0.006 * intensity, radius: 0.08,
      });
    }

    const start = performance.now();
    let lastFrame = performance.now();
    let raf = 0;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - lastFrame) / 1000, 0.033);
      lastFrame = now;
      if (!visible) { drain.drain(); forces.length = 0; return; }
      const t = (now - start) / 1000;

      rect = canvas!.getBoundingClientRect();
      for (const imp of drain.drain()) {
        const p = toUv(imp.cx, imp.cy);
        if (!p) continue;
        pushForce({
          x: p.x, y: p.y,
          vx: (imp.vx / rect.width) * imp.strength * 1.6,
          vy: (-imp.vy / rect.height) * imp.strength * 1.6,
          dye: 0.10 * imp.strength * intensity,
          radius: Math.pow(imp.radius / rect.height, 2) * 2.5 + 0.001,
        });
      }
      ambient(t);

      // -- Inject forces (velocity + dye splats, ping-pong) --
      gl!.useProgram(splat.p);
      for (const f of forces) {
        gl!.uniform1f(splat.u.uAspect, aspect);
        gl!.uniform2f(splat.u.uPoint, f.x, f.y);
        gl!.uniform1f(splat.u.uRadius, f.radius);
        bindTex(0, vel.read.tex);
        gl!.uniform1i(splat.u.uTarget, 0);
        gl!.uniform3f(splat.u.uValue, f.vx, f.vy, 0);
        blit(vel.write, vel.w, vel.h);
        vel.swap();
        if (f.dye > 0) {
          bindTex(0, dye.read.tex);
          gl!.uniform3f(splat.u.uValue, f.dye, 0, 0);
          blit(dye.write, dye.w, dye.h);
          dye.swap();
        }
      }
      forces.length = 0;

      // -- Pressure projection (keeps the motion swirling, not smearing) --
      gl!.useProgram(divergence.p);
      gl!.uniform2f(divergence.u.uTexel, vel.texel[0], vel.texel[1]);
      bindTex(0, vel.read.tex);
      gl!.uniform1i(divergence.u.uVel, 0);
      blit(div, SIM_W, simH);

      gl!.useProgram(pressure.p);
      gl!.uniform2f(pressure.u.uTexel, vel.texel[0], vel.texel[1]);
      bindTex(1, div.tex);
      gl!.uniform1i(pressure.u.uDivergence, 1);
      for (let i = 0; i < 14; i++) {
        bindTex(0, prs.read.tex);
        gl!.uniform1i(pressure.u.uPressure, 0);
        blit(prs.write, SIM_W, simH);
        prs.swap();
      }

      gl!.useProgram(gradient.p);
      gl!.uniform2f(gradient.u.uTexel, vel.texel[0], vel.texel[1]);
      bindTex(0, prs.read.tex);
      bindTex(1, vel.read.tex);
      gl!.uniform1i(gradient.u.uPressure, 0);
      gl!.uniform1i(gradient.u.uVel, 1);
      blit(vel.write, vel.w, vel.h);
      vel.swap();

      // -- Advect velocity, then dye --
      gl!.useProgram(advect.p);
      gl!.uniform1f(advect.u.uDt, dt);
      bindTex(0, vel.read.tex);
      gl!.uniform1i(advect.u.uVel, 0);
      gl!.uniform1i(advect.u.uSrc, 0);
      // Currents die down quickly — heavy water, not a gas sim.
      gl!.uniform1f(advect.u.uDissipation, 0.985);
      blit(vel.write, vel.w, vel.h);
      vel.swap();

      bindTex(0, vel.read.tex);
      bindTex(1, dye.read.tex);
      gl!.uniform1i(advect.u.uVel, 0);
      gl!.uniform1i(advect.u.uSrc, 1);
      // Glow fades like agitated dinoflagellates settling back to dark.
      gl!.uniform1f(advect.u.uDissipation, 0.988);
      blit(dye.write, dye.w, dye.h);
      dye.swap();

      // -- Composite to screen --
      gl!.useProgram(display.p);
      bindTex(0, dye.read.tex);
      gl!.uniform1i(display.u.uDye, 0);
      gl!.uniform1f(display.u.uTime, t);
      blit(null, canvas!.width, canvas!.height);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      drain.dispose();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
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
