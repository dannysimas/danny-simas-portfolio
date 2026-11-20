# Wallpaper source and maintenance

The catalog uses image originals from Danny's public **Danny Vault** shared Dropbox folder. No account credentials are needed. Image downloads go directly to the original file using Dropbox's `dl=1` option. Visitors browse cached previews on the website instead of a Dropbox folder.

`catalog.json` is the bundled starting catalog and offline fallback; the live endpoint replaces it with a complete current listing. Original width, height, byte size, modification date, and filename come from Dropbox file metadata. IDs derive from stable Dropbox file IDs. `format` describes the original, while the local preview and thumbnail assets are JPEG derivatives. The originals are unchanged.

The gallery defaults to **Most recent**, with **Oldest** available in the sort menu. Both use the original file's Dropbox modification date (`modified`), including after live sync. Images with missing dates appear last, and matching dates sort by game and title. Reset filters restores Most recent.

`source-inventory.json` records every visited folder, page count, excluded non-image file, import error, and completion status. The import follows every pagination voucher and traverses nested folders. Only JPG/JPEG, PNG, WebP, AVIF, and GIF image files are eligible; video and source/project files are excluded. Public owner/account metadata is discarded.

## Automatic syncing

The gallery now checks the shared Dropbox folder on opening and every five minutes while visible. Returning to a tab or reconnecting also triggers a check if the last successful check is over a minute old. Updates are applied without resetting filters or loaded-card counts; an open image preview or menu defers the update until it closes. Newly synced wallpapers also support the existing share links.

Add originals to the existing shared folder or its subfolders. The first folder level supplies the game name; deeper folders become collections. New images and game folders appear automatically, and deleted images disappear after a successful sync. Videos are excluded. These updates require no manual import, website edit, or redeployment through the production site and its server endpoint.

This is polling, not an instant Dropbox webhook. The server caches a successful listing for five minutes and the CDN may cache a page for another minute. A full first crawl currently takes about 25 seconds; visitors see the bundled gallery immediately during it. Refreshes run when the gallery is requested, not as a background cron job when nobody is visiting. Allow several minutes for uploads to appear.

- `api/wallpapers.js` exposes the read-only, paginated feed. It uses the fixed shared folder and returns only public image metadata and links. No Dropbox password, account token, or private-folder permission is needed.
- `server/wallpaper-source.mjs` traverses nested folders and pagination with timeouts, retries, URL validation, and bounded limits. Anonymous cookies exist only in server memory. It never uploads, deletes, or modifies anything in Dropbox.
- `server/wallpaper-service.mjs` shares concurrent refreshes and retains the last complete listing on a temporary failure. Cold instances fall back to the bundled browser catalog if Dropbox is unavailable. Partial listings never replace the gallery.
- `live-sync.mjs` checks every page against one catalog revision before applying it. Hidden tabs pause polling. Network failures leave existing images visible and retry automatically.

Unchanged originals use the existing local JPEG previews. New or replaced originals use fresh Dropbox preview renditions immediately, while download buttons still retrieve the untouched originals. The optional import below can periodically refresh the offline fallback and local optimized assets; it is not required for new uploads to appear.

The connection uses the public listing endpoint behind Dropbox's shared-folder page, not a documented stable Dropbox API. A future change to that endpoint may require maintenance. If that happens the saved catalog remains available. The shared folder must remain public and accessible; revoked links and Dropbox bandwidth restrictions can affect previews, syncing, and downloads.

## Running and deploying

The root Vite configuration mounts the same endpoint during local development and preview. On this Windows machine, use Node's system certificate store:

```powershell
node --use-system-ca node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort
```

Vercel runs `api/wallpapers.js` as a server function. `vercel.json` includes its fallback catalog and allows 60 seconds. Successful responses use a short shared-cache lifetime; errors are not cached. See Vercel's [function configuration](https://vercel.com/docs/functions/runtimes/node-js) and [cache-control documentation](https://vercel.com/docs/caching/cache-control-headers).

The production Vite build includes the portfolio, wallpapers, and photomodes. Its asset plugin copies all generated wallpaper previews into `dist/wallpapers/assets/`. Vercel deploys the server endpoint alongside this build. A static-only host without the endpoint will show the bundled library but will not sync automatically.

## Verification

```powershell
node --test tests/wallpaper-sync.test.mjs
```

The checks cover recursive discovery, pagination, added/changed/removed images, preview reuse, incomplete-feed rejection, retry recovery, concurrent requests, revision consistency, and deferring updates while a preview is open. Live read-only verification found 1,183 originals across 26 game collections. No test uploads or deletions were made to Dropbox.

## Optional offline catalog refresh

From the project root:

```powershell
node --use-system-ca concepts/motion-lab/wallpapers/import-dropbox.mjs
powershell -NoProfile -File concepts/motion-lab/wallpapers/optimize-previews.ps1
```

The importer uses the public shared-folder listing endpoint used by Dropbox's own shared-folder page. This is a website endpoint, not a guaranteed stable API, so it may need adjustment if Dropbox changes its viewer. It obtains fresh anonymous session cookies in memory and never stores them. Each HTTP request has a 25-second timeout and up to three attempts.

An existing usable catalog stays available throughout a refresh; a complete successful crawl replaces it atomically. Failed imports retain previous catalog entries and record errors in the inventory. Cached assets for unchanged originals are reused only when both files exist and JPEG headers have valid image dimensions. Changed originals or missing/invalid assets are fetched again; file extensions follow the response MIME type. On a first import, completed entries are published progressively. `WALLPAPER_IMPORT_LIMIT` can limit a development import, which will correctly report `complete: false`.

The importer chooses preview renditions according to the original aspect ratio, avoiding unnecessarily large portrait downloads. The Windows optimizer uses the built-in image codec to create JPEG previews at a maximum 1,600-pixel long edge and thumbnails at a maximum 800-pixel long edge. It verifies encoded dimensions before replacing each file, publishes the new catalog paths atomically, and then removes only the generated derivatives it replaced. A versioned optimized flag prevents repeat compression of unchanged previews. Run it after the importer finishes.

Keep the shared Dropbox folder accessible: removing files, revoking the link, or Dropbox bandwidth limits can affect original downloads. Local thumbnails/previews remain browsable until the next refresh. The production asset packaging is verified with `npm run verify:build`.

If a Windows file watcher interrupts the final catalog save after an otherwise completed import, `node concepts/motion-lab/wallpapers/import-dropbox.mjs --reconcile-local-cache` checks the existing inventory and locally restored assets before repairing catalog paths without another download. The optimizer validates its encoded JPEG dimensions before replacing each derivative and records optimization version 2. Its input and output use UTF-8.
