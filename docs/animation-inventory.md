# Animation Inventory — highfashionbyjol.com

All entries confirmed via DOM class names, computed `transition`/animation-library markers, or a live
triggered state change. Timing values not directly measurable (autoplay intervals, easing curves) are
marked "not verified" rather than invented.

## Marquee / ticker text

- **Announcement bar**: continuously scrolling horizontal ticker — confirmed by the text being tripled in the live DOM (`SUMMER SALES … SUMMER SALES … SUMMER SALES`), the standard technique for a seamless CSS/JS marquee loop.
- **About-page brand marquee**: same mechanism, reused for the "HIGH FASHION BY J.O.L" repeated brand statement under "OUR STORY" (repeated ~12× in the DOM).
- Scroll speed/direction not measured (would require sustained visual observation).

## Carousels (Flickity)

- **Hero slideshow** (`main-slideshow`): Flickity-powered, `is-fade` class → **cross-fade** transition between slides (not slide/swipe), `transition--swipe` class also present suggesting swipe gesture support on touch even though the visual transition is a fade; custom dot pagination (`custom-dots`); draggable (`is-draggable`).
- **Homepage product rails** (Best Sellers / New In / Accessories / Featured / Explore More): Flickity, drag-to-scroll horizontally, no visible dot pagination in the sampled markup (arrows/drag only, unconfirmed whether arrow nav controls exist — class list didn't include an arrows toggle either way).
- Autoplay: theme supports it (`--swiper`/slideshow settings), but actual autoplay interval was **not verified** (would need to watch the DOM over time).

## Drawers (SidePanel)

- **Cart drawer**, **Quick View drawer**, and **Wishlist drawer** all use the same `.side-panel` primitive — opening toggles an `active` class on the panel and `open-cart` / `open-quick-view` / (wishlist equivalent) plus a shared `open-cc` class on `<body>`. The `0.25s` transition duration used consistently across header/menu elements strongly suggests the drawers also animate open/closed at 0.25s, though the drawer's own transition rule wasn't isolated and measured directly — treat 0.25s as a strong default, not a confirmed drawer-specific value.

## Hover states

- Global transition duration of `0.25s` found on dozens of interactive elements (nav links, logo, account/search/cart icons, currency selector, sub-menus) — i.e. the theme applies one consistent hover-transition timing sitewide rather than varying it per component. Good pattern to replicate as a single CSS custom property (`--transition-hover: 0.25s`) rather than hardcoding per component.
- Product-card hover specifics (image swap to second photo on hover, swatch reveal) are implied by the "Available in N colors" swatch UI being present inline in the card at rest (not hidden-until-hover), so the swatches themselves are **not** a hover-reveal — they're always visible. Whether the product image itself swaps on hover was **not verified** (no pointer-hover simulation was run against a still image this session).

## Scroll-based effects

- No `data-animation`/AOS-style scroll-reveal library was detected on section elements sitewide — the theme's `animations-true` body class exists but the only animation-library usage actually found (`animate.css`, classes `animate__animated animate__slideInDown`) was on the **cookie-consent banner only**, not on scroll-triggered section reveals. Don't assume scroll-fade-in on every section; it wasn't found where checked (homepage).
- **Sticky add-to-cart bar** on PDP (inferred from duplicate `--sticky` variant inputs): appears once the user scrolls the primary variant selector out of view. Exact scroll-trigger offset not measured.

## Loading states

- Quick View drawer shows a `.loading-overlay` with an inline SVG `.spinner` (rotating spinner, standard CSS animation) while product data loads into the drawer — confirmed present in the `<quick-view>` element's markup.
- No skeleton-loading screens were found elsewhere (collection grid, search results) — Shopify's server-rendered pages don't need one, so a rebuild using SSR/streaming shouldn't need to invent skeletons here either, only for genuinely async pieces (drawers, AJAX cart updates).

## Popups

- Cookie-consent banner: animates in via `animate.css`'s `slideInDown` on load.
- Promo popup and BOGOS free-gift/mix-and-match popups: exist in DOM, hidden by default, presumably fade/scale in on trigger (overlay + boxed content structure is present) — the actual show transition was **not verified** since the trigger condition wasn't met this session.

## Unverified / needs a follow-up pass

- Hero slideshow autoplay interval and easing curve.
- Product-image hover-swap (second photo on hover) — plausible, industry-standard, but not independently confirmed on this store.
- Exact drawer open/close easing curve (linear vs ease vs cubic-bezier) — only the `0.25s` duration is confirmed, not the timing function.
- Whether homepage sections fade/slide in on scroll on any template other than the one checked (homepage) — not checked on collection/PDP/static pages.
