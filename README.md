<div align="center">

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
cd backend
npm install
npm run dev
```

### Frontend

```bash id="9a2f6h"
cd frontend
npm install
npm run dev
```

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
