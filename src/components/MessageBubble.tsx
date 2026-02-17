import { useState } from "react";
import { Copy, Check, Pencil } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface MessageBubbleProps {
  message: ChatMessage;
  showSenderName?: boolean;
  onEdit?: (msgId: string, newText: string) => void;
}

export function MessageBubble({ message, showSenderName, onEdit }: MessageBubbleProps) {
  const isUser = message.senderType === "user";
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleEditSubmit = () => {
    if (editText.trim() && onEdit) {
      onEdit(message.id, editText.trim());
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex justify-end mb-2 px-3">
        <div className="max-w-[80%] w-full">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full rounded-2xl px-4 py-2 bg-secondary text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
              if (e.key === "Escape") setEditing(false);
            }}
          />
          <div className="flex gap-2 mt-1 justify-end">
            <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleEditSubmit} className="text-xs text-primary hover:text-primary/80 font-medium">Save</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2 px-3 group relative`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? "bg-chat-user text-chat-user-foreground rounded-br-md"
            : "bg-chat-ai text-chat-ai-foreground rounded-bl-md"
        }`}
      >
        {showSenderName && !isUser && (
          <p className="text-xs font-semibold text-primary mb-1">{message.senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          {message.isEdited && (
            <span className="text-[10px] text-muted-foreground italic">edited</span>
          )}
          <p className={`text-[10px] ${isUser ? "text-chat-user-foreground/60" : "text-muted-foreground"}`}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>

      {/* Hover controls */}
      {hovered && (
        <div className={`absolute top-0 ${isUser ? "left-auto right-[calc(80%+8px)]" : "right-auto left-[calc(80%+8px)]"} flex gap-1`}>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md bg-card border border-border hover:bg-secondary transition-colors"
            title="Copy"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          {isUser && onEdit && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-md bg-card border border-border hover:bg-secondary transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
