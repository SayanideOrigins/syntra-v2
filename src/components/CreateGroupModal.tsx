import { useState, useEffect } from "react";
import type { AIEntity, Group } from "@/lib/types";
import { getAllAIs, saveGroup } from "@/lib/db";
import { toast } from "@/hooks/use-toast";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateGroupModal({ open, onOpenChange, onCreated }: CreateGroupModalProps) {
  const [ais, setAIs] = useState<AIEntity[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) getAllAIs().then(setAIs);
  }, [open]);

  const toggleAI = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicture(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    if (selectedIds.length < 2) { toast({ title: "Select at least 2 AIs", variant: "destructive" }); return; }
    setSaving(true);
    const group: Group = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      customPrompt: customPrompt.trim(),
      profilePicture,
      memberIds: selectedIds,
      timerOffset: 1500,
      autonomousEnabled: false,
      mutedMemberIds: [],
      pausedMemberIds: [],
      createdAt: Date.now(),
    };
    await saveGroup(group);
    setSaving(false);
    setName(""); setDescription(""); setCustomPrompt(""); setProfilePicture(null); setSelectedIds([]);
    onOpenChange(false);
    onCreated();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-[hsl(var(--border2))] rounded-t-[24px] z-10 max-h-[88vh] overflow-y-auto scrollbar-thin">
        <div className="w-9 h-1 rounded-full bg-[hsl(var(--border2))] mx-auto mt-3 mb-4" />
        <div className="px-[18px] pb-3.5 border-b border-border">
          <h2 className="font-head text-lg font-bold tracking-[-0.02em]">Create Group</h2>
        </div>
        <div className="px-[18px] py-4 flex flex-col gap-3.5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-surface-2 border-[1.5px] border-dashed border-primary/40 flex flex-col items-center justify-center cursor-pointer shrink-0 hover:bg-surface-3 hover:border-primary/60 transition-all gap-0.5"
              onClick={() => document.getElementById("group-pic-upload")?.click()}
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Group" className="w-full h-full object-cover rounded-full" />
              ) : (
                <>
                  <span className="text-[22px]">👥</span>
                  <span className="font-mono text-[10px] text-primary">+ photo</span>
                </>
              )}
            </div>
            <input id="group-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <div className="flex-1">
              <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Group Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dream Team"
                className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors placeholder:text-syntra-text3"
              />
            </div>
          </div>
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors placeholder:text-syntra-text3"
            />
          </div>
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Custom Group Prompt</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Optional group behavior..."
              rows={2}
              className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] leading-relaxed outline-none focus:border-primary/40 transition-colors resize-none placeholder:text-syntra-text3"
            />
          </div>
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Select AIs (min 2)</label>
            {ais.length === 0 ? (
              <p className="text-[12px] text-syntra-text2 font-light">No AIs created yet.</p>
            ) : (
              <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden max-h-48 overflow-y-auto scrollbar-thin">
                {ais.map((ai, idx) => (
                  <button
                    key={ai.id}
                    onClick={() => toggleAI(ai.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-3 transition-colors text-left relative"
                  >
                    {idx < ais.length - 1 && <div className="absolute bottom-0 left-3 right-3 h-px bg-border" />}
                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${selectedIds.includes(ai.id) ? "bg-primary border-primary" : "border-[hsl(var(--border2))]"}`}>
                      {selectedIds.includes(ai.id) && <span className="text-[10px] text-black">✓</span>}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-surface-3 border border-[hsl(var(--border2))] flex items-center justify-center overflow-hidden shrink-0">
                      {ai.profilePicture ? <img src={ai.profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">🤖</span>}
                    </div>
                    <span className="text-xs font-medium">{ai.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || selectedIds.length < 2}
            className="w-full py-3 bg-primary rounded-xl font-head text-sm font-bold text-black tracking-[-0.01em] hover:-translate-y-px transition-all disabled:opacity-50"
            style={{ boxShadow: "0 4px 20px rgba(34,197,94,0.35)" }}
          >
            {saving ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
