/* ═══════════════════════════════════════════════
   p1xelDrifter Museum — Gallery Renderer
   ═══════════════════════════════════════════════ */

(async function() {
  const container = document.getElementById('gallery-container');
  if (!container) return;

  try {
    const res = await fetch('data/gallery.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const artworks = await res.json();

    // Group by sub_category
    const groups = {};
    for (const a of artworks) {
      const key = a.sub_category || a.platform;
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }

    // Render groups
    for (const [groupName, items] of Object.entries(groups)) {
      const group = document.createElement('div');
      group.className = 'gallery-group';

      const title = document.createElement('h2');
      title.className = 'gallery-group-title';
      title.textContent = groupName;

      // Item count badge
      const count = document.createElement('span');
      count.className = 'gallery-group-count';
      count.textContent = `(${items.length})`;
      title.appendChild(count);

      group.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'gallery-grid';

      items.forEach((item, index) => {
        const card = document.createElement('a');
        card.className = 'artwork-card';
        card.href = `artwork.html?id=${encodeURIComponent(item.id)}`;

        // Accessibility: aria-label for screen readers
        card.setAttribute('aria-label', `${item.title} by ${item.artist}`);
        // Tooltip showing full title on hover
        card.setAttribute('title', `${item.title} — ${item.artist}`);

        const img = document.createElement('img');
        img.className = 'artwork-card-image';
        img.src = item.thumbnail_url || item.image_url;
        img.alt = item.title;
        // Lazy-load images below the fold (skip first 4 = first row)
        if (index >= 4) {
          img.loading = 'lazy';
        }
        img.onerror = function() {
          if (this.src !== item.image_url) {
            this.src = item.image_url;
          }
        };

        const info = document.createElement('div');
        info.className = 'artwork-card-info';

        const cardTitle = document.createElement('div');
        cardTitle.className = 'artwork-card-title';
        cardTitle.textContent = item.title;

        const cardArtist = document.createElement('div');
        cardArtist.className = 'artwork-card-artist';
        cardArtist.textContent = item.artist;

        info.appendChild(cardTitle);
        info.appendChild(cardArtist);
        card.appendChild(img);
        card.appendChild(info);
        grid.appendChild(card);
      });

      group.appendChild(grid);
      container.appendChild(group);
    }

    // Trigger lazy-load observer for images
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Card entrance animation: stagger reveal as cards enter viewport
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Stagger by index within this batch
            setTimeout(() => {
              entry.target.classList.add('revealed');
            }, i * 40);
            cardObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: '50px' });

      document.querySelectorAll('.artwork-card').forEach(card => {
        cardObserver.observe(card);
      });
    } else {
      // No animation support or reduced motion — show all immediately
      document.querySelectorAll('.artwork-card').forEach(card => {
        card.classList.add('revealed');
      });
    }

  } catch (err) {
    console.error('Failed to load gallery:', err);
    container.innerHTML = `
      <div class="not-found">
        <div class="not-found-icon">⚠</div>
        <h2 class="not-found-title">Failed to load artworks</h2>
        <p class="not-found-text">${err.message}</p>
        <a href="/" class="hero-cta">← BACK HOME</a>
      </div>`;
  }
})();
