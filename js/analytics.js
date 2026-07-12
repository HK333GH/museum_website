/* ═══════════════════════════════════════════════
   p1xelDrifter Museum — Vercel Web Analytics
   ═══════════════════════════════════════════════ */

import { inject } from './vercel-analytics.js';

// Initialize Vercel Web Analytics
inject({
  mode: 'auto' // Automatically detects development vs production
});
