# Reference Website Forensic Audit — highfashionbyjol.com

**Audited:** 2026-08-13, via direct DOM/CSS/network inspection of the live site (no guessing — every
claim below was read from the live page). Screenshot capture was unavailable this session (see
Methodology), so this audit leans on computed styles, DOM structure, and live state-changes (clicking
elements and reading the resulting class/DOM diff) rather than visual review. That gap is called out
explicitly wherever it matters, and should be closed with a visual pass before implementation begins.

**Companion documents** (this file is the narrative; these are the structured references):
[routes.md](routes.md) · [design-system.md](design-system.md) · [component-inventory.md](component-inventory.md) · [interaction-map.md](interaction-map.md) · [responsive-map.md](responsive-map.md) · [animation-inventory.md](animation-inventory.md)

## Platform identification

The site is **Shopify** (Online Store 2.0), running the paid theme **"Reformation"** (Shopify Theme
Store id 1762, installed under the name "Copy of Reformation", schema v5.1.0). Apps detected: Swym
(wishlist), Klaviyo (popups/forms/email), BOGOS/Secomapp (free gift & mix-and-match promotions), a
GDPR/cookie-consent widget, and Shopify's hosted New Customer Accounts. This matters for the rebuild:
the *layout and interaction patterns* below are the "Reformation" theme's, and should be reimplemented
generically rather than treated as this specific merchant's bespoke design — the merchant's actual
brand contribution is the copy, imagery, product catalog, and the near-monochrome color choice.

---

## Homepage (`/`)

- **Purpose:** brand landing page, drives into Shop and highlights promos/best sellers.
- **Layout (top to bottom):** Announcement bar (marquee) → Header (logo, nav, icons) → Hero slideshow (Flickity, fade transition, mobile/desktop heights of 500px/1080px) → "BEST SELLERS" carousel → "NEW IN" heading + carousel → Category promo tiles (SHIRTS/OUTERWEAR/JACKETS/ACCESSORIES image blocks) → "ACCESSORIES" carousel → "MORE FEATURED PRODUCTS" carousel → "NEW RELEASES" / "TRACKSUITS" full-bleed image-with-text-overlay promo blocks → "EXPLORE MORE" carousel → Footer.
- **Components:** AnnouncementBar, SiteHeader, MegaMenu/MobileDrawer, HeroSlideshow, FeaturedCollectionCarousel (×5, reused), CategoryPromoBlock, ProductCard/QuickView, SiteFooter, NewsletterSignup, CookieConsentBanner, PromoPopup (hidden by default). Full detail in [component-inventory.md](component-inventory.md).
- **Typography:** single font family site-wide (`"Noto Sans Japanese", sans-serif`), uppercase enforced via theme-level body classes rather than per-element CSS. See [design-system.md](design-system.md).
- **Images:** Shopify CDN-hosted (`/cdn/shop/files/...`), served with `?width=` query params (responsive `srcset` pattern) — 375px images requested at mobile viewport, 1400px at desktop.
- **Buttons:** solid black "SHOP NOW"/"EXPLORE NOW" CTAs, square corners, uppercase.
- **Links:** every product card, category tile, and hero slide is a link into a collection or product.
- **Forms:** none directly on the homepage besides the footer newsletter form (shared with all pages).
- **Animations:** marquee ticker (announcement bar), Flickity fade-crossfade hero, Flickity drag carousels for every product rail (not a static grid). See [animation-inventory.md](animation-inventory.md).
- **Hover states:** 0.25s transition applied broadly to interactive elements (confirmed via computed styles); product-image hover-swap plausible but **not verified**.
- **Click behavior:** cart icon → opens cart **drawer** in place (no navigation); "QUICK VIEW" → opens product **drawer** (same SidePanel primitive as cart); nav "SHOP" → mega-menu flyout (desktop) or drill-in submenu (mobile).
- **Mobile behavior:** off-canvas nav drawer, 2-col grid, 500px hero height, carousels still draggable/swipeable.
- **Tablet behavior (768–1067px):** grid becomes 4-col but nav **stays mobile-style** until 1068px — a real in-between zone, confirmed live.
- **Desktop behavior (≥1068px):** full inline mega-nav, 4-col grid, 1080px hero height.
- **Loading states:** Quick View drawer shows a spinner overlay while product data loads.
- **Empty states:** N/A (always has content).
- **Error states:** not observed (no broken states triggered).

---

## Collections index (`/collections`)

