# Photomode discussions and wallpaper favourites

The active Photomodes page reuses the existing Next Play Supabase `game_comments` table and public website configuration (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`). No table, permission, or archived-route changes are needed.

Each game's discussion uses `game_id = photomode:<photomode-id>`. The archived Next Play entries retain their original IDs and are never included in these queries. Reads select only approved comments, 20 at a time, ordered by ID with a cursor for older comments. Public posts use the same immediately approved policy as Next Play.

The default discussion view is All games, showing the newest posts across the six supported photomodes with a game label on each comment. The combined query explicitly allows only those six thread IDs. Visitors can filter the feed by game, while the comment form requires a specific game before posting. Choosing Reply selects that comment's game automatically. Filtering back to All games preserves the current posting game and draft; changing games saves and restores each draft. New comments appear when the page or selected feed is loaded; this is not an unread tracker or notification system.

Moderate comments in the existing Supabase table editor: filter `game_id` to the relevant `photomode:` ID, then set an unwanted comment's status to `rejected`. Public visitors have no edit/delete controls. Names are visitor-supplied, not verified identities; Reply adds a plain-text @name mention, not a nested thread or notification. No messages or emails are sent automatically.

Comments are rendered as text, with limits of 60 characters for names and 800 for bodies. The form has a honeypot, duplicate-submit prevention, and a 30-second per-game cooldown in the page. These are UI protections, not server-enforced rate limits. The existing public insert policy remains unchanged. The service is read-only during automated live checks; submission tests use mocks and never add test comments to production.

The local `.env.local` is ignored by Git and contains only the existing public anonymous/publishable configuration. Never put a service-role or secret key in Vite variables. The deployment must retain the same existing public Vercel environment variables.

Wallpaper favourites use `dannysimas-wallpaper-favourites-v1` in localStorage, with stable wallpaper IDs only. They remain on the device/browser and are shared between EN/PT-BR. No account or network request is involved. If storage is blocked or full, favourites still work for the current visit and the UI explains that they are temporary. The filter combines with game, orientation, search and resolution, and gallery refreshes preserve the saved IDs.

Validation: `npm test`, `npm run build`, `npm run verify:build`. Integration tests exercise both languages, favourites in the gallery/viewer, safe comment rendering, reply mentions, failures and game-switch races. Actual Supabase reads can be checked using the existing public configuration without posting test messages.
