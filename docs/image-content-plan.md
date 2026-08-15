# Image Content Plan

Written before sourcing began, to map every real UI surface that needed
imagery — not the full list of section names the spec enumerated in the
abstract, since several of those (a dedicated Membership/Disciple page,
subcategory grids beyond Men/Women/Accessories) don't exist as rendered
surfaces in this codebase. Scope here is "what a shopper or admin can
actually see," verified against the live component tree before any image
was sourced (see final-architecture-review discipline: don't assume, check).

| # | Purpose | Subject | Surface | Orientation | Aspect ratio | Source | Status |
|---|---|---|---|---|---|---|---|
| 1 | Homepage hero, slide 1 | Tailored campaign look — "New Season" | `HeroCarousel` desktop + mobile crop | Landscape (desktop) / portrait (mobile) | 2:1 / 4:5 | Unsplash | Done |
| 2 | Homepage hero, slide 2 | Runway/campaign — "Best Sellers" | `HeroCarousel` desktop + mobile crop | Landscape / portrait | 2:1 / 4:5 | Unsplash | Done |
| 3 | Homepage hero, slide 3 | Campaign look — "Summer Sale" | `HeroCarousel` desktop + mobile crop | Landscape / portrait | 2:1 / 4:5 | Unsplash | Done |
| 4 | Promo banner | "New Releases" | `PromotionalBanner` | Landscape | 14:9 | Unsplash | Done |
| 5 | Promo banner | "Tracksuits" | `PromotionalBanner` | Landscape | 14:9 | Unsplash | Done |
| 6 | Category cover ×3 | Men / Women / Accessories | `CategoryGrid` → `CategoryCard` | Portrait | 4:5 | Unsplash | Done |
| 7 | Product gallery, front | All 8 active products | `ProductGallery`, `ProductCard` | Portrait | 4:5 | Unsplash | Done |
| 8 | Product gallery, secondary | All 8 active products | `ProductGallery`, `ProductCard` hover-swap | Portrait | 4:5 | Unsplash | Done |
| 9 | Collection cover ×4 | New In / Best Sellers / Summer Sale / Featured | `Collections` index, `Shop` (collection scope) cover banner | Portrait source, cropped to landscape banner on the cover | 4:5 source | Unsplash | Done |
| 10 | About page hero | Brand-story portrait | `About.tsx` full-width banner | Landscape | ~16:9 | Unsplash | Done |
| 11 | About page secondary | Brand-story portrait | `About.tsx` image/text split section | Portrait | 4:5 | Unsplash | Done |
| 12 | Contact page banner | Boutique interior | `Contact.tsx` top banner | Landscape (wide, short) | ~3.2:1 | Unsplash | Done |
| 13 | Subcategory images (Denim, Jackets, Hoodies, Tops, Skirts, etc.) | — | No current surface renders subcategory images — `CategoryGrid` filters to `parentId === null` only | — | — | — | **Not sourced — no rendering surface exists** |
| 14 | Membership/Disciple landing page | — | This app has no such route (`FAQ`/`About`/`Contact` exist instead) | — | — | — | **N/A — page doesn't exist in this codebase** |
| 15 | Editorial marquee section | "Our Story" brand strip | `EditorialSection.tsx` | — | — | — | **Intentionally text-only** — reuses the announcement-bar scrolling-text mechanism by design (see component's own doc comment); adding a background image would fight the marquee's typographic effect |

## Why category imagery stops at the top level

`CategoryGrid.tsx` (the homepage "Shop By Category" section) explicitly
queries `categories.filter(c => c.parentId === null)` — only Men, Women,
and Accessories render. No mega-menu, filter sidebar, or subcategory page
in this codebase displays a `category.image` for the 20 subcategories
(T-Shirts, Denim, Jackets, Hoodies, Outerwear, Tops, Skirts, Pants, Sets,
Tracksuits, Beanies, Caps, Bags, Socks, etc.). Populating those columns
with stock imagery they'd never display would be scope creep against a
"don't place images where they serve no purpose" brief — the spec itself
says every image must belong to what's being displayed, and an unused
database column isn't a display. The `image` column stays available and
admin-editable (`AdminCategories.tsx` now has an Image URL field with
preview) for whenever a subcategory browsing surface is built.

## Product image count: 2, not up to 5

The spec lists front/back/side/detail/lifestyle as available slots but
only requires "Primary image" and "Secondary image" — everything past that
is explicitly optional ("where appropriate"). Given 8 products × up to 5
images is 40 individually-curated photos versus 16 for a front+secondary
pass, and the marginal shopper-facing benefit of a 5th angle on a t-shirt
in a demo catalog is low, every product got exactly 2: enough for the
gallery to feel real and for the card hover-swap (`ProductCard.tsx`) to
actually activate, which it couldn't before this batch (7 of 8 products
had only 1 image).

## Placeholder status

None of the images shipped in this batch are placeholders in the "fake,
needs replacing" sense — they're real, licensed stock photography, not
gray boxes or `picsum.photos` random seeds (which is what they replaced).
They are still stand-ins for real product photography of this specific
brand's actual garments, which doesn't exist yet since these are demo
products. When real photography is available, replace the URL in
`src/data/images.ts` and the corresponding `supabase/migrations/` seed —
no component changes required, by design (see "central image system" in
the batch spec, section 3).
