# SYNTRA v2 — Full Upgrade Plan

## Overview

Transform the existing Syntra prototype into a dynamic multi-agent conversation engine with turn control, interruption handling, response modes, editable timeline, autonomous discussion, and advanced UI interactions.

This is a large upgrade broken into **6 implementation phases**, each building on the previous one. Given the scope, it is recommended to implement these phases sequentially across multiple messages.

There will not be any kind of Authentication in the app as this is a one user app. User will get 3 seconds of splash screen that contains the logo and name of this web-app and enter the site straight in.

---

## Phase 1: Data Model + State Management Upgrades

### 1a. Extend Types (`src/lib/types.ts`)

Add new fields and types:

- **AIEntity** gains: `responseMode` (per-AI mode override), `isMuted`, `isPaused`
- **Group** gains: `timerOffset` (ms delay between AI turns), `autonomousEnabled`, `mutedMemberIds`, `pausedMemberIds`
- **ChatMessage** gains: `roundNumber`, `isInterruption`, `isAutonomous`, `isEdited`
- New type: `ResponseMode = "regular" | "humanely" | "professional" | "custom"`
- New type: `ConversationSettings` with fields for global response mode, markdown toggle, autonomous toggle, timer offset, active responder IDs
- New type: `GroupState` tracking round count, active/muted/paused participants, autonomous flag, timer offset

### 1b. Upgrade IndexedDB Schema (`src/lib/db.ts`)

- Bump DB version to 2 with migration logic
- Add new DB functions: `deleteMessagesAfter(chatId, timestamp)`, `updateMessage(msg)`, `updateGroup(group)`, `updateAI(ai)`
- Support the new fields on existing stores

### 1c. Create Settings Store

- New file `src/lib/settings.ts` — manages global `ConversationSettings` in a dedicated IndexedDB object store or localStorage
- Default: regular mode, markdown on, autonomous off, timer offset 1500ms

---

## Phase 2: AI Prompt Architecture v2 (`src/lib/ai-service.ts`)

### 2a. New Prompt Builder

Replace `buildSystemPrompt` with a 4-block prompt architecture:

- **Block 1 (Identity Lock):** AI name, role, custom objective, other participants list, identity constraints (cannot speak for others, first person only)
- **Block 2 (Structured Context):** Current topic, new user input, formatted prior responses as bullet points
- **Block 3 (Task Directive):** Instructions to respond as the AI, engage critically, no narration
- **Block 4 (Response Rules):** No repetition, move discussion forward, no meta commentary, no system prompt leaks, response mode enforcement

### 2b. Response Mode Injection

- Append mode-specific instructions to the system prompt:
  - **Regular:** "Respond with structured detail, markdown allowed, emotionally neutral"
  - **Humanely:** "Keep replies short, conversational, expressive, limit markdown"
  - **Professional:** "Be concise, direct, formal, no emojis"
  - **Custom:** Use the AI's custom prompt as-is and follow the Humanely prompt as well.
- Length control: "Matching or decreasing response length to user input and needs is optional but good if done. Compress for short questions. Expand only if necessary."

### 2c. Context Assembly

- New function `assembleContext()` that builds the full message payload per turn:
  - First user message of thread
  - Chronological previous AI replies (as structured bullets)
  - Latest user message
  - Interruption message (if any)
  - Conversation metadata (round number, active members, muted list, timer offset, autonomous flag)

---

## Phase 3: Conversation Engine Upgrades (`src/pages/ChatPage.tsx`)

### 3a. Round System with Metadata

- Track `roundNumber` state, incrementing per user message
- Tag each AI message with its round number
- Enforce no-duplicate rule (existing) plus respect muted/paused members

### 3b. Interruption Handling

- If user sends a message while AIs are still responding (mid-round):
  - Mark it as `isInterruption: true`
  - Do NOT reset the round — continue with remaining AIs
  - The next AI's context includes the interruption message alongside the original thread
  - After the interrupted round completes, the interruption starts a new round

### 3c. Editable Timeline Reset

- When user edits a past message:
  - Delete all messages with timestamp > edited message's timestamp from IndexedDB
  - Update the edited message in DB
  - Reload messages and restart conversation from that point
  - Trigger a new round with fresh context

### 3d. Timer Offset

- Configurable delay (default 1500ms) between each AI's turn in group chat
- Applied as a `setTimeout` before triggering the next AI's stream call

### 3e. Autonomous Discussion

- After all AIs respond in a round, if autonomous mode is enabled:
  - Check if the last few responses indicate the topic needs more exploration (simple heuristic: responses reference unresolved points)
  - If yes, trigger another round of AI-to-AI discussion (no user message, flag `isAutonomous: true`)
  - Stop after max 3 autonomous rounds or when topic appears resolved
  - Each autonomous round uses the same context assembly with an added directive: "Continue only if you have new value to add"

