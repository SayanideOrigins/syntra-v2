import { useState } from "react";
import { Copy, Check, Pencil } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

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
      <div className="flex justify-end mb-1 w-full">
        <div className="max-w-[78%] w-full">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full rounded-[16px] px-[13px] py-[9px] bg-surface-2 border border-border text-foreground text-[13px] font-light resize-none focus:outline-none focus:border-primary/40 transition-colors"
            rows={3}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
              if (e.key === "Escape") setEditing(false);
            }}
          />
          <div className="flex gap-2 mt-1 justify-end">
            <button onClick={() => setEditing(false)} className="text-[11px] text-syntra-text2 hover:text-foreground font-mono">Cancel</button>
            <button onClick={handleEditSubmit} className="text-[11px] text-primary hover:text-primary/80 font-mono font-medium">Save</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${isUser ? "self-end items-end" : "self-start items-start"} max-w-[78%] relative group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Sender name in group */}
      {showSenderName && !isUser && (
        <p className="font-mono text-[10px] font-semibold text-primary mb-[3px] tracking-[0.05em]">
          {message.senderName}
        </p>
      )}

      {/* Bubble */}
      <div
        className={`rounded-[16px] px-[13px] py-[9px] text-[13px] font-light leading-relaxed border ${
          isUser
            ? "bg-chat-user border-chat-user-border rounded-br-[4px]"
            : "bg-chat-ai border-chat-ai-border rounded-bl-[4px]"
        } text-foreground`}
      >
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1 mt-[3px]">
        {message.isEdited && (
          <span className="font-mono text-[9px] text-syntra-text3 italic">edited</span>
        )}
        <span className="font-mono text-[9px] text-syntra-text3">
          {formatTime(message.timestamp)}
        </span>
      </div>

      {/* Hover controls */}
      {hovered && (
        <div className={`absolute top-0 ${isUser ? "left-0 -translate-x-full -ml-1" : "right-0 translate-x-full ml-1"} flex gap-1`}>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-[8px] bg-surface-2 border border-border hover:bg-surface-3 transition-colors"
            title="Copy"
          >
            {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-syntra-text2" />}
          </button>
          {isUser && onEdit && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-[8px] bg-surface-2 border border-border hover:bg-surface-3 transition-colors"
              title="Edit"
            >
              <Pencil className="h-3 w-3 text-syntra-text2" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
