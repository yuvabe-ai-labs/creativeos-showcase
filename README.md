# Yuvabe Studios showcase

A public page of sample reels for prospects, plus an admin where showcase admins add reels and
manage categories.

- `/`: the public page. No sign-in. Reels grouped by category ("Featured" shows them all);
  `/?category=<slug>` opens on one category.
- `/admin`: sign in with a CreativeOS super-admin account. Upload an MP4, give it a title,
  category and cover, and switch it on.

## How it fits with CreativeOS

This app has no database or bucket of its own. It uses CreativeOS's:

- **Supabase:** the `showcase_categories`, `showcase_reels` and `showcase_reel_categories` tables
  (a reel can be in several categories). They are created by
  CreativeOS migration `0063_showcase.sql`. Migrations stay in the CreativeOS repo so the database
  has one migration history. The only CreativeOS table this app reads is `clients` (names), to
  refuse titles that name a brand.
- **Logins:** the same Supabase auth. `/admin` lets in CreativeOS super admins
  (`app_metadata.platform_role = "super_admin"`) and showcase-only logins
  (`app_metadata.showcase_admin = true`, e.g. the sales account). A showcase-only login has no
  org and no access to anything in CreativeOS. Set the flag with the service role (Supabase
  dashboard → Authentication → the user → raw app metadata).
- **Storage:** the CreativeOS media bucket. Showcase files live under `showcase/<reel id>/`.

Decisions are recorded in CreativeOS's ADR log, D501–D506.

## Run it

```
cp .env.example .env.local   # fill in from the CreativeOS environment you want
npm install
npm run dev                  # http://localhost:3100
```

`npm run typecheck`, `npm run lint` and `npm test` before committing.
