import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

  const toggleMute = (id: string) => setMutedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const togglePause = (id: string) => setPausedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const removeMember = (id: string) => {
    if (memberIds.length <= 2) { toast({ title: "Minimum 2 members", variant: "destructive" }); return; }
    setMemberIds((prev) => prev.filter((x) => x !== id));
    setMutedIds((prev) => prev.filter((x) => x !== id));
    setPausedIds((prev) => prev.filter((x) => x !== id));
  };
  const addMember = (id: string) => setMemberIds((prev) => [...prev, id]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-surface border-l border-border overflow-y-auto scrollbar-thin">
        <SheetHeader>
          <SheetTitle className="font-head font-bold tracking-[-0.02em]">Manage Group</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-4">
          {/* Members */}
          <div>
            <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] mb-2">Members</div>
            <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden">
              {memberIds.map((mid, idx) => {
                const ai = allAIs.find((a) => a.id === mid) || members.find((m) => m.id === mid);
                if (!ai) return null;
                const isMuted = mutedIds.includes(mid);
                const isPaused = pausedIds.includes(mid);
                return (
                  <div key={mid} className="flex items-center gap-2.5 px-3 py-2.5 relative">
                    {idx < memberIds.length - 1 && <div className="absolute bottom-0 left-3 right-3 h-px bg-border" />}
                    <div className="w-7 h-7 rounded-full bg-surface-3 border border-[hsl(var(--border2))] flex items-center justify-center overflow-hidden shrink-0">
                      {ai.profilePicture ? <img src={ai.profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">🤖</span>}
                    </div>
                    <span className="text-xs font-medium flex-1 truncate">{ai.name}</span>
                    <button onClick={() => toggleMute(mid)} className={`p-1 rounded ${isMuted ? "text-destructive" : "text-syntra-text2"} hover:text-foreground`} title={isMuted ? "Unmute" : "Mute"}>
                      {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => togglePause(mid)} className={`p-1 rounded ${isPaused ? "text-destructive" : "text-syntra-text2"} hover:text-foreground`} title={isPaused ? "Unpause" : "Pause"}>
                      {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => removeMember(mid)} className="p-1 rounded text-syntra-text2 hover:text-destructive" title="Remove">
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
              <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] mb-2">Add AI</div>
              <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden">
                {nonMembers.map((ai) => (
                  <button
                    key={ai.id}
                    onClick={() => addMember(ai.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-3 transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-surface-3 border border-[hsl(var(--border2))] flex items-center justify-center overflow-hidden shrink-0">
                      {ai.profilePicture ? <img src={ai.profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px]">🤖</span>}
                    </div>
                    <span className="text-xs flex-1">{ai.name}</span>
                    <span className="font-mono text-[10px] text-primary">+ Add</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group prompt */}
          <div>
            <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] mb-2">Group Prompt</div>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              className="w-full bg-surface-2 border border-border rounded-[10px] px-3 py-[9px] text-foreground text-[13px] leading-relaxed outline-none focus:border-primary/40 transition-colors resize-none placeholder:text-syntra-text3"
            />
          </div>

          {/* Timer offset */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-syntra-text2">Timer Offset</span>
              <span className="font-mono text-[11px] text-primary">{timerOffset}ms</span>
            </div>
            <input
              type="range"
              min={0} max={5000} step={100}
              value={timerOffset}
              onChange={(e) => setTimerOffset(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {/* Autonomous */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium">Autonomous Discussion</span>
            <button
              onClick={() => setAutonomousEnabled(!autonomousEnabled)}
              className={`w-[38px] h-[22px] rounded-full relative shrink-0 transition-colors ${
                autonomousEnabled ? "bg-primary" : "bg-surface-3 border border-[hsl(var(--border2))]"
              }`}
            >
              <span
                className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-[left] duration-200"
                style={{ left: autonomousEnabled ? "18px" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
              />
            </button>
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
