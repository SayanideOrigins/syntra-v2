import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AIEntity, ResponseMode } from "@/lib/types";
import { saveAI } from "@/lib/db";
import { toast } from "@/hooks/use-toast";

interface AICustomizePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ai: AIEntity;
  onUpdated: (ai: AIEntity) => void;
}

const modes: { value: ResponseMode; label: string }[] = [
  { value: "regular", label: "Regular" },
  { value: "humanely", label: "Humanely" },
  { value: "professional", label: "Professional" },
  { value: "custom", label: "Custom" },
];

export function AICustomizePanel({ open, onOpenChange, ai, onUpdated }: AICustomizePanelProps) {
  const [name, setName] = useState(ai.name);
  const [job, setJob] = useState(ai.job);
  const [description, setDescription] = useState(ai.description);
  const [customPrompt, setCustomPrompt] = useState(ai.customPrompt);
  const [personalityNotes, setPersonalityNotes] = useState(ai.personalityNotes);
  const [responseMode, setResponseMode] = useState<ResponseMode>(ai.responseMode || "regular");
  const [profilePicture, setProfilePicture] = useState<string | null>(ai.profilePicture);

  useEffect(() => {
    setName(ai.name);
    setJob(ai.job);
    setDescription(ai.description);
    setCustomPrompt(ai.customPrompt);
    setPersonalityNotes(ai.personalityNotes);
    setResponseMode(ai.responseMode || "regular");
    setProfilePicture(ai.profilePicture);
  }, [ai]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicture(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const updated: AIEntity = {
      ...ai, name: name.trim() || ai.name, job: job.trim(), description: description.trim(),
      customPrompt: customPrompt.trim(), personalityNotes: personalityNotes.trim(), responseMode,
      profilePicture,
    };
    await saveAI(updated);
    onUpdated(updated);
    onOpenChange(false);
    toast({ title: "AI updated" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-surface border-l border-border overflow-y-auto scrollbar-thin">
        <SheetHeader>
          <SheetTitle className="font-head font-bold tracking-[-0.02em]">Customize {ai.name}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3.5 mt-4">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-full bg-surface-2 border-[1.5px] border-dashed border-primary/40 flex flex-col items-center justify-center cursor-pointer shrink-0 hover:bg-surface-3 hover:border-primary/60 transition-all gap-0.5 overflow-hidden"
              onClick={() => document.getElementById("ai-customize-pic-upload")?.click()}
            >
              {profilePicture ? (
                <img src={profilePicture} alt="AI" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-[22px]">🤖</span>
                  <span className="font-mono text-[10px] text-primary">+ photo</span>
                </>
              )}
            </div>
            <input id="ai-customize-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Job / Role</label>
            <input value={job} onChange={(e) => setJob(e.target.value)} className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Custom Prompt</label>
            <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={3} className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] leading-relaxed outline-none focus:border-primary/40 transition-colors resize-none" />
          </div>
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Personality Notes</label>
            <textarea value={personalityNotes} onChange={(e) => setPersonalityNotes(e.target.value)} rows={2} className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] leading-relaxed outline-none focus:border-primary/40 transition-colors resize-none" />
          </div>
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Response Mode</label>
            <div className="flex gap-1">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setResponseMode(m.value)}
                  className={`px-[9px] py-1 rounded-full font-mono text-[11px] border transition-all ${
                    responseMode === m.value
                      ? "bg-primary border-primary text-black font-semibold"
                      : "border-border text-syntra-text2 hover:border-[hsl(var(--border2))]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-primary rounded-xl font-head text-sm font-bold text-black tracking-[-0.01em] hover:-translate-y-px transition-all"
            style={{ boxShadow: "0 4px 20px rgba(34,197,94,0.35)" }}
          >
            Save Changes
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