---

## Phase 4: UI Enhancements

### 4a. Message Hover Controls (`src/components/MessageBubble.tsx`)

- On hover over user messages: show Edit (pencil) and Copy (clipboard) icons
- On hover over AI messages: show Copy icon only
- Edit button triggers inline edit mode: message text becomes an input, submit re-triggers timeline reset
- Copy button copies message text to clipboard with toast confirmation

### 4b. Markdown Toggle

- Install `react-markdown` dependency
- Render AI messages through ReactMarkdown when markdown is enabled
- When disabled: strip markdown and render plain text
- Controlled by global settings toggle

### 4c. Clickable AI Names in Group Chat

- AI sender name in group messages becomes a clickable link
- Click opens a floating profile card (popover) showing: name, role, description, personality, response mode
- Clicking the message body area navigates to private chat with that AI

### 4d. Chat Header Interactions

- **Private chat header:** Clicking opens an AI customization drawer/panel where user can edit name, job, custom prompt, personality, per-AI response mode
- **Group chat header:** Clicking opens group management panel with:
  - Add AI (from existing AIs)
  - Remove AI
  - Mute/Unmute AI (muted AIs skip their turn)
  - Pause/Unpause AI
  - Edit group custom prompt
  - Timer offset slider
  - Autonomous discussion toggle

### 4e. Settings Page

- New route `/settings`
- Accessible from home screen header (gear icon)
- Contains:
  - Global response mode selector (radio group)
  - Per-AI mode overrides (list of AIs with dropdowns)
  - Markdown rendering toggle
  - Autonomous discussion toggle
  - Default timer offset slider
  - Active responder selection (checkboxes)

---

## Phase 5: Edge Function Update (`supabase/functions/chat/index.ts`)

- No structural changes needed — the edge function already accepts `systemPrompt` and `messages` generically
- All prompt engineering changes happen client-side in `ai-service.ts`
- The edge function remains a passthrough to the AI gateway

---

## Phase 6: Markdown Stripping + Group Intelligence

### 6a. Markdown Compatibility Mode

- Utility function `stripMarkdown(text: string): string` that removes `**`, `#`, ```, `-` , etc.
- Applied when markdown toggle is off, before rendering

### 6b. Group Intelligence Rules (Prompt-Level)

- Already handled in Block 4 response rules: "Do not repeat previous AI points", "Add unique insight", "Stay in character"
- Additional enforcement: include a summary of key points already made by other AIs in the context

---

## New Files to Create


| File                                  | Purpose                                |
| ------------------------------------- | -------------------------------------- |
| `src/lib/settings.ts`                 | Global settings store (localStorage)   |
| `src/lib/prompt-builder.ts`           | 4-block prompt architecture builder    |
| `src/lib/context-assembler.ts`        | Per-turn context assembly logic        |
| `src/lib/markdown-utils.ts`           | Markdown stripping utility             |
| `src/components/AIProfileCard.tsx`    | Floating AI profile popover            |
| `src/components/AICustomizePanel.tsx` | AI edit drawer for private chat header |
| `src/components/GroupManagePanel.tsx` | Group management drawer                |
| `src/pages/SettingsPage.tsx`          | Global settings page                   |


## Files to Modify


| File                                  | Changes                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `src/lib/types.ts`                    | Extended types with new fields                                              |
| `src/lib/db.ts`                       | DB v2 migration, new operations                                             |
| `src/lib/ai-service.ts`               | Use new prompt builder + context assembler                                  |
| `src/pages/ChatPage.tsx`              | Interruption, timeline reset, timer offset, autonomous, header interactions |
| `src/components/MessageBubble.tsx`    | Hover controls, markdown rendering, clickable AI names                      |
| `src/components/CreateGroupModal.tsx` | Timer offset + autonomous toggle fields                                     |
| `src/pages/Index.tsx`                 | Settings gear icon in header                                                |
| `src/App.tsx`                         | Add /settings route                                                         |


## Dependencies to Add

- `react-markdown` — for markdown rendering in messages

---

## Implementation Order

Due to the scale of this upgrade, implementation will proceed in this order:

1. Types + DB schema + Settings store (foundation)
2. Prompt builder + Context assembler (AI brain)
3. ChatPage conversation engine (interruptions, timeline, timer, autonomous)
4. MessageBubble + UI enhancements (hover, copy, edit, markdown, profile cards)
5. Header panels (AI customize, group manage)
6. Settings page + routing

Each phase builds on the previous and can be tested incrementally.