import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-card border-b border-border px-3 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">Settings</h2>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Global response mode */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Global Response Mode</Label>
          <Select value={settings.globalResponseMode} onValueChange={(v) => update({ globalResponseMode: v as ResponseMode })}>
            <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="humanely">Humanely</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Per-AI modes */}
        {ais.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Per-AI Response Mode</Label>
            <div className="space-y-2">
              {ais.map((ai) => (
                <div key={ai.id} className="flex items-center gap-3 p-2 rounded-md bg-card border border-border">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {ai.profilePicture ? <img src={ai.profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">🤖</span>}
                  </div>
                  <span className="text-sm flex-1 truncate">{ai.name}</span>
                  <Select value={ai.responseMode || "regular"} onValueChange={(v) => updateAIMode(ai.id, v as ResponseMode)}>
                    <SelectTrigger className="w-32 bg-secondary h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="humanely">Humanely</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Markdown toggle */}
        <div className="flex items-center justify-between">
          <Label>Markdown Rendering</Label>
          <Switch checked={settings.markdownEnabled} onCheckedChange={(v) => update({ markdownEnabled: v })} />
        </div>

        {/* Autonomous toggle */}
        <div className="flex items-center justify-between">
          <Label>Autonomous Discussion</Label>
          <Switch checked={settings.autonomousEnabled} onCheckedChange={(v) => update({ autonomousEnabled: v })} />
        </div>

        {/* Timer offset */}
        <div>
          <Label>Default Timer Offset: {settings.defaultTimerOffset}ms</Label>
          <Slider
            value={[settings.defaultTimerOffset]}
            onValueChange={([v]) => update({ defaultTimerOffset: v })}
            min={0} max={5000} step={100}
            className="mt-2"
          />
        </div>
      </main>
    </div>
  );
}
