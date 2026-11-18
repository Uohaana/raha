# RAHA — Liquid Gold

RAHA is a cinematic perfume storefront for a collection of sculptural fragrances. It is a static HTML/CSS/JavaScript website backed by Supabase for authentication, products, favourites, reviews, inventory, and checkout.

The project is designed for Vercel deployment and is stored in the GitHub repository [`Uohaana/raha`](https://github.com/Uohaana/raha).

## Features

- Cinematic RAHA homepage and brand film experience.
- Collection page with 30 perfume compositions.
- Search and mood filters for amber, woods, floral, and mineral scents.
- Individual product pages with:
  - Product information and notes.
  - Product imagery and brand film media.
  - Reviews and ratings.
  - Favourite button.
  - Add-to-bag functionality.
- Persistent shopping bag using browser storage.
- Supabase-backed authenticated checkout.
- Customer account dashboard with:
  - Email/password sign-in.
  - Email-verified account creation.
  - Password reset.
  - Optional Google OAuth support through Supabase.
  - Order history.
  - Saved favourite perfumes.
- Protected admin studio for catalog, orders, and review visibility.
- Protected stock dashboard for inventory updates and low-stock triage.
- Responsive mobile navigation and layouts.
- Security headers configured in `vercel.json`.
- Supabase row-level security policies for customer-owned and admin-only data.

## Project structure

```text
.
├── index.html                 # Homepage and brand film
├── collection.html            # Collection browsing, filters, cart, and checkout
├── account.html               # Customer sign-in and account dashboard
├── products/                  # Generated product detail pages
├── admin.html                 # Admin route redirect
├── studio-vault-9x.html       # Protected admin overview
├── stock.html                 # Protected inventory dashboard
├── styles.css                 # Shared visual system and responsive styles
├── script.js                  # Shared navigation and storefront behavior
├── favorites.js               # Shared authenticated favourites and admin navigation
├── account.js                 # Authentication, orders, and account dashboard
├── collection.js              # Catalog, filters, reviews, cart, and checkout
├── product-page.js            # Shared product-detail controller
├── stock.js                   # Protected stock management controller
├── studio.js                  # Protected admin overview controller
├── supabase-config.js         # Public Supabase URL, key, and fallback catalog
├── public/media/              # Product imagery, logo, and video assets
├── supabase/                  # Database schema and repeatable migrations
├── manus-routes.json          # Route and asset manifest
└── vercel.json                # Security headers and deployment configuration
```

## Requirements

- Python 3 for a simple local preview.
- Node.js and npm for formatting checks.
- A Supabase project for authentication and database features.
- A Vercel account for production deployment.

No build step is required for the static storefront.

## Run locally

Clone the repository and start a local static server from the project root:

```bash
git clone https://github.com/Uohaana/raha.git
cd raha
python3 -m http.server 3000 --bind 0.0.0.0
```

Open the site at:

```text
http://localhost:3000/
```

Useful local routes:

```text
/                         Homepage
/collection.html          Product collection
/account.html             Customer account
/products/nocturne.html   Example product page
/studio-vault-9x.html     Protected admin overview
/stock.html               Protected inventory page
```

The site uses root-relative asset paths because Vercel serves the contents of `public/` at the site root.

## Supabase setup

The browser configuration is in `supabase-config.js`. The publishable Supabase key may be present in browser code; it is not a secret. Sensitive access is enforced by Supabase Auth and row-level security, not by hiding the publishable key.

Apply the SQL migrations in this general order:

1. `supabase/schema.sql` — core catalog, account, review, and order tables.
2. `supabase/catalog_30.sql` — the 30-product catalog seed.
3. `supabase/secure_checkout.sql` — secure order placement RPC.
4. `supabase/optimized_catalog_assets.sql` — optimized product asset paths.
5. `supabase/favorites.sql` — customer-owned favourites.
6. `supabase/private_admin_helper_v4.sql` — private admin authorization helper.
7. `supabase/security_hardening.sql` and `supabase/security_hardening_v2.sql` — security and policy hardening.

Review each migration against the current Supabase schema before applying it to an existing production database. Do not commit service-role keys, database passwords, or user passwords to GitHub.

### Authentication behavior

- Existing customers use **Sign in**.
- New customers use **Create account** and must confirm their email.
- Password reset uses Supabase Auth email delivery.
- Google sign-in appears when the provider is configured in Supabase Auth.
- The Admin navigation link appears only for authenticated users with an `admin` or `editor` record in `admin_profiles`.

The Supabase project must be active for authentication, favourites, orders, stock, and reviews to work.

## Admin workflows

Admin pages are intentionally not included in the public primary navigation for signed-out visitors.

- `/studio-vault-9x.html` displays catalog, stock, order, and review summaries.
- `/stock.html` supports searching, filtering, and updating inventory.
- Admin access is controlled by Supabase Auth and `admin_profiles` roles.
- Inventory updates are protected by database policies; the UI is not the security boundary.

Create or repair admin access through Supabase Auth and SQL migrations. Never put an admin password in source code or a README.

## Checkout behavior

The client stores the current bag in `localStorage` under `raha-cart`. Before an order is created, the Supabase `place_order` RPC rechecks:

- The authenticated customer session.
- The submitted product IDs.
- Quantity limits.
- Published product status.
- Current inventory.
- Shipping name and address.
- The server-calculated total.

The browser does not determine the final trusted order total.

## Code quality

The codebase is intentionally split into small, named modules instead of large inline scripts:

- `favorites.js` — shared authentication state, favourites, and admin navigation.
- `account.js` — sign-in, sign-up, reset, orders, and account dashboard.
- `collection.js` — product loading, filters, reviews, favourites, cart, and checkout.
- `product-page.js` — shared behavior for all product detail pages.
- `stock.js` — authenticated stock loading and updates.
- `studio.js` — authenticated admin overview.

Source formatting uses Prettier for HTML, JavaScript, CSS, JSON, and Markdown. PostgreSQL migrations are formatted separately. User-controlled content is escaped before being inserted into HTML, and page loading has bounded fallbacks so slow backend requests do not block the storefront.

## Validation commands

Check JavaScript syntax:

```bash
for file in *.js; do node --check "$file"; done
```

Check formatting:

```bash
npx prettier@3.6.2 --check "*.html" "products/*.html" "*.js" "*.css" "*.json" "*.md"
```

Check whitespace errors:

```bash
git diff --check
```

Run a local browser smoke test after starting the local server. Verify the homepage, collection, account, product detail, stock, and admin routes.

## Deployment to Vercel

Import the GitHub repository into Vercel:

```text
https://vercel.com/new/import?s=https://github.com/Uohaana/raha
```

Recommended settings:

- Repository: `Uohaana/raha`
- Production branch: `main`
- Project name: `raha-liquid-gold`
- Root directory: `/`
- Framework preset: Other
- Build command: leave empty
- Output directory: leave empty

After deployment, confirm that:

- `/` loads the homepage.
- `/collection.html` displays the catalog.
- `/account.html` loads without JavaScript errors.
- `/products/nocturne.html` loads a product page.
- `/stock.html` remains authentication-gated.
- Supabase Auth redirects use the deployed domain.
- The Supabase project is active.

## Security notes

The repository includes security headers for content type protection, clickjacking protection, referrer control, permissions restrictions, and a Content Security Policy. Supabase RLS remains the primary authorization layer.

Never commit:

- Supabase service-role keys.
- Database passwords.
- Admin passwords.
- OAuth client secrets.
- Access tokens.
- Customer personal data.

If credentials have ever been committed, rotate them immediately in the relevant provider.

## License and project note

RAHA is a portfolio demonstration and noncommercial fragrance-store concept. Product names, imagery, copy, and visual direction are original project assets for this implementation.
