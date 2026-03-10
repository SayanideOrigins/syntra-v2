import { useState, useRef, useCallback, useEffect } from "react";
import { Pin, Star, BellOff, Archive, Trash2, Pencil, X } from "lucide-react";

interface ChatContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onPin: () => void;
  onFavourite: () => void;
  onMute: () => void;
  onArchive: () => void;
  onClearChat: () => void;
  isPinned?: boolean;
  isFavourite?: boolean;
  isMuted?: boolean;
}

export function ChatContextMenu({
  x, y, onClose, onEdit, onPin, onFavourite, onMute, onArchive, onClearChat,
  isPinned, isFavourite, isMuted,
}: ChatContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onClose]);

  // Adjust position to stay on screen
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 300),
    zIndex: 9999,
  };

  const items = [
    { icon: Pencil, label: "Edit", action: onEdit },
    { icon: Pin, label: isPinned ? "Unpin" : "Pin chat", action: onPin },
    { icon: Star, label: isFavourite ? "Unfavourite" : "Add to Favourites", action: onFavourite },
    { icon: BellOff, label: isMuted ? "Unmute" : "Mute notifications", action: onMute },
    { icon: Archive, label: "Archive", action: onArchive },
    { icon: Trash2, label: "Clear chat", action: onClearChat, destructive: true },
  ];

  return (
    <div ref={ref} style={style} className="bg-surface border border-[hsl(var(--border2))] rounded-[12px] py-1 min-w-[180px] shadow-xl">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.action(); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-surface-2 transition-colors ${
            item.destructive ? "text-red-400" : "text-foreground"
          }`}
        >
          <item.icon className="h-3.5 w-3.5 shrink-0" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
