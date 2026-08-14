# Component Inventory — highfashionbyjol.com

Components inferred from DOM structure/class names actually present on the live site, grouped by where
they're reused. Naming below is descriptive (for the rebuild), with the theme's actual CSS class noted
in parentheses for traceability.

## Global / layout

- **AnnouncementBar** (`.announcement-bar`) — top strip, orange background, marquee-scrolled repeating text ("SUMMER SALES / UP TO 50% OFF / date range / free-gift threshold"), links to the sale collection.
- **SiteHeader** (`.header-section`) — black bar: logo (center or left), primary nav, search icon, account/login link, wishlist icon+count, cart icon+count.
- **PrimaryNav / MegaMenu** (`.thb-full-menu`, `.sub-menu`) — desktop only (≥1068px): top-level Home/Shop/About/FAQ/Contact/Become a Disciple, with Shop expanding into a two-column flyout (Men submenu, Women submenu) plus an "All Products" quick link.
- **MobileMenuDrawer** (`.mobile-menu-drawer`) — off-canvas panel below 1068px; same link set as desktop nav, but nested categories use a **drill-in pattern**: tapping "Shop" slides to a submenu screen with a "back" button (`.parent-link-back--button`), rather than an inline accordion expand.
- **CountrySelector** (`<select>` inside a `<form action="/localization">`) — full ISO country list, each entry pre-formatted with its price display currency (almost all show "(USD $)"; Nigeria shows "(NGN ₦)"). Submitting reloads the current page localized.
- **SidePanel** (`.side-panel`) — a single reusable slide-out-drawer component that powers **three different features**: the Cart (`.side-panel.cart-drawer`), Quick View (`.side-panel.product-drawer`), and the Wishlist (`swym-storefront-layout-actions`, left-positioned). Worth rebuilding as one generic `<Drawer>` primitive rather than three bespoke components.
- **SiteFooter** (`footer.footer`) — brand blurb, Instagram link, "Quick Link" nav column (Home/About/Contact/FAQ), "Shop" nav column (Shop/Shop All), store info block (physical address + Google Maps "Get Directions" link + operating hours), Newsletter signup block, copyright + "Powered by Shopify".
- **NewsletterSignup** (`.signup-form`, footer) — Name + Email fields, "GET 10% OFF YOUR NEXT ORDER" incentive copy, posts to Shopify's native `/contact#contact_form` with a hidden tag field (so it's a tagged contact-form submission, not a dedicated email-marketing API call).
- **CookieConsentBanner** (`.goodg-cart`, bottom-right) — "We use essential cookies…Learn more / Got it!" — third-party app (good-apps.co), animated in with `animate.css`'s `slideInDown`.
- **PromoPopup** (`.promo-popup`) — image + "SHOP NOW" CTA modal with overlay and close button; present in DOM but not visible on initial load this session (likely delay- or exit-intent-triggered — trigger condition not independently confirmed).

## Homepage

- **HeroSlideshow** (`.main-slideshow`) — Flickity carousel, fade transition (`is-fade`), swipe-enabled, custom dot pagination, distinct mobile height (500px) vs desktop height (1080px) set via classes.
- **FeaturedCollectionCarousel** (`.products.row.carousel.flickity-enabled`) — reused for every homepage product rail: Best Sellers, New In, Accessories, More Featured Products, Explore More. Draggable, not a static grid.
- **CategoryPromoBlock** ("NEW RELEASES", "TRACKSUITS" — image-with-text-overlay sections, each with an "EXPLORE NOW" link) — full-bleed image + overlaid heading + CTA.
- **ProductCard / QuickViewTrigger** (`<quick-view>` custom element wrapping each card) — badge, image, title, price, color swatches, "QUICK VIEW" overlay that opens the SidePanel Quick View drawer via `href="#Product-Drawer"`.

## Collection / Search results (shared template)

