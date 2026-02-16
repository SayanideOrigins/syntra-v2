import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { getAI, getGroup, getMessages, saveMessage, getAllAIs } from "@/lib/db";
import { streamChat } from "@/lib/ai-service";
import type { AIEntity, ChatMessage, Group } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

export default function ChatPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [typingName, setTypingName] = useState("");
  const [chatEntity, setChatEntity] = useState<{ name: string; profilePicture: string | null } | null>(null);
  const [aiEntity, setAiEntity] = useState<AIEntity | null>(null);
  const [groupData, setGroupData] = useState<{ group: Group; members: AIEntity[] } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isGroup = type === "group";

  useEffect(() => {
    if (!id) return;
    (async () => {
      const msgs = await getMessages(id);
      setMessages(msgs);
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

  const sendPrivateMessage = useCallback(async (userText: string, currentMessages: ChatMessage[]) => {
    if (!aiEntity || !id) return;
    setIsLoading(true);
    setTypingName(aiEntity.name);

    let accumulated = "";
    const aiMsgId = crypto.randomUUID();

    await streamChat({
      ai: aiEntity,
      history: currentMessages,
      userMessage: userText,
      onDelta: (chunk) => {
        accumulated += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === aiMsgId) {
            return prev.map((m) => m.id === aiMsgId ? { ...m, message: accumulated } : m);
          }
          const newMsg: ChatMessage = {
            id: aiMsgId, chatId: id, chatType: "private", senderType: "ai",
            senderName: aiEntity.name, message: accumulated, timestamp: Date.now(),
          };
          return [...prev, newMsg];
        });
      },
      onDone: async () => {
        const finalMsg: ChatMessage = {
          id: aiMsgId, chatId: id, chatType: "private", senderType: "ai",
          senderName: aiEntity.name, message: accumulated, timestamp: Date.now(),
        };
        await saveMessage(finalMsg);
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

  const sendGroupMessage = useCallback(async (userText: string, currentMessages: ChatMessage[]) => {
    if (!groupData || !id) return;
    setIsLoading(true);

    // Shuffle members for this round
    const shuffled = [...groupData.members].sort(() => Math.random() - 0.5);
    let runningMessages = [...currentMessages];

    for (const member of shuffled) {
      setTypingName(member.name);
      let accumulated = "";
      const aiMsgId = crypto.randomUUID();

      await new Promise<void>((resolve) => {
        streamChat({
          ai: member,
          history: runningMessages,
          userMessage: userText,
          groupPrompt: groupData.group.customPrompt,
          onDelta: (chunk) => {
            accumulated += chunk;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.id === aiMsgId) {
                return prev.map((m) => m.id === aiMsgId ? { ...m, message: accumulated } : m);
              }
              const newMsg: ChatMessage = {
                id: aiMsgId, chatId: id, chatType: "group", senderType: "ai",
                senderName: member.name, message: accumulated, timestamp: Date.now(),
              };
              return [...prev, newMsg];
            });
          },
          onDone: async () => {
            const finalMsg: ChatMessage = {
              id: aiMsgId, chatId: id, chatType: "group", senderType: "ai",
              senderName: member.name, message: accumulated, timestamp: Date.now(),
            };
            await saveMessage(finalMsg);
            runningMessages = [...runningMessages, finalMsg];
            resolve();
          },
          onError: (err) => {
            toast({ title: `${member.name} error`, description: err, variant: "destructive" });
            resolve();
          },
        });
      });
    }

    setIsLoading(false);
    setTypingName("");
  }, [groupData, id]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading || !id) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), chatId: id, chatType: isGroup ? "group" : "private",
      senderType: "user", senderName: "You", message: text, timestamp: Date.now(),
    };
    await saveMessage(userMsg);
    const updated = [...messages, userMsg];
    setMessages(updated);

    if (isGroup) {
      await sendGroupMessage(text, updated);
    } else {
      await sendPrivateMessage(text, updated);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-3 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
          {chatEntity?.profilePicture ? (
            <img src={chatEntity.profilePicture} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">{isGroup ? "👥" : "🤖"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">{chatEntity?.name || "Chat"}</h2>
          {isGroup && groupData && (
            <p className="text-xs text-muted-foreground truncate">
              {groupData.members.map((m) => m.name).join(", ")}
            </p>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto scrollbar-thin py-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} showSenderName={isGroup} />
        ))}
        {isLoading && <TypingIndicator name={typingName} />}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="bg-card border-t border-border p-3 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-secondary border-0"
          disabled={isLoading}
        />
        <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
