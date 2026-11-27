# Danny Simas Portfolio

The production website uses the approved Worlds in Frame design in `concepts/motion-lab/`. Vite serves that directory at `/` and builds the portfolio, `/wallpapers/`, and `/photomodes/` into `dist/`. The earlier React implementation in `src/` is preserved but is not the active entry point.

The existing GitHub `main` branch deploys through Vercel to https://dannysimas.com. `vercel.json` retains the paused Next Play routes, configures the wallpaper sync endpoint, and redirects the old concept preview URLs.

Run `npm test`, `npm run build`, and `npm run verify:build` before deploying. The build includes the optimized wallpaper image cache; subsequent Dropbox uploads sync automatically without rebuilding. See [wallpaper maintenance](concepts/motion-lab/wallpapers/README.md).

For local Dropbox access on this Windows machine: `node --use-system-ca node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort`.

## Run locally
```bash
npm install
npm run dev
```

## Build for Vercel
```bash
npm run build
```

Then deploy the project folder to Vercel.

## The Next Play availability

The Next Play is temporarily paused. `NEXT_PLAY_ENABLED` in `src/features.js` controls its desktop and mobile menu entries, homepage logo, lightbox, and standalone pages. While disabled, `/the-next-play` and `/game-notes` show the portfolio at `/`.

To restore it later, reintroduce its routes and menu entry in the active design, then enable `NEXT_PLAY_ENABLED` in the preserved React implementation if that implementation is used. All content, images, styles, and community configuration are preserved; no database changes are needed.

## The Next Play community features

The game pages use Supabase for like/dislike reactions and comments.

1. Create a Supabase project.
2. Run `supabase/game-feedback.sql` in the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local` and add the project URL and public anon key.
4. Add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values to the Vercel project environment variables.
5. New comments are automatically approved and appear immediately. Remove any unwanted comments from the `game_comments` table.

Only the public anon key belongs in the website environment. Never add the Supabase service-role key to Vite or the browser.

## Where images live
Put your final WebP/JPG images here:

```txt
public/images/about/about-danny.webp

public/images/hero/hero-01.webp
public/images/hero/hero-02.webp
public/images/hero/hero-03.webp
public/images/hero/hero-04.webp

public/images/resident-evil/re-cover.webp
public/images/resident-evil/re-01.webp
public/images/resident-evil/re-02.webp

public/images/pragmata/pragmata-cover.webp
public/images/expedition-33/e33-cover.webp
public/images/devil-may-cry/dmc-cover.webp
public/images/tomb-raider/tr-cover.webp
```

## How to change images
The active site content lives in `concepts/motion-lab/content.js`. The original React source is retained in `src/App.jsx`; the examples below describe that preserved implementation.

At the top, replace the stock image URLs with local paths:

```jsx
const stock1 = "/images/hero/hero-01.webp";
```

For galleries, change the folder objects:

```jsx
{
  title: "Resident Evil",
  cover: "/images/resident-evil/re-cover.webp",
  images: [
    "/images/resident-evil/re-01.webp",
    "/images/resident-evil/re-02.webp",
  ],
}
```

## Recommended image sizes
- About image: 1200 x 700 WebP
- Hero images: 1800 x 1000 WebP
- Gallery vertical images: 1080 x 1920 WebP
- Folder covers: 1600 x 900 WebP

## Active favourites and photomode discussions

See [community and favourites maintenance](docs/photomode-community.md) for the reused comment service, moderation and local favourites behavior. See [photomode compatibility sources](docs/photomode-compatibility.md) before replacing a shared download.

## Visitor analytics

Vercel Web Analytics is loaded on all three active pages by `concepts/motion-lab/analytics.js`. It runs only in production builds served from `dannysimas.com` or `www.dannysimas.com`, excluding local previews and temporary deployment URLs. Only page views are collected; no custom events, comment content, or form values are sent.

View visitors, page views, traffic sources, and popular pages in the Vercel project's Analytics dashboard. Web Analytics must also be enabled for `danny-simas-portfolio` in Vercel before deploying. Collection starts after installation; earlier visits cannot be backfilled. Google Analytics is not installed.
