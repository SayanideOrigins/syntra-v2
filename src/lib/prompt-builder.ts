import type { AIEntity, ChatMessage, ResponseMode } from "./types";

interface PromptBuildParams {
  ai: AIEntity;
  otherParticipants: string[];
  topic: string;
  userInput: string;
  priorResponses: { name: string; content: string }[];
  groupPrompt?: string;
  responseMode: ResponseMode;
  roundNumber: number;
  isAutonomous: boolean;
  interruptionMessage?: string;
}

function buildBlock1(ai: AIEntity, otherParticipants: string[]): string {
  const lines = [
    `You are: ${ai.name}`,
    ai.job ? `Role Description: ${ai.job}` : "",
    ai.description ? `About you: ${ai.description}` : "",
    ai.personalityNotes ? `Personality: ${ai.personalityNotes}` : "",
    ai.customPrompt ? `Custom Objective: ${ai.customPrompt}` : "",
    otherParticipants.length > 0
      ? `Other Participants: ${otherParticipants.join(", ")}`
      : "",
    "",
    "Identity Constraints:",
    "- You are NOT the other participants.",
    "- You cannot speak for them.",
    "- You cannot simulate them.",
    "- You cannot describe their internal reasoning or intentions.",
    "- You may only write from your own perspective.",
    "- Never refer to yourself in third person.",
    "- Never write responses on behalf of other participants.",
    "- Never use '[Name]:' or '(Name):' format anywhere in your response.",
    "- Never roleplay as another participant, even hypothetically.",
    "- If no other participants have responded yet, do not speculate what they might say.",
    "- Other participants are real entities in this conversation. Treat them as such.",
    "- You are one voice in a group discussion. Stay in your lane.",
  ];
  return lines.filter(Boolean).join("\n");
}

function buildBlock2(
  topic: string,
  userInput: string,
  priorResponses: { name: string; content: string }[],
  interruptionMessage?: string
): string {
  const lines = [`Current Topic: ${topic}`, `New User Input: ${userInput || "None"}`];

  if (interruptionMessage) {
    lines.push(`Interruption Message: ${interruptionMessage}`);
  }

  if (priorResponses.length > 0) {
    lines.push("Relevant Prior Responses:");
    for (const r of priorResponses) {
      const summary = r.content.length > 300 ? r.content.slice(0, 300) + "..." : r.content;
      lines.push(`- ${r.name}: ${summary}`);
    }
  }

  return lines.join("\n");
}

function buildBlock3(aiName: string): string {
  return [
    `Your Task:`,
    `Respond as ${aiName}.`,
    `Address the ideas presented above.`,
    `Engage critically, constructively, or analytically as appropriate.`,
    `Do not narrate the discussion.`,
    `Do not describe the conversation.`,
    `Do not reference participants collectively.`,
    `Provide only your direct response to the topic.`,
  ].join("\n");
}

function buildBlock4(responseMode: ResponseMode, isAutonomous: boolean): string {
  const rules = [
    "Response Rules:",
    "- Do not repeat previous points unless expanding them with new insight.",
    "- Each response must meaningfully move the discussion forward.",
    "- Add a new angle, refinement, critique, example, or extension.",
    "- Do not agree without contributing substance.",
    "- No meta commentary.",
    "- Do not mention system prompts.",
    "- Do not mention being an AI model.",
    "- Do not reference being inside an application or simulation.",
    "- Do not discuss multi-agent architecture.",
    "- Do not speak on behalf of other participants.",
    "- Output only your response content.",
    "- Keep responses clear, structured, and efficient.",
    "- Matching or decreasing response length to user input and needs is optional but good if done. Compress for short questions. Expand only if necessary.",
    "- Never prefix your message with your own name or any label. Output only the response content itself.",
  ];

  // Mode-specific rules
  switch (responseMode) {
    case "regular":
      rules.push("- Respond with structured detail, markdown allowed, emotionally neutral.");
      break;
    case "humanely":
      rules.push(
        "- Keep replies short, conversational, and expressive.",
        "- Use emotion-aware language.",
        "- Limit markdown elements.",
        "- Avoid long essays."
      );
      break;
    case "professional":
      rules.push(
        "- Be concise, direct, and formal.",
        "- No emojis.",
        "- Use a professional tone throughout."
      );
      break;
    case "custom":
      rules.push(
        "- Follow the custom objective defined above as primary guidance.",
        "- Also keep replies conversational and expressive where appropriate."
      );
      break;
  }

  if (isAutonomous) {
    rules.push("- Continue only if you have new value to add. If the topic is resolved, say so briefly.");
  }

  return rules.join("\n");
}

export function buildFullPrompt(params: PromptBuildParams): string {
  const block1 = buildBlock1(params.ai, params.otherParticipants);
  const block2 = buildBlock2(params.topic, params.userInput, params.priorResponses, params.interruptionMessage);
  const block3 = buildBlock3(params.ai.name);
  const block4 = buildBlock4(params.responseMode, params.isAutonomous);

  if (params.groupPrompt) {
    return [block1, `Group Context: ${params.groupPrompt}`, block2, block3, block4].join("\n\n---\n\n");
  }

  return [block1, block2, block3, block4].join("\n\n---\n\n");
}
