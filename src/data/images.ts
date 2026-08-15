/**
 * Central image catalog for the visual merchandising pass. Every externally-
 * sourced image URL used anywhere in the app should be defined here once and
 * referenced by id — never hardcode an image URL directly in a component.
 *
 * Source: Unsplash (unsplash.com), used under the Unsplash License (free for
 * commercial and noncommercial use, no permission required). Full per-image
 * photographer credit and source links are documented in
 * docs/image-sources.md — this file only carries what the app needs at
 * runtime (the id and an accessible description).
 *
 * `unsplashUrl` appends Unsplash's own CDN resize/crop/format parameters so a
 * single source photo can serve multiple aspect ratios (e.g. a desktop-wide
 * hero crop and a mobile-portrait crop of the same image) without needing a
 * separate asset per breakpoint.
 */

export interface CatalogImage {
  /** Unsplash photo id, e.g. "1508216310976-c518daae0cdc". */
  id: string;
  /** Descriptive alt text — never generic ("photo", "image1"). */
  alt: string;
}

export function unsplashUrl(id: string, opts: { w: number; h?: number; fit?: 'crop' | 'contain' } = { w: 1200 }): string {
  const params = new URLSearchParams({
    w: String(opts.w),
    q: '80',
    auto: 'format',
    fit: opts.fit ?? 'crop',
  });
  if (opts.h) params.set('h', String(opts.h));
  return `https://images.unsplash.com/photo-${id}?${params.toString()}`;
}

/**
 * Re-requests an already-stored Unsplash URL (e.g. a `collections.image`
 * value set by an admin) at a larger size — the CMS-configured URL is
 * sized for its original small use (an 800px tile), so a page that wants
 * to display the same admin-chosen image larger needs the same photo at
 * higher resolution, not a different photo.
 */
export function resizeUnsplashUrl(url: string, opts: { w: number; h?: number }): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('w', String(opts.w));
    if (opts.h) parsed.searchParams.set('h', String(opts.h));
    return parsed.toString();
  } catch {
    return url;
  }
}

export const productImages = {
  oversizedGraphicTeeFront: { id: '1508216310976-c518daae0cdc', alt: 'Model wearing an oversized graphic T-shirt against a plain wall' },
  oversizedGraphicTeeBack: { id: '1542406775-ade58c52d2e4', alt: 'Model in streetwear standing near a grey wall, back detail' },
  straightLegDenimFront: { id: '1624378439575-d8705ad7ae80', alt: 'Straight leg blue denim jeans laid flat on white textile' },
  straightLegDenimBack: { id: '1714143136372-ddaf8b606da7', alt: 'Pair of blue denim jeans on a white background' },
  coachJacketFront: { id: '1614693348454-1e0710d21c60', alt: 'Model wearing a blue denim coach jacket with a black cap' },
  coachJacketBack: { id: '1555583743-991174c11425', alt: 'Model wearing a casual blue washed jacket' },
  embroideredHoodieFront: { id: '1564557287817-3785e38ec1f5', alt: 'Model wearing a grey hoodie, leaning against a wall' },
  embroideredHoodieBack: { id: '1685328403755-de1d57e12e63', alt: 'Model in a hoodie standing on the street' },
  ribbedTankTopFront: { id: '1762337676182-28feaa48e3d4', alt: 'Model in a white ribbed tank top at sunset' },
  ribbedTankTopBack: { id: '1598554747436-c9293d6a588f', alt: 'Model in a white tank top and blue denim jeans, seated' },
  pleatedMidiSkirtFront: { id: '1762337679957-0994eeb9001b', alt: 'Model wearing a pleated midi skirt, seated outdoors' },
  pleatedMidiSkirtBack: { id: '1762337677950-dcd609ca8ffa', alt: 'Model wearing a midi skirt on a ledge in front of a building' },
  canvasToteBagFront: { id: '1624687943971-e86af76d57de', alt: 'Canvas tote bag on a white table' },
  canvasToteBagBack: { id: '1732963947955-858ad7d5e540', alt: 'Tote bag resting on a chair beside a plant' },
  woolBlendBeanieFront: { id: '1576871337632-b9aef4c17ab9', alt: 'Assorted knitted wool beanies' },
  woolBlendBeanieBack: { id: '1510598969022-c4c6c5d05769', alt: 'Model wearing a knit beanie with a denim jacket' },
} satisfies Record<string, CatalogImage>;

