# Image Audit — Visual Merchandising Pass

Final QA pass after implementing docs/image-content-plan.md, run live
against the dev server and the hosted database, not just read from source.

## What changed

- Every `picsum.photos` random-seed placeholder in the database was
  replaced with real, licensed fashion photography: 9 existing product
  images (updated in place) + 7 new secondary product images, 3 hero
  slides, 2 promotional banners.
- 3 top-level categories (Men, Women, Accessories) and 4 collections went
  from `image = null` to real cover photos.
- About and Contact — previously plain text pages with zero imagery — got
  a hero/banner and, for About, a second image/text split section.
- Collection detail pages (`/collections/:slug`) gained a cover-image
  banner they never had before (`Shop.tsx`, collection scope).
- A reusable `OptimizedImage` component (skeleton while loading, branded
  "Image unavailable" fallback on error instead of a broken-image icon,
  explicit width/height to reserve layout space) now backs every new
  surface, and replaced ad-hoc `<img>` tags in `CategoryGrid` and
  `Collections.tsx`.
- A reusable `CategoryCard` component replaced inlined markup in
  `CategoryGrid`, adding a gradient overlay and a description reveal on
  hover (desktop) — no behavior change on mobile, which never depended on
  hover.
- `AdminCategories.tsx` gained an Image URL field with live preview and a
  thumbnail column in the category table (previously had no image
  management at all). `AdminCollections.tsx` already had this.

## Checks performed

**Broken/distorted images.** Every one of the 26 distinct source photos
used was verified with a live `fetch()` against its exact rendered URL
(including crop/resize query params) — all returned `200 image/jpeg`, both
before wiring them in and again after, reading straight from the rendered
DOM's `<img src>` values on the homepage, About, Contact, PDP, and a
collection page. Zero images reported `naturalWidth === 0` on a loaded
element (the definition of a broken image) anywhere checked.

**Layout shift / overflow.** `document.documentElement.scrollWidth` vs
`clientWidth` checked on Home, About, Contact, a collection page (new
cover banner), and a PDP at 375px (mobile) and 1280px (desktop) — no
horizontal overflow on any of them. All new images pass explicit
`width`/`height` (via `OptimizedImage`) so the browser reserves the
correct aspect-ratio box before the image arrives.

**Alt text.** Every new database-seeded image row got real, descriptive
alt text (e.g. "Model wearing a blue denim coach jacket with a black cap",
not "coach-jacket.jpg") — see the values written by
`0042_visual_merchandising_images.sql` and `src/data/images.ts`. Purely
decorative images (hero backgrounds, category/collection cover overlays,
About/Contact banners) use empty `alt=""`, correct per WCAG since the
heading text layered on top already conveys the meaning.

**Regression check.** Full guest flow re-verified after the image changes:
homepage loads and renders the hero/category grid/banners with the new
images, PDP shows both gallery images with working color-variant
selection, add-to-cart still works, no new console errors on a fresh tab
at `/`, `/about`, `/contact`, `/collections/best-sellers`, or
`/products/coach-jacket`.

**A real accessibility regression was caught and fixed during this pass**:
the initial About page rewrite accidentally dropped the page's only
`<h1>` (converted it to a `<p>` while restructuring the hero). Caught by
checking `document.querySelectorAll('h1').length` live rather than
trusting the diff — fixed before this doc was written, re-verified
`h1Count === 1`.

## Performance

- Hero and page-banner images (above the fold) load `eager` with no lazy
  delay; everything else (`CategoryCard`, `Collections` grid, `ProductCard`,
  `ProductGallery`) stays `loading="lazy"`, unchanged from Batch 20's
  existing pattern.
- Unsplash's CDN serves `auto=format` (WebP/AVIF negotiated by the browser
  automatically) and `q=80`, and every image is requested at the exact
  pixel size it's displayed at (`w`/`h` query params matched to the
  component's rendered box) rather than shipping a full-resolution source
  and scaling down client-side.
- No new render-blocking resources — `OptimizedImage`'s skeleton is a CSS
  `animate-pulse`, not a JS-computed placeholder.

## Placeholder / follow-up items

- Subcategory `category.image` values remain `null` — no UI surface
  renders them today (see image-content-plan.md's "why category imagery
  stops at the top level"). Not a gap in this pass; there's nothing to
  populate that would ever be seen.
- All sourced imagery is real licensed stock photography of the right
  *subject* (a jacket product shows a jacket, a denim product shows denim)
  but is necessarily not photography of this specific demo catalog's exact
  garments, since those don't physically exist. Swapping in real product
  photography later requires only editing `src/data/images.ts` and the
  corresponding migration/seed values — no component changes, per the
  "central image system" requirement.
- Two low-value leftovers from this session's earlier live database
  testing remain in the `orders` table (one test order from a payment
  concurrency check) — unrelated to this batch, noted for completeness,
  not something this pass touched or needed to clean up.

## Summary counts

| Metric | Count |
|---|---|
| Distinct source photos used | 26 |
| Product images replaced/added | 16 (8 products × 2) |
| Categories with a cover image | 3 of 23 (all top-level ones a UI surface renders) |
| Collections with a cover image | 4 of 4 |
| Homepage hero slides | 3 |
| Homepage promotional banners | 2 |
| Editorial/page images (About ×2, Contact ×1) | 3 |
| Pages that went from zero imagery to having a hero/banner | 2 (About, Contact) |
| New reusable components | 2 (`OptimizedImage`, `CategoryCard`) |
| Broken images found | 0 |
| Accessibility regressions found and fixed during this pass | 1 (missing About `<h1>`) |
