/* ═══════════════════════════════════════════════
   p1xelDrifter Museum — Shared Utilities
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Lazy-load images: add '.loaded' class when visible
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    lazyImages.forEach(img => observer.observe(img));
  } else {
    lazyImages.forEach(img => img.classList.add('loaded'));
  }

  // Mark non-lazy images as loaded after a short delay
  setTimeout(() => {
    document.querySelectorAll('img:not([loading="lazy"])').forEach(img => {
      img.classList.add('loaded');
    });
  }, 300);

  // ── Mobile nav toggle ──
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
});