export const categoryImages = {
  men: { id: '1644092000597-ff2320ffbb6d', alt: "Men's fashion editorial — model in a tailored jacket" },
  women: { id: '1533392151650-269f96231f65', alt: "Women's fashion editorial — monochrome portrait" },
  accessories: { id: '1680690653166-1618c3bcdf51', alt: 'Fashion accessories — sunglasses and watch styled on a tray' },
} satisfies Record<string, CatalogImage>;

export const collectionImages = {
  newIn: { id: '1571513800374-df1bbe650e56', alt: 'Editorial fashion portrait for the New In collection' },
  bestSellers: { id: '1613915617430-8ab0fd7c6baf', alt: 'Editorial fashion portrait for the Best Sellers collection' },
  summerSale: { id: '1662532577856-e8ee8b138a8b', alt: 'Vibrant editorial portrait for the Summer Sale collection' },
  featured: { id: '1629511565591-a1d494ad6c58', alt: 'Editorial fashion portrait for Featured Products' },
} satisfies Record<string, CatalogImage>;

export const heroImages = {
  newSeason: { id: '1603189343302-e603f7add05a', alt: 'Model in a tailored black outfit — New Season campaign' },
  bestSellers: { id: '1543728069-a3f97c5a2f32', alt: 'Fashion show runway — Best Sellers campaign' },
  summerSale: { id: '1657815929003-b97cc426cb3d', alt: 'Model in white outfit — Summer Sale campaign' },
} satisfies Record<string, CatalogImage>;

export const bannerImages = {
  newReleases: { id: '1733322992706-1210ca79f4df', alt: 'Models walking a runway — New Releases' },
  tracksuits: { id: '1635650804060-bb009bcb2ea5', alt: 'Model in athletic streetwear with a skateboard — Tracksuits' },
} satisfies Record<string, CatalogImage>;

export const editorialImages = {
  contactBanner: { id: '1441984904996-e0b6ba687e04', alt: 'Minimal clothing boutique interior with hanging racks' },
} satisfies Record<string, CatalogImage>;

/** Contact page — premium editorial redesign. */
export const contactImages = {
  hero: { id: '1544005313-94ddf0286df2', alt: 'Warm, confident portrait — X-Rare contact hero' },
  formSide: { id: '1677779817420-b3ad7a4a1f2c', alt: 'Close-up gold chain detail on jacket fabric, editorial styling' },
} satisfies Record<string, CatalogImage>;

/** Multi-brand / Liberian-identity repositioning pass. Contemporary West African fashion editorial — people, style, city life, not tourism or traditional-costume imagery. */
export const liberianImages = {
  homeHero: { id: '1783013959203-1176111307e7', alt: 'Group of young men in contemporary streetwear, urban editorial' },
  brandsHero: { id: '1535530705774-695729778c55', alt: 'Two men in stylish contemporary streetwear against an urban backdrop' },
  localSpotlight: { id: '1623472927536-c966c62f0701', alt: 'Confident portrait, contemporary West African street style' },
  aboutDestination: { id: '1783379794529-361c9225b3d5', alt: 'Models in coordinated contemporary fashion, editorial styling' },
} satisfies Record<string, CatalogImage>;

/** About page — premium fashion-editorial redesign. One entry per section that needs a photo. */
export const aboutImages = {
  hero: { id: '1785741833876-8db063dd8654', alt: 'Confident model in editorial streetwear, X-Rare campaign' },
  storyChapterOne: { id: '1668952135120-7d997b1b3778', alt: 'Model in a long coat against a plain backdrop — editorial portrait' },
  storyChapterTwo: { id: '1659522761084-79196b64abe4', alt: 'Model in a white dress, minimal elegant styling' },
  storyChapterThree: { id: '1785414671221-0c3353f9f417', alt: 'Stylish model seated on a rooftop, editorial fashion look' },
  globalVision: { id: '1531123897727-8f129e1688ce', alt: 'Confident African fashion editorial portrait' },
  customerOne: { id: '1786482126555-c37b4aba91c8', alt: 'Confident model in a blazer holding sunglasses on a city street' },
  customerTwo: { id: '1780396508935-94e234affc92', alt: 'Model in a navy tracksuit, confident street style pose' },
  finalCta: { id: '1580478491436-fd6a937acc9e', alt: 'Model in a red blazer seated on stairs, dramatic editorial campaign' },
} satisfies Record<string, CatalogImage>;
