/* ═══════════════════════════════════════════════
   p1xelDrifter Museum — Artwork Detail
   ═══════════════════════════════════════════════ */

(async function() {
  const container = document.getElementById('artwork-detail');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const artworkId = params.get('id');

  if (!artworkId) {
    container.innerHTML = `
      <div class="not-found">
        <div class="not-found-icon">?</div>
        <h2 class="not-found-title">No artwork specified</h2>
        <p class="not-found-text">Please select an artwork from the gallery.</p>
        <a href="generative-art.html" class="hero-cta">← BACK TO GALLERY</a>
      </div>`;
    return;
  }

  try {
    const res = await fetch('data/gallery.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const artworks = await res.json();

    const artwork = artworks.find(a => a.id === artworkId);

    if (!artwork) {
      container.innerHTML = `
        <div class="not-found">
          <div class="not-found-icon">?</div>
          <h2 class="not-found-title">Artwork not found</h2>
          <p class="not-found-text">ID: ${escapeHtml(artworkId)}</p>
          <a href="generative-art.html" class="hero-cta">← BACK TO GALLERY</a>
        </div>`;
      return;
    }

    // Update page title
    document.title = `${artwork.title} by ${artwork.artist} — p1xelDrifter Museum`;

    // Set OG image
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:image');
      meta.content = artwork.image_url;
      document.head.appendChild(meta);
    }

    container.innerHTML = `
      <a href="generative-art.html" class="artwork-back">← Back to Generative Art</a>
      <div class="artwork-detail-grid">
        <img
          class="artwork-detail-image"
          src="${escapeAttr(artwork.image_url)}"
          alt="${escapeAttr(artwork.title)}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
        >
        <div class="not-found" style="display:none;min-height:300px;">
          <div class="not-found-icon">🖼</div>
          <p class="not-found-text">Image unavailable</p>
        </div>
        <div class="artwork-detail-info">
          <h1 class="artwork-detail-title">${escapeHtml(artwork.title)}</h1>
          <p class="artwork-detail-artist">by ${escapeHtml(artwork.artist)}</p>

          <ul class="artwork-meta">
            <li>
              <span class="artwork-meta-label">Collection</span>
              <span class="artwork-meta-value">${escapeHtml(artwork.collection)}</span>
            </li>
            <li>
              <span class="artwork-meta-label">Item #</span>
              <span class="artwork-meta-value">${escapeHtml(artwork.item_number)}</span>
            </li>
            <li>
              <span class="artwork-meta-label">Mint Date</span>
              <span class="artwork-meta-value">${escapeHtml(artwork.mint_date)}</span>
            </li>
            <li>
              <span class="artwork-meta-label">Blockchain</span>
              <span class="artwork-meta-value">${escapeHtml(artwork.blockchain)}</span>
            </li>
            <li>
              <span class="artwork-meta-label">Platform</span>
              <span class="artwork-meta-value">${escapeHtml(artwork.platform)}</span>
            </li>
          </ul>

          <a href="${escapeAttr(artwork.source_url)}" class="artwork-detail-link" target="_blank" rel="noopener">
            VIEW ON ${escapeHtml(artwork.platform.toUpperCase())} →
          </a>
        </div>
      </div>`;

  } catch (err) {
    console.error('Failed to load artwork:', err);
    container.innerHTML = `
      <div class="not-found">
        <div class="not-found-icon">⚠</div>
        <h2 class="not-found-title">Failed to load artwork</h2>
        <p class="not-found-text">${escapeHtml(err.message)}</p>
        <a href="/" class="hero-cta">← BACK HOME</a>
      </div>`;
  }
})();

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
