import { useState, useEffect } from "react";
import type { Group } from "@/lib/types";
import { saveGroup, deleteGroup } from "@/lib/db";
import { toast } from "@/hooks/use-toast";

interface GroupEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onUpdated: () => void;
}

export function GroupEditSheet({ open, onOpenChange, group, onUpdated }: GroupEditSheetProps) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [customPrompt, setCustomPrompt] = useState(group.customPrompt);
  const [profilePicture, setProfilePicture] = useState<string | null>(group.profilePicture);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setName(group.name);
    setDescription(group.description);
    setCustomPrompt(group.customPrompt);
    setProfilePicture(group.profilePicture);
    setShowDeleteConfirm(false);
  }, [group]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicture(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const updated: Group = {
      ...group,
      name: name.trim() || group.name,
      description: description.trim(),
      customPrompt: customPrompt.trim(),
      profilePicture,
    };
    await saveGroup(updated);
    onOpenChange(false);
    onUpdated();
    toast({ title: "Group updated" });
  };

  const handleHide = async () => {
    await saveGroup({ ...group, isHidden: true });
    onOpenChange(false);
    onUpdated();
    toast({ title: `${group.name} hidden from list` });
  };

  const handleDelete = async () => {
    await deleteGroup(group.id);
    onOpenChange(false);
    onUpdated();
    toast({ title: `${group.name} deleted permanently` });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-[hsl(var(--border2))] rounded-t-[24px] z-10 max-h-[88vh] overflow-y-auto scrollbar-thin">
        <div className="w-9 h-1 rounded-full bg-[hsl(var(--border2))] mx-auto mt-3 mb-4" />
        <div className="px-[18px] pb-3.5 border-b border-border">
          <h2 className="font-head text-lg font-bold tracking-[-0.02em]">Edit Group</h2>
        </div>
        <div className="px-[18px] py-4 flex flex-col gap-3.5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-surface-2 border-[1.5px] border-dashed border-primary/40 flex flex-col items-center justify-center cursor-pointer shrink-0 hover:bg-surface-3 hover:border-primary/60 transition-all gap-0.5 overflow-hidden"
              onClick={() => document.getElementById("group-edit-pic-upload")?.click()}
            >
              {profilePicture ? (
                <img src={profilePicture} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <>
                  <span className="text-[22px]">👥</span>
                  <span className="font-mono text-[10px] text-primary">+ photo</span>
                </>
              )}
            </div>
            <input id="group-edit-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <div className="flex-1">
              <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors placeholder:text-syntra-text3" />
            </div>
          </div>
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] outline-none focus:border-primary/40 transition-colors placeholder:text-syntra-text3" />
          </div>
          <div>
            <label className="font-mono text-[11px] text-syntra-text2 uppercase tracking-[0.1em] mb-1.5 block">Group Prompt</label>
            <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={3} className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] leading-relaxed outline-none focus:border-primary/40 transition-colors resize-none placeholder:text-syntra-text3" />
          </div>

          <button onClick={handleSave} className="w-full py-3 bg-primary rounded-xl font-head text-sm font-bold text-black tracking-[-0.01em] hover:-translate-y-px transition-all" style={{ boxShadow: "0 4px 20px hsl(var(--green) / 0.35)" }}>
            Save Changes
          </button>

          <div className="flex gap-2">
            <button onClick={handleHide} className="flex-1 py-2.5 bg-surface-2 border border-border rounded-xl font-mono text-[12px] text-syntra-text2 hover:bg-surface-3 transition-colors">
              Remove from list
            </button>
            {showDeleteConfirm ? (
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500/20 border border-red-500/40 rounded-xl font-mono text-[12px] text-red-400 hover:bg-red-500/30 transition-colors">
                Confirm Delete
              </button>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 py-2.5 bg-surface-2 border border-border rounded-xl font-mono text-[12px] text-red-400 hover:bg-red-500/10 transition-colors">
                Delete permanently
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
