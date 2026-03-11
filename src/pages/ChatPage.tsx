import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Hand } from "lucide-react";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ProfileInfoView } from "@/components/ProfileInfoView";
import { GroupManagePanel } from "@/components/GroupManagePanel";
import {
  getAI, getGroup, getMessages, saveMessage, getAllAIs,
  deleteMessagesAfter, updateMessage, saveAI,
} from "@/lib/db";
import { streamChat } from "@/lib/ai-service";
import { assembleContext } from "@/lib/context-assembler";
import { getSettings } from "@/lib/settings";
import type { AIEntity, ChatMessage, Group, GroupState } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

function makeMsg(
  partial: Omit<ChatMessage, "roundNumber" | "isInterruption" | "isAutonomous" | "isEdited">,
  extra?: Partial<ChatMessage>
): ChatMessage {
  return { roundNumber: 0, isInterruption: false, isAutonomous: false, isEdited: false, ...partial, ...extra };
}

interface ChatPageProps {
  overrideType?: string;
  overrideId?: string;
  embedded?: boolean;
}

export default function ChatPage({ overrideType, overrideId, embedded }: ChatPageProps) {
  const params = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const type = overrideType || params.type;
  const id = overrideId || params.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [typingName, setTypingName] = useState("");
  const [chatEntity, setChatEntity] = useState<{ name: string; profilePicture: string | null } | null>(null);
  const [aiEntity, setAiEntity] = useState<AIEntity | null>(null);
  const [groupData, setGroupData] = useState<{ group: Group; members: AIEntity[] } | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [showProfile, setShowProfile] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isGroup = type === "group";
  const abortRef = useRef(false);
  const sentinelVisibleRef = useRef(true);
  const lastRoundStarterIdRef = useRef<string | null>(null);

  // Track sentinel visibility via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;
    const observer = new IntersectionObserver(
      ([entry]) => { sentinelVisibleRef.current = entry.isIntersecting; },
      { root: container, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Unhide AI if navigating to it
  useEffect(() => {
    if (!id || isGroup) return;
    (async () => {
      const ai = await getAI(id);
      if (ai && ai.isHidden) {
        await saveAI({ ...ai, isHidden: false });
      }
    })();
  }, [id, isGroup]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const msgs = await getMessages(id);
      setMessages(msgs);
      const maxRound = msgs.reduce((max, m) => Math.max(max, m.roundNumber || 0), 0);
      setRoundNumber(maxRound + 1);

      if (isGroup) {
        const group = await getGroup(id);
        if (!group) return;
        setChatEntity({ name: group.name, profilePicture: group.profilePicture });
        const allAIs = await getAllAIs();
        const members = allAIs.filter((a) => group.memberIds.includes(a.id));
        setGroupData({ group, members });
      } else {
        const ai = await getAI(id);
        if (!ai) return;
        setChatEntity({ name: ai.name, profilePicture: ai.profilePicture });
        setAiEntity(ai);
      }
    })();
  }, [id, isGroup]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-focus input on keypress — scoped to chat container
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (["Escape", "Enter", "Backspace", "Tab", "Delete"].includes(e.key)) return;
      if (e.key.startsWith("Arrow") || (e.key.startsWith("F") && e.key.length <= 3)) return;
      if (e.key.length !== 1) return;
      if (document.activeElement === inputRef.current) return;
      // Only focus if activeElement is inside the chat container or nothing is focused
      const active = document.activeElement;
      if (active && active !== document.body && !container.contains(active)) return;
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const waitForScrollOrTimeout = useCallback((): Promise<void> => {
    if (sentinelVisibleRef.current) return Promise.resolve();
    return new Promise((resolve) => {
      const maxTimeout = setTimeout(resolve, 8000);
      const interval = setInterval(() => {
        if (sentinelVisibleRef.current || abortRef.current) {
          clearTimeout(maxTimeout);
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  }, []);

  const handleInterrupt = () => {
    abortRef.current = true;
  };

  const sendPrivateMessage = useCallback(async (userText: string, currentMessages: ChatMessage[], round: number) => {
    if (!aiEntity || !id) return;
    setIsLoading(true);
    setTypingName(aiEntity.name);

    const settings = getSettings();
    const effectiveMode = aiEntity.responseMode !== "regular" ? aiEntity.responseMode : settings.globalResponseMode;
    const groupState: GroupState = {
      roundNumber: round, activeMembers: [aiEntity.id],
      mutedMembers: [], pausedMembers: [], autonomousFlag: false, timerOffset: 0,
    };

    const { systemPrompt, messages: apiMessages } = assembleContext({
      ai: aiEntity, allMessages: currentMessages, userMessage: userText,
      otherParticipants: [], effectiveMode, groupState,
    });

    let accumulated = "";
    const aiMsgId = crypto.randomUUID();

    await streamChat({
      systemPrompt, messages: apiMessages,
      onDelta: (chunk) => {
        accumulated += chunk;
        const acc = accumulated;
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === aiMsgId);
          if (exists) return prev.map((m) => m.id === aiMsgId ? { ...m, message: acc } : m);
          return [...prev, makeMsg({ id: aiMsgId, chatId: id, chatType: "private", senderType: "ai", senderName: aiEntity.name, message: acc, timestamp: Date.now() }, { roundNumber: round })];
        });
      },
      onDone: async () => {
        await saveMessage(makeMsg({ id: aiMsgId, chatId: id, chatType: "private", senderType: "ai", senderName: aiEntity.name, message: accumulated, timestamp: Date.now() }, { roundNumber: round }));
        setIsLoading(false);
        setTypingName("");
      },
      onError: (err) => {
        toast({ title: "AI Error", description: err, variant: "destructive" });
        setIsLoading(false);
        setTypingName("");
      },
    });
  }, [aiEntity, id]);

  const sendGroupMessage = useCallback(async (
    userText: string, currentMessages: ChatMessage[], round: number,
    isInterruption = false, isAutonomousRound = false
  ): Promise<ChatMessage[]> => {
    if (!groupData || !id) return currentMessages;
    setIsLoading(true);
    abortRef.current = false;

    const settings = getSettings();
    const timerOffset = groupData.group.timerOffset || settings.defaultTimerOffset;

    const activeMembers = groupData.members.filter(
      (m) => !groupData.group.mutedMemberIds.includes(m.id) &&
             !groupData.group.pausedMemberIds.includes(m.id) && !m.isMuted && !m.isPaused
    );

    // Mention detection: scan userText for @Name mentions
    let ordered: AIEntity[];
    if (userText && !isAutonomousRound) {
      const mentionRegex = /@(\S+)/g;
      const mentionedNames: string[] = [];
      let match;
      while ((match = mentionRegex.exec(userText)) !== null) {
        mentionedNames.push(match[1].toLowerCase());
      }
      if (mentionedNames.length > 0) {
        const mentioned = activeMembers.filter((m) =>
          mentionedNames.some((name) => m.name.toLowerCase().includes(name))
        );
        const rest = activeMembers.filter((m) => !mentioned.includes(m));
        ordered = [...mentioned, ...rest.sort(() => Math.random() - 0.5)];
      } else {
        ordered = [...activeMembers].sort(() => Math.random() - 0.5);
      }
    } else {
      ordered = [...activeMembers].sort(() => Math.random() - 0.5);
    }

    // For autonomous rounds, ensure first speaker != last round's starter
    if (isAutonomousRound && lastRoundStarterIdRef.current && ordered.length > 1) {
      let attempts = 0;
      while (ordered[0].id === lastRoundStarterIdRef.current && attempts < 10) {
        ordered = [...ordered.sort(() => Math.random() - 0.5)];
        attempts++;
      }
    }

    if (ordered.length > 0) {
      lastRoundStarterIdRef.current = ordered[0].id;
    }

    let runningMessages = [...currentMessages];

    for (let i = 0; i < ordered.length; i++) {
      const member = ordered[i];
      if (abortRef.current) break;
      setTypingName(member.name);

      const effectiveMode = member.responseMode !== "regular" ? member.responseMode : settings.globalResponseMode;
      const groupState: GroupState = {
        roundNumber: round, activeMembers: activeMembers.map((m) => m.id),
        mutedMembers: groupData.group.mutedMemberIds, pausedMembers: groupData.group.pausedMemberIds,
        autonomousFlag: isAutonomousRound, timerOffset,
      };

      const otherParticipants = activeMembers.filter((m) => m.id !== member.id);
      const { systemPrompt, messages: apiMessages } = assembleContext({
        ai: member, allMessages: runningMessages, userMessage: isAutonomousRound ? "" : userText,
        otherParticipants, groupPrompt: groupData.group.customPrompt,
        effectiveMode, groupState, interruptionMessage: isInterruption ? userText : undefined,
      });

      let accumulated = "";
      const aiMsgId = crypto.randomUUID();

      // Wait for this member's full response before moving to next
      await new Promise<void>((resolve) => {
        streamChat({
          systemPrompt, messages: apiMessages,
          onDelta: (chunk) => {
            accumulated += chunk;
            const acc = accumulated;
            setMessages((prev) => {
              const exists = prev.find((m) => m.id === aiMsgId);
              if (exists) return prev.map((m) => m.id === aiMsgId ? { ...m, message: acc } : m);
              return [...prev, makeMsg(
                { id: aiMsgId, chatId: id, chatType: "group", senderType: "ai", senderName: member.name, message: acc, timestamp: Date.now() },
                { roundNumber: round, isAutonomous: isAutonomousRound }
              )];
            });
          },
          onDone: async () => {
            const finalMsg = makeMsg(
              { id: aiMsgId, chatId: id, chatType: "group", senderType: "ai", senderName: member.name, message: accumulated, timestamp: Date.now() },
              { roundNumber: round, isAutonomous: isAutonomousRound }
            );
            await saveMessage(finalMsg);
            runningMessages = [...runningMessages, finalMsg];
            // Sync state with runningMessages so next member sees all prior messages
            setMessages([...runningMessages]);
            resolve();
          },
          onError: (err) => {
            toast({ title: `${member.name} error`, description: err, variant: "destructive" });
            resolve();
          },
        });
      });

      // Smart pacing: only wait if sentinel is out of view
      if (i < ordered.length - 1 && !abortRef.current) {
        await waitForScrollOrTimeout();
        if (timerOffset > 0) {
          await new Promise((r) => setTimeout(r, timerOffset));
        }
      }
    }

    setIsLoading(false);
    setTypingName("");
    return runningMessages;
  }, [groupData, id, waitForScrollOrTimeout]);

  // Autonomous rounds receiving fresh messages
  const runAutonomousRounds = useCallback(async (currentMessages: ChatMessage[], baseRound: number) => {
    if (!groupData) return;
    const settings = getSettings();
    if (!groupData.group.autonomousEnabled || !settings.autonomousEnabled) return;

    let msgs = currentMessages;
    for (let i = 0; i < 3; i++) {
      if (abortRef.current) break;
      const newRound = baseRound + i + 1;
      setRoundNumber(newRound + 1);
      msgs = await sendGroupMessage("", msgs, newRound, false, true);
    }
  }, [groupData, sendGroupMessage]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !id) return;
    setInput("");

    const currentRound = roundNumber;
    const isInterruption = isLoading;

    const userMsg = makeMsg({
      id: crypto.randomUUID(), chatId: id, chatType: isGroup ? "group" : "private",
      senderType: "user", senderName: "You", message: text, timestamp: Date.now(),
    }, { roundNumber: currentRound, isInterruption });

    await saveMessage(userMsg);
    const updated = [...messages, userMsg];
    setMessages(updated);
    if (!isInterruption) setRoundNumber(currentRound + 1);

    if (isGroup) {
      const finalMsgs = await sendGroupMessage(text, updated, currentRound, isInterruption);
      if (!isInterruption && !abortRef.current) {
        await runAutonomousRounds(finalMsgs, currentRound);
      }
    } else {
      await sendPrivateMessage(text, updated, currentRound);
    }
  };

  const handleEditMessage = async (msgId: string, newText: string) => {
    if (!id) return;
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;
    await deleteMessagesAfter(id, msg.timestamp);
    await updateMessage({ ...msg, message: newText, isEdited: true });
    const freshMsgs = await getMessages(id);
    setMessages(freshMsgs);
    const newRound = (msg.roundNumber || 0) + 1;
    setRoundNumber(newRound);
    if (isGroup) {
      const finalMsgs = await sendGroupMessage(newText, freshMsgs, newRound);
      await runAutonomousRounds(finalMsgs, newRound);
    } else {
      await sendPrivateMessage(newText, freshMsgs, newRound);
    }
  };

  const handleHeaderClick = () => {
    setShowProfile(true);
  };

  const handleProfileUpdated = (entity: AIEntity | Group) => {
    if (isGroup) {
      const group = entity as Group;
      setGroupData((prev) => prev ? { ...prev, group } : null);
      setChatEntity({ name: group.name, profilePicture: group.profilePicture });
    } else {
      const ai = entity as AIEntity;
      setAiEntity(ai);
      setChatEntity({ name: ai.name, profilePicture: ai.profilePicture });
    }
  };

  // Profile info view
  if (showProfile) {
    return (
      <ProfileInfoView
        type={isGroup ? "group" : "ai"}
        entity={isGroup ? groupData?.group : aiEntity}
        members={isGroup ? groupData?.members : undefined}
        onBack={() => setShowProfile(false)}
        onUpdated={handleProfileUpdated}
        embedded={embedded}
      />
    );
  }

  const settings = getSettings();

  return (
    <div ref={chatContainerRef} className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border px-3.5 py-3 flex items-center gap-2.5 relative z-10">
        {!embedded && (
          <button
            onClick={() => navigate("/home")}
            className="w-8 h-8 rounded-[10px] bg-surface-2 border border-border flex items-center justify-center text-syntra-text2 shrink-0 hover:bg-surface-3 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer" onClick={handleHeaderClick}>
          <div className="w-9 h-9 rounded-full bg-surface-3 border-[1.5px] border-[hsl(var(--border2))] flex items-center justify-center overflow-hidden shrink-0">
            {chatEntity?.profilePicture ? (
              <img src={chatEntity.profilePicture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-base">{isGroup ? "👥" : "🤖"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-head text-sm font-bold truncate tracking-[-0.01em]">{chatEntity?.name || "Chat"}</h2>
            {isGroup && groupData ? (
              <p className="font-mono text-[11px] text-syntra-text2 truncate">
                {groupData.members.map((m) => m.name).join(", ")}
              </p>
            ) : (
              <div className="flex items-center gap-1 font-mono text-[11px] text-primary">
                <span
                  className="w-[5px] h-[5px] rounded-full bg-primary"
                  style={{ boxShadow: "0 0 6px hsl(var(--green) / 0.6)", animation: "pulse-status 2s ease-in-out infinite" }}
                />
                Active
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin py-3.5 px-3 flex flex-col gap-1.5"
        style={{
          backgroundImage: "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--green) / 0.03) 0%, transparent 60%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 80px, black calc(100% - 80px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 80px, black calc(100% - 80px), transparent 100%)",
        }}
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            showSenderName={isGroup}
            onEdit={msg.senderType === "user" ? handleEditMessage : undefined}
            fontSize={settings.messageFontSize}
          />
        ))}
        {isLoading && <TypingIndicator name={typingName} />}
        <div ref={sentinelRef} className="h-px" />
        <div ref={bottomRef} />
      </main>

      {/* Interrupt button */}
      {isLoading && isGroup && (
        <div className="flex justify-center -mt-1 mb-1">
          <button
            onClick={handleInterrupt}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-2 border border-border text-syntra-text2 font-mono text-[11px] hover:bg-surface-3 hover:text-foreground transition-all"
          >
            <Hand className="h-3 w-3" />
            Interrupt
          </button>
        </div>
      )}

      {/* Input */}
      <footer className="bg-surface border-t border-border p-2.5 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-surface-2 border border-border rounded-[14px] px-3 py-2 focus-within:border-primary/30 transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none text-foreground text-[13px] placeholder:text-syntra-text3"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-[11px] bg-primary flex items-center justify-center shrink-0 disabled:opacity-40 hover:scale-105 transition-all cursor-pointer"
          style={{ boxShadow: "0 2px 10px hsl(var(--green) / 0.3)" }}
        >
          <Send className="h-[15px] w-[15px] text-black" />
        </button>
      </footer>

      {/* Group manage panel */}
      {groupData && (
        <GroupManagePanel
          open={showGroupPanel}
          onOpenChange={setShowGroupPanel}
          group={groupData.group}
          members={groupData.members}
          onUpdated={(group, members) => {
            setGroupData({ group, members });
            setChatEntity({ name: group.name, profilePicture: group.profilePicture });
          }}
        />
      )}
    </div>
  );
}
