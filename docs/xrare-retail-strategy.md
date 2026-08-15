# X-Rare Retail Strategy

## The customer experience shift

Before this pass, every surface communicated "this is where I buy
X-Rare." The retail strategy is to shift that to "this is where I
discover fashion" — emphasizing curation, brands, and editorial framing
over a single-label catalog feel, without pretending the catalog is
bigger or more diverse than it actually is today.

## Homepage sequence

The homepage (fully admin-configurable via `homepage_sections`, unchanged
mechanism) now runs:

```
HERO ("The Rare Edit")
  ↓
BEST SELLERS (product carousel)
  ↓
X-RARE (banner → /brands/x-rare)
  ↓
NEW IN (product carousel)
  ↓
SHOP BY CATEGORY
  ↓
THE BRANDS WE CURATE (banner → /brands)
  ↓
ACCESSORIES (product carousel)
  ↓
TRACKSUITS (banner)
  ↓
FEATURED PRODUCTS (product carousel)
  ↓
OUR STORY (editorial marquee)
  ↓
EXPLORE MORE (product carousel)
```

This is the brief's own suggested rhythm (hero → new in → X-Rare →
local/global → the edit → trending → brands → editorial → final CTA),
adapted to the sections that already exist in this codebase's homepage
builder rather than inventing a parallel section system. "Local / Rare"
and "Global Picks" as two separate sections were **not** built as
distinct homepage blocks — see the multi-brand architecture doc for why:
with exactly one real brand onboarded, a "From Everywhere" section would
either be empty or dishonestly padded. The single "Brands We Curate"
banner is the version of this idea that's true today; it becomes a real
two-column "From Home / From Everywhere" split the moment a second,
non-Liberian brand is onboarded (the `brands.country` field already
carries what's needed to build that split later — see the architecture
doc).

## Merchandising labels

The brief lists a set of editorial merchandising labels (Our Picks, The
Rare Edit, Staff Picks, New to X-Rare, Trending, Essentials, Limited,
Local Spotlight, International Picks). This codebase's existing
`collections` system is exactly this mechanism — "New In," "Best
Sellers," "Summer Sale," and "Featured Products" are already curated,
named, editorial collections a product can belong to regardless of
brand. No new data model was needed here: **a collection is already
brand-agnostic** (`collection_products` links a product, not a brand), so
"THE MONROVIA EDIT" or "AFTER DARK" are collections an admin can create
today through `AdminCollections.tsx`, and they'll correctly mix X-Rare
with any future brand's products the moment more than one brand exists.

## Brand discovery

- `/brands` — the directory. Featured brands, then all brands, gracefully
  degrading to an honest "we're just getting started" note when (as
  today) there's only one.
- `/brands/:slug` — a brand's own storefront: hero, story, full product
  grid, reusing the exact same grid/filter/sort/pagination shell as
  `/shop` (`useProductListing`) rather than a bespoke implementation.
- Every product card and product detail page shows its brand, and the
  brand name is a link to that brand's page (see the architecture doc for
  the exact data flow).
- Search and the product listing API both accept a brand filter
  (`brandSlug` on `ListProductsParams`) — wired end-to-end, ready for a
  visible brand filter UI in `FilterPanel` the moment there's more than
  one brand to filter by. Building that UI today, with one brand, would
  be a filter control with a single always-selected option — deferred as
  genuinely not useful yet, not as a missing feature.

## Payments, shipping, currency — deliberately unchanged this pass

- **Currency**: pricing stays in USD, matching the brief's own fallback
  instruction ("if the business primarily prices in USD, preserve that
  configuration rather than inventing a new pricing model"). `Money`
  (`{ cents, currency }`) already carries a currency code end-to-end, so a
  real multi-currency `currencyService` is additive work, not a
  rearchitecture, whenever LRD/GHS/NGN pricing is actually configured.
- **Payments**: Card, Paystack, and Flutterwave are the three real,
  already-implemented providers (`src/components/checkout/
  PaymentMethodSelector.tsx`) — this matches the brief's own examples and
  needed no changes. Mobile-money and bank-transfer support ride on top
  of Paystack/Flutterwave's own provider capabilities once those
  integrations go live end-to-end, not as separate X-Rare-side providers.
- **Shipping**: `shipping_zones`/`shipping_methods` already model Ghana
  (Accra/Tema/Other Ghana) and an International zone with real
  configured rates and delivery windows — the exact "configurable zones,
  not hard-coded prices" architecture the brief asks for already existed
  and was left alone. Adding a dedicated Liberia zone (vs. folding it
  into "International" as today) is a content change for whoever manages
  shipping config, not a schema change.
- **Checkout addresses**: `addresses` already uses a generic
  address1/city/region/postal_code/country_code shape with `postal_code`
  nullable — it was never hard-coded to a European format, so no
  Liberia-specific field additions were needed.

## What "done" looks like for this pass vs. what's future work

**Done**: real `brands` table and admin CRUD, `/brands` and
`/brands/:slug`, brand shown on every product card/PDP/cart/order line,
brand-aware product listing API, homepage repositioned around discovery
rather than a single-label feed, About/Contact/FAQ updated to explain the
multi-brand model honestly.

**Future work, intentionally not built now** (see the architecture doc's
"future marketplace capabilities" section for the full list): a visible
brand filter control, a true "From Home / From Everywhere" homepage
split, brand-level shipping-rule differentiation, a self-service brand
submission flow beyond the Contact page's "Brand Partners" card, and a
real multi-currency `currencyService`. None of these were skipped because
they're hard — they were skipped because building UI or logic around data
that doesn't exist yet (a second real brand, a confirmed non-USD pricing
requirement) would be exactly the kind of invention the brief itself
warns against.
