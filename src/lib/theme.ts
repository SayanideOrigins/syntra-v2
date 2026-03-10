import type { ThemeSettings, AppBranding, ThemePreset } from "./types";

const THEME_KEY = "syntra-theme";

export const THEME_PRESETS: ThemePreset[] = [
  { name: "Black/Green", colors: ["#22c55e"] },
  { name: "Black/Blue", colors: ["#3b82f6"] },
  { name: "Black/Purple", colors: ["#a855f7"] },
  { name: "Black/Red", colors: ["#ef4444"] },
  { name: "Charcoal/Amber", colors: ["#f59e0b"] },
];

const DEFAULT_BRANDING: AppBranding = {
  name: "SYNTRA",
  splitPoint: 3,
  font: "Syne",
  alignment: "left",
};

const DEFAULT_THEME: ThemeSettings = {
  preset: "Black/Green",
  customColors: ["#22c55e"],
  branding: { ...DEFAULT_BRANDING },
};

export function getThemeSettings(): ThemeSettings {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return { ...DEFAULT_THEME, branding: { ...DEFAULT_BRANDING } };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_THEME,
      ...parsed,
      branding: { ...DEFAULT_BRANDING, ...parsed.branding },
    };
  } catch {
    return { ...DEFAULT_THEME, branding: { ...DEFAULT_BRANDING } };
  }
}

export function saveThemeSettings(settings: ThemeSettings): void {
  localStorage.setItem(THEME_KEY, JSON.stringify(settings));
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function applyTheme(colors: string[]): void {
  const primary = colors[0] || "#22c55e";
  const { h, s, l } = hexToHSL(primary);
  const root = document.documentElement;

  // Primary
  root.style.setProperty("--primary", `${h} ${s}% ${l}%`);
  root.style.setProperty("--accent", `${h} ${s}% ${l}%`);
  root.style.setProperty("--ring", `${h} ${s}% ${l}%`);
  root.style.setProperty("--sidebar-primary", `${h} ${s}% ${l}%`);
  root.style.setProperty("--sidebar-ring", `${h} ${s}% ${l}%`);

  // Green vars for glow etc
  root.style.setProperty("--green", `${h} ${s}% ${l}%`);
  root.style.setProperty("--green-dim", `${h} ${Math.min(s + 1, 100)}% ${Math.max(l - 8, 10)}%`);
  root.style.setProperty("--green-glow", `${h} ${s}% ${l}% / 0.18`);
  root.style.setProperty("--green-glow2", `${h} ${s}% ${l}% / 0.08`);

  // Chat user bubble
  root.style.setProperty("--chat-user", `${h} 35% 16%`);
  root.style.setProperty("--chat-user-border", `${h} ${s}% ${l}% / 0.3`);
}

export function resetThemeToDefaults(): void {
  const root = document.documentElement;
  root.style.setProperty("--primary", "142 71% 45%");
  root.style.setProperty("--accent", "142 71% 45%");
  root.style.setProperty("--ring", "142 71% 45%");
  root.style.setProperty("--sidebar-primary", "142 71% 45%");
  root.style.setProperty("--sidebar-ring", "142 71% 45%");
  root.style.setProperty("--green", "142 71% 45%");
  root.style.setProperty("--green-dim", "142 72% 37%");
  root.style.setProperty("--green-glow", "142 71% 45% / 0.18");
  root.style.setProperty("--green-glow2", "142 71% 45% / 0.08");
  root.style.setProperty("--chat-user", "150 35% 16%");
  root.style.setProperty("--chat-user-border", "142 71% 45% / 0.3");
}

export function initTheme(): void {
  const settings = getThemeSettings();
  applyTheme(settings.customColors);
}
