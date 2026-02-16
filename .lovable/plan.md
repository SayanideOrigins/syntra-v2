

# SYNTRA — Phase 1 Implementation Plan

## Overview
A mobile-first WhatsApp-style AI orchestration app with **real AI responses** powered by Lovable AI (via Supabase Edge Functions). All chat data stored locally in IndexedDB. Each created AI entity has its own system prompt and isolated conversation history. In group chats, AIs respond one-by-one in random order — **no AI can respond twice in the same round cycle**.

---

## 1. Backend — Lovable Cloud + Edge Function
- Enable **Lovable Cloud** to get a Supabase backend
- Create a **`chat` edge function** that:
  - Receives: system prompt, conversation history, and user message
  - Calls Lovable AI Gateway (`google/gemini-3-flash-preview`)
  - Streams the response back via SSE for real-time token rendering
  - Handles rate limit (429) and payment (402) errors gracefully
- The `LOVABLE_API_KEY` is auto-provisioned — no user configuration needed

## 2. Home Screen
- **Top header** with "SYNTRA" branding in a dark theme
- **Search bar** — filters AIs and Groups by name in real-time
- **Scrollable chat list**: profile picture, name, description preview, last message, timestamp
- **Floating "+" button** (bottom-right) to create a new AI
- Menu option in header to create Groups

## 3. Create AI Flow
- Modal form: AI Name (required), Profile Picture upload, Short Description, Job/Role, Custom Prompt, Personality Notes
- On save: AI gets a unique ID and appears in chat list immediately
- The custom prompt becomes the system prompt sent to the AI gateway — this gives each AI its unique personality

## 4. Private AI Chat (Real AI Responses)
- Each AI chat sends its specific **system prompt** and **isolated conversation history** to the edge function
- Responses stream in token-by-token with a typing indicator
- Messages persist locally in IndexedDB between sessions
- User bubbles right, AI bubbles left, with timestamps
- Auto-scroll to newest message

## 5. Group Creation
- Select multiple existing AIs via checkboxes
- Fill group details: Name, Description, Profile Picture, Custom Group Prompt
- Group appears in chat list alongside individual AIs

## 6. Group Chat — Round System (No Duplicate Responses)
- User sends a message → a new **round cycle** begins
- All group member AIs are placed into a shuffled queue
- AIs respond **one at a time** in random order from that queue
- **Once an AI has responded in a round, it is removed from the queue and cannot respond again in that cycle**
- Each AI's turn sends to the edge function: its system prompt + group prompt + full group conversation context
- **Typing indicator** shows which AI is currently responding
- The round ends when every AI in the group has responded exactly once
- A new round begins only when the user sends another message
- All responses appended to group chat history in order

## 7. Local Database (IndexedDB)
- **AI Table**: id, name, description, job, custom_prompt, profile_picture, created_at
- **Groups Table**: id, name, description, custom_prompt, profile_picture, member AI IDs
- **Chat History Table**: id, chat_id, chat_type, sender_type, sender_name, message, timestamp
- Each AI's history isolated by `chat_id`

## 8. Search System
- Real-time filtering of AIs and Groups by name
- Empty state with "No results found"

## 9. UI/UX
- Mobile-first dark theme (WhatsApp/Telegram inspired)
- Smooth transitions via React Router
- Distinct message bubbles with sender name labels in group chats
- Streaming text animation as AI responds
- Toast notifications for errors

## 10. Architecture for Future Expansion
- AI service layer abstracted for easy model/provider swaps
- Modular components for mentions, cooldowns, status indicators later
- Round system logic isolated for future customization (turn order rules, cooldowns, etc.)

