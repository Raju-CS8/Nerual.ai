<div align="center">

# 🧠 NEURALIQ

### *AI as a System, not a Feature*

> Persistent AI memory · Document intelligence · Real-time collaboration
> Built as a **stateful intelligence layer over stateless infrastructure**

<br/>

[![Live App](https://img.shields.io/badge/🌐%20Live%20App-Explore-7c3aed?style=for-the-badge)](https://nerual-ai.vercel.app)
[![Backend](https://img.shields.io/badge/🚀%20API-Live-06b6d4?style=for-the-badge)](https://nerual-ai.onrender.com)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

</div>

---

# ⚡ What This Actually Is

This is **not**:

* another ChatGPT wrapper
* a CRUD SaaS dashboard

This is:

> A **multi-user AI system** where context, state, and collaboration are treated as first-class primitives.

---

# 🧠 The Problem Space

Most tools today are fragmented:

| Category      | Limitation               |
| ------------- | ------------------------ |
| AI Chat       | Stateless, no continuity |
| Docs          | Static, no interaction   |
| Collaboration | No intelligence layer    |

---

# 🚀 The Idea

> Combine **memory + documents + collaboration + AI** into one system.

---

# 🧩 System Design Philosophy

### 1. Stateless Infrastructure → Stateful Experience

* API remains stateless (JWT)
* State reconstructed dynamically:

  * chat history
  * workspace messages
  * document context

---

### 2. Context is the Real Database

Instead of vector DB (for now):

* Context is built at runtime
* Injected into model calls
* Optimized per endpoint

---

### 3. AI is a Shared Layer

* Not user-specific only
* Workspace = shared AI context
* Multiple users → same intelligence state

---

# 🏗 Architecture Overview

```
User (Browser)
   │
   ├── REST (data)
   ├── WebSocket (real-time)
   │
   ▼
Node.js (Orchestration Layer)
   │
   ├── Controllers (logic)
   ├── Socket.io (events)
   ├── Middleware (auth, limits)
   │
   ▼
MongoDB (state)
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

# ⚙️ Core System Flows

## 🧠 AI Chat Flow

```
User Input
  ↓
Fetch Chat History
  ↓
Inject Context
  ↓
Groq API Call
  ↓
Store Response
```

---

## 📄 Document Intelligence Flow

```
Upload File
  ↓
Parse (PDF/DOCX/TXT)
  ↓
Extract Text
  ↓
Inject into Prompt
  ↓
AI Response
```

---

## 🤝 Workspace Collaboration Flow

```
User joins workspace
  ↓
Socket room subscription
  ↓
Real-time message broadcast
  ↓
Shared AI context updates
```

---

# 🔥 What Makes This Non-Trivial

* Multi-user shared AI context
* Hybrid REST + WebSocket system
* Dynamic context injection
* Token-based system constraints
* Real-time + AI consistency

---

# ⚖️ Engineering Trade-offs

| Decision          | Why            | Trade-off          |
| ----------------- | -------------- | ------------------ |
| No vector DB      | Simpler system | Less scalable docs |
| Context injection | Faster         | Token limits       |
| Socket.io rooms   | Real-time UX   | Scaling complexity |
| JWT auth          | Stateless APIs | Recompute context  |

---

# 📊 Observability & Constraints

* Rate limiting (per route)
* Token usage tracking
* Daily usage aggregation
* Plan-based restrictions

---

# 🛠 Tech Stack (Signal Only)

### Frontend

* React 19 + Vite
* Tailwind
* Socket.io

### Backend

* Node.js + Express
* MongoDB (Mongoose)
* Socket.io
* JWT + Passport

### AI

* Groq (LLaMA 3.3 70B)

---

# 📁 Project Structure

```
neuraliq/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
│
└── frontend/
    ├── pages/
    ├── components/
    ├── hooks/
    └── api.js
```

---

# 🔒 Security Layer

* JWT authentication
* bcrypt hashing
* CORS restriction
* file validation
* rate limiting

---

# 🔑 Environment

```
PORT=5000
MONGO_URI=...
JWT_SECRET=...
GROQ_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

# 🧪 Run Locally

```
git clone https://github.com/Raju-CS8/Nerual.ai.git
cd neuraliq
```

### Backend

```
cd backend
npm install
npm run dev
```

### Frontend

```
cd frontend
npm install
npm run dev
```

---

# ☁️ Deployment

| Layer    | Platform      |
| -------- | ------------- |
| Frontend | Vercel        |
| Backend  | Render        |
| Database | MongoDB Atlas |

---

# 🔮 Where This Can Go

* Vector DB (semantic retrieval)
* Streaming responses
* Redis scaling (Socket.io)
* Background workers
* Long-term AI memory

---

# 👨‍💻 Author

**Raju**
MCA @ Christ University

> Focused on building systems — not just features

---

<div align="center">

⭐ If this project made you think differently, consider starring it

</div>
