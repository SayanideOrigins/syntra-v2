import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
              onClick={() => document.getElementById("group-pic-upload")?.click()}
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Group" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-muted-foreground">👥</span>
              )}
            </div>
            <input id="group-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <div className="flex-1">
              <Label htmlFor="group-name">Group Name *</Label>
              <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dream Team" className="bg-secondary" />
            </div>
          </div>
          <div>
            <Label htmlFor="group-desc">Description</Label>
            <Input id="group-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this group about?" className="bg-secondary" />
          </div>
          <div>
            <Label htmlFor="group-prompt">Custom Group Prompt</Label>
            <Textarea id="group-prompt" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Optional group behavior..." rows={2} className="bg-secondary" />
          </div>
          <div>
            <Label>Select AIs (min 2)</Label>
            {ais.length === 0 ? (
              <p className="text-sm text-muted-foreground">No AIs created yet.</p>
            ) : (
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto scrollbar-thin">
                {ais.map((ai) => (
                  <label key={ai.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary cursor-pointer">
                    <Checkbox checked={selectedIds.includes(ai.id)} onCheckedChange={() => toggleAI(ai.id)} />
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {ai.profilePicture ? <img src={ai.profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">🤖</span>}
                    </div>
                    <span className="text-sm font-medium">{ai.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving || selectedIds.length < 2} className="w-full">
            {saving ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
