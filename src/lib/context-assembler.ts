import type { AIEntity, ChatMessage, ResponseMode, GroupState } from "./types";
import { buildFullPrompt } from "./prompt-builder";

type Msg = { role: "user" | "assistant"; content: string };

interface AssembleParams {
  ai: AIEntity;
  allMessages: ChatMessage[];
  userMessage: string;
  otherParticipants: AIEntity[];
  groupPrompt?: string;
  effectiveMode: ResponseMode;
  groupState: GroupState;
  interruptionMessage?: string;
}

export function assembleContext(params: AssembleParams): {
  systemPrompt: string;
  messages: Msg[];
} {
  const {
    ai,
    allMessages,
    userMessage,
    otherParticipants,
    groupPrompt,
    effectiveMode,
    groupState,
    interruptionMessage,
  } = params;

  // Find first user message as topic
  const firstUserMsg = allMessages.find((m) => m.senderType === "user");
  const topic = firstUserMsg?.message || userMessage;

  // Gather prior AI responses for structured context
  const priorResponses = allMessages
    .filter((m) => m.senderType === "ai")
    .slice(-20) // last 20 AI messages for context window
    .map((m) => ({ name: m.senderName, content: m.message }));

  const systemPrompt = buildFullPrompt({
    ai,
    otherParticipants: otherParticipants.map((p) => p.name),
    topic,
    userInput: userMessage,
    priorResponses,
    groupPrompt,
    responseMode: effectiveMode,
    roundNumber: groupState.roundNumber,
    isAutonomous: groupState.autonomousFlag,
    interruptionMessage,
  });

  // Build conversation history for the API
  const messages: Msg[] = allMessages.map((m) => ({
    role: m.senderType === "user" ? ("user" as const) : ("assistant" as const),
    content:
      m.senderType === "ai"
        ? `[${m.senderName}]: ${m.message}`
        : m.message,
  }));

  // Add current user message if not already in history
  if (userMessage) {
    messages.push({ role: "user", content: userMessage });
  }

  return { systemPrompt, messages };
}
