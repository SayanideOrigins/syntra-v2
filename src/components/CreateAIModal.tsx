import { useState } from "react";
import type { AIEntity } from "@/lib/types";
import { saveAI } from "@/lib/db";
import { toast } from "@/hooks/use-toast";

interface CreateAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateAIModal({ open, onOpenChange, onCreated }: CreateAIModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [job, setJob] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [personalityNotes, setPersonalityNotes] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicture(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const ai: AIEntity = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      job: job.trim(),
      customPrompt: customPrompt.trim(),
      personalityNotes: personalityNotes.trim(),
      profilePicture,
      responseMode: "regular",
      isMuted: false,
      isPaused: false,
      createdAt: Date.now(),
    };
    await saveAI(ai);
    setSaving(false);
    setName(""); setDescription(""); setJob(""); setCustomPrompt(""); setPersonalityNotes(""); setProfilePicture(null);
    onOpenChange(false);
    onCreated();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-[hsl(var(--border2))] rounded-t-[24px] z-10 max-h-[88vh] overflow-y-auto scrollbar-thin">
        {/* Drag handle */}
        <div className="w-9 h-1 rounded-full bg-[hsl(var(--border2))] mx-auto mt-3 mb-4" />

        {/* Title */}
        <div className="px-[18px] pb-3.5 border-b border-border">
          <h2 className="font-head text-lg font-bold tracking-[-0.02em]">Create AI</h2>
        </div>

        {/* Body */}
        <div className="px-[18px] py-4 flex flex-col gap-3.5">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-surface-2 border-[1.5px] border-dashed border-primary/40 flex flex-col items-center justify-center cursor-pointer shrink-0 hover:bg-surface-3 hover:border-primary/60 transition-all gap-0.5"
              onClick={() => document.getElementById("ai-pic-upload")?.click()}
            >
              {profilePicture ? (
                <img src={profilePicture} alt="AI" className="w-full h-full object-cover rounded-full" />
              ) : (
                <>
                  <span className="text-[22px]">🤖</span>
                  <span className="font-mono text-[10px] text-primary">+ photo</span>
                </>
              )}
            </div>
            <input id="ai-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <div className="flex-1">
              <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Atlas"
                className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors placeholder:text-syntra-text3"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors placeholder:text-syntra-text3"
            />
          </div>

          {/* Job */}
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Job / Role</label>
            <input
              value={job}
              onChange={(e) => setJob(e.target.value)}
              placeholder="e.g. Creative Writer"
              className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors placeholder:text-syntra-text3"
            />
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Custom Prompt</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Define this AI's behavior..."
              rows={3}
              className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] leading-relaxed outline-none focus:border-primary/40 transition-colors resize-none placeholder:text-syntra-text3"
            />
          </div>

          {/* Personality */}
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Personality Notes</label>
            <textarea
              value={personalityNotes}
              onChange={(e) => setPersonalityNotes(e.target.value)}
              placeholder="e.g. Friendly, uses emojis..."
              rows={2}
              className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] leading-relaxed outline-none focus:border-primary/40 transition-colors resize-none placeholder:text-syntra-text3"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary rounded-xl font-head text-sm font-bold text-black tracking-[-0.01em] hover:-translate-y-px transition-all disabled:opacity-50"
            style={{ boxShadow: "0 4px 20px rgba(34,197,94,0.35)" }}
          >
            {saving ? "Creating..." : "Create AI"}
          </button>
        </div>
      </div>
    </div>
  );
}
