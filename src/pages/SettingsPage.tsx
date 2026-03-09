import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/settings";
import { getAllAIs, saveAI } from "@/lib/db";
import type { ConversationSettings, ResponseMode, AIEntity } from "@/lib/types";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ConversationSettings>(getSettings());
  const [ais, setAIs] = useState<AIEntity[]>([]);

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

  const modes: { value: ResponseMode; label: string }[] = [
    { value: "regular", label: "Regular" },
    { value: "humanely", label: "Humanely" },
    { value: "professional", label: "Professional" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border px-3.5 py-3.5 flex items-center gap-2.5">
        <button
          onClick={() => navigate("/home")}
          className="w-8 h-8 rounded-[10px] bg-surface-2 border border-border flex items-center justify-center text-syntra-text2 shrink-0 hover:bg-surface-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <h2 className="font-head text-base font-bold tracking-[-0.02em]">Settings</h2>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-thin p-3.5 flex flex-col gap-2.5">
        {/* Response Mode */}
        <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] pt-1 pb-1.5">
          Response Mode
        </div>
        <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden">
          <div className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[15px]" style={{ background: "rgba(34,197,94,0.12)" }}>
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
          {/* Markdown */}
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

          {/* Autonomous */}
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
            <div className="flex justify-between text-[12px] mb-1">
              <span className="text-syntra-text2">Timer Offset</span>
              <span className="font-mono text-[11px] text-primary">{settings.defaultTimerOffset}ms</span>
            </div>
            <div className="relative h-1 bg-surface-3 rounded-full mt-2">
              <div
                className="h-full bg-primary rounded-full relative"
                style={{ width: `${(settings.defaultTimerOffset / 5000) * 100}%` }}
              >
                <div
                  className="absolute right-[-6px] top-[-6px] w-4 h-4 rounded-full bg-primary"
                  style={{ boxShadow: "0 0 8px rgba(34,197,94,0.4)" }}
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={5000}
              step={100}
              value={settings.defaultTimerOffset}
              onChange={(e) => update({ defaultTimerOffset: Number(e.target.value) })}
              className="w-full opacity-0 absolute cursor-pointer"
              style={{ marginTop: "-14px", height: "20px" }}
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
                    style={{ background: "rgba(34,197,94,0.08)" }}
                  >
                    {modes.find((m) => m.value === (ai.responseMode || "regular"))?.label}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
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
        className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-[left] duration-200`}
        style={{
          left: checked ? "18px" : "2px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}
