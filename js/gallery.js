/* ═══════════════════════════════════════════════
   p1xelDrifter Museum — Gallery Renderer
   ═══════════════════════════════════════════════ */

(function() {
  const container = document.getElementById('gallery-container');
  if (!container) return;

  // Read category filter from data attribute (e.g. data-category="ai-art")
  const categoryFilter = container.getAttribute('data-category') || null;

  // Format "28 Mar 2026" → "Mar 2026" (Month Year)
  function formatMintDate(raw) {
    const parts = raw.trim().split(/\s+/);
    if (parts.length >= 3) {
      // "DD Mon YYYY" → "Mon YYYY"
      return parts[1] + ' ' + parts[2];
    }
    return raw;
  }

  // Blockchain badge color mapping
  function blockchainClass(name) {
    if (!name) return '';
    return 'bc-' + name.toLowerCase().replace(/\s+/g, '-');
  }

  fetch('data/gallery.json')
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(artworks => {
      // Filter by category if specified
      if (categoryFilter) {
        artworks = artworks.filter(a => a.category === categoryFilter);
      }

      // Group by sub_category
      const groups = {};
      for (const a of artworks) {
        const key = a.sub_category || a.platform;
        if (!groups[key]) groups[key] = [];
        groups[key].push(a);
      }

      // Sort each group by mint_date descending (newest first)
      for (const key of Object.keys(groups)) {
        groups[key].sort((a, b) => new Date(b.mint_date) - new Date(a.mint_date));
      }

      const frag = document.createDocumentFragment();

      for (const [groupName, items] of Object.entries(groups)) {
        const group = document.createElement('div');
        group.className = 'gallery-group';

        const title = document.createElement('h2');
        title.className = 'gallery-group-title';
        title.textContent = groupName;

        const count = document.createElement('span');
        count.className = 'gallery-group-count';
        count.textContent = '(' + items.length + ')';
        title.appendChild(count);

        group.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'gallery-grid';

        items.forEach((item, index) => {
          // Card links to external platform page (Art Blocks / fxHash)
          const card = document.createElement('a');
          card.className = 'artwork-card';
          card.href = item.source_url;
          card.target = '_blank';
          card.rel = 'noopener noreferrer';
          card.setAttribute('aria-label', item.title + ' by ' + item.artist);
          card.setAttribute('title', item.title + ' — ' + item.artist);

          // ── Image with hover overlay ──
          const imgWrap = document.createElement('div');
          imgWrap.className = 'artwork-card-imgwrap';

          const img = document.createElement('img');
          img.className = 'artwork-card-image';
          img.src = item.thumbnail_url;
          img.alt = item.title;
          if (index >= 4) img.loading = 'lazy';

          // Hover overlay with "VIEW" text
          const overlay = document.createElement('div');
          overlay.className = 'artwork-card-overlay';
          overlay.innerHTML = '<span>VIEW &#8599;</span>';

          imgWrap.appendChild(img);
          imgWrap.appendChild(overlay);
          card.appendChild(imgWrap);

          // ── Info section ──
          const info = document.createElement('div');
          info.className = 'artwork-card-info';

          const cardTitle = document.createElement('div');
          cardTitle.className = 'artwork-card-title';
          cardTitle.textContent = item.title;

          const cardArtist = document.createElement('div');
          cardArtist.className = 'artwork-card-artist';
          cardArtist.textContent = item.artist;

          // Blockchain + Mint date meta row
          const cardMeta = document.createElement('div');
          cardMeta.className = 'artwork-card-meta';

          const bcBadge = document.createElement('span');
          bcBadge.className = 'bc-badge ' + blockchainClass(item.blockchain);
          bcBadge.textContent = item.blockchain;

          const dot = document.createElement('span');
          dot.className = 'meta-dot';
          dot.textContent = '·';

          const dateSpan = document.createElement('span');
          dateSpan.className = 'mint-date';
          dateSpan.textContent = formatMintDate(item.mint_date);

          cardMeta.appendChild(bcBadge);
          cardMeta.appendChild(dot);
          cardMeta.appendChild(dateSpan);

          info.appendChild(cardTitle);
          info.appendChild(cardArtist);
          info.appendChild(cardMeta);
          card.appendChild(info);
          grid.appendChild(card);
        });

        group.appendChild(grid);
        frag.appendChild(group);
      }

      container.appendChild(frag);

      // Card entrance animation: stagger reveal as cards enter viewport
      if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        var cardObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry, i) {
            if (entry.isIntersecting) {
              setTimeout(function() {
                entry.target.classList.add('revealed');
              }, i * 40);
              cardObserver.unobserve(entry.target);
            }
          });
        }, { rootMargin: '50px' });

        document.querySelectorAll('.artwork-card').forEach(function(card) {
          cardObserver.observe(card);
        });
      } else {
        document.querySelectorAll('.artwork-card').forEach(function(card) {
          card.classList.add('revealed');
        });
      }
    })
    .catch(function(err) {
      console.error('Failed to load gallery:', err);
      container.innerHTML =
        '<div class="not-found">' +
          '<div class="not-found-icon">&#9888;</div>' +
          '<h2 class="not-found-title">Failed to load artworks</h2>' +
          '<p class="not-found-text">' + err.message + '</p>' +
          '<a href="/" class="hero-cta">&#8592; BACK HOME</a>' +
        '</div>';
    });
})();
