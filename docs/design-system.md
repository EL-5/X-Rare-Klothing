# Design System — highfashionbyjol.com

Source: **Shopify theme "Reformation"** (theme_store_id 1762, schema v5.1.0, installed as "Copy of
Reformation"). All values below are read directly from the live site's computed CSS custom properties
and stylesheets (`app.css`), not estimated.

## Platform / stack (observed)

- **Shopify** (Online Store 2.0, `Shopify.theme` object confirms theme name/id).
- Theme: Reformation (a paid Shopify Theme Store theme; layout patterns below are the theme's, content/imagery is the merchant's).
- Apps detected via injected scripts/CSS: **Swym** (wishlist, "save for later"), **Klaviyo** (email popups/forms, "Become a Disciple" signup), **BOGOS/Secomapp** (free-gift-with-purchase, mix & match promos), a GDPR/cookie-consent widget (`good-apps.co`), Shopify's native pixel/analytics, Shopify's hosted **New Customer Accounts**.
- No product-review app detected on the sampled PDP (no Judge.me/Loox/Stamped markup present).

## Color tokens (from `:root` custom properties)

| Token | Value | Usage |
|---|---|---|
| `--bg-body` | `#ffffff` | Page background |
| `--bg-body-darken` | `#f7f7f7` | Alternate section background |
| `--color-body` | `#151515` | Primary text (near-black, not pure black) |
| `--color-accent` | `#151515` | Accent / links |
| `--color-border` | `#E2E2E2` | Hairline borders |
| `--color-form-border` | `#dedede` | Input borders |
| `--color-announcement-bar-bg` | `#151515` (overridden per-section to `#ff5f15` orange on the live announcement bar) | Announcement bar |
| `--color-announcement-bar-text` | `#ffffff` | Announcement bar text |
| `--color-header-bg` | `#000000` | Header bar |
| `--color-header-text` / `--color-header-links` / `--color-header-icons` | `#ffffff` | Header foreground |
| `--color-header-border` | `#E2E2E2` | Header divider |
| `--solid-button-background` | `#151515` | Primary (solid) button fill |
| `--solid-button-label` | `#ffffff` | Primary button text |
| `--outline-button-label` | `#151515` | Secondary (outline) button text |
| `--color-price` | `#151515` | Price text |
| `--color-star` | `#FD9A52` | Rating stars (unused — no reviews app active) |
| `--color-inventory-instock` | `#279A4B` | In-stock indicator (green) |
| `--color-inventory-lowstock` | `#FB9E5B` | Low-stock indicator (orange) |
| `--color-badge-sold-out` | `#939393` | "Sold out" badge |
| `--color-badge-sale` | `#151515` | "Save X%" badge |
| `--color-badge-text` | `#ffffff` | Badge text |
| `--color-footer-bg` | `#151515` | Footer background |
| `--color-footer-text` / `--color-footer-link` | `#ffffff` | Footer foreground |
| `--color-footer-border` | `#444444` | Footer dividers |

**Reading:** near-monochrome brand palette — black header/footer, off-black (`#151515`) body text on
white, one loud accent color (orange `#ff5f15`) reserved for the promotional announcement bar/badges.
Sale badges are black-on-white rather than red, which is a deliberate restrained-luxury choice worth
preserving in a clone rather than defaulting to a typical red "SALE" badge.

## Typography

- **Observed font stack:** `"Noto Sans Japanese", sans-serif` for body, headings, nav, buttons, and prices alike — i.e. the theme is using one font family site-wide with weight variation (400/500/600/700), not a heading/body pairing. 656 font-face variants were registered by the browser (heavy Google Fonts / Noto subsetting for multi-script support), but only the Latin subset is visibly used.
- Font-size scale observed: body/nav ≈ 12–14px, section headers (`h2`, e.g. "BEST SELLERS") ≈ 12px @ 600 weight with generous `line-height: 42px` (the visual size comes from spacing, not font-size), product titles ≈ 17px.
- `text-transform` is controlled by three theme-level body classes rather than per-element CSS: `button-uppercase-true`, `navigation-uppercase-true`, `product-title-uppercase-true` — i.e. buttons, nav links, and product titles are uppercased globally via a theme setting toggle, and this is a clean, reusable pattern worth replicating (one design-system flag instead of scattered `text-transform: uppercase`).
- `--font-body-scale`, `--font-heading-scale`, `--font-navigation-scale`, `--font-product-title-scale` are all `1.0` — the theme ships a font-scale slider (merchant-adjustable) currently left at default.
- Letter-spacing: body/heading `0em` (none), buttons `0.02em`.

## Spacing / layout

- `--section-spacing-mobile: 50px`, `--section-spacing-desktop: 90px` — vertical rhythm between homepage sections.
- `--button-border-radius: 0px` — square-cornered buttons throughout (matches the "restrained luxury" look).
- `--badge-corner-radius: 4px` — badges get a slight rounding, contrasting with square buttons.
- `--logo-height: 30px` (desktop and mobile identical).

## Breakpoints (extracted from `app.css` media queries — not guessed)

| Breakpoint | Raw value | What changes at it |
|---|---|---|
| ~767/768px | `max-width:767px` / `min-width:48em` (768px) | Mobile ↔ tablet: product grid goes from 2-up to 4-up (`small-up-2 medium-up-4` grid classes) |
| 1068px | `min-width:1068px` | Header switches from the mobile hamburger/off-canvas drawer to the full inline mega-nav (confirmed live: nav is hidden at 1024px width, visible at 1080px) |
| 1200px | `min-width:1200px` | Large-desktop container/spacing adjustment |
| 66.75em (~1068px) | `min-width:66.75em` | Duplicate of the 1068px rule expressed in em (theme uses a mix of px and em queries) |

Grid system is **not** CSS Grid — product listings use a Foundation-style flexbox grid with utility
classes (`row`, `small-up-2`, `medium-up-4`), and homepage product rows are **Flickity carousels**
(`.products.row.carousel.flickity-enabled`), not static grids — see `interaction-map.md` and
`animation-inventory.md`.

## Buttons

- Two variants only: **solid** (black fill, white uppercase label, square corners) and **outline**
  (transparent fill, black label/border). No visible tertiary/ghost/link-style CTA button was found
  beyond plain text links.
- Buttons observed: `ADD TO CART` (solid), `BUY IT NOW` (outline, Shopify accelerated checkout), `ADD TO WISHLIST` (text/icon), `SHOP NOW` (solid), `SEND MESSAGE` (solid), `SUBMIT` (solid, Become a Disciple form), `CONTINUE SHOPPING` (solid, empty-cart state), `Start Shopping` (solid, empty-cart alt), `APPLY`/`CLEAR` (filter drawer).

## Product card

- Image, "SAVE N%" badge (top-left) or "SOLD OUT" badge, a `QUICK VIEW` overlay label, title (uppercase), strikethrough original price + sale price, and inline color swatches with an "Available in N colors" caption when the product has color variants. This card is reused identically across the homepage carousels, collection grids, and search results.

## Unknowns

- No live screenshot capture was possible this session (the embedded browser pane did not composite frames for screenshot calls), so exact pixel spacing, shadow/blur values, and precise imagery art direction were **not** visually verified — everything above comes from computed CSS/DOM inspection, which is reliable for tokens but should be spot-checked visually before final sign-off.
- Dark mode: no evidence of a dark theme (single color-token set, no `prefers-color-scheme` handling found).
