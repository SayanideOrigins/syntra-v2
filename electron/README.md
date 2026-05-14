# Electron Wrapper — Google Sign-in Support

This folder lets you wrap the Syntra web app in Electron with **Google sign-in
that works inside the desktop app** — no external browser window opens.

## How it works

1. The renderer detects Electron via `window.electronAPI.isElectron`
   (set by `preload.cjs`).
2. It asks Supabase for the Google OAuth URL with
   `signInWithOAuth({ provider: "google", options: { skipBrowserRedirect: true,
   redirectTo: "https://syntra-electron.local/auth/callback" } })`.
3. It calls `electronAPI.googleSignIn(url)`, which the main process handles by
   opening a modal `BrowserWindow` pointed at that URL.
4. The user picks their Google account in that window. Google redirects to our
   sentinel `https://syntra-electron.local/...` URL with the Supabase tokens
   in the URL hash.
5. `will-redirect` intercepts that navigation, extracts the hash/query, closes
   the window, and returns the data to the renderer, which calls
   `supabase.auth.setSession(...)`. Done — same session as the web app.

## Packaging

From the project root:

```bash
npm install --save-dev electron @electron/packager
npx vite build
npx @electron/packager . "Syntra"   --platform=darwin --arch=x64   --out=electron-release --overwrite   --ignore='^/src' --ignore='^/public' --ignore='^/electron-release'
```

Make sure `vite.config.ts` has `base: './'` so assets resolve under `file://`,
and `package.json` has `"main": "electron/main.cjs"`.

## Supabase configuration

In your Supabase project's **Authentication → URL Configuration**, add
`https://syntra-electron.local/auth/callback` to the allowed redirect URLs.
The URL is never actually loaded — Electron intercepts it — but Supabase has
to allow-list it for the OAuth flow to issue tokens.
