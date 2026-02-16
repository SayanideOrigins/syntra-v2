import type { AIEntity, ChatMessage } from "./types";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type Msg = { role: "user" | "assistant"; content: string };

function buildSystemPrompt(ai: AIEntity, groupPrompt?: string): string {
  const parts: string[] = [];
  parts.push(`Your name is ${ai.name}.`);
  if (ai.job) parts.push(`Your role/job: ${ai.job}.`);
  if (ai.description) parts.push(`About you: ${ai.description}.`);
  if (ai.customPrompt) parts.push(ai.customPrompt);
  if (ai.personalityNotes) parts.push(`Personality: ${ai.personalityNotes}.`);
  if (groupPrompt) parts.push(`Group context: ${groupPrompt}`);
  return parts.join("\n");
}

function chatHistoryToMessages(history: ChatMessage[]): Msg[] {
  return history.map((m) => ({
    role: m.senderType === "user" ? "user" as const : "assistant" as const,
    content: m.senderType === "ai" ? `[${m.senderName}]: ${m.message}` : m.message,
  }));
}

export async function streamChat({
  ai,
  history,
  userMessage,
  groupPrompt,
  onDelta,
  onDone,
  onError,
}: {
  ai: AIEntity;
  history: ChatMessage[];
  userMessage: string;
  groupPrompt?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  const systemPrompt = buildSystemPrompt(ai, groupPrompt);
  const messages: Msg[] = [
    ...chatHistoryToMessages(history),
    { role: "user", content: userMessage },
  ];

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ systemPrompt, messages }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({ error: "Request failed" }));
      onError(errData.error || `Error ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError("No response body");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Flush remaining
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Connection error");
  }
}
