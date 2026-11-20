# Photomode downloads

The three named cards are on the separate Photomodes page at https://dannysimas.com/photomodes/. The portfolio and wallpaper menus link to this page; the cards are not embedded in the homepage. Download files, compatibility requirements, and installation instructions have not been supplied. No active download links or guessed requirements are shown.

Add the supplied archives under `public/downloads/photomodes/`, then update `photomodes-data.js`: `downloadUrl` uses the public URL (for example `/downloads/photomodes/filename.zip`); `fileName` is an optional suggested filename. `preview`, `version`, `platform`, `requirements`, and `installation` are optional and must contain confirmed details. Local files use the browser download attribute; external download URLs open in a new tab. Set `downloadUrl` back to null to show the coming-soon state.

The renderer displays setup details only when supplied, and rejects non-HTTP(S) URL schemes. No binaries are executed by the site or during setup.
