#!/usr/bin/env node
// Batch 20: builds public/sitemap.xml from real product/category/collection
// slugs before `vite build` runs, using only the anon key (same public data
// any storefront visitor can already read — no elevated access needed).
// SITE_URL isn't known yet (this project has no deployed production domain
// at time of writing) — set it via env var once one exists; the fallback
// below uses the IANA-reserved example domain so it's obviously a
// placeholder rather than a real-looking but wrong URL.
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// This runs as a plain Node script (not through Vite), so `.env.local`
// isn't picked up automatically the way `import.meta.env` picks it up in
// app code — read the same file directly rather than adding a dotenv
// dependency for two lines.
function loadEnvLocal() {
  try {
    const content = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    for (const line of content.split('\n')) {
      const match = /^([\w.-]+)\s*=\s*(.*)$/.exec(line.trim());
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // No .env.local present — fine, falls through to process.env as-is.
  }
}
loadEnvLocal();

const SITE_URL = process.env.SITE_URL || 'https://x-rare-klothing.example';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const STATIC_PATHS = ['/', '/shop', '/collections', '/about', '/faq', '/contact'];

function urlEntry(path, lastmod) {
  return `  <url>\n    <loc>${SITE_URL}${path}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
}

async function main() {
  const paths = [...STATIC_PATHS];

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const [{ data: products }, { data: categories }, { data: collections }] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('status', 'active'),
      supabase.from('categories').select('slug'),
      supabase.from('collections').select('slug, updated_at').eq('is_published', true),
    ]);

    for (const p of products ?? []) paths.push([`/products/${p.slug}`, p.updated_at]);
    for (const c of categories ?? []) paths.push([`/category/${c.slug}`]);
    for (const c of collections ?? []) paths.push([`/collections/${c.slug}`, c.updated_at]);
  } else {
    console.warn('[sitemap] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY not set — generating static-routes-only sitemap.');
  }

  const entries = paths.map((p) => (Array.isArray(p) ? urlEntry(p[0], p[1]) : urlEntry(p)));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
  console.log(`[sitemap] wrote ${paths.length} URLs to public/sitemap.xml`);
}

main().catch((err) => {
  console.error('[sitemap] generation failed:', err);
  process.exitCode = 1;
});
