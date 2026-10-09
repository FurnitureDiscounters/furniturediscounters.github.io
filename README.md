# Furniture Discounters

A responsive, build-free furniture storefront for [furniturediscounters.github.io](https://furniturediscounters.github.io). Built with semantic HTML, CSS, and vanilla JavaScript ES modules.

## Pages

- `index.html`: editorial homepage, categories, featured sample furniture, and store introduction.
- `store.html`: twelve sample products, searchable catalog, category filters, price/name sorting, and keyboard-accessible product detail dialogs.
- `about.html`: store introduction and explicitly labeled editable business/contact placeholders.
- `order.html`: local cart, quantity controls, demo confirmation, order-number copy, and simulated lookup.

## Run locally

Serve the repository over HTTP because the JavaScript uses ES modules:

```sh
python -m http.server 4173
```

Open `http://localhost:4173`. No build, package installation, API credentials, or external runtime services are required. Do not open the HTML directly with a `file://` URL.

## GitHub Pages

The four HTML files live at the repository root. Keep the existing GitHub Pages branch/root configuration. `.nojekyll` preserves the static assets unchanged. All page, image, font, stylesheet, and module paths are relative, so this also works under a GitHub Pages project subdirectory. HTTPS is supplied by GitHub Pages.

## Demo behavior and privacy

**Demo Mode — Orders are not submitted to the store.**

Products, prices, specifications, availability, and photography are illustrative sample content. The site does not collect contact details, submit orders, process payments, or create shipping promises. Contact information is displayed as explicit placeholders, without fake phone/email links. There are no fabricated reviews, awards, or business-history claims.

The browser stores selections in `fd.demo.cart.v1` and orders in `fd.demo.orders.v1`. Orders remain on the same browser profile and origin; clearing browser data removes them. They cannot be retrieved on other devices. A built-in lookup fixture, `FD-2026-001234`, is explicitly labeled as a tutorial example and is separate from user-created orders. Recent saved order numbers are shown on the order page.

Quantities are whole numbers from 1 to 99. Totals use integer cents. Creating an order persists an immutable snapshot of names, prices, and quantities before clearing the cart. Duplicate submissions reuse the in-flight operation, and a persisted cart revision prevents duplicates if clearing storage fails. Web Locks serialize supported same-origin browser tabs; other browsers use a per-tab queue. This demonstration is not a production multi-user database.

Unavailable storage produces an actionable error without claiming the order was saved. Corrupt cart data can be explicitly reset without deleting saved orders. Corrupt saved orders are preserved and produce an error instead of being silently discarded.

## Code layout

```text
assets/
  css/styles.css              Shared design system and responsive layouts
  js/
    data/products.js          Explicitly marked sample product records
    services/product-service.js  Async product repository boundary
    services/order-service.js    Async browser-storage order adapter
    ui.js                     Cards, details, toast, formatting, escaping
    shared.js                 Navigation, cart badge, entrance animations
    home.js                   Featured collection
    store.js                  Search/filter/sort and URL state
    order.js                  Cart and demo-order interface
  images/                     Optimized local WebP photography
  fonts/                      Self-hosted fonts and their OFL licenses
  favicon.svg                 Original chair logo
```

## Editing the demo

Change products in `assets/js/data/products.js`. Each record has `id`, `name`, `category`, `price` (USD), `description`, `image`, `availability`, `dimensions`, `material`, `finish`, and `featured`. Keep product IDs stable while testing existing browser carts. Replace photography with verified images of the real stock before launch. Search reads names, categories, materials, finishes, and descriptions.

Edit business information in `about.html` and the shared footer markup in all four pages. Keep the navigation identical and the active link's `aria-current="page"` correct. There are no runtime templates or build tools.

## Future Firebase integration

No Firebase SDK, credentials, configuration, or network calls are included. Service methods return Promises so the UI can later consume a real backend:

1. Replace `product-service.js` with Firestore reads while retaining `getProducts()` and `getProduct(id)` and the product shape. Move category configuration into the repository response if categories become dynamic.
2. Replace order persistence in `order-service.js` with a backend adapter. Keep the public cart operations, `createOrder`, `getOrder`, and `getOrders`; retain the `cart-updated` event for the current UI. The current adapter imports sample products to calculate totals. Production totals, stock, and status transitions must be validated server-side against authoritative product records.
3. Implement Firestore transactions or a trusted backend to allocate unique order numbers and create orders atomically. Decide on authenticated lookup or an unguessable lookup token; a short numeric order number alone should not expose real customer data.
4. Add a separate administrator dashboard with Firebase Authentication and server-enforced admin authorization. Enforce product/order write permissions in Firestore rules; do not rely on hidden navigation or client-side checks.
5. Use Firebase Storage for verified product images with restricted upload permissions and validated file size/type. Store image references on product records.
6. Add real order status updates and cross-device retrieval only after access rules and privacy requirements are implemented. Introduce customer information and payments in a separate, reviewed phase.
7. Choose an explicit migration/clearing policy for the `fd.demo.*` keys. Never import local demonstration orders into live fulfillment automatically. Replace all demo notices only when the real flow is operational.

## Verification

The frontend is checked in a real Chromium-based browser at desktop, tablet, and mobile widths. Coverage includes catalog search, filtering, both price sorts, empty results, product dialog/focus, cart quantities/removal/totals, reload persistence, demo creation and clipboard copy, saved and example lookup, corrupt storage recovery, unavailable storage, browser isolation, mobile navigation, image requests, and horizontal overflow. See `VERIFICATION.md` for the completed check report.

Photo and font sources are documented in [ASSET-CREDITS.md](ASSET-CREDITS.md).
