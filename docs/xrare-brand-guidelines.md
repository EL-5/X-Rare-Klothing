# X-Rare Brand Guidelines

## Positioning

X-Rare is a **Liberia-rooted fashion and lifestyle retailer**. It is two
things at once, and the distinction is deliberate:

1. **X-Rare, the label** — the brand's own proprietary fashion line.
2. **X-Rare, the destination** — a curated multi-brand retail platform
   that carries X-Rare alongside selected third-party brands.

The equation that governs every design and product decision:

```
AFRICAN SOUL + EUROPEAN-LEVEL EXECUTION + GLOBAL FASHION CURATION
```

Concretely: photography is African/Liberian, story is Liberian, fashion
curation is global, UX/checkout/performance are held to an international
production standard, typography and product presentation stay premium.

## Statements

Two statements, used consistently, never mixed or replaced with
competing slogans:

| Statement | Used for |
|---|---|
| **Rare by design. Different by nature.** | The X-Rare label specifically — product pages, the label's own marketing, the About page's brand story. |
| **Rooted in Liberia. Curated for the world.** | The X-Rare store/destination as a whole — homepage, Brands directory, the About page's "two stories" section. |

"THE RARE EDIT" is the homepage's campaign framing (hero headline), not a
third slogan — it names the curated content on the homepage, the way a
magazine names an issue's lead feature.

## The meaning of X

Unchanged from the label's original identity — this is foundational and
doesn't get diluted by the multi-brand repositioning:

- **Cross** boundaries.
- **Break** limits.
- **Define** your own identity.

"Rare" is the idea that every person has something unique about them.

## Color system

| Token | Hex | Existing CSS variable |
|---|---|---|
| Black | `#0A0A0A` | `--color-ink` |
| White | `#FFFFFF` | `--color-surface` |
| Cream | `#F5F3EE` | `--color-surface-muted` |
| Red | `#D71920` | `--color-accent` |
| Soft Gray | `#EAEAEA` | `--color-border` |

Ratio target: ~70% white/cream, ~25% black, ~5% red. Red is a micro-detail
accent (labels, dividers, hover states, one CTA per section) — never a
field color, never used for large background areas. No traditional
African color palette (no added greens/golds/patterned color schemes) —
warmth comes from cream, photography, and texture, not from a new color
system layered on top of the existing one. These tokens were already
correct before this pass (see `src/index.css`); this document formalizes
why they stay exactly as they are.

## Typography

International fashion-editorial typography: large uppercase headings,
small tracked-out micro-labels, minimal navigation, clean product
information. No decorative or "African-coded" display typefaces — the
Liberian identity comes through art direction (photography, story,
curation), never through typography or ornament. This mirrors the
existing type scale in `src/index.css` — no changes needed there either.

## Photography direction

Prioritize, in order:

1. Liberian and West African models and creatives.
2. Contemporary urban environments — city life, streetwear, studios,
   coastal environments — shot with international-editorial lighting and
   composition.
3. International models/settings only where the story specifically calls
   for a "global fashion" beat (e.g. a brand spotlight for an
   international label).

Explicitly avoid: flags, traditional costume as decoration, maps, palm
trees as a visual motif, generic "African ornament" patterns, safari
imagery, tribal symbols used without specific cultural context. The test
for every image: does it read as **international fashion editorial**, or
does it read as **tourism photography**? Only the former ships.

All sourced imagery for this pass is real, licensed photography (Unsplash
License — see `docs/image-sources.md` for the running attribution table
started in the visual-merchandising batch), standing in for actual
Liberian campaign photography X-Rare will commission once it exists — the
same "real stand-in, not invented," discipline used throughout this
project's imagery work.

## Brand hierarchy (visual)

- **X-Rare wordmark** — used for the site/store identity (header, footer,
  browser chrome). One wordmark, no separate "store" logo — per the
  brief's own instruction not to create confusing duplicate logos.
- **X-Rare as a brand card** — on `/brands` and inside product
  cards/pages, X-Rare appears as *one brand among the brands X-Rare
  carries*, styled identically to every other brand (same card component,
  same product-card label treatment). The distinction between "the store"
  and "the label" is communicated through content and information
  architecture (the About page's two-stories section, the label having
  its own `/brands/x-rare` page), not through a second visual identity.

## What this pass deliberately did not change

- No new color tokens, no new typeface — the existing system already
  matched the brief's own color/typography requirements.
- No literal "X-RARE THE STORE" vs "X-RARE THE LABEL" dual-logo system —
  the brief itself warns against "confusing duplicate logos."
