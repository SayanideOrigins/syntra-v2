import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
      createdAt: Date.now(),
    };
    await saveAI(ai);
    setSaving(false);
    setName(""); setDescription(""); setJob(""); setCustomPrompt(""); setPersonalityNotes(""); setProfilePicture(null);
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create AI</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
              onClick={() => document.getElementById("ai-pic-upload")?.click()}
            >
              {profilePicture ? (
                <img src={profilePicture} alt="AI" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-muted-foreground">🤖</span>
              )}
            </div>
            <input id="ai-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <div className="flex-1">
              <Label htmlFor="ai-name">Name *</Label>
              <Input id="ai-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Atlas" className="bg-secondary" />
            </div>
          </div>
          <div>
            <Label htmlFor="ai-desc">Description</Label>
            <Input id="ai-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="bg-secondary" />
          </div>
          <div>
            <Label htmlFor="ai-job">Job / Role</Label>
            <Input id="ai-job" value={job} onChange={(e) => setJob(e.target.value)} placeholder="e.g. Creative Writer" className="bg-secondary" />
          </div>
          <div>
            <Label htmlFor="ai-prompt">Custom Prompt</Label>
            <Textarea id="ai-prompt" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Define this AI's behavior..." rows={3} className="bg-secondary" />
          </div>
          <div>
            <Label htmlFor="ai-personality">Personality Notes</Label>
            <Textarea id="ai-personality" value={personalityNotes} onChange={(e) => setPersonalityNotes(e.target.value)} placeholder="e.g. Friendly, uses emojis..." rows={2} className="bg-secondary" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Creating..." : "Create AI"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
