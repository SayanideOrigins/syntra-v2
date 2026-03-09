import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChatListItemCard } from "@/components/ChatListItemCard";
import { CreateAIModal } from "@/components/CreateAIModal";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { getAllAIs, getAllGroups, getLastMessage } from "@/lib/db";
import type { ChatListItem } from "@/lib/types";

const Index = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ChatListItem[]>([]);
  const [search, setSearch] = useState("");
  const [showCreateAI, setShowCreateAI] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const loadItems = useCallback(async () => {
    const [ais, groups] = await Promise.all([getAllAIs(), getAllGroups()]);
    const aiItems: ChatListItem[] = await Promise.all(
      ais.map(async (ai) => {
        const last = await getLastMessage(ai.id);
        return {
          id: ai.id, name: ai.name, description: ai.description,
          profilePicture: ai.profilePicture,
          lastMessage: last?.message || "", lastTimestamp: last?.timestamp || ai.createdAt,
          type: "ai" as const,
        };
      })
    );
    const groupItems: ChatListItem[] = await Promise.all(
      groups.map(async (g) => {
        const last = await getLastMessage(g.id);
        return {
          id: g.id, name: g.name, description: g.description,
          profilePicture: g.profilePicture,
          lastMessage: last?.message || "", lastTimestamp: last?.timestamp || g.createdAt,
          type: "group" as const,
        };
      })
    );
    const all = [...aiItems, ...groupItems].sort((a, b) => b.lastTimestamp - a.lastTimestamp);
    setItems(all);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filtered = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3.5">
          <h1 className="font-head text-2xl font-extrabold tracking-[-0.04em]">
            <span className="text-primary">SYN</span>
            <span className="text-foreground">TRA</span>
            <span className="font-mono text-[9px] text-syntra-text3 tracking-[0.1em] ml-1.5 align-middle">v2</span>
          </h1>
          <div className="flex gap-1">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="w-[34px] h-[34px] rounded-[10px] border border-border bg-surface-2 flex items-center justify-center text-syntra-text2 hover:bg-surface-3 hover:text-foreground transition-all"
              title="Create Group"
            >
              <Users className="h-[15px] w-[15px]" />
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="w-[34px] h-[34px] rounded-[10px] border border-border bg-surface-2 flex items-center justify-center text-syntra-text2 hover:bg-surface-3 hover:text-foreground transition-all"
              title="Settings"
            >
              <Settings className="h-[15px] w-[15px]" />
            </button>
          </div>
        </div>
        <div className="relative flex items-center gap-2.5 bg-surface-2 border border-border rounded-xl px-3 py-2 focus-within:border-primary/30 transition-colors">
          <Search className="h-3.5 w-3.5 text-syntra-text3 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AIs and groups..."
            className="bg-transparent border-none outline-none text-foreground text-[13px] w-full placeholder:text-syntra-text3"
          />
        </div>
      </header>

      {/* Chat List */}
      <main className="flex-1 overflow-y-auto scrollbar-thin py-1.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-syntra-text2 px-6 text-center">
            {items.length === 0 ? (
              <>
                <span className="text-5xl mb-4">🤖</span>
                <p className="text-lg font-head font-semibold text-foreground">No AIs yet</p>
                <p className="text-sm mt-1 font-light">Tap + to create your first AI</p>
              </>
            ) : (
              <p className="text-sm font-light">No results found</p>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((item) => (
              <ChatListItemCard
                key={item.id}
                item={item}
                onClick={() => navigate(`/chat/${item.type}/${item.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowCreateAI(true)}
        className="fixed bottom-5 right-4 w-[52px] h-[52px] rounded-full bg-primary flex items-center justify-center z-50 border-none cursor-pointer hover:scale-105 transition-all"
        style={{ boxShadow: "0 4px 20px rgba(34,197,94,0.4)" }}
      >
        <Plus className="h-[22px] w-[22px] text-black" />
      </button>

      <CreateAIModal open={showCreateAI} onOpenChange={setShowCreateAI} onCreated={loadItems} />
      <CreateGroupModal open={showCreateGroup} onOpenChange={setShowCreateGroup} onCreated={loadItems} />
    </div>
  );
};

export default Index;
