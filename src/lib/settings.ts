import type { ConversationSettings } from "./types";

const SETTINGS_KEY = "syntra-settings";

const DEFAULT_SETTINGS: ConversationSettings = {
  globalResponseMode: "regular",
  markdownEnabled: true,
  autonomousEnabled: false,
  defaultTimerOffset: 1500,
};

export function getSettings(): ConversationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: ConversationSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
