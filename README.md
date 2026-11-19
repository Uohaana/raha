# RAHA — Liquid Gold

### A cinematic perfume storefront for fragrances that leave a trace.

<p align="center">
  <img width="850" alt="RAHA Liquid Gold perfume storefront" src="public/media/raha-logo-mark.svg" />
</p>

A premium fragrance experience built with plain HTML, CSS, and JavaScript, backed by Supabase and designed for Vercel. RAHA combines a visual brand film, a 30-perfume collection, customer accounts, favourites, reviews, secure checkout, and a protected inventory studio.

## Features

- Cinematic homepage with RAHA brand film and Liquid Gold hero presentation
- Collection of 30 original perfume compositions
- Search and mood filters for amber, woods, floral, and mineral scents
- Individual product pages for every perfume
- Product notes, pricing, stock status, reviews, and ratings
- Favourite perfumes saved to each customer's account
- Persistent shopping bag stored in the browser
- Authenticated checkout with server-side stock and total validation
- Customer account dashboard with orders and saved favourites
- Email/password sign-in and email-verified account creation
- Password reset flow through Supabase Auth
- Optional Continue with Google authentication
- Protected admin studio for catalog, orders, and reviews
- Protected stock page with search, low-stock filtering, and inventory updates
- Responsive desktop and mobile layouts
- Security headers configured for Vercel
- Supabase Row Level Security for customer and admin data

## Pages

| Page                    | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `/`                     | RAHA homepage and brand film                                             |
| `/collection.html`      | Browse, search, filter, and add perfumes to the bag                      |
| `/products/*.html`      | Individual perfume pages                                                 |
| `/account.html`         | Sign in, create an account, reset a password, view orders and favourites |
| `/studio-vault-9x.html` | Protected admin overview                                                 |
| `/stock.html`           | Protected stock management page                                          |

## Customer Experience

### Account

Existing customers use **Sign in**. New customers use **Create account** and must verify their email before accessing the account dashboard.

After signing in, the account page becomes a personal RAHA dashboard with:

- Order history
- Saved favourite perfumes
- Remove-favourite controls
- Collection links
- Sign out

Guests can browse normally. When a guest selects a favourite, writes a review, or checks out, RAHA sends them to the account page first.

### Favourites

Every collection card and product page has a heart button. Favourites are stored in Supabase in the `favorites` table and protected so each customer can only read, create, or delete their own favourites.

### Checkout

The shopping bag is stored locally under `raha-cart` so it survives page navigation. The final order is created through the Supabase `place_order` function, which rechecks:

- The customer session
- Product IDs
- Product publication status
- Quantity limits
- Current stock
- Shipping details
- The trusted server-side total

## Admin Studio

The admin area is protected by Supabase Auth and the `admin_profiles` table. Only users with an `admin` or `editor` role receive the Admin navigation link.

The studio provides:

- Published product count
- Total inventory count
- Low-stock count
- Catalog overview
- Recent orders
- Customer review overview

The stock page provides:

- Inventory search
- All, low-stock, and out-of-stock filters
- Direct stock editing
- Low-stock indicators
- Authenticated database updates

The browser interface is not the security boundary. Supabase RLS policies protect the database even if someone manually opens an admin URL.

## Project Structure

```text
.
├── index.html                 # Homepage and brand film
├── collection.html            # Collection, cart, reviews, and checkout
├── account.html               # Customer authentication and account dashboard
├── products/                  # Individual perfume pages
├── admin.html                 # Admin route entry point
├── studio-vault-9x.html       # Protected admin overview
├── stock.html                 # Protected stock dashboard
├── styles.css                 # Shared visual system
├── script.js                  # Shared navigation behavior
├── favorites.js               # Favourites and authenticated navigation
├── account.js                 # Account controller
├── collection.js              # Collection controller
├── product-page.js            # Product-page controller
├── stock.js                   # Stock controller
├── studio.js                  # Admin controller
├── supabase-config.js         # Public Supabase configuration and fallback catalog
├── public/media/              # Product images, logo, and video assets
├── supabase/                  # Database schema and migrations
├── vercel.json                # Deployment headers and security policy
└── README.md
```

## Dependencies

- `Python 3.10+` for a local static preview
- `Node.js` and `npm` for formatting checks
- `Supabase` for Auth, database tables, RLS, reviews, favourites, orders, and stock
- `Vercel` for deployment
- Supabase JavaScript client loaded from jsDelivr in the HTML pages

No framework or build step is required.

### Install & Run

```bash
git clone https://github.com/Uohaana/raha.git
cd raha
python3 -m http.server 3000 --bind 0.0.0.0
```

Open:

```text
http://localhost:3000/
```

## Supabase Setup

Apply the migrations in this order:

1. `supabase/schema.sql`
2. `supabase/catalog_30.sql`
3. `supabase/secure_checkout.sql`
4. `supabase/optimized_catalog_assets.sql`
5. `supabase/favorites.sql`
6. `supabase/private_admin_helper_v4.sql`
7. `supabase/security_hardening.sql`
8. `supabase/security_hardening_v2.sql`

The public browser key belongs in `supabase-config.js`. Never put a service-role key, database password, admin password, or OAuth secret in the repository.

The Supabase project must be active for sign-in, favourites, reviews, orders, checkout, and stock management to work.

## Code Quality

The source is intentionally divided into small controllers instead of large inline scripts:

- `account.js` handles authentication, reset emails, orders, and favourites
- `collection.js` handles catalog loading, filters, reviews, cart, and checkout
- `product-page.js` keeps all product pages consistent
- `stock.js` handles protected inventory management
- `studio.js` handles the protected admin overview
- `favorites.js` shares session, favourites, and admin-navigation behavior

HTML, JavaScript, CSS, JSON, Markdown, and SQL are formatted for readability. User-controlled values are escaped before being rendered into HTML, and slow Supabase requests have bounded fallbacks so they do not block the storefront.

## Checks

Check JavaScript syntax:

```bash
for file in *.js; do node --check "$file"; done
```

Check formatting:

```bash
npx prettier@3.6.2 --check "*.html" "products/*.html" "*.js" "*.css" "*.json" "*.md"
```

Check Git whitespace errors:

```bash
git diff --check
```

## Deploy to Vercel

Import the repository:

```text
https://vercel.com/new/import?s=https://github.com/Uohaana/raha
```

Recommended settings:

| Setting           | Value              |
| ----------------- | ------------------ |
| Repository        | `Uohaana/raha`     |
| Production branch | `main`             |
| Project name      | `raha-liquid-gold` |
| Root directory    | `/`                |
| Framework         | Other              |
| Build command     | Empty              |
| Output directory  | Empty              |

## Security

`vercel.json` configures:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- Strict referrer policy
- Restricted browser permissions
- Content Security Policy
- Immutable caching for media assets

Supabase RLS remains the main authorization layer. Admin pages are protected by authenticated role checks and database policies.

## Want Your Own RAHA Version?

Change the catalog in `supabase/catalog_30.sql` and the fallback catalog in `supabase-config.js`. Add product imagery under `public/media/perfumes/`, then create a product page under `products/` using the existing page structure.

Keep the same product slug in the catalog, image filename, and product-page URL so the collection links and Supabase records continue to match.

## Project Note

RAHA is a portfolio demonstration and noncommercial fragrance-store concept. Product names, imagery, copy, and visual direction are original project assets for this implementation.

## Repository

[GitHub — Uohaana/raha](https://github.com/Uohaana/raha)