- **Purpose:** category-browse hub ("SHOP BY CATEGORY").
- **Layout:** header → "SHOP BY CATEGORY" grid of image tiles (Explore More, Best Sellers, All Products, New In, Shirts, Outer Wear, Women, Featured Products, Long-sleeves, Shorts, Accessories, Gowns, Jackets, Denim, Bags) → footer.
- **Components:** CollectionTile grid (image + label), reusing the same visual language as CategoryPromoBlock on the homepage.
- **Forms/animations/hover:** none beyond the standard header/footer chrome; tile hover not verified visually.
- **Mobile/tablet/desktop:** tile grid presumably reflows column count with viewport (exact column counts at this specific template not independently measured — extrapolated from the same grid utility classes used elsewhere).

---

## Collection / category pages (e.g. `/collections/new-in`, `/collections/shirts-1`, `/collections/men`)

- **Purpose:** product listing per category.
- **Layout:** breadcrumb (Home / Shop / [Category]) → H1 category name → "FILTER AND SORT" bar (live result count + Availability facet + Sort dropdown) → product grid → "Load more" button.
- **Components:** Breadcrumb, FilterAndSortBar (rendered twice — desktop sidebar + mobile drawer variants), ProductGrid, LoadMore, ProductCard/QuickView.
- **Typography/Images/Buttons:** shared with homepage (see design-system.md); ProductCard badge = "SAVE N%" or "SOLD OUT".
- **Forms:** the filter form (Availability checkbox + Sort select), Clear/Apply actions.
- **Animations:** none beyond standard hover transitions; grid itself is static (not a carousel) here, unlike the homepage rails.
- **Click behavior:** "Load more" appends more products (AJAX-append is the standard Shopify/Reformation pattern; not independently triggered/observed this session).
- **Mobile:** 2-col grid, filters collapse into a drawer form.
- **Tablet/Desktop:** 4-col grid; filter sidebar visible inline on desktop.
- **Empty state:** not triggered (all sampled collections had products) — infer it mirrors the search empty-state copy pattern, but this is an assumption, not confirmed on a collection specifically.
- **Facet variability:** every collection sampled (`new-in`, `shirts-1`) exposed only an **Availability** facet — no color/size/price faceting was found anywhere in the store.

---

## Product detail page (PDP) (e.g. `/products/hf-embossed-leather-jacket`)

