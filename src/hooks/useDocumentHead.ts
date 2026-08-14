import { useEffect } from 'react';

export interface DocumentHeadOptions {
  /** Page-specific title. Rendered as "`title` — X-Rare" (bare "X-Rare" on the homepage). */
  title: string;
  description?: string;
  /** Path (e.g. `/products/oversized-graphic-tee`) combined with the current origin for the canonical URL and og:url. Defaults to the current path. */
  path?: string;
  image?: string;
  type?: 'website' | 'product';
  /** Set for pages that shouldn't be indexed (checkout, account, auth). */
  noindex?: boolean;
}

const SITE_NAME = 'X-Rare';
const DEFAULT_IMAGE = '/logo.png';

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sets per-route document title, meta description, canonical URL, and Open
 * Graph tags — pure DOM manipulation rather than react-helmet-async, since
 * this is a CSR-only SPA with no server render to deduplicate against.
 * Each page's own call simply overwrites the previous page's tags on
 * navigation; nothing needs to be restored on unmount.
 */
export function useDocumentHead(options: DocumentHeadOptions): void {
  const { title, description, path, image, type = 'website', noindex } = options;

  useEffect(() => {
    document.title = title === SITE_NAME ? SITE_NAME : `${title} — ${SITE_NAME}`;

    const url = `${window.location.origin}${path ?? window.location.pathname}`;
    const resolvedImage = image ? `${window.location.origin}${image}` : `${window.location.origin}${DEFAULT_IMAGE}`;

    if (description) upsertMeta('name', 'description', description);
    upsertLink('canonical', url);

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', title);
    if (description) upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:image', resolvedImage);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    if (description) upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', resolvedImage);

    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  }, [title, description, path, image, type, noindex]);
}
