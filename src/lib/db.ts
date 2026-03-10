import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AIEntity, Group, ChatMessage } from "./types";

interface SyntraDB extends DBSchema {
  ais: { key: string; value: AIEntity; indexes: { "by-name": string } };
  groups: { key: string; value: Group; indexes: { "by-name": string } };
  messages: {
    key: string;
    value: ChatMessage;
    indexes: { "by-chat": string; "by-timestamp": [string, number] };
  };
}

let dbPromise: Promise<IDBPDatabase<SyntraDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SyntraDB>("syntra", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const aiStore = db.createObjectStore("ais", { keyPath: "id" });
          aiStore.createIndex("by-name", "name");
          const groupStore = db.createObjectStore("groups", { keyPath: "id" });
          groupStore.createIndex("by-name", "name");
          const msgStore = db.createObjectStore("messages", { keyPath: "id" });
          msgStore.createIndex("by-chat", "chatId");
          msgStore.createIndex("by-timestamp", ["chatId", "timestamp"]);
        }
      },
    });
  }
  return dbPromise;
}

// AI operations
export async function getAllAIs(): Promise<AIEntity[]> {
  const db = await getDB();
  const ais = await db.getAll("ais");
  return ais
    .map((ai) => ({
      responseMode: "regular" as const,
      isMuted: false,
      isPaused: false,
      ...ai,
    }))
    .filter((ai) => !ai.isHidden);
}

export async function searchAIs(query: string): Promise<AIEntity[]> {
  const db = await getDB();
  const ais = await db.getAll("ais");
  const q = query.toLowerCase();
  return ais
    .map((ai) => ({
      responseMode: "regular" as const,
      isMuted: false,
      isPaused: false,
      ...ai,
    }))
    .filter((ai) => ai.name.toLowerCase().includes(q) || ai.description.toLowerCase().includes(q));
}

export async function getAI(id: string): Promise<AIEntity | undefined> {
  const db = await getDB();
  const ai = await db.get("ais", id);
  if (!ai) return undefined;
  return { responseMode: "regular" as const, isMuted: false, isPaused: false, ...ai };
}

export async function saveAI(ai: AIEntity): Promise<void> {
  const db = await getDB();
  await db.put("ais", ai);
}

export async function deleteAI(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("ais", id);
  // Also delete all messages for this AI
  const msgs = await db.getAllFromIndex("messages", "by-chat", id);
  const tx = db.transaction("messages", "readwrite");
  for (const m of msgs) await tx.store.delete(m.id);
  await tx.done;
}

// Group operations
export async function getAllGroups(): Promise<Group[]> {
  const db = await getDB();
  const groups = await db.getAll("groups");
  return groups
    .map((g) => ({
      timerOffset: 1500,
      autonomousEnabled: false,
      mutedMemberIds: [] as string[],
      pausedMemberIds: [] as string[],
      ...g,
    }))
    .filter((g) => !g.isHidden);
}

export async function searchGroups(query: string): Promise<Group[]> {
  const db = await getDB();
  const groups = await db.getAll("groups");
  const q = query.toLowerCase();
  return groups
    .map((g) => ({
      timerOffset: 1500,
      autonomousEnabled: false,
      mutedMemberIds: [] as string[],
      pausedMemberIds: [] as string[],
      ...g,
    }))
    .filter((g) => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
}

export async function getGroup(id: string): Promise<Group | undefined> {
  const db = await getDB();
  const g = await db.get("groups", id);
  if (!g) return undefined;
  return { timerOffset: 1500, autonomousEnabled: false, mutedMemberIds: [], pausedMemberIds: [], ...g };
}

export async function saveGroup(group: Group): Promise<void> {
  const db = await getDB();
  await db.put("groups", group);
}

export async function deleteGroup(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("groups", id);
  // Also delete all messages for this group
  const msgs = await db.getAllFromIndex("messages", "by-chat", id);
  const tx = db.transaction("messages", "readwrite");
  for (const m of msgs) await tx.store.delete(m.id);
  await tx.done;
}

// Message operations
export async function getMessages(chatId: string): Promise<ChatMessage[]> {
  const db = await getDB();
  const msgs = await db.getAllFromIndex("messages", "by-chat", chatId);
  const backfilled = msgs.map((m) => ({
    roundNumber: 0,
    isInterruption: false,
    isAutonomous: false,
    isEdited: false,
    ...m,
  }));
  return backfilled.sort((a, b) => a.timestamp - b.timestamp);
}

export async function saveMessage(msg: ChatMessage): Promise<void> {
  const db = await getDB();
  await db.put("messages", msg);
}

export async function getLastMessage(chatId: string): Promise<ChatMessage | undefined> {
  const db = await getDB();
  const msgs = await db.getAllFromIndex("messages", "by-chat", chatId);
  if (msgs.length === 0) return undefined;
  return msgs.sort((a, b) => b.timestamp - a.timestamp)[0];
}

export async function deleteMessagesAfter(chatId: string, timestamp: number): Promise<void> {
  const db = await getDB();
  const msgs = await db.getAllFromIndex("messages", "by-chat", chatId);
  const tx = db.transaction("messages", "readwrite");
  for (const m of msgs) {
    if (m.timestamp > timestamp) {
      await tx.store.delete(m.id);
    }
  }
  await tx.done;
}

export async function updateMessage(msg: ChatMessage): Promise<void> {
  const db = await getDB();
  await db.put("messages", msg);
}

export async function clearMessages(chatId: string): Promise<void> {
  const db = await getDB();
  const msgs = await db.getAllFromIndex("messages", "by-chat", chatId);
  const tx = db.transaction("messages", "readwrite");
  for (const m of msgs) await tx.store.delete(m.id);
  await tx.done;
}
