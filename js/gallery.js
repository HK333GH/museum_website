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
      group.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'gallery-grid';

      for (const item of items) {
        const card = document.createElement('a');
        card.className = 'artwork-card';
        card.href = `artwork.html?id=${encodeURIComponent(item.id)}`;

        const img = document.createElement('img');
        img.className = 'artwork-card-image';
        img.src = item.thumbnail_url || item.image_url;
        img.alt = item.title;
        img.onerror = function() {
          // Fallback: try full image if thumbnail fails
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
      }

      group.appendChild(grid);
      container.appendChild(group);
    }

    // Trigger lazy-load observer
    document.dispatchEvent(new Event('DOMContentLoaded'));

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
