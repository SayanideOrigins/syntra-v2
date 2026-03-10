import { useRef, useCallback } from "react";
import { Pin, Star } from "lucide-react";
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
  onLongPress?: (e?: { x: number; y: number }) => void;
}

export function ChatListItemCard({ item, onClick, onLongPress }: ChatListItemCardProps) {
  const isAI = item.type === "ai";
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const touchPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    didLongPress.current = false;
    touchPos.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress?.(touchPos.current);
    }, 500);
  }, [onLongPress]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!didLongPress.current) onClick();
  }, [onClick]);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onLongPress?.({ x: e.clientX, y: e.clientY });
  }, [onLongPress]);

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={handleContextMenu}
      className="w-full flex items-center gap-3 px-4 py-[11px] hover:bg-surface-2 transition-colors text-left relative select-none"
    >
      <div className="absolute bottom-0 left-4 right-4 h-px bg-border" />

      {/* Avatar */}
      <div className="w-[46px] h-[46px] rounded-full bg-surface-3 border-[1.5px] border-[hsl(var(--border2))] flex items-center justify-center overflow-hidden shrink-0 relative">
        {item.profilePicture ? (
          <img src={item.profilePicture} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg">{item.type === "group" ? "👥" : "🤖"}</span>
        )}
        {isAI && (
          <span
            className="absolute bottom-[1px] right-[1px] w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface"
            style={{ boxShadow: "0 0 8px hsl(var(--green) / 0.5)" }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <div className="flex items-center gap-1 min-w-0">
            <h3 className="font-head text-sm font-semibold text-foreground truncate tracking-[-0.01em]">
              {item.name}
            </h3>
            {item.isPinned && <Pin className="h-2.5 w-2.5 text-syntra-text3 shrink-0" />}
            {item.isFavourite && <Star className="h-2.5 w-2.5 text-primary shrink-0 fill-primary" />}
          </div>
          {item.lastTimestamp > 0 && (
            <span className="font-mono text-[10px] text-syntra-text3 ml-2 shrink-0">
              {formatTimestamp(item.lastTimestamp)}
            </span>
          )}
        </div>
        <p className="text-xs text-syntra-text2 truncate font-light">
          {item.lastMessage || item.description || "Start a conversation"}
        </p>
      </div>
    </button>
  );
}
