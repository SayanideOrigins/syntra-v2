import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Search, Settings } from "lucide-react";
import { ChatListItemCard } from "@/components/ChatListItemCard";
import { CreateAIModal } from "@/components/CreateAIModal";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { AIEditSheet } from "@/components/AIEditSheet";
import { GroupEditSheet } from "@/components/GroupEditSheet";
import { ChatContextMenu } from "@/components/ChatContextMenu";
import { AppLogo } from "@/components/AppLogo";
import { getAllAIs, getAllGroups, getLastMessage, searchAIs, searchGroups, saveAI, saveGroup, clearMessages, getGroup, getAI } from "@/lib/db";
import type { ChatListItem, AIEntity, Group } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatPage from "./ChatPage";

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<ChatListItem[]>([]);
  const [search, setSearch] = useState("");
  const [showCreateAI, setShowCreateAI] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingAI, setEditingAI] = useState<AIEntity | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [allAIsMap, setAllAIsMap] = useState<Map<string, AIEntity>>(new Map());
  const [allGroupsMap, setAllGroupsMap] = useState<Map<string, Group>>(new Map());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: ChatListItem } | null>(null);
  // Desktop two-panel
  const [selectedChat, setSelectedChat] = useState<{ type: string; id: string } | null>(null);

  const loadItems = useCallback(async () => {
    const [ais, groups] = await Promise.all([getAllAIs(), getAllGroups()]);
    const aiMap = new Map<string, AIEntity>();
    ais.forEach((ai) => aiMap.set(ai.id, ai));
    setAllAIsMap(aiMap);
    const grpMap = new Map<string, Group>();
    groups.forEach((g) => grpMap.set(g.id, g));
    setAllGroupsMap(grpMap);

    const aiItems: ChatListItem[] = await Promise.all(
      ais.map(async (ai) => {
        const last = await getLastMessage(ai.id);
        return {
          id: ai.id, name: ai.name, description: ai.description,
          profilePicture: ai.profilePicture,
          lastMessage: last?.message || "", lastTimestamp: last?.timestamp || ai.createdAt,
          type: "ai" as const,
          isPinned: ai.isPinned, isFavourite: ai.isFavourite, isNotificationMuted: ai.isNotificationMuted,
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
          isPinned: g.isPinned, isFavourite: g.isFavourite, isNotificationMuted: g.isNotificationMuted,
        };
      })
    );
    const all = [...aiItems, ...groupItems].sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastTimestamp - a.lastTimestamp;
    });
    setItems(all);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const [searchResults, setSearchResults] = useState<ChatListItem[]>([]);
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const q = search.toLowerCase();
    (async () => {
      const [ais, groups] = await Promise.all([searchAIs(q), searchGroups(q)]);
      const aiItems: ChatListItem[] = await Promise.all(
        ais.map(async (ai) => {
          const last = await getLastMessage(ai.id);
          return {
            id: ai.id, name: ai.name, description: ai.description,
            profilePicture: ai.profilePicture,
            lastMessage: last?.message || "", lastTimestamp: last?.timestamp || ai.createdAt,
            type: "ai" as const,
            isPinned: ai.isPinned, isFavourite: ai.isFavourite, isNotificationMuted: ai.isNotificationMuted,
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
            isPinned: g.isPinned, isFavourite: g.isFavourite, isNotificationMuted: g.isNotificationMuted,
          };
        })
      );
      setSearchResults([...aiItems, ...groupItems].sort((a, b) => b.lastTimestamp - a.lastTimestamp));
    })();
  }, [search]);

  const filtered = search.trim() ? searchResults : items;

  const handleItemClick = (item: ChatListItem) => {
    if (isMobile) {
      navigate(`/chat/${item.type}/${item.id}`);
    } else {
      setSelectedChat({ type: item.type, id: item.id });
    }
  };

  const handleLongPress = (item: ChatListItem, e?: { x: number; y: number }) => {
    if (e) {
      setContextMenu({ x: e.x, y: e.y, item });
    } else {
      // Fallback: open edit sheet directly
      openEditSheet(item);
    }
  };

  const openEditSheet = async (item: ChatListItem) => {
    if (item.type === "ai") {
      const ai = allAIsMap.get(item.id) || await getAI(item.id);
      if (ai) setEditingAI(ai);
    } else {
      const group = allGroupsMap.get(item.id) || await getGroup(item.id);
      if (group) setEditingGroup(group);
    }
  };

  const handleContextAction = async (action: string, item: ChatListItem) => {
    if (action === "edit") {
      openEditSheet(item);
    } else if (action === "pin") {
      if (item.type === "ai") {
        const ai = allAIsMap.get(item.id);
        if (ai) { await saveAI({ ...ai, isPinned: !ai.isPinned }); loadItems(); }
      } else {
        const g = allGroupsMap.get(item.id);
        if (g) { await saveGroup({ ...g, isPinned: !g.isPinned }); loadItems(); }
      }
    } else if (action === "favourite") {
      if (item.type === "ai") {
        const ai = allAIsMap.get(item.id);
        if (ai) { await saveAI({ ...ai, isFavourite: !ai.isFavourite }); loadItems(); }
      } else {
        const g = allGroupsMap.get(item.id);
        if (g) { await saveGroup({ ...g, isFavourite: !g.isFavourite }); loadItems(); }
      }
    } else if (action === "mute") {
      if (item.type === "ai") {
        const ai = allAIsMap.get(item.id);
        if (ai) { await saveAI({ ...ai, isNotificationMuted: !ai.isNotificationMuted }); loadItems(); }
      } else {
        const g = allGroupsMap.get(item.id);
        if (g) { await saveGroup({ ...g, isNotificationMuted: !g.isNotificationMuted }); loadItems(); }
      }
    } else if (action === "archive") {
      if (item.type === "ai") {
        const ai = allAIsMap.get(item.id);
        if (ai) { await saveAI({ ...ai, isHidden: true }); loadItems(); }
      } else {
        const g = allGroupsMap.get(item.id);
        if (g) { await saveGroup({ ...g, isHidden: true }); loadItems(); }
      }
    } else if (action === "clear") {
      await clearMessages(item.id);
      loadItems();
    }
  };

  const chatListPanel = (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3.5">
          <AppLogo />
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
                onClick={() => handleItemClick(item)}
                onLongPress={(e) => handleLongPress(item, e)}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowCreateAI(true)}
        className="fixed bottom-5 right-4 w-[52px] h-[52px] rounded-full bg-primary flex items-center justify-center z-50 border-none cursor-pointer hover:scale-105 transition-all"
        style={{ boxShadow: "0 4px 20px hsl(var(--green) / 0.4)" }}
      >
        <Plus className="h-[22px] w-[22px] text-black" />
      </button>

      <CreateAIModal open={showCreateAI} onOpenChange={setShowCreateAI} onCreated={loadItems} />
      <CreateGroupModal open={showCreateGroup} onOpenChange={setShowCreateGroup} onCreated={loadItems} />
      {editingAI && (
        <AIEditSheet open={!!editingAI} onOpenChange={(open) => { if (!open) setEditingAI(null); }} ai={editingAI} onUpdated={loadItems} />
      )}
      {editingGroup && (
        <GroupEditSheet open={!!editingGroup} onOpenChange={(open) => { if (!open) setEditingGroup(null); }} group={editingGroup} onUpdated={loadItems} />
      )}

      {/* Context menu */}
      {contextMenu && (
        <ChatContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onEdit={() => openEditSheet(contextMenu.item)}
          onPin={() => handleContextAction("pin", contextMenu.item)}
          onFavourite={() => handleContextAction("favourite", contextMenu.item)}
          onMute={() => handleContextAction("mute", contextMenu.item)}
          onArchive={() => handleContextAction("archive", contextMenu.item)}
          onClearChat={() => handleContextAction("clear", contextMenu.item)}
          isPinned={contextMenu.item.isPinned}
          isFavourite={contextMenu.item.isFavourite}
          isMuted={contextMenu.item.isNotificationMuted}
        />
      )}
    </div>
  );

  // Desktop two-panel layout
  if (!isMobile) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-[320px] border-r border-border shrink-0 h-full relative">
          {chatListPanel}
        </div>
        <div className="flex-1 h-full">
          {selectedChat ? (
            <ChatPage
              key={`${selectedChat.type}-${selectedChat.id}`}
              overrideType={selectedChat.type}
              overrideId={selectedChat.id}
              embedded
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-syntra-text2">
              <AppLogo size="lg" className="mb-4" />
              <p className="font-mono text-[11px] text-syntra-text3 uppercase tracking-[0.25em] mt-2">
                AI Orchestration · v2
              </p>
              <p className="text-sm mt-6 font-light">Select a chat to start</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return chatListPanel;
};

export default Index;
