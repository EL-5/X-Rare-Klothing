# Responsive Map — highfashionbyjol.com

## Methodology note

The embedded browser pane in this session could not composite frames for pixel screenshots (every
`screenshot` call timed out with "the Browser pane is not displayed"), so this map is built from **two
reliable non-visual sources** instead of eyeballing 9 widths × 10 pages by screenshot:

1. **Source-of-truth CSS breakpoints**, extracted directly from the live `app.css` via `fetch()`:
   `max-width:767px`, `min-width:48em` (768px), `min-width:66.75em`/`1068px`, `min-width:1200px`.
2. **Live viewport resize + computed-style checks** at representative widths (375, 1024, 1080) to confirm
   which breakpoint actually flips which component, done via `resize_window` + `getComputedStyle`.

This is more precise than a visual skim for *where* things change, but does not capture exact spacing/
image-crop/typography-scale shifts at every one of the 9 requested widths — that final visual pass
should be done with a working screenshot tool before implementation sign-off (flagged as an unknown at
the end).

## Breakpoint table

| Width bucket | CSS trigger | Confirmed effect |
|---|---|---|
| **320–767px** (mobile: 320, 375, 390, 414) | below `768px` | Off-canvas mobile nav (drill-in submenu pattern); product grids render 2-up (`small-up-2`); hero slideshow uses its mobile height class (500px) |
| **768–1067px** (tablet: 768, and 1024 falls here too) | `min-width:768px` fires, but `min-width:1068px` has not | Product grids switch to 4-up (`medium-up-4`); **nav is still off-canvas** — confirmed live at 1024px width the desktop `.thb-full-menu` container is `display:none`. Tablet gets the wide grid but keeps the mobile-style nav; this in-between zone is real, not a guess. |
| **1068px+** (desktop: 1280, 1440, 1920, and 1024→1080 crossover) | `min-width:1068px` | Full inline mega-nav appears — confirmed live: `display:flex` at 1080px vs `display:none` at 1024px, an 8px-precision confirmation of the exact flip point |
| **1200px+** | `min-width:1200px` | Additional large-desktop container/spacing rule in `app.css` (rule content not fully diffed against sub-1200 state this session — flagged below) |

## Per-requested-width notes

| Width | Bucket | Notes |
|---|---|---|
| 320px | mobile | Below the theme's typical minimum tested width; 2-col grid and off-canvas nav apply, but this is the tightest fit — worth an explicit real-device check for overflow on long product titles/prices in the rebuild. |
| 375px | mobile | Verified live (this is the width the resize checks were run at). 2-col grid, off-canvas nav, mobile hero height. |
| 390/414px | mobile | Same bucket as 375px — no distinct breakpoint between 320–767px was found in the CSS, so these should render identically to 375px modulo safe-area/viewport differences. |
| 768px | tablet crossover | `min-width:768px` fires exactly here — 4-col grid begins, nav is still mobile-style (confirmed the nav switch is a separate, later breakpoint at 1068px, not 768px — an easy mistake to make when cloning). |
| 1024px | tablet | Confirmed live: still mobile/off-canvas nav (`display:none` on desktop nav container), 4-col grid active. |
| 1280px | desktop | Full desktop nav + grid; above both the 1068px and 1200px triggers. |
| 1440px | desktop | Same bucket as 1280/1920 — no breakpoint was found between 1200px and typical desktop widths, so layout should be static (centered max-width container) from 1200px up. |
| 1920px | wide desktop | Same as above — content is presumably centered in a max-width container rather than stretching edge-to-edge, consistent with the luxury-brand aesthetic, but the container's exact `max-width` value was not read this session. |

## Component-level responsive behavior

- **Header:** black bar persists at all widths; logo height is identical mobile/desktop (`--logo-height` = `--logo-height-mobile` = 30px, i.e. no responsive logo scaling token exists — worth deciding deliberately in the rebuild rather than copying a possibly-unintentional non-scaling logo).
- **Nav:** off-canvas drawer (<1068px) → inline mega-menu (≥1068px), see breakpoint table.
- **Product grid:** 2-up (<768px) → 4-up (≥768px). No 3-up tablet-specific step was found — it jumps straight from 2 to 4.
- **Hero slideshow:** explicit `mobile-height-500` vs `desktop-height-1080` classes — a fixed-height crop swap rather than fluid aspect-ratio scaling.
- **Homepage product rails:** Flickity carousels resize their visible-slide count responsively (typical Flickity `cellAlign`/`groupCells` behavior) — exact visible-count-per-width was not measured live.
- **Filter/sort panel:** two separate DOM renders exist (`facets-desktop-container` vs `facets__mobile_form`) rather than one panel that repositions via CSS — confirms the theme intentionally forks markup for mobile vs desktop filters rather than reusing one responsive component.

## Unknowns / follow-up required

- Exact `max-width` of the desktop content container above 1200px (needed to know whether 1440px/1920px add side padding or just center the same fixed width).
- Visual confirmation of image crops/art-direction changes between mobile and desktop hero images (theme supports separate mobile/desktop image fields in Reformation, but which specific images are set per-breakpoint here wasn't visually diffed).
- True pixel screenshots at all 9 requested widths — blocked this session by the browser pane not compositing frames for `screenshot()`. Retry with a working screenshot path before final visual sign-off.
