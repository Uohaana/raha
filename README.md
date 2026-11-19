# RAHA

### A small fragrance house for scents that feel personal, warm, and worth coming back to.

<p align="center">
  <img width="850" alt="RAHA perfume storefront" src="public/media/raha-monogram.svg" />
</p>

RAHA is a cinematic perfume storefront made with plain HTML, CSS, and JavaScript. It uses Supabase for accounts, favourites, reviews, orders, checkout, and stock, and it is ready to deploy on Vercel.

The idea is simple: make choosing a fragrance feel less like filling out a form and more like finding something that belongs to you.

# Main Idea

There are two sides to RAHA:

- The **film**: a slow visual introduction to the house and its first scent.
- The **shop**: thirty original compositions with product pages, scent notes, favourites, a bag, reviews, and checkout.

The visual direction is dark amber, tactile, and editorial. The writing is intentionally specific and conversational instead of sounding like automatic product copy.

## Features

- Cinematic homepage with moving fragrance films
- Original RAHA monogram and premium house branding
- DM Serif Display and Manrope typography
- Floating navigation bar with Film, Shop scents, Our house, Account, and Bag
- 30 perfume compositions with individual local artwork
- Search and scent-family filters
- Product pages for the collection
- Notes, prices, availability, comments, and ratings
- Customer favourites saved to Supabase
- Browser-persistent shopping bag
- Authenticated checkout with server-side stock and total checks
- Customer accounts with orders and favourites
- Existing-account sign in
- Email-verified account creation
- Password reset through Supabase Auth
- Optional Google sign-in
- Protected admin studio for admins and editors
- Protected stock management page
- Low-stock and out-of-stock inventory filters
- Responsive desktop and mobile layouts
- Vercel security headers and Supabase Row Level Security

# The Collection

Every perfume has its own name, image, notes, price, and mood.

The current collection includes:

- Nocturne
- Saffron Veil
- Velvet Oud
- Dawn Resin
- Ember Bloom
- Mineral Veil
- Cinder Rose
- Golden Hour
- Ash & Iris
- Silk Atlas
- Fig Noir
- Solar Musk
- Amber Archive
- Quiet Tide
- Black Tea
- Celestial Skin
- Fig & Salt
- Rose Signal
- Cedar Drift
- After Rain
- Moss Lit
- Linen Smoke
- Cassis Night
- Opal Heat
- Stone Fig
- Amber Mist
- Santal Quiet
- Blue Hour
- Velvet Citrus
- White Oud

The images are stored in `public/media/perfumes/`. Each image uses the same slug as its perfume and product-page URL.

# Pages

| Page                    | What it does                                                            |
| ----------------------- | ----------------------------------------------------------------------- |
| `/`                     | RAHA film, house story, and first scent introduction                    |
| `/collection.html`      | Browse, search, filter, favourite, and add scents to the bag            |
| `/products/*.html`      | Individual fragrance pages                                              |
| `/about.html`           | The RAHA house story                                                    |
| `/account.html`         | Sign in, create an account, reset a password, see orders and favourites |
| `/studio-vault-9x.html` | Protected admin overview                                                |
| `/stock.html`           | Protected inventory management                                          |

# Customer Flow

Guests can browse the collection without signing in.

Existing customers use **Sign in**. New customers use **Create account**, then verify their email before opening the account dashboard.

A signed-in customer can:

- Save and remove favourite scents
- Read previous orders
- Add products to the bag
- Leave a review or rating
- Place an order through the protected checkout function

The bag is stored locally under `raha-cart`, so it survives normal page navigation. At checkout, Supabase checks the signed-in user, product IDs, published status, quantity, current stock, shipping details, and trusted server-side totals before creating an order.

# Admin Studio

The admin area is protected by Supabase Auth and the `admin_profiles` table.

Users with an `admin` or `editor` role can access:

