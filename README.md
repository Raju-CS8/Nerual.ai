<div align="center">

# 🧠 NEURALIQ

### AI-Native Collaborative Workspace System

> A full-stack system that integrates persistent AI memory, document intelligence, and real-time multi-user collaboration over a shared context.

[Live App](https://nerual-ai.vercel.app) • [Backend API](https://nerual-ai.onrender.com)

</div>

---

# 1. Why This Project Exists

Most AI tools today are **stateless, single-user, and context-fragmented**.

* Chat systems → no long-term memory
* Document tools → no interaction loop
* Collaboration tools → no intelligence layer

This project explores:

> **What if AI becomes a shared system layer instead of a feature?**

---

# 2. System Goals

* Maintain **persistent conversational state**
* Enable **AI over user-owned documents**
* Support **real-time multi-user interaction over shared context**
* Enforce **usage constraints (tokens, rate limits, plans)**
* Keep system **stateless at API layer but stateful at data layer**

---

# 3. Core Architecture (Mental Model)

This is not just a CRUD app.

It is a **3-layer system**:

```
User Interaction Layer (React SPA)
↓
State Orchestration Layer (Node + Socket.io)
↓
Intelligence + Persistence Layer (Groq + MongoDB)
```

---

# 4. Key Engineering Decisions

## 4.1 Stateless API + Stateful Experience

* APIs are stateless (JWT-based)
* State is reconstructed using:

  * Chat history
  * Workspace messages
  * Document context

👉 Trade-off:

* Simpler scaling
* Higher compute cost per request

---

## 4.2 Context Window Optimization

AI calls are constrained by token limits.

So system injects:

* Personal chat → last 20 messages
* Workspace → last 10 + documents
* File Q&A → compressed document chunks

👉 Trade-off:

* Reduced hallucination vs limited long memory

---

## 4.3 Real-Time Collaboration via Rooms

Each workspace = Socket.io room

* Events are broadcasted to all members
* No polling → reduces latency
* Presence tracking handled in-memory

👉 Trade-off:

* Requires horizontal scaling strategy (future: Redis adapter)

---

## 4.4 Document Processing Pipeline

```
Upload → Parse → Extract Text → Inject into AI Context
```

Supports:

* PDF (pdf-parse)
* DOCX (mammoth)
* TXT

👉 Decision:

* No vector DB (intentional)
* Uses **prompt injection approach**

Trade-off:

* Faster
* Less scalable for large documents

---

## 4.5 Usage Tracking System

Every request updates:

* tokensUsed
* messagesCount
* documentsProcessed

Stored per day (`Usage` collection)

👉 Enables:

* rate enforcement
* analytics
* subscription gating

---

# 5. System Architecture

```
Client (React + Vite)
│
├── REST (fetch)
├── WebSocket (Socket.io)
│
▼
Node.js (Express)
│
├── Auth Layer (JWT + Passport)
├── API Layer (Controllers)
├── Real-time Layer (Socket.io)
│
├── MongoDB (State)
│     ├── Users
│     ├── Chats
│     ├── Workspaces
│     └── Usage
│
└── Groq API (LLaMA 3.3)
```

---

# 6. What Makes This System Non-Trivial

### 1. Multi-user AI context synchronization

* All users share the same AI state in workspace

### 2. Hybrid interaction model

* REST + WebSocket coexist

### 3. Dynamic context injection

* Context differs per endpoint

### 4. Rate limiting at multiple levels

* General / Auth / Chat / Upload

### 5. Soft real-time system

* Not eventually consistent, not strictly real-time

---

# 7. Constraints & Limitations

* No vector database → limits document scale
* Memory is session-based → not lifelong
* Socket.io not horizontally scaled yet
* Token limits restrict long conversations

---

# 8. Future Engineering Work

* Redis adapter for Socket scaling
* Vector DB (FAISS / Pinecone) for retrieval
* Streaming AI responses
* Background job queue (BullMQ)
* Chunked document indexing

---

# 9. Tech Stack (Only What Matters)

### Frontend

* React 19 + Vite
* Tailwind
* Socket.io client

### Backend

* Node.js + Express
* MongoDB + Mongoose
* Socket.io
* JWT + Passport

### AI

* Groq API (LLaMA 3.3 70B)

---

# 10. Running the System

```bash
git clone https://github.com/Raju-CS8/Nerual.ai.git
cd neuraliq
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 11. Environment Variables

```env
PORT=5000
MONGO_URI=...
JWT_SECRET=...
GROQ_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

# 12. Author

**Raju**
MCA @ Christ University

Focused on:

* Full-stack systems
* AI integration
* Real-time architectures

---

# 13. Final Note

This project is not about UI.

It is about exploring:

> How AI behaves when treated as a system primitive, not a feature.
