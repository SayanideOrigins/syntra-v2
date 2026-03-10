import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VolumeX, Volume2, Pause, Play, UserMinus, Plus, Search } from "lucide-react";
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
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  useEffect(() => {
    setCustomPrompt(group.customPrompt);
    setTimerOffset(group.timerOffset);
    setAutonomousEnabled(group.autonomousEnabled);
    setMutedIds(group.mutedMemberIds);
    setPausedIds(group.pausedMemberIds);
    setMemberIds(group.memberIds);
    if (open) getAllAIs().then(setAllAIs);
  }, [group, open]);

  const nonMembers = allAIs
    .filter((ai) => !memberIds.includes(ai.id))
    .filter((ai) => !addSearch.trim() || ai.name.toLowerCase().includes(addSearch.toLowerCase()));

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
  const addMember = (id: string) => {
    setMemberIds((prev) => [...prev, id]);
    setShowAddMenu(false);
    setAddSearch("");
  };

  const sliderPercent = (timerOffset / 5000) * 100;

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

            {/* Add Member Button */}
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 bg-transparent border border-border rounded-[12px] text-syntra-text2 font-mono text-[11px] hover:bg-surface-2 hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Member
            </button>

            {/* Add member dropdown */}
            {showAddMenu && (
              <div className="mt-2 bg-surface-2 border border-border rounded-[14px] overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                  <Search className="h-3 w-3 text-syntra-text3" />
                  <input
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    placeholder="Search AIs..."
                    className="bg-transparent border-none outline-none text-foreground text-[12px] w-full placeholder:text-syntra-text3"
                    autoFocus
                  />
                </div>
                {nonMembers.length === 0 ? (
                  <div className="px-3 py-3 text-[11px] text-syntra-text3 text-center">No AIs available</div>
                ) : (
                  nonMembers.map((ai) => (
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
                  ))
                )}
              </div>
            )}
          </div>

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

          {/* Timer offset - proper styled slider */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-xs text-syntra-text2">Timer Offset</span>
              <span className="font-mono text-[11px] text-primary">{timerOffset}ms</span>
            </div>
            <div className="relative">
              <div className="h-1 bg-secondary rounded-full">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${sliderPercent}%` }}
                />
              </div>
              <input
                type="range"
                min={0} max={5000} step={100}
                value={timerOffset}
                onChange={(e) => setTimerOffset(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                style={{ height: "20px", marginTop: "-8px" }}
              />
              <div
                className="absolute top-[-6px] w-4 h-4 rounded-full bg-primary pointer-events-none"
                style={{
                  left: `calc(${sliderPercent}% - 8px)`,
                  boxShadow: "0 0 8px hsl(var(--green) / 0.4)",
                }}
              />
            </div>
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
            style={{ boxShadow: "0 4px 20px hsl(var(--green) / 0.35)" }}
          >
            Save Changes
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
