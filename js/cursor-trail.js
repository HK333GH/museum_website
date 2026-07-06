/* ═══════════════════════════════════════════════
   p1xelDrifter Museum — Cursor Trail Effect
   Subtle neon particle trail following the mouse.
   Inspired by quentinhocde.com
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  const COLORS = ['#00ffff', '#ff00ff']; // neon cyan, neon magenta
  const MAX_PARTICLES = 50;
  const SPAWN_INTERVAL_MS = 30; // throttle particle creation
  const LIFETIME_MS = 1200;      // particle lifespan ~1.2s
  const MIN_RADIUS = 1.5;
  const MAX_RADIUS = 3.5;
  const START_OPACITY = 0.7;

  // ── canvas setup ──────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-trail-canvas';
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;';
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
  /** @type {{ x:number, y:number, radius:number, color:string, opacity:number, born:number }[]} */
  const particles = [];
  let lastSpawn = 0;
  let mouseX = -100;
  let mouseY = -100;

  // ── spawn a particle at the current mouse position ────────
  function spawn() {
    const now = performance.now();
    if (now - lastSpawn < SPAWN_INTERVAL_MS) return;
    if (mouseX < 0 || mouseY < 0) return;
    lastSpawn = now;

    particles.push({
      x: mouseX,
      y: mouseY,
      radius: MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: START_OPACITY,
      born: now,
    });

    // prune oldest particles when over limit
    while (particles.length > MAX_PARTICLES) {
      particles.shift();
    }
  }

  // ── render loop ───────────────────────────────────────────
  function render(timestamp) {
    ctx.clearRect(0, 0, width, height);

    const now = performance.now();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const age = now - p.born;
      const progress = age / LIFETIME_MS; // 0 → 1

      if (progress >= 1) {
        particles.splice(i, 1);
        continue;
      }

      // ease-out fade
      const alpha = p.opacity * (1 - progress);
      // slight shrink
      const r = p.radius * (1 - progress * 0.6);

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(render);
  }

  // ── events ────────────────────────────────────────────────
  window.addEventListener(
    'mousemove',
    function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      spawn();
    },
    { passive: true }
  );

  // handle touch devices too
  window.addEventListener(
    'touchmove',
    function (e) {
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
        spawn();
      }
    },
    { passive: true }
  );

  // start the render loop
  requestAnimationFrame(render);
})();
