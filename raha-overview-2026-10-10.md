# RAHA Perfume Store — Implementation Overview

**Date:** 2026-10-10  
**Repository:** `Uohaana/raha-liquid-gold`  
**Production branch:** `main`  
**Tested preview:** `https://raha-liquid-gold-dblwc36k6-swds1.vercel.app/`  
**Supabase project:** `ukgvrcxvjlnqfybclxna`

## 1. Storefront features

RAHA is a fragrance-film storefront with a dark liquid-gold visual system, responsive layouts, a brand mark, optimized product media, and a 30-fragrance collection. The home page contains the hero film/brand treatment, collection entry point, and editorial brand sections. The collection page supports product discovery and links each fragrance to its own product detail route.

Each product route includes the product name, tagline, notes, price, responsive product imagery, available stock state, rating/review presentation, add-to-bag action, and comments area. The catalog uses 30 distinct perfume records and individual WebP product assets under `public/media/perfumes/webp/`; the store also includes the RAHA ambient brand film and a scalable RAHA logo SVG.

The customer experience includes a persistent bag/cart, quantity controls, checkout fields, order confirmation, account sign-in, account sign-up, password reset, order history, logout, and a Google OAuth entry point. The sign-up screen explicitly communicates that new accounts require email verification. Google is safely surfaced but currently reports a configuration message because the Supabase Google provider is not enabled.

A new FAQ/service page covers delivery, payment, returns/exchanges, review moderation, and why an account is required. The FAQ adapts useful service-information patterns from the Chero reference while excluding footwear-specific features such as size logic and AR shoe preview.

## 2. Admin features

The protected admin area uses Supabase Auth and the `admin_profiles` role table. The admin workflow includes:

- Authenticated admin sign-in.
- Stock dashboard with all 30 SKUs.
- Total stock and low-stock summaries.
- Per-product stock editing and save actions.
- Order overview with customer email, status, total, and order rows.
- Review overview and moderation access.
- Admin logout.
- No public inventory access before authentication.

The final live stock test loaded 30 rows, 595 total units, and 6 low-stock products. A real restock action changed Nocturne from 22 back to 23 units through the dashboard and persisted successfully in Supabase.

## 3. Current Supabase data model

### `public.perfumes`

| Column       | Purpose                             |
| ------------ | ----------------------------------- |
| `id`         | UUID primary key                    |
| `slug`       | Unique route/catalog identifier     |
| `name`       | Fragrance name                      |
| `tagline`    | Short product positioning           |
| `notes`      | Fragrance notes                     |
| `price`      | Numeric price                       |
| `image_url`  | Published product asset path        |
| `stock`      | Inventory quantity                  |
| `status`     | `draft`, `published`, or `archived` |
| `created_at` | Creation timestamp                  |

### `public.admin_profiles`

| Column         | Purpose                         |
| -------------- | ------------------------------- |
| `id`           | UUID linked to `auth.users(id)` |
| `display_name` | Admin display name              |
| `role`         | `admin` or `editor`             |
| `created_at`   | Creation timestamp              |

### `public.orders`

| Column       | Purpose                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| `id`         | UUID order identifier                                                    |
| `user_id`    | Authenticated customer owner                                             |
| `email`      | Customer email captured at order time                                    |
| `total`      | Calculated order total                                                   |
| `status`     | `pending`, `confirmed`, `packed`, `shipped`, `completed`, or `cancelled` |
| `shipping`   | JSON shipping name/address payload                                       |
| `created_at` | Order timestamp                                                          |

### `public.order_items`

Stores the order-to-product relationship, product name snapshot, unit price snapshot, and quantity. It references `orders` with cascade deletion and `perfumes` with set-null deletion.

### `public.reviews`

Stores one review per customer/product pair through a unique constraint. Ratings are limited to 1–5 and review states are `pending`, `approved`, or `rejected`.

### Current database snapshot

The live database currently reports:

| Metric                | Count/value |
| --------------------- | ----------: |
| Published perfumes    |          30 |
| Total published stock |         595 |
| Approved reviews      |          14 |
| Existing orders       |           1 |
| Admin/editor profiles |           1 |

The one remaining order is the existing QA order. Temporary checkout orders from the live tests were deleted after each test and inventory was restored.

## 4. Checkout backend

`public.place_order(p_items jsonb, p_shipping jsonb)` is the checkout RPC. It is a `SECURITY DEFINER` PL/pgSQL function with a fixed `search_path = public` and authenticated-only execution.

The function:

1. Requires a signed-in user.
2. Requires a non-empty item array.
3. Validates shipping name and address length/content.
4. Reads the authenticated user email from `auth.users`.
5. Validates item UUIDs and quantities from 1 through 10.
6. Locks published product rows for update.
7. Confirms every requested product is still published.
8. Confirms sufficient stock.
9. Calculates the total from database prices rather than trusting browser totals.
10. Inserts the order and item snapshots.
11. Decrements inventory atomically.
12. Returns the order UUID and calculated total.

