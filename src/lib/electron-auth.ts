// Electron-aware Google sign-in helper.
//
// When the web app is wrapped with Electron, the preload script exposes
// `window.electronAPI` with an `googleSignIn(url)` method that opens an
// internal BrowserWindow pointing at `url`, waits for a redirect to the
// configured callback, and returns the URL fragment containing Supabase
// tokens (access_token, refresh_token, ...).
//
// In a normal browser this module is a no-op (isElectron === false) and the
// app keeps using `lovable.auth.signInWithOAuth` like before.

import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true;
      googleSignIn: (authUrl: string) => Promise<
        | { ok: true; hash: string; query: string; url: string }
        | { ok: false; error: string }
      >;
    };
  }
}

export const isElectron = (): boolean =>
  typeof window !== "undefined" && !!window.electronAPI?.isElectron;

/**
 * Run Google OAuth inside an in-app Electron BrowserWindow.
 * No external browser is opened. On success the Supabase session is set and
 * `onAuthStateChange` listeners (e.g. ProtectedRoute) will fire as usual.
 */
export async function signInWithGoogleElectron(): Promise<void> {
  if (!window.electronAPI) throw new Error("Not running in Electron");

  // Ask Supabase for the provider authorize URL but don't navigate.
  const redirectTo = "https://syntra-electron.local/auth/callback";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data?.url) throw error ?? new Error("No auth URL returned");

  // Open the URL inside the Electron window and wait for the redirect.
  const result = await window.electronAPI.googleSignIn(data.url);
  if (!result.ok) {
    throw new Error((result as { ok: false; error: string }).error);
  }

  // Supabase implicit flow puts tokens in the URL hash.
  const hash = result.hash.startsWith("#") ? result.hash.slice(1) : result.hash;
  const params = new URLSearchParams(hash);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  if (access_token && refresh_token) {
    const { error: setErr } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (setErr) throw setErr;
    return;
  }

  // PKCE / code flow fallback.
  const code = new URLSearchParams(result.query).get("code");
  if (code) {
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exErr) throw exErr;
    return;
  }

  throw new Error("OAuth callback did not contain tokens or code");
}
