import { ROUTES } from './routes';

export interface HeroSlide {
  id: string;
  eyebrow?: string;
  heading: string;
  subheading?: string;
  cta: { label: string; href: string };
  imageDesktop: string;
  imageMobile: string;
}

/**
 * Hero carousel slides. No CMS table exists for homepage marketing sections
 * in this schema (unlike products/collections, which are genuinely
 * database-driven per the batch spec) — this mirrors how the reference
 * theme's homepage sections are merchant-configured in the Shopify theme
 * editor rather than queried per-render.
 */
export const heroSlides: HeroSlide[] = [
  {
    id: 'new-season',
    eyebrow: 'New Season',
    heading: 'Rare By Design',
    subheading: 'Different by nature — restrained silhouettes, heavyweight fabrics, made to last.',
    cta: { label: 'Shop New In', href: ROUTES.collection('new-in') },
    imageDesktop: 'https://picsum.photos/seed/hf-hero-1-desktop/2000/1000',
    imageMobile: 'https://picsum.photos/seed/hf-hero-1-mobile/900/1125',
  },
  {
    id: 'best-sellers',
    eyebrow: 'Fan Favorites',
    heading: 'The Best Sellers',
    subheading: 'The pieces our customers keep coming back for.',
    cta: { label: 'Shop Best Sellers', href: ROUTES.collection('best-sellers') },
    imageDesktop: 'https://picsum.photos/seed/hf-hero-2-desktop/2000/1000',
    imageMobile: 'https://picsum.photos/seed/hf-hero-2-mobile/900/1125',
  },
  {
    id: 'summer-sale',
    eyebrow: 'Limited Time',
    heading: 'Up To 50% Off',
    subheading: 'Select styles, while supplies last.',
    cta: { label: 'Shop The Sale', href: ROUTES.collection('summer-sale') },
    imageDesktop: 'https://picsum.photos/seed/hf-hero-3-desktop/2000/1000',
    imageMobile: 'https://picsum.photos/seed/hf-hero-3-mobile/900/1125',
  },
];

export interface PromoBanner {
  id: string;
  heading: string;
  cta: { label: string; href: string };
  image: string;
}

export const promotionalBanners: PromoBanner[] = [
  {
    id: 'new-releases',
    heading: 'New Releases',
    cta: { label: 'Explore Now', href: ROUTES.collection('new-in') },
    image: 'https://picsum.photos/seed/hf-promo-releases/1400/900',
  },
  {
    id: 'tracksuits',
    heading: 'Tracksuits',
    cta: { label: 'Explore Now', href: ROUTES.shop },
    image: 'https://picsum.photos/seed/hf-promo-tracksuits/1400/900',
  },
];

export const editorialContent = {
  label: 'Our Story',
  repeatedText: 'X-RARE',
  body: 'Built for the person who does not want to look, think, or move like everybody else. Every collection represents identity, confidence, and individuality.',
};
