# Route Inventory — highfashionbyjol.com

Captured by DOM/link crawl of the live site (Shopify store, theme "Reformation"). Every route below was
observed directly (menu structure, `/collections` index page, in-page links) — none are guessed.

## Core

| Route | Purpose |
|---|---|
| `/` | Homepage |
| `/collections` | Collection index ("Shop by Category" tile grid) |
| `/collections/all` | Canonical all-products collection (Shopify default; linked from empty-cart "Start Shopping") |
| `/search` | Search results (also accepts `?q=` empty for a blank search page) |
| `/cart` | Full-page cart (in addition to the cart drawer) |
| `/account/login` | Redirects to Shopify's hosted new customer-accounts flow at `account.highfashionbyjol.com/authentication/login` (passwordless email sign-in) |
| `/pages/about` | About / brand story |
| `/pages/contact` | Contact page + form |
| `/pages/avada-faqs` | FAQ + Policies accordion page |
| `/pages/become-a-disciple` | Community/loyalty signup ("HF Disciples") |
| `/products/<handle>` | Product detail page (PDP) |

## Collections (all confirmed via nav + `/collections` index)

| Label | Route |
|---|---|
| All Products | `/collections/new-in` |
| New In (promo) | `/collections/new-in-1` |
| Men | `/collections/men` |
| Women | `/collections/women` |
| Accessories | `/collections/accessories-1` |
| Shirts | `/collections/shirts-1` |
| Denim | `/collections/denim-1` |
| Jackets | `/collections/jacket` |
| Shorts | `/collections/short` |
| Pants | `/collections/pants` |
| Hoodies | `/collections/hoodies` |
| Outerwear | `/collections/outer-wear-1` |
| Tops | `/collections/tops` |
| Gown | `/collections/gowns` |
| Skirts | `/collections/skirts` |
| BumShorts | `/collections/bumshorts` |
| Explore More | `/collections/all-products-copy` |
| Best Sellers | `/collections/all-products-copy-1` |
| Featured Products | `/collections/featured-products` |
| Long-sleeves | `/collections/long-sleeves` |
| Bags | `/collections/bags-1` |

Note the duplicate/near-duplicate handles (`new-in` vs `new-in-1`, `all-products-copy` vs
`all-products-copy-1`) — these read as merchant-created homepage-section collections rather than a
clean taxonomy. A rebuild should use a single deliberate category taxonomy (Men/Women × Shirts, Denim,
Jackets, Shorts, Pants, Hoodies, Outerwear / Tops, Gowns, Skirts, Bumshorts / Accessories / Bags) plus
marketing collections (New In, Best Sellers, Featured, Sale) rather than copying the duplication.

## Non-page endpoints (functional, not pages)

| Route | Purpose |
|---|---|
| `/localization` (POST) | Country/currency selector form submission (reloads current page with new locale) |
| `/cart/add`, `/cart/change` (implied by Shopify AJAX cart, not directly observed) | Cart drawer add/update — infer from theme, not independently confirmed this session |
| `/contact#contact_form` (POST) | Both the footer newsletter form and the full contact-page form post here, distinguished by field names (`contact[tags]` for newsletter vs `contact[email]`/`contact[phone]`/`contact[body]` for the contact form) |
| Klaviyo-hosted form (no `action` attr) | "Become a Disciple" signup — client-side JS submit, not a native form post |

## Unknowns / not reached this session

- Individual product handles beyond the few sampled (`hf-embossed-leather-jacket`, `hf-carters-classic-top`) — full catalog not enumerated (225+ products across collections).
- No `/pages/privacy-policy`, `/pages/terms-of-service`, `/pages/refund-policy` links were found as standalone routes — those policies are folded into accordion sections on the FAQ page instead of dedicated Shopify policy pages. Worth double-checking checkout (not reached — would require a real cart + Shopify Checkout, out of scope for a passive audit).
- Wishlist has no dedicated URL — it's a drawer only (`#swym-wishlist`).
