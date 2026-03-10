export type ResponseMode = "regular" | "humanely" | "professional" | "custom";

export interface AIEntity {
  id: string;
  name: string;
  description: string;
  job: string;
  customPrompt: string;
  personalityNotes: string;
  profilePicture: string | null;
  responseMode: ResponseMode;
  isMuted: boolean;
  isPaused: boolean;
  isHidden?: boolean;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  customPrompt: string;
  profilePicture: string | null;
  memberIds: string[];
  timerOffset: number;
  autonomousEnabled: boolean;
  mutedMemberIds: string[];
  pausedMemberIds: string[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  chatType: "private" | "group";
  senderType: "user" | "ai";
  senderName: string;
  message: string;
  timestamp: number;
  roundNumber: number;
  isInterruption: boolean;
  isAutonomous: boolean;
  isEdited: boolean;
}

export type ChatListItem = {
  id: string;
  name: string;
  description: string;
  profilePicture: string | null;
  lastMessage: string;
  lastTimestamp: number;
  type: "ai" | "group";
};

export interface ConversationSettings {
  globalResponseMode: ResponseMode;
  markdownEnabled: boolean;
  autonomousEnabled: boolean;
  defaultTimerOffset: number;
}

export interface GroupState {
  roundNumber: number;
  activeMembers: string[];
  mutedMembers: string[];
  pausedMembers: string[];
  autonomousFlag: boolean;
  timerOffset: number;
}
