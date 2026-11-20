# Worlds in Frame - production source

This approved design is now the production entry point. Vite serves this directory at the domain root and builds its portfolio, wallpaper, and photomode pages. The existing GitHub/Vercel pipeline publishes the build.

Run `npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`, then open http://127.0.0.1:5174/.

The expanding artwork hero and scroll-driven horizontal gallery are complemented by a grid view, full collection browser, image viewer with keyboard/swipe controls and personal downloads, collaboration filters, full-screen navigation with changing artwork previews and oversized links, and expandable FAQs. Phone layouts use native horizontal browsing. OS reduced-motion preferences are respected.

Content is copied directly from `src/App.jsx`: 6 collections / 87 images, the full About copy, 4 statistics, 17 collaborators in 4 groups, 6 recognition items, all 11 FAQs, 3 media-kit content groups, and 6 social links. Run `node concepts/motion-lab/sync-content.mjs` after changing those source arrays. The script checks that every full-size image and thumbnail exists. The Next Play remains paused in production and is absent from this concept.

The contact form uses the existing Formspree endpoint; a valid submission sends a real message. Local verification checks required-field validation without sending a message. Delivery has not been tested. Media Kit buttons use the existing Beacons URL. Instagram uses the existing LightWidget feed plus its [official responsive embed script](https://lightwidget.com/what-is-widget-embed-code).

Typography: 18px body, 14px minimum labels, 16px navigation, 24px collection titles. Existing cyan, violet, near-black and white tones are retained.

Verified: in-memory Vite builds for this concept and the unchanged production entry; complete source asset inventory; desktop and phone layout, collection dialogs, image arrow keys/Escape/focus return, grid toggle, navigation, collaboration filters, FAQ expansion, and native form validation. The shared Vite/Vercel configuration includes the read-only wallpaper endpoint.

## Wallpaper Vault

Open http://127.0.0.1:5174/wallpapers/ or follow Wallpaper Vault from the concept menu or artwork section.

The library contains 1,183 Dropbox image originals across 26 games (1,181 portrait and 2 landscape images). All 50 source folders and their pagination were inspected; 49 MP4 files were excluded. The original portfolio gallery still contains its original 87 curated images.

Visitors can search, filter by game/orientation/resolution, sort by game/resolution/download size, load more images, open previews, zoom, navigate previous/next, copy direct wallpaper links, and download the untouched original. Local optimized JPEG thumbnails and previews keep browsing lightweight. Original dimensions, file type and download size remain visible. Phone layouts collapse the secondary filters. The original cyan/violet palette, social icons, and custom cursor are retained.

Verified in the browser: desktop and phone layouts, orientation/game/resolution/search filters, empty-state reset, preview zoom/navigation, copy-link feedback, Escape and focus return. A browser download saved a valid original JPEG matching its exact catalog byte size. Native dialog and OS reduced-motion behavior are retained. The same verified pages are included in the production build.

Future Dropbox uploads sync automatically through `/api/wallpapers` when the gallery opens and every five minutes while visible. New game folders, replaced originals, and removals are reflected after a successful complete listing. The existing saved catalog stays available during refreshes and network failures. See [wallpapers/README.md](wallpapers/README.md) for the sync behavior, local certificate setup, and optional offline-cache maintenance. The production build packages all three pages and copies the cached wallpaper assets to `/wallpapers/assets/`.

Final verification: all 1,183 catalog IDs are unique; all 2,366 referenced JPEG derivatives exist, decode with valid dimensions, retain the source aspect ratio, and meet the 800/1,600-pixel limits. The full local cache is approximately 285 MiB. The source inventory is complete with zero import errors. Production, portfolio concept, and wallpaper entry builds pass in memory. Browser checks include the repaired portrait/landscape previews and a phone layout with no horizontal overflow.

The landing page now uses a large angled cyan Explore graphic with a violet backing layer. It opens the full-screen visual menu; a compact filled header control takes over after scrolling. Both pages share artwork previews, keyboard navigation, native Escape, and focus return. Desktop, short-screen, and 320/390-pixel menu layouts have been checked.

## Photomodes

The independent [Photomodes page](http://127.0.0.1:5174/photomodes/) contains the three announced game cards, shared navigation, and footer. Files and setup details remain pending; see [PHOTOMODES.md](PHOTOMODES.md). The earlier homepage `#photomodes` preview link forwards to this page. `concepts/motion-lab/photomodes/index.html` is included in the production build.
