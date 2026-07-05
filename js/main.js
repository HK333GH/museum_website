/* ═══════════════════════════════════════════════
   p1xelDrifter Museum — Shared Utilities
   ═══════════════════════════════════════════════ */

// Lazy-load images: add '.loaded' class when visible
document.addEventListener('DOMContentLoaded', () => {
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
    // Fallback: mark all as loaded
    lazyImages.forEach(img => img.classList.add('loaded'));
  }

  // Also mark non-lazy images as loaded after a short delay
  setTimeout(() => {
    document.querySelectorAll('img:not([loading="lazy"])').forEach(img => {
      img.classList.add('loaded');
    });
  }, 300);
});