- **Breadcrumb** (Home / Shop / [Collection]).
- **FilterAndSortBar** (`.facets__form`) — collapsible "FILTER AND SORT" control showing live result count, an **Availability** checkbox (only facet configured store-wide — no size/color/price facets were present on any sampled collection), and a **Sort By** dropdown (Featured, Most relevant, Best selling, Alphabetically A–Z/Z–A, Price low–high/high–low, Date old–new/new–old — search results omit "Featured"), with Clear/Apply actions. Rendered twice in the DOM (desktop sidebar + mobile drawer variant).
- **ProductGrid** — Foundation-style flex grid (`small-up-2 medium-up-4`), 2 columns mobile / 4 columns tablet+desktop.
- **LoadMore** (`.pagination--loadmore`) — collection pages use a manual "Load more" button, **not** numbered pagination.
- **NumberedPagination** — by contrast, `/search` results use classic numbered pages (1, 2, 3…), a real inconsistency between the two listing templates worth deciding on (recommend picking one — infinite/load-more — consistently in the rebuild).

## Product detail page (PDP)

- **ProductGallery** (`.product-images.product-images--list`) — stacked/listed media (not a single-image-with-thumbnails carousel as sampled; thumbnail rail was not found on this product, may be a per-product configuration for single-image products — needs a multi-image product spot-check).
- **VariantSelector** — Color as swatch radio buttons, Size as pill/button radio group; Shopify-standard `name="Color"`/`name="Size"` radio inputs.
- **StickyAddToCartBar** — a duplicate set of variant inputs suffixed `--sticky` (`Color--sticky`, `Size--sticky`) confirms a sticky/floating add-to-cart bar mirrors the main selector once the user scrolls past it.
- **AddToCart / BuyItNow / AddToWishlist** button row.
- **PickupAvailability** (Shopify native) — shows the physical store, "usually ready in 1 hour", expandable "View store information".
- **AccordionDetails** (`<details>`) — "PRODUCT DETAILS" (open by default judging from text order), "SHIPPING AND RETURNS", "SIZE GUIDE" as collapsible sections.
- **ShareButton** — copy-link action (confirmed via "Copied to clipboard" toast text).
- **RelatedProducts** ("YOU MIGHT ALSO BE INTERESTED IN") — same ProductCard grid/carousel, populated via Shopify product recommendations.
- No reviews component present.

## Cart

- **CartDrawer** (side panel) and **CartPage** (`/cart`) share the same empty state: "Your cart is empty / Ready to find your new favorite products? / CONTINUE SHOPPING", plus a "Recently viewed products" rail below it (note: this rail's own heading currently shows literal unreplaced placeholder copy, "Describe your recently viewed products here" — a real authoring bug on the live site, not something to intentionally reproduce).

## Static content pages

- **MarqueeHeading** — reused on the About page exactly like the announcement bar (the brand name "HIGH FASHION BY J.O.L" repeats ~12× in a scrolling strip under an "OUR STORY" label) — confirms marquee is a shared theme section, not a one-off.
- **FAQAccordion** (`.pages/avada-faqs`) — 24 total `<details>` items across two groups: **FAQs** (12 questions: brand, purchase locations, international shipping, delivery time, order tracking, returns, sizing, payment methods, sustainability, support contact, staying updated, opening hours) and **Policies** (Refund/Exchange, Delivery, Privacy Policy, Terms and Conditions, Size Guide and Styling Tips, Authenticity Assurance, Customer Care, High Fashion Family Benefits) — i.e. legal/policy pages are folded into FAQ accordions rather than being standalone routes.
- **ContactForm** (`/pages/contact`) — Name, Email (required), Phone, Comment, "SEND MESSAGE"; posts to Shopify's native contact form endpoint.
- **DiscipleSignupForm** (`/pages/become-a-disciple`) — First Name, Social platform ("Socials"), Social Handle, Email, Submit; no native `action` attribute — submitted client-side via Klaviyo's JS, not a Shopify form post.

## Account

- **Login** — not a themed page; redirects to Shopify's hosted New Customer Accounts UI (`account.<domain>`) — passwordless "Sign in or create an account" with an email field, a marketing-opt-in checkbox, and Submit. This surface is Shopify-hosted chrome, not the merchant's theme — a clone should build its own equivalent auth screen rather than copy Shopify's hosted UI verbatim.
