# AI Chat Specialization & Restructuring

The goal is to transition the AI Chat from a generic, single-view interface into a specialized, hierarchical "Workspace" that feels premium and tailored to the student's specific curriculum.

## Current vs Proposed
- **Current:** All chat sessions are mixed in one sidebar. The user selects the subject (e.g., IGCSE Physics) via small pills before sending a message. It feels generic.
- **Proposed:** A Discord-like two-tier navigation. The user first creates/selects a "Section" (e.g., Cambridge A-Level Biology). Once inside a section, the entire UI themes itself to that subject, and they can manage multiple specific chat threads within that section.

## Open Questions
- **Backend Prompts:** Are we able to modify the backend `/api/ask` route to accept and utilize a more specialized system prompt based on the chosen board/level/subject? (I will handle the frontend styling and parameters, just confirming if you'd like backend changes too).
- **Persistence of Empty Sections:** If a user creates a section but hasn't sent a message yet, we need to remember they added it. Since you mentioned the current Supabase setup is sufficient (no `sections` table), we can save the user's "Active Sections" in `localStorage` or derive them from their existing `chat_sessions` + local state. Does this approach sound good?

## Proposed Changes

### 1. UI & Layout Restructuring (Discord-Style Navigation)
We will rebuild `src/pages/AiChat.tsx` to feature a dual-sidebar layout:
- **Outer Sidebar (Sections):** A sleek, icon-based vertical rail on the far left showing the user's active subject sections (e.g., ⚛️ for Physics, 🌿 for Bio).
- **Inner Sidebar (Chats):** Shows the chat history *filtered* to the currently active section.
- **Main Chat Area:** The chat interface, which will adapt its theme and welcome message based on the active section.

### 2. Section Creation Flow
- We will add a "Add Section" (`+`) button in the outer sidebar.
- Clicking it opens a beautiful, animated modal where the user selects:
  - **Board:** Cambridge (locked for now, but UI will show it as a premium badge)
  - **Level:** IGCSE or A-Level
  - **Subject:** Physics, Chemistry, Biology
- Confirming will add the section to their outer sidebar, creating a specialized workspace.

### 3. Specialization & Theming (Making it less boring)
To make the AI feel specialized and "alive", we will introduce dynamic visual themes:
- **Physics:** Deep navy/indigo accents, subtle particle/atom background patterns. AI persona: "Physics Tutor".
- **Chemistry:** Vibrant teal/cyan accents, molecular background motifs. AI persona: "Chemistry Tutor".
- **Biology:** Emerald/emerald-green accents, organic/leafy background elements. AI persona: "Biology Tutor".
- **Welcome Screen:** Instead of a generic "Ask me anything", the empty state will boldly declare the specific curriculum, e.g., "Welcome to Cambridge IGCSE Biology. Ask me about cell structures, enzymes, or ecology..."
- **Micro-animations:** Smooth transitions when switching sections, glowing effects on active section icons, and premium UI touches (glassmorphism on sidebars).

### 4. Code Modifications
- **`src/pages/AiChat.tsx`**: Major refactor to implement the two-tier layout, state management for `activeSection`, and the Section Creation Modal.
- **`src/pages/AiChat.css`**: Add CSS variables and classes for the dynamic subject themes (colors, backgrounds).

## Verification Plan
### Manual Verification
- Test creating a new section (e.g., Cambridge A-Level Chemistry).
- Verify the outer sidebar updates and the inner sidebar is initially empty.
- Verify the main chat area themes correctly (colors, icons, placeholders change to Chemistry).
- Send a message and ensure the `chat_session` is created with the correct `subject` field (`A_Chem`).
- Switch to another section (e.g., IGCSE Physics) and ensure the chat list and themes update accordingly, isolating the chats.
