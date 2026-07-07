/* ═══════════════════════════════════════════════
   p1xelDrifter Museum — WebGL2 Background Effect
   Dual-pass render-to-texture: flowmap + organic blobs.
   Grey-toned lava-like fluid distorted by mouse.
   Replicated from quentinhocde.com
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Canvas setup ──────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
  // Insert as FIRST child of body so it sits behind everything
  document.body.insertBefore(canvas, document.body.firstChild);

  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    console.warn('WebGL2 not supported — background effect disabled');
    return;
  }

  // ── Shared vertex shader (full-screen quad) ───────────────
  const vertexSrc = `#version 300 es
    precision highp float;
    in vec2 aPosition;
    out vec2 vUv;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }`;

  // ── Flowmap fragment shader (pass 1) ─────────────────────
  const flowmapFragSrc = `#version 300 es
    precision highp float;
    uniform sampler2D tMap;
    uniform float uFalloff;
    uniform float uAlpha;
    uniform float uDissipation;
    uniform float uAspect;
    uniform vec2 uMouse;
    uniform vec2 uVelocity;
    in vec2 vUv;
    out vec4 fragColor;

    void main() {
      vec4 color = texture(tMap, vUv) * uDissipation;
      vec2 cursor = vUv - uMouse;
      cursor.x *= uAspect;
      vec3 stamp = vec3(uVelocity * vec2(1.0, -1.0), 1.0 - pow(1.0 - min(1.0, length(uVelocity)), 3.0));
      float falloff = smoothstep(uFalloff, 0.0, length(cursor)) * uAlpha;
      color.rgb = mix(color.rgb, stamp, vec3(falloff));
      fragColor = color;
    }`;

  // ── Main fragment shader (pass 2) ────────────────────────
  const mainFragSrc = `#version 300 es
    precision highp float;

    uniform float uTime;
    uniform float uEffectiveTime;
    uniform float uBlurMix;
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    uniform sampler2D tFlow;
    uniform float uRevert;
    uniform float uIntensity;

    in vec2 vUv;
    out vec4 fragColor;

    // Simplex noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    float grain(vec2 uv, float time) {
      vec2 seed = uv * uResolution + time;
      return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      float t = uEffectiveTime;

      vec4 flow = texture(tFlow, uv);
      vec2 flowVector = (flow.rg * 2.0 - 1.0) * 0.5;

      vec2 offset = vec2(
        snoise(uv * 1.0 + t * 0.05),
        snoise(uv * 1.0 - t * 0.03 + 100.0)
      ) * 0.4;

      vec2 offset2 = vec2(
        snoise(uv * 0.6 + t * 0.08),
        snoise(uv * 0.6 - t * 0.10 + 50.0)
      ) * 0.25;

      vec2 distortedUv = uv + flowVector + offset + offset2;

      float shape1 = snoise(distortedUv * 1.2 + t * 0.12);
      float shape2 = snoise(distortedUv * 0.7 - t * 0.10 + vec2(50.0, 30.0));
      float shape3 = snoise((distortedUv + offset * 0.3) * 1.8 + t * 0.08);

      float wave = snoise(uv * 0.5 + t * 0.06) * 0.3;

      float combined = shape1 * 0.4 + shape2 * 0.35 + shape3 * 0.25;
      combined += wave;

      float depth = snoise(distortedUv * 0.4 - t * 0.05);
      combined += depth * 0.4;

      combined = combined * 0.5 + 0.5;
      combined = smoothstep(0.3, 0.7, combined);

      float blur = 0.0;
      blur += snoise(distortedUv * 0.8 + t * 0.07) * 0.4;
      blur += snoise(distortedUv * 0.5 - t * 0.06) * 0.6;
      blur = blur * 0.5 + 0.5;

      float finalVal = mix(combined, blur, uBlurMix);
      finalVal = smoothstep(0.2, 0.8, finalVal);

      vec3 color = vec3(finalVal);
      color = pow(color, vec3(1.5));
      color = mix(vec3(0.05), vec3(0.22), color);

      float vignette = length(uv - 0.5);
      vignette = 1.0 - smoothstep(0.3, 1.1, vignette);
      color *= mix(0.7, 1.0, vignette);

      float grainValue = grain(uv, uEffectiveTime * 50.0);
      color += (grainValue - 0.5) * 0.08;

      vec3 differenceColor = abs(vec3(1.0) - color);
      color = mix(color, differenceColor, uRevert);

      fragColor = vec4(color, 1.0);
    }`;

  // ── Shader compilation helper ─────────────────────────────
  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(vertSrc, fragSrc) {
    const vs = createShader(gl.VERTEX_SHADER, vertSrc);
    const fs = createShader(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return program;
  }

  // ── Compile programs ──────────────────────────────────────
  const flowmapProgram = createProgram(vertexSrc, flowmapFragSrc);
  const mainProgram = createProgram(vertexSrc, mainFragSrc);
  if (!flowmapProgram || !mainProgram) return;

  // ── Uniform locations ─────────────────────────────────────
  // Flowmap uniforms
  const flowUnis = {
    tMap: gl.getUniformLocation(flowmapProgram, 'tMap'),
    uFalloff: gl.getUniformLocation(flowmapProgram, 'uFalloff'),
    uAlpha: gl.getUniformLocation(flowmapProgram, 'uAlpha'),
    uDissipation: gl.getUniformLocation(flowmapProgram, 'uDissipation'),
    uAspect: gl.getUniformLocation(flowmapProgram, 'uAspect'),
    uMouse: gl.getUniformLocation(flowmapProgram, 'uMouse'),
    uVelocity: gl.getUniformLocation(flowmapProgram, 'uVelocity'),
  };

  // Main uniforms
  const mainUnis = {
    uTime: gl.getUniformLocation(mainProgram, 'uTime'),
    uEffectiveTime: gl.getUniformLocation(mainProgram, 'uEffectiveTime'),
    uBlurMix: gl.getUniformLocation(mainProgram, 'uBlurMix'),
    uMouse: gl.getUniformLocation(mainProgram, 'uMouse'),
    uResolution: gl.getUniformLocation(mainProgram, 'uResolution'),
    tFlow: gl.getUniformLocation(mainProgram, 'tFlow'),
    uRevert: gl.getUniformLocation(mainProgram, 'uRevert'),
    uIntensity: gl.getUniformLocation(mainProgram, 'uIntensity'),
  };

  // ── Full-screen quad geometry ─────────────────────────────
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1,  1,  1, -1,   1, 1,
  ]), gl.STATIC_DRAW);

  function setupVertexAttrib(program) {
    const aPos = gl.getAttribLocation(program, 'aPosition');
    if (aPos < 0) {
      // Some drivers rename 'aPosition' — try common alternatives
      // But we control the source, so just use what we defined
      return false;
    }
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    return true;
  }

  // ── Framebuffer / textures ────────────────────────────────
  function createRenderTarget(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    return { texture: tex, framebuffer: fb };
  }

  let flowTexW, flowTexH;
  let flowTargetA, flowTargetB;

  function resize() {
    const w = canvas.width = window.innerWidth;
    const h = canvas.height = window.innerHeight;

    // Flowmap at lower internal resolution for performance
    flowTexW = Math.ceil(w / 2);
    flowTexH = Math.ceil(h / 2);

    // Clean up old
    if (flowTargetA) {
      gl.deleteTexture(flowTargetA.texture);
      gl.deleteFramebuffer(flowTargetA.framebuffer);
    }
    if (flowTargetB) {
      gl.deleteTexture(flowTargetB.texture);
      gl.deleteFramebuffer(flowTargetB.framebuffer);
    }

    flowTargetA = createRenderTarget(flowTexW, flowTexH);
    flowTargetB = createRenderTarget(flowTexW, flowTexH);

    gl.viewport(0, 0, w, h);
  }
  resize();
  window.addEventListener('resize', () => {
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
  });

  // ── Mouse state ───────────────────────────────────────────
  let mouseX = 0;
  let mouseY = 0;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let mouseOnScreen = false;
  let lastMouseTime = 0;

  function onMove(clientX, clientY) {
    // Only update current position, NOT prevMouse (that's done in render loop)
    mouseX = clientX;
    mouseY = clientY;
    mouseOnScreen = true;
    lastMouseTime = performance.now();
  }

  window.addEventListener('mousemove', function (e) {
    onMove(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (e.touches.length > 0) {
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchstart', function (e) {
    if (e.touches.length > 0) {
      const cx = e.touches[0].clientX;
      const cy = e.touches[0].clientY;
      prevMouseX = cx;
      prevMouseY = cy;
      mouseX = cx;
      mouseY = cy;
      mouseOnScreen = true;
      lastMouseTime = performance.now();
    }
  }, { passive: true });

  window.addEventListener('mouseleave', function () {
    mouseOnScreen = false;
  });

  // ── Animation state ───────────────────────────────────────
  let currentTime = 0;
  let effectiveTime = 0;
  let lastFrameTime = 0;
  let animId;

  // Flowmap params
  const FLOW_FALLOFF = 0.5;
  const FLOW_ALPHA = 0.2;
  const FLOW_DISSIPATION = 0.99;

  // Main params
  const BLUR_MIX = 0.4;
  const REVERT = 0.0;
  const INTENSITY = 1.0;

  // ── Render loop ───────────────────────────────────────────
  function render(timestamp) {
    animId = requestAnimationFrame(render);

    // Compute dt (capped to avoid jumps on tab switch)
    let dt = lastFrameTime ? Math.min(timestamp - lastFrameTime, 50) : 16.667;
    lastFrameTime = timestamp;

    // Update times
    currentTime += dt * 1e-4;
    effectiveTime += dt * 5e-4 * INTENSITY;

    // Compute mouse velocity (pixel delta since last frame)
    const dx = mouseX - prevMouseX;
    const dy = mouseY - prevMouseY;

    // Update prevMouse AFTER computing delta (catches all movement between frames)
    prevMouseX = mouseX;
    prevMouseY = mouseY;

    // Decay velocity when mouse is stationary or off-screen
    const now = performance.now();
    const timeSinceMove = now - lastMouseTime;

    if (mouseOnScreen && timeSinceMove < 100) {
      // Use raw pixel deltas (quentinhocde.com does NOT normalize by canvas size)
      velocityX = dx;
      velocityY = dy;
    } else {
      velocityX *= 0.9;
      velocityY *= 0.9;
    }

    // Clamp velocity
    const MAX_VEL = 0.05;
    velocityX = Math.max(-MAX_VEL, Math.min(MAX_VEL, velocityX));
    velocityY = Math.max(-MAX_VEL, Math.min(MAX_VEL, velocityY));

    // Mouse UV
    const mouseUvX = mouseX / canvas.width;
    const mouseUvY = 1.0 - mouseY / canvas.height; // flip Y for OpenGL

    // Flowmap aspect ratio
    const flowAspect = flowTexW / flowTexH;

    // ═══ PASS 1: Render flowmap ═══════════════════════════════
    gl.useProgram(flowmapProgram);
    setupVertexAttrib(flowmapProgram);

    // Framebuffer: render to flowTargetB, sample flowTargetA
    gl.bindFramebuffer(gl.FRAMEBUFFER, flowTargetB.framebuffer);
    gl.viewport(0, 0, flowTexW, flowTexH);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, flowTargetA.texture);
    gl.uniform1i(flowUnis.tMap, 0);
    gl.uniform1f(flowUnis.uFalloff, FLOW_FALLOFF);
    gl.uniform1f(flowUnis.uAlpha, FLOW_ALPHA);
    gl.uniform1f(flowUnis.uDissipation, FLOW_DISSIPATION);
    gl.uniform1f(flowUnis.uAspect, flowAspect);
    gl.uniform2f(flowUnis.uMouse, mouseUvX, mouseUvY);
    gl.uniform2f(flowUnis.uVelocity, velocityX, velocityY);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Swap flow targets (B becomes the new source for next frame)
    const tmp = flowTargetA;
    flowTargetA = flowTargetB;
    flowTargetB = tmp;

    // ═══ PASS 2: Render main scene to screen ══════════════════
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(mainProgram);
    setupVertexAttrib(mainProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, flowTargetA.texture);
    gl.uniform1i(mainUnis.tFlow, 0);
    gl.uniform1f(mainUnis.uTime, currentTime);
    gl.uniform1f(mainUnis.uEffectiveTime, effectiveTime);
    gl.uniform1f(mainUnis.uBlurMix, BLUR_MIX);
    gl.uniform2f(mainUnis.uMouse, mouseUvX, mouseUvY);
    gl.uniform2f(mainUnis.uResolution, canvas.width, canvas.height);
    gl.uniform1f(mainUnis.uRevert, REVERT);
    gl.uniform1f(mainUnis.uIntensity, INTENSITY);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Start the loop
  lastFrameTime = performance.now();
  animId = requestAnimationFrame(render);
})();
