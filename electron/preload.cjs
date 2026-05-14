// Electron preload — exposes a tiny, typed API to the renderer.
// Runs in an isolated context with contextIsolation: true.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  googleSignIn: (authUrl) => ipcRenderer.invoke("google-sign-in", authUrl),
});
