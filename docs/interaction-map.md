# Interaction Map — highfashionbyjol.com

Every entry below reflects a behavior actually triggered and inspected this session (via DOM/class/state
changes), not assumed from convention. Where a behavior could not be triggered/verified, it's flagged
under "Not verified."

## Header / Announcement bar

- Announcement bar text is tripled in the DOM (`SUMMER SALES … SUMMER SALES … SUMMER SALES`) — a CSS/JS marquee ticker, continuously scrolling, linking anywhere in the strip to `/collections/new-in-1`.
- Header is fixed-black; icons (search, wishlist, cart, account) sit right-aligned; logo center.
- Cart icon shows a live item-count badge (`.thb-item-count`, reads "0" when empty).

## Navigation / Mega menu

- **Desktop (≥1068px):** hovering/clicking "SHOP" reveals a two-column flyout: left column = Men category list (Shirts, Denim, Jackets, Shorts, Pants, Hoodies, Outerwear), right column = Women category list (Tops, Gown, Skirts, BumShorts), both anchored under quick links "All Products / Men / Women / Accessories." Confirmed via the live `thb-full-menu` DOM tree, not by simulated hover (mouse-hover CSS trigger itself not independently confirmed — could be hover **or** click-to-open; class name `menu-item-has-children` doesn't disambiguate). **Not fully verified: hover vs. click trigger.**
- **Mobile/tablet (<1068px):** off-canvas drawer slides in from the side; nested categories use a drill-in pattern — tapping "Shop" transitions the panel to the Shop submenu with a "← back" control (`.parent-link-back--button`) rather than expanding inline. Transition duration for menu-related elements is consistently `0.25s`.
- Nav switch point measured live: at 1024px width the desktop nav's container is `display:none`; at 1080px it's `display:flex`. The actual CSS breakpoint is `1068px` (from source).

## Search

- Header search icon links to `/search` (full navigation, not an inline overlay/predictive-search dropdown on this pass — **not verified** whether a live-typeahead dropdown exists before pressing Enter, since input was submitted via URL query rather than by typing character-by-character).
- `/search` with no query renders an empty "SEARCH RESULTS" header with just the search input, no products.
- `/search?q=tee` → "47 results found for 'tee'" with a Filter-and-sort sidebar (Availability + Sort By) and **numbered pagination** (1, 2, 3, 4…), unlike collection pages' load-more.
- `/search?q=<nonsense>` → "0 results found for '<query>'. Check the spelling or use a different word or phrase." (explicit empty-state copy).

## Cart

- Clicking the header cart icon opens the **Cart drawer** in place (`body` gains `open-cart open-cc` classes; URL does not change) — confirmed live.
- Empty state: "Your cart is currently empty. Start Shopping" (drawer) / "Your cart is empty — Ready to find your new favorite products? — CONTINUE SHOPPING" (full `/cart` page) — the drawer and full-page copy differ slightly, worth normalizing in a rebuild.
- `/cart` page also renders a "Recently viewed products" rail beneath the empty state.
- Add-to-cart flow itself (drawer update after adding an item, quantity stepper, remove-line-item, subtotal recompute) was **not verified** — doing so would require actually adding a product to cart, which was out of scope for a passive read-only audit this session. Flagged as a follow-up.

## Quick View

- Each product card is wrapped in a `<quick-view>` custom element (`href="#Product-Drawer"`). Clicking it opens the same **SidePanel** primitive as the cart, in "product-drawer" mode, showing full variant selection (color swatches, size pills) and pricing without leaving the page. Body gains `open-quick-view open-cc`.
- Confirmed via direct `.click()` dispatch — a real state change, not inferred.

## Variant selection (PDP)

- Color and Size are separate radio-input groups (`name="Color"`, `name="Size"`), rendered as swatches (color) and pill buttons (size).
- A **duplicate** set of the same inputs exists with a `--sticky` suffix, confirming a sticky add-to-cart bar mirrors selection state once the user scrolls the primary selector out of view. (Bar's scroll-trigger threshold not independently measured.)
- Selecting a variant is expected to swap the gallery's active image to that variant's `featured_image` (present in the quick-view JSON payload observed) — plausible from the data shape but the resulting DOM swap was **not visually confirmed** (no screenshot capability this session).

## Filters / Sort (Collection + Search)

- "FILTER AND SORT" toggles a panel (rendered twice in DOM — separate desktop-sidebar and mobile-drawer markup, `facets-desktop-container` vs `facets__mobile_form`).
- Only facet configured anywhere sampled: **Availability → In stock**. No color/size/price range facets exist on any collection tested (`/collections/new-in`, `/collections/shirts-1`) — this appears to be a genuine store configuration choice, not a missing feature to discover elsewhere.
- Sort dropdown changes the query string / triggers a refetch (Shopify-standard `sort_by` param) — actual re-sort was not manually triggered and observed this session; the presence of the "APPLY" button suggests filters batch client-side then submit, rather than applying instantly per-click. **Not fully verified.**

## Load more / Pagination

- Collection templates: "Load more" button (`.pagination--loadmore`) — click behavior (AJAX append vs. full reload) not triggered this session; standard Shopify/Reformation pattern is AJAX-append.
- Search template: numbered page links — standard full navigation between `?page=N`.

## Accordions

- FAQ/Policies page: 24 native `<details>` elements — native browser disclosure behavior (click summary to toggle, no custom JS required, so keyboard/enter-key toggling works for free).
- PDP: Product Details / Shipping & Returns / Size Guide as `<details>` — same native pattern.

## Forms

- **Newsletter (footer):** Name + Email → posts to `/contact#contact_form` with a hidden `contact[tags]` field (tags the contact as a newsletter subscriber rather than calling a dedicated ESP API directly).
- **Contact page form:** Name, Email (required), Phone, Comment → posts to the same `/contact#contact_form` endpoint with different field names (`contact[name]`, `contact[email]`, `contact[phone]`, `contact[body]`).
- **Become a Disciple form:** First Name, Social platform, Social Handle, Email → **no native `action`**, submitted via Klaviyo's client-side JS (a "custom form" embed, not a Shopify-native form).
- **Country/region selector:** a `<select>` inside a form posting to `/localization` with hidden `form_type`/`_method`/`return_to` fields — submitting reloads the current page under the new locale/currency. Not actually submitted this session (would have persisted a currency-change cookie for the remainder of the browsing session with no audit benefit), but the mechanism is fully visible from the form markup.

## Carousels

- **Hero:** Flickity, swipe-enabled, fade transition between slides, custom dot pagination, autoplay timing **not verified** (would require sustained observation).
- **Homepage product rails** (Best Sellers, New In, Accessories, Featured, Explore More): Flickity, drag-to-scroll (`is-draggable`), not a fixed grid — this is a meaningfully different implementation than a typical CSS-grid product list and should be replicated as an actual carousel, not a wrapping grid.

## Marquee

- Two confirmed usages: the top **announcement bar** (promo text) and the **About page** "OUR STORY" brand-name marquee. Same underlying scrolling-text mechanism reused for both a functional (promo) and decorative (brand statement) purpose.

## Popups / Modals

- **Cookie consent** (`goodg-cart`, bottom-right): visible on load, animated in via `animate.css`'s `slideInDown`, "Learn more" / "Got it!" actions.
- **Promo popup** (`.promo-popup`, image + "SHOP NOW"): present in the DOM but hidden on initial load this session — trigger condition (delay, exit-intent, once-per-session cookie) **not verified**.
- **Free-gift / mix-and-match popups** (BOGOS/Secomapp app): present in DOM (`freegifts-main-popup-container`, `bogos-mix-match-main-collection-popup-container`), hidden by default — presumably triggered by cart-value thresholds (the announcement bar advertises "FREE GIFT ON PURCHASES ABOVE $500"). Trigger not independently verified — would require adding $500+ of product to cart.

## Newsletter

- See Forms above — footer form promises "GET 10% OFF YOUR NEXT ORDER" as the signup incentive.

## Country selector

- See Forms above. Full ISO-3166 country list, each option pre-labeled with the currency that country will see (nearly all "(USD $)"; Nigeria explicitly shows "(NGN ₦)" — i.e. most countries are NOT actually localized to their native currency despite being listed, only USD and NGN are real supported currencies). This is an important nuance: **the country list is broad (localization/shipping-region selection) but currency support is narrow (USD + NGN only)** — don't assume every listed country gets its own currency in a clone.