- Published product count
- Total inventory
- Low-stock count
- Catalog overview
- Recent orders
- Customer review overview
- Stock editing
- Low-stock and out-of-stock filters

The browser link is not the security boundary. Supabase Row Level Security protects the actual data even if someone opens an admin URL manually.

# Dependencies

- `Python 3.10+` for a local static preview
- `Node.js` and `npm` for formatting and syntax checks
- `Supabase` for Auth, database tables, reviews, favourites, orders, checkout, and stock
- `Vercel` for hosting
- Supabase JavaScript client from jsDelivr

There is no framework and no build step.

## Install & Run

```bash
git clone https://github.com/Uohaana/raha.git
cd raha
python3 -m http.server 3000 --bind 0.0.0.0
```

Then open:

```text
http://localhost:3000/
```

For local previewing, use a static server configured to expose `public/` at the site root so `/media/...` URLs resolve correctly.

# Supabase Setup

Apply the migrations in this order:

1. `supabase/schema.sql`
2. `supabase/catalog_30.sql`
3. `supabase/secure_checkout.sql`
4. `supabase/optimized_catalog_assets.sql`
5. `supabase/favorites.sql`
6. `supabase/private_admin_helper_v4.sql`
7. `supabase/security_hardening.sql`
8. `supabase/security_hardening_v2.sql`

The public Supabase URL and publishable browser key are stored in `supabase-config.js`.

Never commit:

- A Supabase service-role key
- A database password
- An admin password
- An OAuth secret
- Private customer data

# Project Structure

```text
.
├── index.html                 # Homepage and brand film
├── collection.html            # Collection, bag, reviews, and checkout
├── account.html               # Customer authentication and dashboard
├── products/                  # Individual product pages
├── about.html                 # RAHA house story
├── studio-vault-9x.html       # Protected admin overview
├── stock.html                 # Protected stock management
├── styles.css                 # Shared design tokens and layout rules
├── humanized-overrides.css    # RAHA typography, navigation, and brand layer
├── script.js                  # Shared motion and navigation behavior
├── favorites.js               # Favourites and admin navigation
├── account.js                 # Account controller
├── collection.js              # Collection, bag, reviews, and checkout
├── product-page.js            # Product-page controller
├── stock.js                   # Stock controller
├── studio.js                  # Admin controller
├── supabase-config.js         # Supabase config and fallback catalog
├── public/media/              # Logo, product images, and film assets
├── supabase/                  # Database schema and migrations
├── vercel.json                # Deployment and security headers
└── README.md
```

The JavaScript is split into small controllers instead of one large inline script. Product IDs, route slugs, local image names, and Supabase records stay aligned so the collection and detail pages work together.

# Checks

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

# Deploy to Vercel

Import the repository:

```text
https://vercel.com/new/import?s=https://github.com/Uohaana/raha
```

Recommended settings:

- Repository: `Uohaana/raha`
- Production branch: `main`
- Framework: `Other`
- Build command: empty
- Output directory: empty
- Root directory: `/`

`vercel.json` adds content-type protection, frame protection, referrer restrictions, browser-permission restrictions, a content-security policy, and immutable caching for static media.

# Want Your Own Version?

Change the fallback catalog in `supabase-config.js` and the seeded catalog in `supabase/catalog_30.sql`.

To add a new perfume:

1. Choose a unique slug.
2. Add the product to Supabase.
3. Add the same slug to the fallback catalog.
4. Add a unique image to `public/media/perfumes/`.
5. Add a matching page under `products/`.
6. Keep the same slug in the database, image filename, and URL.
7. Run the checks above before pushing.

You can also change the copy, notes, prices, colours, videos, and typography while keeping the existing controller and database contracts.

# Project Note

RAHA is a noncommercial portfolio demonstration and fragrance-store concept. The product names, images, copy, logo, and visual direction are original project assets for this implementation.

# Repository

[GitHub — Uohaana/raha](https://github.com/Uohaana/raha)
