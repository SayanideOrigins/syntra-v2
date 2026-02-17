import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AIEntity, ResponseMode } from "@/lib/types";
import { saveAI } from "@/lib/db";
import { toast } from "@/hooks/use-toast";

interface AICustomizePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ai: AIEntity;
  onUpdated: (ai: AIEntity) => void;
}

export function AICustomizePanel({ open, onOpenChange, ai, onUpdated }: AICustomizePanelProps) {
  const [name, setName] = useState(ai.name);
  const [job, setJob] = useState(ai.job);
  const [description, setDescription] = useState(ai.description);
  const [customPrompt, setCustomPrompt] = useState(ai.customPrompt);
  const [personalityNotes, setPersonalityNotes] = useState(ai.personalityNotes);
  const [responseMode, setResponseMode] = useState<ResponseMode>(ai.responseMode || "regular");

  useEffect(() => {
    setName(ai.name);
    setJob(ai.job);
    setDescription(ai.description);
    setCustomPrompt(ai.customPrompt);
    setPersonalityNotes(ai.personalityNotes);
    setResponseMode(ai.responseMode || "regular");
  }, [ai]);

  const handleSave = async () => {
    const updated: AIEntity = {
      ...ai, name: name.trim() || ai.name, job: job.trim(), description: description.trim(),
      customPrompt: customPrompt.trim(), personalityNotes: personalityNotes.trim(), responseMode,
    };
    await saveAI(updated);
    onUpdated(updated);
    onOpenChange(false);
    toast({ title: "AI updated" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Customize {ai.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary" />
          </div>
          <div>
            <Label>Job / Role</Label>
            <Input value={job} onChange={(e) => setJob(e.target.value)} className="bg-secondary" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary" />
          </div>
          <div>
            <Label>Custom Prompt</Label>
            <Textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={3} className="bg-secondary" />
          </div>
          <div>
            <Label>Personality Notes</Label>
            <Textarea value={personalityNotes} onChange={(e) => setPersonalityNotes(e.target.value)} rows={2} className="bg-secondary" />
          </div>
          <div>
            <Label>Response Mode</Label>
            <Select value={responseMode} onValueChange={(v) => setResponseMode(v as ResponseMode)}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="humanely">Humanely</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} className="w-full">Save Changes</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
