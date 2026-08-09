# The JK Espresso Tracker

A web app for tracking espresso brews, beans, gear, and recipes — built for TheJKExperience. Works on desktop and mobile browsers (responsive layout), and can be installed as an app on your phone's home screen (see [Install it as a mobile app](#install-it-as-a-mobile-app) below). Your Brew Log, Beans, and personal Recipes now sync across devices through a free Supabase account; Gear, Discover, and Learn stay fully local and work with zero setup.

## Quick start

1. Double-click **index.html** to open the app in your browser.
2. The first time, it'll send you to a one-time **setup.html** page with instructions for connecting your own free cloud database. Do that once, and every device you sign in on shares the same brew log.

Full setup steps (also shown in-app on `setup.html`):

### 1. Create a free Supabase project
Go to [supabase.com](https://supabase.com), sign up, and create a new project (any name/region, set a database password you don't need to remember day-to-day).

### 2. Run the schema script
In your Supabase project: **SQL Editor → New query** → paste in the contents of `supabase/schema.sql` (included in this folder) → **Run**. This creates your `beans`, `brews`, and `recipes` tables, locks each one down with row-level security so only you can ever see your own rows, and creates a private `brew-photos` storage bucket with matching access rules.

### 3. Copy in your project keys
In Supabase: **Project Settings → API**. Copy the **Project URL** and the **anon public** key. Open `js/supabase-config.js` and paste them in:

```js
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";
```

Both values are safe to leave in this file — they only grant what the row-level security policies in `schema.sql` allow (a signed-in user can only ever read or write their own data).

### 4. Sign up in the app
Reload `index.html`, click **Sign in → Create account**, and you're syncing.

## What's in it

- **Home** — dashboard with quick stats and recent brews *(requires sign-in)*
- **Brew Log** — grind size, grinder, machine, tools, dose/yield weight, brew time, rating, feedback, next-brew recommendations, and up to three photos per brew (shot pour, puck, packaging); searchable history *(requires sign-in)*
- **Beans** — your bean library: roaster, roast type, origin, process, tasting notes, roaster history *(requires sign-in)*
- **Recipes** — starter recipes are visible to everyone, no account needed; signing in lets you save your own, which then sync across devices
- **Gear** — searchable catalog of real espresso machines, grinders, and tools across price tiers (researched Aug 2026 — confirm current pricing before buying); fully local, no account
- **Discover** — a starter directory of specialty roasters and home-barista communities, plus a **live "find roasters near me"** search powered by OpenStreetMap (free, no API key or account required) that geolocates you and lists real nearby coffee shops/roasters sorted by distance; fully local, no account
- **Learn** — a coffee history timeline and a reference table of drink styles with how-to instructions; fully local, no account

## How your data is stored now

- **Beans, Brews, and your custom Recipes** live in your own private Supabase (Postgres) database, protected by row-level security — nobody but you can read or write your rows, even though the API key is public in the app's code. Signing in on your phone and your computer shows the same data on both, because it's coming from the same cloud database rather than each browser's local storage.
- **Brew photos** are stored in a private Supabase Storage bucket, organized under your account, and only ever displayed via short-lived signed links generated for you.
- **Gear, Discover, and Learn** are unaffected by any of this — they're static reference content that ships with the app and need no login or internet-dependent database, though the live "near me" search does need an internet connection and location permission.
- There's currently no offline mode for the personal-data pages (Home, Brew Log, Beans) — they need an internet connection to load and save, since that's what makes the cross-device sync possible. If offline logging turns out to matter a lot in practice, that's a reasonable next addition (a local queue that syncs once you're back online).

## Install it as a mobile app

The site is now a PWA (Progressive Web App) — you can add it to your phone's home screen and it opens full-screen with its own icon, no App Store needed:

- **iPhone (Safari):** open the site → tap the **Share** icon → **Add to Home Screen** → **Add**.
- **Android (Chrome):** open the site → tap the **⋮** menu → **Add to Home screen** (or **Install app**) → **Add**.

Once installed, it launches like a normal app and the static pages (Gear, Discover, Learn, and the app shell itself) keep working even with no signal; Brew Log/Beans/Recipes still need internet since they sync through Supabase.

## Notes on the "near me" search

It uses the OpenStreetMap Overpass API, which is free and doesn't require an account, but its coverage depends on volunteer mapping in your area — dense cities tend to have great data, some suburban/rural areas less so. Each result links out to both OpenStreetMap and a Google Maps search so you can cross-check hours, reviews, and directions.

## Next steps / ideas for a later pass

- Offline queueing for Brew Log/Beans so logging works without signal, syncing once you're back online
- Charts of rating/extraction trends over time
- Google or magic-link sign-in as additional options alongside email/password
- A real App Store/Play Store listing (wrapping this same code with Capacitor) if you outgrow the home-screen-install version
