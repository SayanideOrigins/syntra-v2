import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/settings";
import { getAllAIs, saveAI } from "@/lib/db";
import { getThemeSettings, saveThemeSettings, applyTheme, THEME_PRESETS } from "@/lib/theme";
import { AppLogo } from "@/components/AppLogo";
import { supabase } from "@/integrations/supabase/client";
import type { ConversationSettings, ResponseMode, AIEntity, ThemeSettings, AppBranding } from "@/lib/types";

const FONT_OPTIONS = ["Syne", "Space Grotesk", "DM Sans", "Inter", "monospace"];
const FONT_SIZES = [
  { label: "Small", value: 12 },
  { label: "Medium", value: 13 },
  { label: "Large", value: 15 },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ConversationSettings>(getSettings());
  const [ais, setAIs] = useState<AIEntity[]>([]);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(getThemeSettings());
  const savedThemeRef = useRef<ThemeSettings>(getThemeSettings());

  useEffect(() => { getAllAIs().then(setAIs); }, []);

  const update = (partial: Partial<ConversationSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
  };

  const updateAIMode = async (aiId: string, mode: ResponseMode) => {
    const ai = ais.find((a) => a.id === aiId);
    if (!ai) return;
    const updated = { ...ai, responseMode: mode };
    await saveAI(updated);
    setAIs((prev) => prev.map((a) => a.id === aiId ? updated : a));
  };

  const updateThemeColors = (colors: string[], presetName?: string) => {
    const next = { ...themeSettings, customColors: colors, ...(presetName ? { preset: presetName } : {}) };
    setThemeSettings(next);
    applyTheme(colors);
  };

  const updateBranding = (partial: Partial<AppBranding>) => {
    setThemeSettings((prev) => ({
      ...prev,
      branding: { ...prev.branding, ...partial },
    }));
  };

  const saveTheme = () => {
    saveThemeSettings(themeSettings);
    savedThemeRef.current = { ...themeSettings };
  };

  const revertTheme = () => {
    setThemeSettings(savedThemeRef.current);
    applyTheme(savedThemeRef.current.customColors);
  };

  useEffect(() => {
    return () => {
      const current = getThemeSettings();
      applyTheme(current.customColors);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const modes: { value: ResponseMode; label: string }[] = [
    { value: "regular", label: "Regular" },
    { value: "humanely", label: "Humanely" },
    { value: "professional", label: "Professional" },
    { value: "custom", label: "Custom" },
  ];

  const sliderPercent = (settings.defaultTimerOffset / 5000) * 100;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="bg-surface border-b border-border px-3.5 py-3.5 flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => { revertTheme(); navigate("/home"); }}
          className="w-8 h-8 rounded-[10px] bg-surface-2 border border-border flex items-center justify-center text-syntra-text2 shrink-0 hover:bg-surface-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <h2 className="font-head text-base font-bold tracking-[-0.02em]">Settings</h2>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3.5 flex flex-col gap-2.5">
        {/* Appearance */}
        <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] pt-1 pb-1.5">
          Appearance
        </div>
        <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden p-3 flex flex-col gap-3">
          {/* Theme presets */}
          <div>
            <p className="text-[12px] text-syntra-text2 mb-2">Theme Presets</p>
            <div className="flex gap-2 flex-wrap">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => updateThemeColors(preset.colors, preset.name)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-mono text-[10px] border transition-all ${
                    themeSettings.preset === preset.name
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-syntra-text2 hover:border-[hsl(var(--border2))]"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: preset.colors[0] }} />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom color picker */}
          <div>
            <p className="text-[12px] text-syntra-text2 mb-2">Custom Accent Color</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeSettings.customColors[0] || "#22c55e"}
                onChange={(e) => updateThemeColors([e.target.value], "Custom")}
              />
              <span className="font-mono text-[11px] text-syntra-text2">{themeSettings.customColors[0] || "#22c55e"}</span>
            </div>
          </div>

          {/* Message Font Size */}
          <div>
            <p className="text-[12px] text-syntra-text2 mb-2">Message Font Size</p>
            <div className="flex gap-1">
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.value}
                  onClick={() => update({ messageFontSize: fs.value })}
                  className={`px-[9px] py-1 rounded-full font-mono text-[11px] border transition-all ${
                    (settings.messageFontSize || 13) === fs.value
                      ? "bg-primary border-primary text-black font-semibold"
                      : "border-border text-syntra-text2 hover:border-[hsl(var(--border2))]"
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save / revert */}
          <div className="flex gap-2">
            <button
              onClick={saveTheme}
              className="flex-1 py-2 bg-primary rounded-[10px] font-mono text-[11px] font-medium text-black hover:-translate-y-px transition-all"
            >
              Save Theme
            </button>
            <button
              onClick={revertTheme}
              className="flex-1 py-2 bg-surface-3 border border-border rounded-[10px] font-mono text-[11px] text-syntra-text2 hover:bg-surface-2 transition-colors"
            >
              Revert
            </button>
          </div>
        </div>

        {/* Branding */}
        <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] pt-2 pb-1.5">
          Branding
        </div>
        <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden p-3 flex flex-col gap-3">
          {/* Live preview */}
          <div className={`flex py-3 ${themeSettings.branding.alignment === "center" ? "justify-center" : themeSettings.branding.alignment === "right" ? "justify-end" : "justify-start"}`}>
            <span
              className="font-extrabold tracking-[-0.04em]"
              style={{
                fontFamily: themeSettings.branding.font === "monospace" ? "'JetBrains Mono', monospace" : `'${themeSettings.branding.font}', sans-serif`,
                fontSize: "28px",
              }}
            >
              <span className="text-primary">
                {(themeSettings.branding.name || "SYNTRA").slice(0, themeSettings.branding.splitPoint)}
              </span>
              <span className="text-foreground">
                {(themeSettings.branding.name || "SYNTRA").slice(themeSettings.branding.splitPoint)}
              </span>
            </span>
          </div>

          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">App Name</label>
            <input
              value={themeSettings.branding.name}
              onChange={(e) => updateBranding({ name: e.target.value })}
              className="w-full bg-surface-3 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors"
              placeholder="SYNTRA"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Split Point</label>
              <input
                type="number"
                min={0}
                max={(themeSettings.branding.name || "SYNTRA").length}
                value={themeSettings.branding.splitPoint}
                onChange={(e) => updateBranding({ splitPoint: Number(e.target.value) })}
                className="w-full bg-surface-3 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Alignment</label>
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => updateBranding({ alignment: align })}
                    className={`flex-1 py-[7px] rounded-[8px] font-mono text-[10px] border transition-all ${
                      themeSettings.branding.alignment === align
                        ? "bg-primary border-primary text-black"
                        : "border-border text-syntra-text2"
                    }`}
                  >
                    {align[0].toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Font</label>
            <div className="flex gap-1 flex-wrap">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => updateBranding({ font: f })}
                  className={`px-2.5 py-1.5 rounded-full font-mono text-[10px] border transition-all ${
                    themeSettings.branding.font === f
                      ? "bg-primary border-primary text-black"
                      : "border-border text-syntra-text2"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveTheme}
            className="w-full py-2 bg-primary rounded-[10px] font-mono text-[11px] font-medium text-black hover:-translate-y-px transition-all"
          >
            Save Branding
          </button>
        </div>

        {/* Response Mode */}
        <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] pt-2 pb-1.5">
          Response Mode
        </div>
        <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden">
          <div className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[15px]" style={{ background: "hsl(var(--green) / 0.12)" }}>
              💬
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-foreground">Global Mode</p>
              <p className="text-[11px] text-syntra-text2 font-light mt-0.5">Default response style for all AIs</p>
            </div>
          </div>
          <div className="px-3 pb-3 flex gap-1">
            {modes.map((m) => (
              <button
                key={m.value}
                onClick={() => update({ globalResponseMode: m.value })}
                className={`px-[9px] py-1 rounded-full font-mono text-[11px] border transition-all ${
                  settings.globalResponseMode === m.value
                    ? "bg-primary border-primary text-black font-semibold"
                    : "border-border text-syntra-text2 hover:border-[hsl(var(--border2))]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] pt-2 pb-1.5">
          Features
        </div>
        <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden">
          <div className="flex items-center p-3 gap-3 relative">
            <div className="absolute bottom-0 left-3.5 right-3.5 h-px bg-border" />
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[15px]" style={{ background: "rgba(59,130,246,0.12)" }}>
              📝
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-foreground">Markdown Rendering</p>
              <p className="text-[11px] text-syntra-text2 font-light mt-0.5">Format AI responses with markdown</p>
            </div>
            <PillToggle checked={settings.markdownEnabled} onChange={(v) => update({ markdownEnabled: v })} />
          </div>
          <div className="flex items-center p-3 gap-3">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[15px]" style={{ background: "rgba(245,158,11,0.12)" }}>
              🔄
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-foreground">Autonomous Discussion</p>
              <p className="text-[11px] text-syntra-text2 font-light mt-0.5">AIs continue discussing on their own</p>
            </div>
            <PillToggle checked={settings.autonomousEnabled} onChange={(v) => update({ autonomousEnabled: v })} />
          </div>
        </div>

        {/* Timer Offset */}
        <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] pt-2 pb-1.5">
          Timing
        </div>
        <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden">
          <div className="p-3 pb-4">
            <div className="flex justify-between text-[12px] mb-3">
              <span className="text-syntra-text2">Timer Offset</span>
              <span className="font-mono text-[11px] text-primary">{settings.defaultTimerOffset}ms</span>
            </div>
            <input
              type="range"
              min={0} max={5000} step={100}
              value={settings.defaultTimerOffset}
              onChange={(e) => update({ defaultTimerOffset: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>

        {/* Per-AI modes */}
        {ais.length > 0 && (
          <>
            <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] pt-2 pb-1.5">
              Per-AI Modes
            </div>
            <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden">
              {ais.map((ai, idx) => (
                <div key={ai.id} className="flex items-center gap-2.5 px-3.5 py-2.5 relative">
                  {idx < ais.length - 1 && <div className="absolute bottom-0 left-3.5 right-3.5 h-px bg-border" />}
                  <div className="w-[30px] h-[30px] rounded-full bg-surface-3 border border-[hsl(var(--border2))] flex items-center justify-center overflow-hidden shrink-0">
                    {ai.profilePicture ? <img src={ai.profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">🤖</span>}
                  </div>
                  <span className="text-xs font-medium flex-1 truncate">{ai.name}</span>
                  <button
                    onClick={() => {
                      const currentIdx = modes.findIndex((m) => m.value === (ai.responseMode || "regular"));
                      const nextIdx = (currentIdx + 1) % modes.length;
                      updateAIMode(ai.id, modes[nextIdx].value);
                    }}
                    className="px-2 py-[3px] rounded-full font-mono text-[10px] border border-primary/30 text-primary"
                    style={{ background: "hsl(var(--green) / 0.08)" }}
                  >
                    {modes.find((m) => m.value === (ai.responseMode || "regular"))?.label}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Sign Out */}
        <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] pt-2 pb-1.5">
          Account
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-destructive/10 border border-destructive/30 rounded-[14px] text-destructive font-medium text-[13px] hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>

        <div className="h-16" />
      </main>
    </div>
  );
}

function PillToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-[38px] h-[22px] rounded-full relative shrink-0 transition-colors ${
        checked ? "bg-primary" : "bg-surface-3 border border-[hsl(var(--border2))]"
      }`}
    >
      <span
        className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-[left] duration-200"
        style={{
          left: checked ? "18px" : "2px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}
