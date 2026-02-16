export interface AIEntity {
  id: string;
  name: string;
  description: string;
  job: string;
  customPrompt: string;
  personalityNotes: string;
  profilePicture: string | null;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  customPrompt: string;
  profilePicture: string | null;
  memberIds: string[];
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
