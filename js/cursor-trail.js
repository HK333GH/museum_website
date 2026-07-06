/* ═══════════════════════════════════════════════
   p1xelDrifter Museum — Cursor Trail Effect
   Subtle neon particle trail following the mouse.
   Inspired by quentinhocde.com
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  const COLORS = ['#00ffff', '#ff00ff']; // neon cyan, neon magenta
  const MAX_PARTICLES = 60;
  const LIFETIME_MS = 1000;       // particle lifespan ~1s
  const MIN_RADIUS = 1;
  const MAX_RADIUS = 2.5;
  const START_OPACITY = 0.5;

  // ── canvas setup ──────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-trail-canvas';
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:auto;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── particle store ────────────────────────────────────────
  const particles = [];
  let mouseX = -100;
  let mouseY = -100;
  let lastX = -100;
  let lastY = -100;
  let animId;

  // ── spawn particles between current and last position ─────
  function spawnLine() {
    if (mouseX < 0 || mouseY < 0) return;

    const dx = mouseX - lastX;
    const dy = mouseY - lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Spawn particles along the line to fill gaps
    const steps = Math.max(1, Math.floor(dist / 8));
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = lastX + dx * t;
      const y = lastY + dy * t;

      // Tiny random offset for organic feel
      const ox = (Math.random() - 0.5) * 3;
      const oy = (Math.random() - 0.5) * 3;

      particles.push({
        x: x + ox,
        y: y + oy,
        radius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: START_OPACITY * (0.6 + Math.random() * 0.4),
        born: performance.now(),
      });
    }

    // Prune
    while (particles.length > MAX_PARTICLES) {
      particles.shift();
    }
  }

  // ── render loop ───────────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, width, height);

    const now = performance.now();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const age = now - p.born;
      const progress = age / LIFETIME_MS;

      if (progress >= 1) {
        particles.splice(i, 1);
        continue;
      }

      // Ease-out fade + shrink
      const alpha = p.opacity * (1 - progress) * (1 - progress);
      const r = p.radius * (1 - progress * 0.5);

      // Glow effect via shadow
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = r * 3;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    animId = requestAnimationFrame(render);
  }

  // ── events ────────────────────────────────────────────────
  function onMove(clientX, clientY) {
    lastX = mouseX;
    lastY = mouseY;
    mouseX = clientX;
    mouseY = clientY;
    spawnLine();
  }

  window.addEventListener('mousemove', function (e) {
    onMove(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (e.touches.length > 0) {
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  // Also handle touch start to begin the trail
  window.addEventListener('touchstart', function (e) {
    if (e.touches.length > 0) {
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      mouseX = lastX;
      mouseY = lastY;
    }
  }, { passive: true });

  // Handle mouse leaving window — stop trail
  window.addEventListener('mouseleave', function () {
    mouseX = -100;
    mouseY = -100;
  });

  // Start the render loop
  animId = requestAnimationFrame(render);
})();
