import { useState, useEffect } from "react";
import { ArrowLeft, Pencil, Search, BellOff, Archive, ChevronDown, ChevronUp } from "lucide-react";
import { saveAI, saveGroup } from "@/lib/db";
import type { AIEntity, Group } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

interface ProfileInfoViewProps {
  type: "ai" | "group";
  entity: AIEntity | Group | null | undefined;
  members?: AIEntity[];
  onBack: () => void;
  onUpdated: (entity: AIEntity | Group) => void;
  embedded?: boolean;
}

export function ProfileInfoView({ type, entity, members, onBack, onUpdated }: ProfileInfoViewProps) {
  const [editing, setEditing] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [job, setJob] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [personalityNotes, setPersonalityNotes] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    if (!entity) return;
    setName(entity.name || "");
    setDescription(entity.description || "");
    setCustomPrompt(entity.customPrompt || "");
    setProfilePicture(entity.profilePicture || null);
    if (type === "ai") {
      const ai = entity as AIEntity;
      setJob(ai.job || "");
      setPersonalityNotes(ai.personalityNotes || "");
    }
  }, [entity, type]);

  if (!entity) return null;

  const isAI = type === "ai";
  const ai = isAI ? (entity as AIEntity) : null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicture(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (isAI && ai) {
      const updated: AIEntity = {
        ...ai, name: name.trim() || ai.name, job: job.trim(),
        description: description.trim(), customPrompt: customPrompt.trim(),
        personalityNotes: personalityNotes.trim(), profilePicture,
      };
      await saveAI(updated);
      onUpdated(updated);
    } else {
      const group = entity as Group;
      const updated: Group = {
        ...group, name: name.trim() || group.name,
        description: description.trim(), customPrompt: customPrompt.trim(),
        profilePicture,
      };
      await saveGroup(updated);
      onUpdated(updated);
    }
    setEditing(false);
    toast({ title: "Saved" });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="bg-surface border-b border-border px-3.5 py-3 flex items-center gap-2.5">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-[10px] bg-surface-2 border border-border flex items-center justify-center text-syntra-text2 shrink-0 hover:bg-surface-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <h2 className="font-head text-sm font-bold flex-1">{isAI ? "AI Info" : "Group Info"}</h2>
        <button
          onClick={() => setEditing(!editing)}
          className="w-8 h-8 rounded-[10px] bg-surface-2 border border-border flex items-center justify-center text-syntra-text2 shrink-0 hover:bg-surface-3 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center py-6 px-4">
          <div
            className="w-20 h-20 rounded-full bg-surface-2 border-2 border-[hsl(var(--border2))] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => editing && document.getElementById("profile-pic-upload")?.click()}
          >
            {profilePicture ? (
              <img src={profilePicture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{isAI ? "🤖" : "👥"}</span>
            )}
          </div>
          {editing && (
            <input id="profile-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          )}

          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-3 text-center bg-surface-2 border border-border rounded-[10px] px-3 py-2 text-foreground font-head text-lg font-bold outline-none focus:border-primary/40 w-full max-w-[240px]"
            />
          ) : (
            <h1 className="mt-3 font-head text-lg font-bold">{entity.name}</h1>
          )}

          {isAI && (
            editing ? (
              <input
                value={job}
                onChange={(e) => setJob(e.target.value)}
                placeholder="Job / Role"
                className="mt-1 text-center bg-surface-2 border border-border rounded-[10px] px-3 py-1.5 text-syntra-text2 text-sm outline-none focus:border-primary/40 w-full max-w-[240px]"
              />
            ) : (
              ai?.job && <p className="text-sm text-syntra-text2 mt-1">{ai.job}</p>
            )
          )}
        </div>

        {/* Action buttons */}
        {!editing && (
          <div className="flex justify-center gap-6 pb-4">
            <button className="flex flex-col items-center gap-1 text-syntra-text2 hover:text-primary transition-colors">
              <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                <Search className="h-4 w-4" />
              </div>
              <span className="font-mono text-[10px]">Search</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-syntra-text2 hover:text-primary transition-colors">
              <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                <BellOff className="h-4 w-4" />
              </div>
              <span className="font-mono text-[10px]">Mute</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-syntra-text2 hover:text-primary transition-colors">
              <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                <Archive className="h-4 w-4" />
              </div>
              <span className="font-mono text-[10px]">Archive</span>
            </button>
          </div>
        )}

        <div className="px-4 flex flex-col gap-3 pb-6">
          {/* About */}
          <div className="bg-surface-2 border border-border rounded-[14px] p-3">
            <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] mb-2">About</div>
            {editing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-surface-3 border border-border rounded-[10px] px-3 py-2 text-foreground text-[13px] outline-none focus:border-primary/40 resize-none"
              />
            ) : (
              <p className="text-[13px] text-foreground font-light leading-relaxed">
                {entity.description || "No description"}
              </p>
            )}
          </div>

          {/* Custom Prompt - Collapsible */}
          <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <span className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em]">Custom Prompt</span>
              {showPrompt ? <ChevronUp className="h-3.5 w-3.5 text-syntra-text3" /> : <ChevronDown className="h-3.5 w-3.5 text-syntra-text3" />}
            </button>
            {showPrompt && (
              <div className="px-3 pb-3">
                {editing ? (
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={4}
                    className="w-full bg-surface-3 border border-border rounded-[10px] px-3 py-2 text-foreground text-[13px] outline-none focus:border-primary/40 resize-none"
                  />
                ) : (
                  <p className="text-[13px] text-syntra-text2 font-light whitespace-pre-wrap">
                    {entity.customPrompt || "None set"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Personality Notes - AI only */}
          {isAI && (
            <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <span className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em]">Personality Notes</span>
                {showNotes ? <ChevronUp className="h-3.5 w-3.5 text-syntra-text3" /> : <ChevronDown className="h-3.5 w-3.5 text-syntra-text3" />}
              </button>
              {showNotes && (
                <div className="px-3 pb-3">
                  {editing ? (
                    <textarea
                      value={personalityNotes}
                      onChange={(e) => setPersonalityNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-surface-3 border border-border rounded-[10px] px-3 py-2 text-foreground text-[13px] outline-none focus:border-primary/40 resize-none"
                    />
                  ) : (
                    <p className="text-[13px] text-syntra-text2 font-light whitespace-pre-wrap">
                      {ai?.personalityNotes || "None set"}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Group members list */}
          {!isAI && members && members.length > 0 && (
            <div className="bg-surface-2 border border-border rounded-[14px] overflow-hidden">
              <div className="p-3">
                <div className="font-mono text-[10px] text-syntra-text3 uppercase tracking-[0.18em] mb-2">
                  Members · {members.length}
                </div>
              </div>
              {members.map((m, idx) => (
                <div key={m.id} className="flex items-center gap-2.5 px-3 py-2 relative">
                  {idx < members.length - 1 && <div className="absolute bottom-0 left-3 right-3 h-px bg-border" />}
                  <div className="w-8 h-8 rounded-full bg-surface-3 border border-[hsl(var(--border2))] flex items-center justify-center overflow-hidden">
                    {m.profilePicture ? <img src={m.profilePicture} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">🤖</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{m.name}</p>
                    {m.job && <p className="text-[11px] text-syntra-text2 truncate">{m.job}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {editing && (
            <button
              onClick={handleSave}
              className="w-full py-3 bg-primary rounded-xl font-head text-sm font-bold text-black tracking-[-0.01em] hover:-translate-y-px transition-all"
              style={{ boxShadow: "0 4px 20px hsl(var(--green) / 0.35)" }}
            >
              Save Changes
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
