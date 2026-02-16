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
    dbPromise = openDB<SyntraDB>("syntra", 1, {
      upgrade(db) {
        const aiStore = db.createObjectStore("ais", { keyPath: "id" });
        aiStore.createIndex("by-name", "name");

        const groupStore = db.createObjectStore("groups", { keyPath: "id" });
        groupStore.createIndex("by-name", "name");

        const msgStore = db.createObjectStore("messages", { keyPath: "id" });
        msgStore.createIndex("by-chat", "chatId");
        msgStore.createIndex("by-timestamp", ["chatId", "timestamp"]);
      },
    });
  }
  return dbPromise;
}

// AI operations
export async function getAllAIs(): Promise<AIEntity[]> {
  const db = await getDB();
  return db.getAll("ais");
}

export async function getAI(id: string): Promise<AIEntity | undefined> {
  const db = await getDB();
  return db.get("ais", id);
}

export async function saveAI(ai: AIEntity): Promise<void> {
  const db = await getDB();
  await db.put("ais", ai);
}

export async function deleteAI(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("ais", id);
}

// Group operations
export async function getAllGroups(): Promise<Group[]> {
  const db = await getDB();
  return db.getAll("groups");
}

export async function getGroup(id: string): Promise<Group | undefined> {
  const db = await getDB();
  return db.get("groups", id);
}

export async function saveGroup(group: Group): Promise<void> {
  const db = await getDB();
  await db.put("groups", group);
}

// Message operations
export async function getMessages(chatId: string): Promise<ChatMessage[]> {
  const db = await getDB();
  const msgs = await db.getAllFromIndex("messages", "by-chat", chatId);
  return msgs.sort((a, b) => a.timestamp - b.timestamp);
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
