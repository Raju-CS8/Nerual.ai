# NEURALIQ - AI-Powered Collaborative Workspace

<<<<<<< Updated upstream
# 🧠 NEURALIQ

### ⚡ AI-Powered Collaborative Workspace System

> **Persistent AI Memory · Document Intelligence · Real-Time Collaboration**

<br/>

[![Live App](https://img.shields.io/badge/🌐%20Live%20App-Explore-7c3aed?style=for-the-badge)](https://nerual-ai.vercel.app)
[![Backend](https://img.shields.io/badge/🚀%20Backend%20API-Live-06b6d4?style=for-the-badge)](https://nerual-ai.onrender.com)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

</div>

---

# ⚡ QUICK SNAPSHOT

| Category      | Details                                       |
| ------------- | --------------------------------------------- |
| 🎯 Problem    | AI tools lack memory, docs, and collaboration |
| 💡 Solution   | Unified AI + Docs + Teams system              |
| 🧠 Core Idea  | AI as a **shared state layer**                |
| ⚙️ Stack      | React · Node · MongoDB · Socket.io · Groq     |
| 🔥 Complexity | Real-time + AI context + state reconstruction |

---

# 🚀 PROJECT OVERVIEW

**NEURALIQ** is a full-stack AI system that integrates:

* 🤖 Persistent AI Chat
* 📄 Document Intelligence (PDF/DOCX/TXT)
* 🤝 Real-Time Multi-user Collaboration

🔗 Live → https://nerual-ai.vercel.app
🔗 Backend → https://nerual-ai.onrender.com

---

# 🧠 CORE IDEA (NOT GENERIC)

### ❌ Problem Space

| System        | Limitation      |
| ------------- | --------------- |
| AI Chat       | Stateless       |
| Docs          | Static          |
| Collaboration | No intelligence |

---

### ✅ Solution

> Build a system where **AI becomes shared, persistent, and contextual**

---

# 🔥 WHY THIS IS DIFFERENT

* AI memory per user AND workspace
* Multi-user shared AI context
* Document-aware conversations
* Token-based system constraints
* Hybrid real-time + REST architecture

---

# 🧠 SYSTEM THINKING (IMPORTANT SIGNAL)

```id="ht3s9l"
AI Context = Chat History + Workspace Messages + Documents
```

* No single source of truth
* Context is dynamically reconstructed
* Every AI call is state-aware

---

# 🏗 SYSTEM ARCHITECTURE

```id="d1n0l8"
BROWSER (React SPA)
   │
   ├── REST API (data)
   ├── WebSocket (real-time)
   │
   ▼
Express.js Backend
   │
   ├── Controllers (business logic)
   ├── Middleware (auth, limits)
   ├── Socket.io (real-time sync)
   │
   ▼
MongoDB (state layer)
   │
   ├── Users
   ├── Chats
   ├── Workspaces
   └── Usage
   │
   ▼
Groq API (LLaMA 3.3)
```

---

# ⚙️ CORE SYSTEM FLOWS

## 🧠 Chat Pipeline

```id="7r29qz"
User Input → Fetch History → Inject Context → AI → Store → UI
```

## 📄 Document Pipeline

```id="g1p2md"
Upload → Parse → Extract → Inject → AI Response
```

## 🤝 Collaboration Pipeline

```id="4z0u2x"
Join Room → Broadcast → Sync → Shared AI Context
```

---

# ⚖️ ENGINEERING TRADE-OFFS

| Decision          | Why            | Trade-off                     |
| ----------------- | -------------- | ----------------------------- |
| No vector DB      | Simplicity     | Limited scalability           |
| Context injection | Fast           | Token constraints             |
| Socket.io rooms   | Real-time UX   | Horizontal scaling complexity |
| JWT auth          | Stateless APIs | Recompute state               |

---

# 🔥 KEY FEATURES (FULL)

| Feature                  | Description                     |
| ------------------------ | ------------------------------- |
| 🔐 Authentication        | Email/password + Google OAuth   |
| 🤖 AI Chat               | Persistent conversation history |
| 📄 Document Intelligence | Upload + summarize + Q&A        |
| 🤝 Collaboration         | Real-time workspace chat        |
| 🏢 Workspaces            | Invite via share code           |
| 📊 Analytics             | Usage dashboard                 |
| 💳 Plans                 | Free vs Pro system              |
| 🖼 Avatar                | Profile upload                  |
| 📤 Export                | PDF / DOCX                      |
| 🛡 Rate Limiting         | Multi-layer protection          |

---

# 🛠 TECH STACK (FULL DETAIL)

### 🎨 Frontend

* React 19 (Vite)
* Tailwind CSS
* Socket.io-client
* react-markdown
* recharts
* jsPDF + docx
* html2canvas
* file-saver

---

### ⚙️ Backend

* Node.js + Express 5
* MongoDB + Mongoose
* Socket.io
* Passport.js (OAuth)
* JWT Authentication
* bcryptjs
* multer (memory storage)
* pdf-parse / pdfjs-dist
* mammoth
* sharp
* express-rate-limit
* express-session

---

### 🤖 AI Layer

* Groq API
* LLaMA 3.3 70B
* Context-aware prompt injection

---

# 📁 PROJECT STRUCTURE

```id="n1h0jq"
neuraliq/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
│
└── frontend/
    ├── pages/
    ├── components/
    ├── hooks/
    └── api.js
```

---

# 🗄 DATABASE DESIGN

### Collections

* Users
* Chats
* Workspaces
* Usage

### Key Concepts

* Chat history drives AI context
* Workspace stores shared state
* Usage enforces limits

---

# 📡 API SYSTEM

### Auth

* POST `/signup`
* POST `/login`
* GET `/me`

### Chat

* POST `/`
* GET `/history`
* GET `/stats`

### Files

* POST `/upload`
* POST `/chat`

### Workspace

* Create / Join / Chat / Manage

---

# ⚡ REAL-TIME SYSTEM

* Socket.io rooms per workspace
* Typing indicators
* Live message sync
* Online users tracking

---

# 🔒 SECURITY + LIMITING

### Rate Limits

* General → 100 / 15 min
* Auth → 10 / 15 min
* Chat → 30 / min
* Upload → 20 / hour

### Security

* JWT auth
* bcrypt hashing
* CORS restriction
* File validation
* Token usage limits

---

# 🔑 ENVIRONMENT

```env id="d0q1x2"
PORT=5000
MONGO_URI=...
JWT_SECRET=...
GROQ_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

# 🧪 RUN LOCALLY

```bash id="5m4j8f"
git clone https://github.com/Raju-CS8/Nerual.ai.git
cd neuraliq
```

### Backend

```bash id="3m7g2k"
=======
NEURALIQ is a premium, real-time multiplayer AI collaboration platform. It allows individuals and teams to build isolated workspaces, upload and analyze documents, engage in context-aware conversations with LLMs, and collaborate with team members in real-time through WebSockets.

---

## 🎯 Project Objectives & Goals

The core mission of **NEURALIQ** is to bridge the gap between individual AI chat interfaces and team collaboration workspaces by providing:
1. **Democratized AI Assistance:** Seamless integration of high-performance LLMs (such as LLaMA-3.3-70B via Groq SDK) for all users with smart rate limits and tiering.
2. **Context-Aware Analytics:** Enabling users to parse complex documents (PDFs, DOCX, TXT) and immediately query, summarize, or extract actionable items from them.
3. **Real-time Team Synchronization:** Rooms-based workspace environments where teammates see other online members, typing indicators, new messages, and document updates instantaneously without manual refreshes.
4. **Transparent Resource Auditing:** Visual dashboard charts representing real-time API token consumption, remaining tokens, active days, and document counters to regulate usage.
5. **Secure and Flexible Authentication:** Seamless transition between local email/password validation and Google OAuth single sign-on (SSO).

---

## 🚀 Core Features

### 1. User Dashboard & Usage Analytics
* **Token Usage Metrics:** Interactive gauges showing total tokens used versus the free tier limit (100,000 tokens), including calculated percentages and real-time warnings (yellow warning banner at 80% usage, red blocking banner at 100% usage).
* **Usage Overview Chart:** A custom SVG area and line graph displaying daily token usage over the last 7 days (populated dynamically from the database).
* **Document Progress Circle:** Animated radial completion widget highlighting the total count of documents processed.
* **Profile Summary:** Quick details on user status (Free vs. Pro plan), remaining token counts, active usage days, and a redirect trigger to upgrade plans.

### 2. General AI Chat Engine
* **Context Preservation:** Chat memory utilizing previous message blocks (up to 20 messages for Free, and extended contexts for Pro) to preserve user-AI discussion history.
* **Chat Management:** Dynamic sidebar to create a "New Chat", rename existing chats in-place, delete historical chats, and view relative timestamps ("5m ago", "2d ago").
* **Rich Text Rendering:** Integration of markdown formatting supporting headers, bulleted/numbered lists, bold styling, and inline/block code syntax highlighting.
* **Document Exports:** Options to export the entire chat transcript directly as a professionally formatted **PDF** (using `jspdf` layout configurations) or **Word Document (.docx)** (using `docx` generation styles).

### 3. File Summarization & Q&A Panel
* **Drag-and-Drop Uploader:** Intuitive dashboard drop zone accepting PDF, DOCX, and TXT files up to 50MB.
* **Text Extraction Engine:** Server-side parsing of raw file buffers to extract text (processing up to 8,000 characters).
* **Automated Document Summaries:** Generates structured document overviews on upload containing an *Executive Summary*, *Key Points*, and *Action Items*.
* **Document Chat:** Interactive interface to ask questions specific to the uploaded file context, extract bullet points, or generate flashcards (Q&A format).

### 4. Collaborative Workspaces
* **Multi-User Rooms:** Isolated workspaces with a unique share code (e.g., `NEURO-XXXXX`) allowing coworkers to join and gain access.
* **Real-time Socket Notifications:** Instant synchronization of user activity (system messages for user joined, user left, document added), chat history updates, and messages.
* **Presence Indicators:** Live count and avatar icons of currently active users in the workspace.
* **Typing Indicators:** Real-time feedback showing when other workspace collaborators are actively writing.
* **Workspace Chat & QA:** Workspace-wide messaging thread with the ability to trigger AI prompts on uploaded workspace documents.

### 5. Team Management & Activity Feed
* **Teammate Directory:** Aggregated grid of all collaborators across all workspaces owned by or shared with the user.
* **Teammate Role & Status Controllers:** Ability to assign custom roles (*Admin, Developer, Designer, Analyst, Manager*) and update status indicators (*Online, Busy, Offline*).
* **Collaborator Eviction:** Allows workspace owners to delete/remove collaborators from workspaces they own.
* **Workspace Task Graph:** Bar graph mapping the distribution of loaded documents across different workspaces.
* **Live Activity Feed:** A scrolling real-time log capturing recent actions, detailing who uploaded what document, under which workspace, and when.

---

## 🛠️ Technology Stack

### Frontend Architecture
* **Core Framework:** React 19 (Component-based architecture utilizing React hooks like `useState`, `useEffect`, `useCallback`, and `useRef`).
* **Build System:** Vite (Fast dev server and optimized production packaging).
* **Styling & Theme:** Tailwind CSS v3 (Responsive glassmorphism UI, dark mode palette, custom keyframe micro-animations like pulse-glows and page transitions).
* **WebSockets Client:** `socket.io-client` (Bi-directional workspace room connection).
* **Data Visualization:** Custom SVG line/area graphics and radial circle loaders for dependency-free, high-performance rendering.
* **File Generators:** 
  * `jspdf` for compiling transcripts into multi-page PDF documents.
  * `docx` & `file-saver` for packing and downloading Microsoft Word files.
* **Markdown Parser:** `react-markdown` for structured, code-highlighted AI text output.

### Backend Infrastructure
* **Runtime & Web Server:** Node.js with Express (REST API routing, validation middleware, and global error handling).
* **Database & ORM:** MongoDB with Mongoose (Document-based schema models mapping Users, Workspaces, Chats, and Daily Usage Logs).
* **AI Integration:** `groq-sdk` connecting to the `llama-3.3-70b-versatile` LLM model.
* **WebSockets Server:** `socket.io` running alongside the HTTP server to handle room-based connection logic and presence management.
* **Authentication & SSO:** Passport.js with Google OAuth 2.0 (`passport-google-oauth20`) and custom JWT (`jsonwebtoken`) route verification.
* **Security & Rate Limiting:**
  * `bcryptjs` for secure password hashing.
  * `express-rate-limit` namespace limiting (auth signups/logins capped at 10 requests per 15 min; chats at 30 requests per min; file uploads at 20 requests per hour).
  * CORS origin filters checking against verified local development and production URLs.
* **File Upload & Parsing:**
  * `multer` for memory buffer file handling.
  * `pdf-parse` / `pdfjs-dist` (legacy build) for PDF parsing.
  * `mammoth` for DOCX raw text extraction.
  * `sharp` for asset scaling.

---

## 🔄 Request & Process Flow Architecture

### 1. Authentication & Session Flow
```
[Client App]                              [Backend Server]                         [Google OAuth / Database]
     |                                           |                                             |
     |---- 1. Submit email/password ------------>|                                             |
     |                                           |---- 2. Query Email & Hash Verification ---->|
     |                                           |<--- 3. Return user profile -----------------|
     |                                           |                                             |
     |                                           |---- 4. Generate & Sign JWT (JWT_SECRET) --->|
     |<--- 5. Return JSON (User + Token) --------|                                             |
     |                                           |                                             |
     |===== GOOGLE OAUTH FLOW ===================|                                             |
     |                                           |                                             |
     |---- 6. GET /auth/google ----------------->|---- 7. Redirect to Google Consent --------->|
     |                                           |                                             |
     |                                           |<--- 8. Callback with Profile Data ----------|
     |                                           |---- 9. Create/Find User & Generate JWT ---->|
     |<--- 10. Redirect with Token in URL -------|                                             |
     |     (dashboard?token=xyz)                 |                                             |
```

### 2. File Upload & AI Summarization Flow
```
[Client App]                                [Backend API]                          [Groq LLaMA Service]
     |                                            |                                         |
     |---- 1. POST /api/files/upload (Form) ----->|                                         |
     |        (Includes file in Multer buffer)    |                                         |
     |                                            |---- 2. Parse file extensions ---------->|
     |                                            |     (pdfjs / mammoth text extractor)    |
     |                                            |                                         |
     |                                            |---- 3. Slice to first 8,000 chars ----->|
     |                                            |                                         |
     |                                            |---- 4. Send summarize prompt to Groq -->|
     |                                            |<--- 5. Return markdown summary ---------|
     |                                            |                                         |
     |                                            |---- 6. Increment DB processed counter ->|
     |<--- 7. Return extracted text + summary ----|                                         |
```

### 3. Real-time Workspace Socket Flow
```
[Client User A]                        [Socket.io Gateway]                       [Client User B]
       |                                       |                                        |
       |--- 1. emit('join_workspace', ID) ---->|                                        |
       |                                       |--- 2. Join room context (socket.join)  |
       |                                       |--- 3. emit('user_joined', User A) ---->|
       |                                       |<-- 4. emit('users_online', updated) ---|
       |<-- 5. emit('users_online', updated) --|                                        |
       |                                       |                                        |
       |--- 6. emit('typing') ---------------->|                                        |
       |                                       |--- 7. emit('user_typing', User A) ---->|
       |                                       |                                        |
       |--- 8. emit('workspace_message') ----->|                                        |
       |                                       |--- 9. emit('new_message', User A) ---->|
       |                                       |                                        |
       |=== AI ANSWERING SYNC =================|                                        |
       |                                       |                                        |
       |--- 10. POST /api/workspace/chat ----->| (Hits Groq API, saves message in DB)   |
       |<-- 11. Returns AI Reply json ---------|                                        |
       |--- 12. emit('ai_response', Reply) --->|                                        |
       |                                       |--- 13. emit('new_message', AI Reply) ->|
```

---

## 📈 Development Status

### ✅ Completed
1. **Security & Session Layer:**
   * Double-tier auth validation (Standard Login/Signup + Google OAuth redirect loop).
   * Request throttling via customizable rate limiters mapped to route categories.
   * Session verification via custom JWT header middlewares.
   * Profile photo updating (base64 buffer conversion) and profile name edits.
2. **Global AI Chat Engine:**
   * Full chat panel featuring auto-scroll, markdown parsing, and conversation histories.
   * Multi-page PDF layout generation via `jspdf` and Word Document packet delivery via `docx`.
   * Dynamic sidebar managing active chat deletions and updates.
3. **Analytics Dashboard:**
   * Plan warning/blocking indicators monitoring the 100,000 free token boundary.
   * Custom line/area charting showing token activity logs dynamically fetched from user usage schemas.
4. **Document Processing Engine:**
   * Backend parser extracting raw data from `.pdf`, `.docx`, and `.txt` files.
   * Summarization agent that formats executive summaries and action items.
   * Isolated Q&A chat specific to the uploaded file text buffer.
5. **Real-time Infrastructure:**
   * WebSocket room binding based on workspace IDs.
   * Collaborative indicators (online members indicator, real-time typing listeners, workspace update synchronization).
6. **Team Panel:**
   * Teammate listing based on workspace collaborators.
   * Role management options, live upload feed parsing, and document distribution charts.

### 🚧 In Building Stage
1. **Global Socket State Syncing:**
   * Refining Socket connections inside page navigation (cleaning up and re-instantiating socket connections cleanly during workspace switches).
2. **UI Micro-interactions:**
   * Polishing CSS drag-over styles and workspace sidebar renaming indicators.

### 📋 To Be Completed (Next Steps & Roadmap)
1. **CRITICAL BUG FIX - Workspace AI Context Ingestion:**
   * *Issue:* The workspace controller (`workspaceController.js` inside `chatWithWorkspace`) processes and compiles the documents loaded into the workspace into `combinedContext`, but does not inject this context into the system prompt messages sent to the Groq LLM API.
   * *Resolution:* Modify the system prompt initialization to append the document context text when query calls are dispatched.
2. **Integrated Payment Gateway:**
   * Currently, upgrading to the Pro plan triggers a mock endpoint (`/api/subscription/upgrade`) which directly overrides the user plan property in the database. Integrate Stripe or Razorpay to handle secure transactions and webhooks.
3. **Document Chunking & Vector Databases (RAG):**
   * Currently, document uploads only slice the first 8,000 characters of a file. Implement a Retrieval-Augmented Generation (RAG) system using vector embeddings (e.g., Pinecone, ChromaDB, or pgvector) and text chunking to allow querying of files larger than 100+ pages.
4. **Collaborative Text Editing:**
   * Integrate a collaborative rich-text editor (e.g., Quill or TipTap powered by Yjs) into workspaces so teammates can write document summaries and drafts together in real-time.
5. **Role-Based Permissions Enforcement:**
   * Currently, collaborator roles (Admin, Developer, Designer, Analyst, Manager) are cosmetic fields stored in the UI. Enforce permissions on the backend to restrict file deletion, workspace deletions, and invites to Workspace Admins/Owners.

---

## ⚙️ Getting Started

### Environment Variable Setup

Create a `.env` file inside the `backend` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/neuraliq
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
GROQ_API_KEY=gsk_your_groq_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

Create a `.env` file inside the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Installation & Execution

#### 1. Start the Backend Server
```bash
>>>>>>> Stashed changes
cd backend
npm install
npm run dev
```

<<<<<<< Updated upstream
### Frontend

```bash id="9a2f6h"
=======
#### 2. Start the Frontend Server
```bash
>>>>>>> Stashed changes
cd frontend
npm install
npm run dev
```
<<<<<<< Updated upstream

---

# ☁️ DEPLOYMENT

| Layer    | Platform      |
| -------- | ------------- |
| Frontend | Vercel        |
| Backend  | Render        |
| Database | MongoDB Atlas |

---

# 🔮 FUTURE WORK

* Vector DB integration
* Streaming responses
* Redis scaling
* Background job queues
* Long-term memory

---

# 👨‍💻 AUTHOR

**Raju**
MCA @ Christ University

> Focused on building systems with real-world constraints

---

<div align="center">

⭐ Star this repo if you found it valuable

</div>
=======
>>>>>>> Stashed changes
