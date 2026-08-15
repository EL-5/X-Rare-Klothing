# X-Rare Multi-Brand Architecture

## What existed before this pass

`products.brand` was a plain nullable free-text column, always literally
the string `"X-Rare"` for every one of the 8 seeded products — a
placeholder that assumed a single-brand catalog. This pass replaces it
with a real relational model.

## Schema

```
brands
  id            uuid primary key
  name          text
  slug          text unique
  logo          text          -- URL, nullable
  cover_image   text          -- URL, nullable
  description   text          -- nullable
  country       text          -- nullable, e.g. "Liberia"
  website       text          -- nullable
  is_published  boolean       -- default true
  is_featured   boolean       -- default false
  created_at / updated_at

products
  brand_id      uuid references brands(id) on delete set null   -- new
  -- (brand text column dropped — see migration 0046)
```

`on delete set null` rather than `on delete cascade`: deleting a brand
should never delete its products, it should just leave them
unbranded — an admin can then reassign them.

## RLS

Mirrors the existing `pages`/`categories`/`faqs` pattern exactly — no new
pattern invented:

- `Public can read published brands` — `is_published or
  has_any_role(content staff)`.
- `Content staff manage/update/delete brands` — insert/update/delete
  gated to `content_manager`, `admin`, `super_admin`.
- `audit_brands` trigger — every insert/update/delete is logged through
  the existing generic `log_audit_event()` function, same as every other
  sensitive table.

## Read path

`productRepository.hydrate()` already batch-fetches variants and images
for a page of products; this pass adds a third batch fetch,
`fetchBrands(brandIds)`, following the exact same shape (one `.in('id',
ids)` query, mapped into a `Map<string, BrandSummary>`, joined in
memory) — no N+1 queries, no new query pattern. `cartRepository.buildCart`
gets the equivalent treatment so cart line items carry brand too.

`Product.brand` changed type from `string | null` to `BrandSummary | null`
(`{ id, name, slug }`) — deliberately a summary, not the full `Brand`
shape, since every read path that needs a product's brand only ever needs
enough to render a label and a link, never the brand's full description/
logo/cover image. Fetching the full `Brand` (via `brandService.getBySlug`)
happens exactly once, on the brand's own page.

## Write path

`AdminProductDetail.tsx`'s free-text "Brand" input became a `<select>`
populated from `brandService.listSummaries()` — an admin can no longer
type an arbitrary brand name into a product; they pick from brands that
actually exist, which is the entire point of making this relational.
`ProductFormInput.brand: string` became `ProductFormInput.brandId: string
| null`.

## Storefront surfaces touched

| Surface | Change |
|---|---|
| `ProductCard` | Brand name shown above the product title. |
| `ProductInformation` (PDP) | Brand name is now a clickable link to `/brands/:slug`, not plain text. |
| `Cart` (`cartRepository.buildCart`) | Line items carry `product.brand`, ready for a brand-grouped cart view once there's more than one brand per cart to make that grouping meaningful. |
| `Search` / `Shop` listing | `ListProductsParams.brandSlug` filters the product query by brand, exactly parallel to the existing `collectionSlug`/`categorySlug` filters. |
| New: `/brands` | Directory — featured brands, then all brands, an honest "just getting started" note when there's only one. |
| New: `/brands/:slug` | A brand's own storefront (hero, story, full catalog) reusing `useProductListing({ brandSlug })` and the existing `ProductGrid`/`QuickViewDrawer` — no bespoke grid implementation. |
| New: `AdminBrands.tsx` | Full CRUD, publish/feature toggles, product-count-per-brand (computed from a single grouped query, not N+1). |

## Order confirmation / order line items

Not changed in this pass. `order_items` already snapshots
`product_name`/`variant_sku`/price at the moment of purchase (so a later
product edit or deletion can't retroactively alter historical order
data) — adding a `brand_name` snapshot column to that same historical
record is a natural, low-risk follow-up, deferred here to keep this
pass's blast radius to the systems that needed to change for the
storefront-facing multi-brand experience to actually work end-to-end
today.

## Future marketplace capabilities the schema doesn't block

The brief explicitly asks the architecture not to prevent an eventual
creative-ecosystem platform (designers, photographers, stylists,
independent labels self-managing their own presence). Nothing in this
schema forecloses that:

- `brands` is already a first-class entity independent of `profiles` —
  adding a `brands.owner_profile_id` column later to let a brand manage
  its own catalog is additive, not a redesign.
- RLS policies are already role-based (`has_any_role`), so a future
  `brand_manager`-style scoped role (a brand can only edit *its own*
  brand row and *its own* products) is a policy change, not a new
  authorization model.
- `is_featured`/`is_published` already give admins editorial control over
  which brands surface where, which is the same lever a "brand
  application/approval" flow would need.

None of this is built now — it's flagged here so the next batch doesn't
have to re-derive that the schema was already designed with it in mind.
