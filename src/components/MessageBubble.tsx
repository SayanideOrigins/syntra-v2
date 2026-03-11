import { useState, useEffect, useRef } from "react";
import { Copy, Check, Pencil } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface MessageBubbleProps {
  message: ChatMessage;
  showSenderName?: boolean;
  onEdit?: (msgId: string, newText: string) => void;
  fontSize?: number;
}

export function MessageBubble({ message, showSenderName, onEdit, fontSize = 13 }: MessageBubbleProps) {
  const isUser = message.senderType === "user";
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);
  const [copied, setCopied] = useState(false);

  // Typewriter effect for AI messages
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const prevMessageRef = useRef(message.message);
  const typewriterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetTextRef = useRef(message.message);
  const displayedCountRef = useRef(0);

  useEffect(() => {
    if (isUser) {
      setDisplayText(message.message);
      return;
    }

    targetTextRef.current = message.message;

    if (message.message.length > prevMessageRef.current.length || prevMessageRef.current === "") {
      setShowCursor(true);
      if (!typewriterIntervalRef.current) {
        typewriterIntervalRef.current = setInterval(() => {
          if (displayedCountRef.current < targetTextRef.current.length) {
            displayedCountRef.current += 1;
            setDisplayText(targetTextRef.current.slice(0, displayedCountRef.current));
          }
        }, 18);
      }
    }

    prevMessageRef.current = message.message;
  }, [message.message, isUser]);

  useEffect(() => {
    if (isUser) return;
    const checkDone = setInterval(() => {
      if (displayedCountRef.current >= targetTextRef.current.length && targetTextRef.current.length > 0) {
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
        setShowCursor(false);
        setDisplayText(targetTextRef.current);
        clearInterval(checkDone);
      }
    }, 100);
    return () => clearInterval(checkDone);
  }, [isUser]);

  useEffect(() => {
    return () => {
      if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
    };
  }, []);

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

  const shownText = isUser ? message.message : (displayText || message.message);

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
      className={`flex flex-col ${isUser ? "self-end items-end" : "self-start items-start"} max-w-[78%] relative`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showSenderName && !isUser && (
        <p className="font-mono text-[10px] font-semibold text-primary mb-[3px] tracking-[0.05em]">
          {message.senderName}
        </p>
      )}

      {/* Wrapper: bubble + hover controls side by side so mouse doesn't leave */}
      <div className="flex items-start gap-1">
        {/* Hover controls - LEFT side for user messages */}
        {isUser && hovered && (
          <div className="flex gap-1 shrink-0 mt-1">
            {onEdit && (
              <button onClick={() => setEditing(true)} className="p-2 rounded-[8px] bg-surface-2 border border-border hover:bg-surface-3 transition-colors" title="Edit">
                <Pencil className="h-3 w-3 text-syntra-text2" />
              </button>
            )}
            <button onClick={handleCopy} className="p-2 rounded-[8px] bg-surface-2 border border-border hover:bg-surface-3 transition-colors" title="Copy">
              {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-syntra-text2" />}
            </button>
          </div>
        )}

        <div
          className={`rounded-[16px] px-[13px] py-[9px] font-light leading-relaxed border ${
            isUser
              ? "bg-chat-user border-chat-user-border rounded-br-[4px]"
              : "bg-chat-ai border-chat-ai-border rounded-bl-[4px]"
          } text-foreground`}
        >
          <p className="whitespace-pre-wrap break-words" style={{ fontSize: `${fontSize}px` }}>
            {shownText}
            {showCursor && !isUser && (
              <span className="inline-block w-[2px] h-[14px] bg-primary ml-[1px] align-middle" style={{ animation: "pulse-status 1s ease-in-out infinite" }} />
            )}
          </p>
        </div>

        {/* Hover controls - RIGHT side for AI messages */}
        {!isUser && hovered && (
          <div className="flex gap-1 shrink-0 mt-1">
            <button onClick={handleCopy} className="p-2 rounded-[8px] bg-surface-2 border border-border hover:bg-surface-3 transition-colors" title="Copy">
              {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-syntra-text2" />}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 mt-[3px]">
        {message.isEdited && (
          <span className="font-mono text-[9px] text-syntra-text3 italic">edited</span>
        )}
        <span className="font-mono text-[9px] text-syntra-text3">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