- **Purpose:** single-product purchase page.
- **Layout:** breadcrumb → two-column: media (left) + info panel (right) → title → price (strikethrough original + sale) + "SAVE N%" → Color swatches → Size pills → Add to Cart / Buy it Now / Add to Wishlist → Pickup availability block → accordions (Product Details, Shipping and Returns, Size Guide) → share/copy-link → "YOU MIGHT ALSO BE INTERESTED IN" related-products rail → footer.
- **Components:** ProductGallery, VariantSelector, StickyAddToCartBar (mirrors selection once scrolled past), PickupAvailability (Shopify-native), AccordionDetails, ShareButton, RelatedProducts.
- **Forms:** the add-to-cart form itself (variant radios + quantity, implicit — quantity stepper not independently confirmed present).
- **Animations:** accordion expand/collapse is native `<details>` (no custom animation needed); sticky bar entrance not measured.
- **Hover states:** swatch/size hover not verified visually.
- **Click behavior:** selecting a variant is expected to update price/image (data shape supports it — `featured_image` present per variant in the drawer's JSON) but the resulting **visual swap was not confirmed** (no screenshot this session).
- **Mobile:** gallery and info panel presumably stack vertically (standard PDP responsive pattern) — not independently measured at 375px on this specific template.
- **Tablet/Desktop:** two-column layout.
- **Loading states:** none specific to PDP beyond the shared Quick View spinner (PDP itself is server-rendered).
- **Empty/Error states:** "SOLD OUT" badge state exists (seen on other product cards, e.g. "HF ROUND BAG BLACK"); a fully sold-out PDP's exact CTA state (disabled button? "Notify me"?) was **not directly observed** — flagged as a follow-up.

---

## About (`/pages/about`)

- **Purpose:** brand story.
- **Layout:** "OUR STORY" label → scrolling brand-name marquee ("HIGH FASHION BY J.O.L" ×~12) → mission statement paragraph → founding story paragraph (founder: Rahman Jago, founded 2019).
- **Components:** MarqueeHeading (shared mechanism with the announcement bar), body copy blocks.
- **Forms/animations:** none beyond the marquee scroll and shared footer newsletter form.
- **Mobile/tablet/desktop:** text-centric page, layout differences not independently measured but low-risk (single-column prose page).

---

## Contact (`/pages/contact`)

- **Purpose:** support contact.
- **Layout:** "CONTACT US" heading → operating hours (Mon–Sat 10am–10pm, Sun 12pm–10pm — note this **differs** from the footer's listed hours of Mon–Sat 10am–8pm / Sun 12pm–8pm, a real content inconsistency on the live site, not to be copied) → contact form (Name, Email*, Phone, Comment, Send Message).
- **Forms:** posts to Shopify's native `/contact#contact_form` endpoint; only Email is marked required.
- **Error/empty states:** native HTML5 validation only observed (required attribute on Email); no custom inline-validation styling confirmed.

---

## FAQ (`/pages/avada-faqs`)

- **Purpose:** FAQs + all legal/policy content, folded into one page (no standalone `/policies/*` routes exist on this store).
- **Layout:** "FAQs" heading → 12-question accordion → "POLICIES" heading → 8-item accordion (Refund/Exchange, Delivery, Privacy Policy, Terms and Conditions, Size Guide and Styling Tips, Authenticity Assurance, Customer Care, High Fashion Family Benefits).
- **Components:** FAQAccordion (native `<details>`, 24 items total).
- **Content sample (Refund/Exchange, quoted in full since it's short and directly relevant to rebuild logic):** 10-day return window, item must be unworn with tags, proof of purchase required, refund processed within 7 working days, customer pays return shipping.

---

## Become a Disciple (`/pages/become-a-disciple`)

- **Purpose:** loyalty/community signup ("HF Disciples" get early access to drops, private events).
- **Layout:** two-line hero statement ("Being a Disciple isn't about fitting in. / It's about recognizing those who already stand apart!") → signup form (First Name, Socials, Social Handle, Email, Submit) → benefits blurb → marketing-consent disclaimer.
- **Forms:** no native `action` — submitted via Klaviyo's client-side JS (distinct from every other form on the site, which post to Shopify natively).

---

## Search (`/search`)

- **Purpose:** sitewide product search.
- **Layout:** breadcrumb (Home / Search) → "SEARCH RESULTS" heading → (if query) result count → Filter-and-sort bar → product grid → **numbered pagination** (differs from collection pages' "Load more").
- **Empty query state:** heading only, no products, no "0 results" messaging (distinct from a searched-but-empty state).
- **Zero-result state:** explicit copy — `No results found for "<query>". Check the spelling or use a different word or phrase.`
- **Populated state:** e.g. `47 results found for "tee"`.

---

## Cart (drawer + `/cart`)

- **Purpose:** review/edit cart before checkout.
- **Drawer:** opens in place over any page (body classes `open-cart open-cc`), empty copy: "Your cart is currently empty. Start Shopping."
- **Full page (`/cart`):** slightly different empty copy: "Your cart is empty — Ready to find your new favorite products? — CONTINUE SHOPPING", plus a "Recently viewed products" rail (whose own section heading currently shows **unreplaced placeholder text**, "Describe your recently viewed products here" — a live authoring bug, noted so it is *not* accidentally treated as intentional copy to clone).
- **Populated state:** not observed (no items were added this session, out of scope for a passive audit) — line-item layout, quantity stepper, and subtotal calc are a follow-up.

---

## Account / login

- **Purpose:** customer authentication.
- **Behavior:** `/account/login` redirects to Shopify's **hosted** New Customer Accounts flow at `account.highfashionbyjol.com`, a passwordless "Sign in or create an account" screen (email field + marketing opt-in checkbox + Submit). This is Shopify platform chrome, not the merchant's own theme — a clone should design its own equivalent screen rather than replicate Shopify's hosted UI pixel-for-pixel.

---

## Footer (present on every page)

- **Layout:** brand blurb → Instagram link → "QUICK LINK" nav (Home/About/Contact/FAQ) → "SHOP" nav (Shop/Shop All) → store info (address, hours, "Get Directions" map link) → Newsletter signup ("GET 10% OFF YOUR NEXT ORDER") → copyright + "Powered by Shopify."
- **Forms:** Newsletter (Name + Email) posting to `/contact#contact_form` with a hidden tag field.

---

## Country/region selector

- Present in the header/footer as a `<select>` with the full ISO country list, each entry showing its expected currency label — but only **USD and NGN (Nigeria)** are real distinct currencies; every other country still displays "(USD $)". Submitting posts to `/localization` and reloads the current page. Not actually submitted this session to avoid leaving the browsing session in an altered-currency state with no audit benefit — full form shape is documented in [interaction-map.md](interaction-map.md).

---

## 1. Complete route inventory

See [routes.md](routes.md) for the full table (12 core routes + 21 collection routes + non-page form endpoints).

## 2. Complete component inventory

See [component-inventory.md](component-inventory.md) — headline finding: **Cart, Quick View, and Wishlist all share one `SidePanel` drawer primitive**, and homepage product rows are **carousels, not grids**.

## 3. Complete interaction inventory

See [interaction-map.md](interaction-map.md) — headline findings: collection pages use "Load more" while search uses numbered pagination (an inconsistency, not a pattern to copy uncritically); only one filter facet (Availability) exists store-wide; the "Become a Disciple" form is the only one that isn't a native Shopify form post.

## 4. Complete animation inventory

See [animation-inventory.md](animation-inventory.md) — headline finding: no scroll-reveal animation library is used site-wide despite an `animations-true` theme flag; the only `animate.css` usage found is the cookie-consent banner. Marquee (ticker) is a shared, reused mechanism for both the promo announcement bar and the About page's brand statement.

## 5. Recommended architecture

For a "proper e-commerce platform, not merely a visual clone" (per the brief), suggested stack and structure:

- **Framework:** Next.js (App Router) or Remix for SSR/streaming product/collection pages — matches the server-rendered-with-light-hydration feel of the reference (fast first paint, JS-enhanced drawers/carousels on top).
- **Commerce backend:** headless commerce platform (Shopify Storefront API, Medusa, or Saleor) rather than hand-rolling cart/checkout/payment — the reference itself is Shopify-powered; replicating checkout/payment compliance from scratch is out of scope and risky. If full independence from Shopify is required, Medusa (open-source, self-hostable, Stripe-native) is the closer architectural analog to what's observed.
- **Component layer:**
  - One generic `<Drawer>` primitive (open/close state, backdrop, focus-trap) driving Cart, Quick View, Wishlist, and Mobile Nav — mirroring the reference's reuse of one `SidePanel` for three features, rather than building three bespoke drawers.
  - One `<Carousel>` primitive (Embla or Keen-Slider are good Flickity-equivalents with better accessibility/React support) driving the hero and every homepage product rail.
  - `<Accordion>` built on native `<details>`/`<summary>` (as the reference does) for FAQ/Policies/PDP sections — free keyboard support, no JS animation library needed.
  - A single `ProductCard` component reused across homepage rails, collection grids, search results, and related-products — matching the reference's actual reuse.
- **Design tokens:** implement the observed CSS custom-property system directly (colors, section spacing, button radius, badge radius) as Tailwind theme extensions or CSS variables — see [design-system.md](design-system.md) for the literal token values to seed from (with replaceable brand color instead of copying `#151515`/`#ff5f15` verbatim unless the project owner wants this exact palette).
- **Filtering:** since the reference only ever surfaces one facet (Availability), don't over-build a faceted-search system upfront — implement it generically (facet config driven by product metafields/tags) but ship with the same minimal Availability + Sort UX first, and let the merchant add more facets later.
- **Forms:** all newsletter/contact forms should go through one backend contact/lead endpoint (mirroring the reference's reuse of a single Shopify contact-form endpoint for two different forms) rather than three different integrations; keep the loyalty ("Become a Disciple") signup on a separate ESP-integrated endpoint since it has different data (social handles) and intent.
- **Auth:** since login redirects to Shopify's own hosted UI here, a headless rebuild needs its **own** account/auth pages — reuse whatever auth the chosen commerce backend provides (Shopify Customer Account API, Medusa's customer auth, or a NextAuth/Clerk layer) rather than trying to reverse-engineer Shopify's hosted screen.
- **Images:** use a CDN-backed responsive image pipeline (Next.js `<Image>` or equivalent) mirroring the reference's `?width=` query-param responsive pattern.

## 6. Unknowns requiring later investigation

1. **No visual screenshots were captured this session** (Browser pane didn't composite frames) — every layout claim above comes from DOM/CSS inspection, which is reliable for structure/tokens but not for final pixel-level spacing, imagery art direction, or exact visual hierarchy. **Action: re-run a visual pass (screenshots at all 9 requested widths) before implementation sign-off.**
2. Add-to-cart → populated-cart-drawer flow (line items, quantity stepper, subtotal, remove) was not exercised.
3. Hero slideshow autoplay interval/easing, and whether product images swap on card hover, were not measurable without sustained visual observation.
4. Mega-menu trigger (hover vs. click) on desktop was not disambiguated.
5. Promo popup and BOGOS free-gift/mix-and-match popup trigger conditions (timing, cart-value threshold, session-frequency) were not exercised.
6. Sold-out PDP state (disabled button vs. "Notify me" vs. hidden) was not directly observed.
7. Desktop container `max-width` above 1200px, and whether 1440px/1920px differ from each other, was not read from source.
8. Full 225+ product catalog was not enumerated — only a handful of representative products/collections were sampled.
9. Whether a live predictive-search dropdown exists (before pressing Enter on `/search`) was not tested.
