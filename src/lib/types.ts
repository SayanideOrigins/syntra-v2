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
  isPinned?: boolean;
  isFavourite?: boolean;
  isNotificationMuted?: boolean;
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
  isHidden?: boolean;
  isPinned?: boolean;
  isFavourite?: boolean;
  isNotificationMuted?: boolean;
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
  isPinned?: boolean;
  isFavourite?: boolean;
  isNotificationMuted?: boolean;
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

export interface ThemePreset {
  name: string;
  colors: string[];
}

export interface AppBranding {
  name: string;
  splitPoint: number;
  font: string;
  alignment: "left" | "center" | "right";
}

export interface ThemeSettings {
  preset: string;
  customColors: string[];
  branding: AppBranding;
}