Direct anonymous order/order-item inserts are revoked. Authenticated customers use the RPC rather than writing arbitrary order totals from the browser.

## 5. Authentication configuration

The live Auth configuration was inspected through Supabase:

- Email provider: enabled.
- Automatic email confirmation: disabled, so new accounts require verification.
- Anonymous users: disabled.
- Google provider: currently disabled.
- Existing confirmed admin account: authenticates successfully.
- Password reset: connected to `resetPasswordForEmail`; Supabase anti-abuse cooldown was observed during repeat testing.

The customer account page supports existing-account sign-in, verified sign-up, password reset, logout, and a Google OAuth entry point. Google requires a Google OAuth client ID/secret and redirect configuration before it can complete an OAuth login.

## 6. RLS and security configuration

All commerce and account tables have Row Level Security enabled.

The effective hardening migration moves the admin check into the non-exposed `private` schema as `private.is_admin()`. The helper is `SECURITY DEFINER`, uses a fixed search path, and is executable only by the authenticated role for RLS evaluation. Public and anonymous execution of the old `public.is_admin()` helper is revoked.

Effective policy behavior:

- Anonymous users can read only published perfumes.
- Authenticated users can read published perfumes and their own permitted account data.
- Only admins/editors can insert, update, or delete perfumes.
- Customers can create and read only their own orders.
- Admins/editors can update orders.
- Customers can read their own order items; admins can read all order items.
- Customers can submit reviews only for themselves and only in pending state.
- Customers can edit only their own pending reviews.
- Admins/editors can moderate reviews.
- Anonymous visitors can read approved reviews only.
- Admin profiles are readable only by the signed-in owner through the policy.

The live Supabase security review found no public or anonymous execution grant for the private admin helper. Supabase still reports the intentional authenticated `place_order` security-definer function for review, because it must perform atomic stock/order operations. Supabase also reports that leaked-password protection is disabled; that is a project Auth setting still requiring manual enablement.

## 7. Vercel security and delivery configuration

`vercel.json` applies the following headers globally:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- Strict referrer policy.
- Permissions policy disabling camera, microphone, geolocation, and payment browser capabilities.
- Content Security Policy restricting scripts, images, fonts, media, forms, and Supabase connections.
- One-year immutable caching for media assets.
- Short HTML caching with stale-while-revalidate.

The admin routes use `noindex`, `nofollow`, and `noarchive` metadata. The repository does not contain Supabase service-role keys or stored admin passwords.

## 8. Final live end-to-end test

Tested against:

`https://raha-liquid-gold-dblwc36k6-swds1.vercel.app/`

Results:

| Test                             | Result |
| -------------------------------- | ------ |
| Existing account sign-in         | Passed |
| Product detail route             | Passed |
| Add Nocturne to bag              | Passed |
| Cart drawer opens                | Passed |
| Cart contains correct item       | Passed |
| Supabase checkout RPC            | Passed |
| Order confirmation returned      | Passed |
| Cart cleared after checkout      | Passed |
| Admin stock login                | Passed |
| Admin dashboard data             | Passed |
| 30 stock rows rendered           | Passed |
| Frontend HTTP errors during test | None   |

The final test created temporary order `c74bc992-e5b5-436e-8980-e179c9bc7c59`, reduced Nocturne stock from 23 to 22, confirmed the admin dashboard, restored stock to 23 through the admin UI, and deleted the temporary order. The final Supabase check reported `temporary_order_count = 0` and Nocturne stock `= 23`.

## 9. Vercel deployment and production promotion status

The tested preview deployment is ready:

- Deployment: `dpl_28hvyXzciWiBNYXLep8z9EEV8xNo`
- Preview URL: `raha-liquid-gold-dblwc36k6-swds1.vercel.app`
- Commit: `00a4625`
- State: `READY`
- Target: preview

The promoted `main` deployment is not ready:

- Deployment: `dpl_A8tNJuNyxA7vTTzKyLgF7cF2EX2F`
- Commit: `d87dab0`
- Target: production
- State: `BLOCKED`
- Vercel error link: account-configuration troubleshooting

The Vercel deployment listing confirms the promotion status has **not updated to READY**. Build-event retrieval and runtime-log retrieval were attempted, but the connected Vercel scope returned deployment/project not-found responses for those log endpoints. This is a connector/team access limitation, not evidence that the application itself produced runtime errors. The ready preview showed no frontend HTTP errors during the final end-to-end test.

The domain `raha-perfume.vercel.app` is attached to the Vercel project but was still serving the older production deployment during the last direct check. The current production block therefore remains the step preventing the latest build from becoming the domain’s production version.

## 10. Recommended final Vercel actions

A Vercel team owner should open the blocked production deployment and promote it to production, or resolve the account-configuration restriction for the `swds1` team. After promotion, verify:

- `https://raha-perfume.vercel.app/faq.html` returns 200.
- The customer account page contains the password-reset control.
- The domain serves the same commit as the tested preview.
- The custom domain points to the new production deployment.
