export function TypingIndicator({ name }: { name?: string }) {
  return (
    <div className="self-start flex items-center gap-2 px-3 py-2 bg-chat-ai border border-chat-ai-border rounded-[14px] rounded-bl-[4px]">
      {name && <span className="font-mono text-[10px] font-medium text-primary">{name}</span>}
      <div className="flex gap-[3px] items-center">
        <span
          className="w-[5px] h-[5px] rounded-full bg-syntra-text3"
          style={{ animation: "dot-bounce 1.4s ease-in-out infinite" }}
        />
        <span
          className="w-[5px] h-[5px] rounded-full bg-syntra-text3"
          style={{ animation: "dot-bounce 1.4s ease-in-out infinite", animationDelay: "0.2s" }}
        />
        <span
          className="w-[5px] h-[5px] rounded-full bg-syntra-text3"
          style={{ animation: "dot-bounce 1.4s ease-in-out infinite", animationDelay: "0.4s" }}
        />
      </div>
    </div>
  );
}
