import type { ChatListItem } from "@/lib/types";

function formatTimestamp(ts: number) {
  const now = new Date();
  const d = new Date(ts);
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface ChatListItemCardProps {
  item: ChatListItem;
  onClick: () => void;
}

export function ChatListItemCard({ item, onClick }: ChatListItemCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left"
    >
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
        {item.profilePicture ? (
          <img src={item.profilePicture} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl">{item.type === "group" ? "👥" : "🤖"}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="text-sm font-semibold truncate">{item.name}</h3>
          {item.lastTimestamp > 0 && (
            <span className="text-[11px] text-muted-foreground ml-2 shrink-0">{formatTimestamp(item.lastTimestamp)}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {item.lastMessage || item.description || "Start a conversation"}
        </p>
      </div>
    </button>
  );
}
