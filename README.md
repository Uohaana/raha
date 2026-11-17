# RAHA — Liquid Gold

Premium fragrance-film storefront for RAHA, with collection browsing, individual perfume pages, account orders, favourites, Supabase Auth/RLS, and a protected admin inventory dashboard.

## Local preview

```bash
python3 -m http.server 3000 --bind 0.0.0.0
```

Then open `http://localhost:3000/`.

## Account experience

Existing users sign in from `/account.html`. Once authenticated, the sign-in form becomes the RAHA account dashboard with:

- Order history.
- Saved favourite perfumes.
- Favourite removal controls.
- Collection links.
- Sign out.

Collection cards and every generated product detail page include a heart control. Guests are sent to sign in; signed-in users save favourites to Supabase. The navigation adds an **Admin** link only when the signed-in user has an `admin` or `editor` role in `admin_profiles`.

## Supabase

Apply `supabase/schema.sql` to the RAHA Supabase project, then apply `supabase/favorites.sql` to create the account-owned favourites table and RLS policies. The browser uses the publishable key in `supabase-config.js`; it is safe to expose, while admin access and favourites ownership are enforced by Supabase Auth and RLS.

At the time of this package export, the connected RAHA Supabase project was inactive, so the favourites migration is included and ready to apply when the project is resumed.

## GitHub and deployment

The project is intended for `Uohaana/raha-liquid-gold` with Vercel serving the root static site. The private admin pages are `/studio-vault-9x.html` and `/stock.html`; they are not indexed and require Supabase authentication.
