import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <header className="bg-card border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-primary">SYN</span>TRA
          </h1>
          <Button variant="ghost" size="icon" onClick={() => setShowCreateGroup(true)} title="Create Group">
            <Users className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AIs and Groups..."
            className="pl-9 bg-secondary border-0"
          />
        </div>
      </header>

      {/* Chat List */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6 text-center">
            {items.length === 0 ? (
              <>
                <span className="text-5xl mb-4">🤖</span>
                <p className="text-lg font-medium">No AIs yet</p>
                <p className="text-sm mt-1">Tap + to create your first AI</p>
              </>
            ) : (
              <p className="text-sm">No results found</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
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
      <Button
        onClick={() => setShowCreateAI(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <CreateAIModal open={showCreateAI} onOpenChange={setShowCreateAI} onCreated={loadItems} />
      <CreateGroupModal open={showCreateGroup} onOpenChange={setShowCreateGroup} onCreated={loadItems} />
    </div>
  );
};

export default Index;
