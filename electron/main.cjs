// Electron main process. Use with @electron/packager.
//
// IMPORTANT: this file is only used when the app is wrapped with Electron.
// It is ignored by the normal Vite/web build.
//
// It exposes an IPC handler `google-sign-in` that opens an in-app
// BrowserWindow pointing at a Supabase OAuth authorize URL, waits for the
// final redirect to our sentinel callback (https://syntra-electron.local/...),
// and returns the URL fragment + query so the renderer can call
// supabase.auth.setSession(...) without ever opening an external browser.

const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");

const CALLBACK_PREFIX = "https://syntra-electron.local/auth/callback";

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the built Vite app.
  win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  return win;
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ---------- Logout: wipe Google OAuth partition so account picker shows again ----------
ipcMain.handle("auth-clear-session", async () => {
  try {
    const oauthSession = session.fromPartition("persist:google-oauth");
    await oauthSession.clearStorageData({
      storages: ["cookies", "localstorage", "indexdb", "websql", "serviceworkers", "cachestorage"],
    });
    await oauthSession.clearCache();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

// ---------- Google OAuth via in-app BrowserWindow ----------
ipcMain.handle("google-sign-in", async (event, authUrl) => {
  return new Promise((resolve) => {
    const parent = BrowserWindow.fromWebContents(event.sender) || undefined;

    const authWin = new BrowserWindow({
      width: 500,
      height: 650,
      parent,
      modal: true,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        partition: "persist:google-oauth",
      },
    });

    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      try { authWin.close(); } catch (_) {}
      resolve(payload);
    };

    const tryCapture = (urlStr) => {
      if (!urlStr || !urlStr.startsWith(CALLBACK_PREFIX)) return false;
      try {
        const u = new URL(urlStr);
        finish({ ok: true, hash: u.hash || "", query: u.search || "", url: urlStr });
      } catch (e) {
        finish({ ok: false, error: String(e) });
      }
      return true;
    };

    // Catch the redirect before it tries to actually load syntra-electron.local
    authWin.webContents.on("will-redirect", (e, url) => {
      if (tryCapture(url)) e.preventDefault();
    });
    authWin.webContents.on("will-navigate", (e, url) => {
      if (tryCapture(url)) e.preventDefault();
    });
    // Some flows update the URL without a navigation event.
    authWin.webContents.on("did-navigate", (_e, url) => tryCapture(url));
    authWin.webContents.on("did-navigate-in-page", (_e, url) => tryCapture(url));

    authWin.on("closed", () => {
      if (!settled) {
        settled = true;
        resolve({ ok: false, error: "Sign-in window closed" });
      }
    });

    authWin.loadURL(authUrl).catch((err) => {
      finish({ ok: false, error: String(err) });
    });
  });
});
