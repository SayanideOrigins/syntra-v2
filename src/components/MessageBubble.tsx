import type { ChatMessage } from "@/lib/types";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface MessageBubbleProps {
  message: ChatMessage;
  showSenderName?: boolean;
}

export function MessageBubble({ message, showSenderName }: MessageBubbleProps) {
  const isUser = message.senderType === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2 px-3`}>
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
        <p className={`text-[10px] mt-1 ${isUser ? "text-chat-user-foreground/60" : "text-muted-foreground"} text-right`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
