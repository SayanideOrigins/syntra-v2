import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { VolumeX, Volume2, Pause, Play, UserMinus } from "lucide-react";
import type { AIEntity, Group } from "@/lib/types";
import { saveGroup, getAllAIs } from "@/lib/db";
import { toast } from "@/hooks/use-toast";

interface GroupManagePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  members: AIEntity[];
  onUpdated: (group: Group, members: AIEntity[]) => void;
}

export function GroupManagePanel({ open, onOpenChange, group, members, onUpdated }: GroupManagePanelProps) {
  const [customPrompt, setCustomPrompt] = useState(group.customPrompt);
  const [timerOffset, setTimerOffset] = useState(group.timerOffset);
  const [autonomousEnabled, setAutonomousEnabled] = useState(group.autonomousEnabled);
  const [mutedIds, setMutedIds] = useState<string[]>(group.mutedMemberIds);
  const [pausedIds, setPausedIds] = useState<string[]>(group.pausedMemberIds);
  const [allAIs, setAllAIs] = useState<AIEntity[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>(group.memberIds);

  useEffect(() => {
    setCustomPrompt(group.customPrompt);
    setTimerOffset(group.timerOffset);
    setAutonomousEnabled(group.autonomousEnabled);
    setMutedIds(group.mutedMemberIds);
    setPausedIds(group.pausedMemberIds);
    setMemberIds(group.memberIds);
    if (open) getAllAIs().then(setAllAIs);
  }, [group, open]);

  const nonMembers = allAIs.filter((ai) => !memberIds.includes(ai.id));

  const handleSave = async () => {
    const updated: Group = {
      ...group, customPrompt: customPrompt.trim(), timerOffset,
      autonomousEnabled, mutedMemberIds: mutedIds, pausedMemberIds: pausedIds,
      memberIds,
    };
    await saveGroup(updated);
    const updatedMembers = allAIs.filter((ai) => memberIds.includes(ai.id));
    onUpdated(updated, updatedMembers);
    onOpenChange(false);
    toast({ title: "Group updated" });
  };

  const toggleMute = (id: string) => {
    setMutedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const togglePause = (id: string) => {
    setPausedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const removeMember = (id: string) => {
    if (memberIds.length <= 2) { toast({ title: "Minimum 2 members", variant: "destructive" }); return; }
    setMemberIds((prev) => prev.filter((x) => x !== id));
    setMutedIds((prev) => prev.filter((x) => x !== id));
    setPausedIds((prev) => prev.filter((x) => x !== id));
  };
  const addMember = (id: string) => {
    setMemberIds((prev) => [...prev, id]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Manage Group</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-4">
          {/* Members */}
          <div>
            <Label className="mb-2 block">Members</Label>
            <div className="space-y-2">
              {memberIds.map((mid) => {
                const ai = allAIs.find((a) => a.id === mid) || members.find((m) => m.id === mid);
                if (!ai) return null;
                const isMuted = mutedIds.includes(mid);
                const isPaused = pausedIds.includes(mid);
                return (
                  <div key={mid} className="flex items-center gap-2 p-2 rounded-md bg-secondary">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {ai.profilePicture ? <img src={ai.profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">🤖</span>}
                    </div>
                    <span className="text-sm flex-1 truncate">{ai.name}</span>
                    <button onClick={() => toggleMute(mid)} className={`p-1 rounded ${isMuted ? "text-destructive" : "text-muted-foreground"} hover:text-foreground`} title={isMuted ? "Unmute" : "Mute"}>
                      {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => togglePause(mid)} className={`p-1 rounded ${isPaused ? "text-destructive" : "text-muted-foreground"} hover:text-foreground`} title={isPaused ? "Unpause" : "Pause"}>
                      {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => removeMember(mid)} className="p-1 rounded text-muted-foreground hover:text-destructive" title="Remove">
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add member */}
          {nonMembers.length > 0 && (
            <div>
              <Label className="mb-2 block">Add AI</Label>
              <div className="space-y-1">
                {nonMembers.map((ai) => (
                  <label key={ai.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary cursor-pointer" onClick={() => addMember(ai.id)}>
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {ai.profilePicture ? <img src={ai.profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">🤖</span>}
                    </div>
                    <span className="text-sm">{ai.name}</span>
                    <span className="text-xs text-primary ml-auto">+ Add</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Group prompt */}
          <div>
            <Label>Group Prompt</Label>
            <Textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={3} className="bg-secondary" />
          </div>

          {/* Timer offset */}
          <div>
            <Label>Timer Offset: {timerOffset}ms</Label>
            <Slider value={[timerOffset]} onValueChange={([v]) => setTimerOffset(v)} min={0} max={5000} step={100} className="mt-2" />
          </div>

          {/* Autonomous */}
          <div className="flex items-center justify-between">
            <Label>Autonomous Discussion</Label>
            <Switch checked={autonomousEnabled} onCheckedChange={setAutonomousEnabled} />
          </div>

          <Button onClick={handleSave} className="w-full">Save Changes</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
