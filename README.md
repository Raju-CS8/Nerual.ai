<div align="center">

# 🧠 NEURALIQ
### AI-Powered Real-Time Collaborative Workspace

*Your team thinks here..*

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-nerual--ai.vercel.app-7c3aed?style=for-the-badge&logoColor=white)](https://nerual-ai.vercel.app)
[![Backend](https://img.shields.io/badge/🚀%20Backend%20API-Live%20on%20Render-06b6d4?style=for-the-badge)](https://nerual-ai.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Raju--CS8%2FNerual.ai-181717?style=for-the-badge&logo=github)](https://github.com/Raju-CS8/Nerual.ai)
[![Tests](https://img.shields.io/badge/Tests-30%2F30%20Passing-10b981?style=for-the-badge)](https://github.com/Raju-CS8/Nerual.ai)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📌 What Is NEURALIQ?

Most AI tools are **stateless, solo, and dumb about your documents.**

NEURALIQ fixes all three — it's a full-stack SaaS platform where teams collaborate in shared AI workspaces, upload documents for intelligent Q&A, and chat with an AI that responds like Jarvis — always knowing who is speaking, what documents are loaded, and what was discussed before.

> Built with React 19, Node.js, MongoDB, Socket.io, Groq LLaMA 3.3-70B, TipTap + Yjs, and RAG-style document chunking.

---

## ⚡ Quick Snapshot

| Category | Details |
|---|---|
| 🎯 Problem | AI tools lack memory, document awareness, and real-time collaboration |
| 💡 Solution | Unified AI + Documents + Team workspace in one platform |
| 🧠 AI Model | LLaMA 3.3-70B via Groq SDK |
| ⚙️ Stack | React · Node.js · MongoDB · Socket.io · Yjs · Groq |
| 🔥 Key Complexity | Real-time sync + RAG document context + identity-aware AI responses |
| 🧪 Tests | 30/30 Jest tests passing |
| 🚀 Deployed | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## 🚀 Core Features

### 1. 🤖 Jarvis-Style AI — Knows Who Is Speaking
The AI always responds to **whoever is currently sending the message**, not the last person who spoke. Even in shared workspaces with chat history from multiple users, the AI identifies the active user via JWT and addresses only them — like a real third person in the room.

### 2. 📄 RAG-Based Document Intelligence
Documents are no longer limited to 8,000 characters. Uploaded files are split into overlapping chunks with a keyword-scoring retrieval engine that fetches only the most relevant sections per query — enabling accurate answers across 100+ page documents without a vector database.

```
Upload PDF → Extract Full Text → Chunk with Overlap → Score by Query Keywords → Inject Top Chunks → Groq LLM
```

### 3. 🔴 Real-Time Collaborative Workspaces
Teams join isolated rooms via a share code (`NEURO-XXXXX`). Everything syncs instantly via Socket.io — messages, document uploads, typing indicators, presence avatars, and AI responses.

### 4. ✏️ Collaborative Rich Text Editor
A TipTap + Yjs CRDT-powered editor inside every workspace. Multiple users can write notes simultaneously — changes sync in real-time across all connected clients via a custom Yjs WebSocket server.

### 5. 🔐 Role-Based Access Control (Backend Enforced)
Roles are not cosmetic — they are enforced on every backend route:

| Role | Permissions |
|---|---|
| Owner | Full access — delete workspace, rename, manage all |
| Admin | Delete documents, remove collaborators |
| Developer / Designer / Analyst / Manager | Chat, upload documents |
| Viewer | Read-only — chat only |

### 6. 📊 Usage Analytics Dashboard
Live token consumption tracking with a 7-day SVG area chart, document counter, plan status (Free/Pro), and automatic warnings at 80% and 100% token usage.

### 7. 🔑 Dual Authentication
Email/password with bcrypt hashing + Google OAuth 2.0 SSO via Passport.js. JWT tokens are verified on every protected route with automatic expiry handling on the frontend.

### 8. 👥 Team Management Panel
Aggregated teammate directory across all workspaces. Owners can assign roles, update status (Online/Busy/Offline), and remove collaborators. All changes persist to MongoDB.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (React 19 SPA)                   │
│                                                             │
│  Pages: Dashboard · Chat · Files · Workspace · Team        │
│  Real-time: Socket.io Client                               │
│  Collab Editor: TipTap + Yjs WebsocketProvider            │
└──────────────────┬──────────────────┬───────────────────────┘
                   │ REST API          │ WebSocket
                   ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXPRESS.JS BACKEND (Node.js)               │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Controllers │  │  Middleware  │  │   Socket.io      │  │
│  │ auth        │  │ JWT protect  │  │   Workspace rooms│  │
│  │ chat        │  │ roleMiddle   │  │   Typing events  │  │
│  │ workspace   │  │ rateLimiter  │  │   Presence sync  │  │
│  │ files       │  │ CORS         │  └──────────────────┘  │
│  └─────────────┘  └──────────────┘                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Yjs WebSocket Server (/yjs)            │   │
│  │         CRDT sync for collaborative editor         │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
┌─────────────────┐  ┌────────────────────┐
│  MongoDB Atlas  │  │    Groq API        │
│                 │  │  LLaMA 3.3-70B     │
│  Users          │  │                    │
│  Chats          │  │  RAG context       │
│  Workspaces     │  │  injected per      │
│  Usage logs     │  │  query             │
└─────────────────┘  └────────────────────┘
```

---

## 🔄 Key System Flows

### Authentication Flow
```
Email/Password ──► bcrypt verify ──► JWT sign ──► Return token
Google OAuth   ──► Passport.js  ──► Find/Create user ──► JWT ──► Redirect with token
```

### RAG Document Flow
```
File Upload
    │
    ▼
Extract full text (pdf-parse / mammoth)
    │
    ▼
chunkText() — split into 1500-char chunks with 200-char overlap
    │
    ▼
Store chunks[] in MongoDB alongside extractedText
    │
    ▼ (on each chat message)
retrieveRelevantChunks() — keyword score each chunk against query
    │
    ▼
Top 3 chunks per document injected into Groq system prompt
    │
    ▼
LLaMA 3.3-70B answers with full document context
```

### Real-Time Workspace Flow
```
User A joins ──► socket.join(workspaceId) ──► broadcast users_online
User A types ──► emit('typing') ──► broadcast user_typing to room
User A sends ──► POST /workspace/chat ──► Groq API ──► save to DB
                      │
                      ▼
              emit('ai_response') ──► broadcast to all room members
```

### Collaborative Editor Flow
```
User opens Notes tab
    │
    ▼
new Y.Doc() + WebsocketProvider connects to /yjs/workspace-{id}
    │
    ▼
TipTap editor binds to Y.Doc (CRDT)
    │
    ▼
Every keystroke syncs to all connected clients via Yjs protocol
    │
    ▼
Colored cursors show each user's position in real-time
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite | Core framework + fast builds |
| Tailwind CSS v3 | Glassmorphism dark UI + animations |
| Socket.io Client | Real-time workspace sync |
| TipTap v2 | Rich text collaborative editor |
| Yjs + y-websocket | CRDT real-time sync protocol |
| react-markdown | Markdown rendering for AI responses |
| jspdf + docx | Chat export to PDF and Word |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Document database + schemas |
| Socket.io | WebSocket room management |
| Groq SDK (LLaMA 3.3-70B) | AI inference engine |
| Passport.js + Google OAuth | SSO authentication |
| JWT (jsonwebtoken) | Stateless route protection |
| bcryptjs | Password hashing |
| multer | Memory-buffer file uploads |
| pdf-parse + mammoth | PDF and DOCX text extraction |
| express-rate-limit | Route-level rate limiting |
| Jest + Supertest | Backend testing (30/30 passing) |

---

## 🧪 Test Coverage

```bash
npm test
```

```
Test Suites: 4 passed, 4 total
Tests:       30 passed, 30 total

├── auth.test.js          — Signup, login, duplicate email, missing fields
├── workspace.test.js     — Create, get, rename, delete + auth guards
├── chunking.test.js      — RAG chunk splitting and keyword retrieval (unit)
└── roleMiddleware.test.js — Owner / Admin / Viewer / Stranger enforcement
```

---

## 📁 Project Structure

```
neuraliq/
├── backend/
│   ├── __tests__/
│   │   ├── auth.test.js
│   │   ├── workspace.test.js
│   │   ├── chunking.test.js
│   │   └── roleMiddleware.test.js
│   ├── config/
│   │   ├── db.js
│   │   └── passport.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── fileController.js
│   │   └── workspaceController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Chat.js
│   │   ├── Workspace.js
│   │   └── Usage.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── fileRoutes.js
│   │   ├── workspaceRoutes.js
│   │   └── googleAuth.js
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Sidebar.jsx
        │   └── CollaborativeEditor.jsx
        ├── hooks/
        │   └── useSocket.js
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── Chat.jsx
        │   ├── Files.jsx
        │   ├── Workspace.jsx
        │   ├── Team.jsx
        │   ├── Pricing.jsx
        │   └── Settings.jsx
        ├── App.jsx
        └── api.js
```

---

## 🗄️ Database Design

### Collections & Key Fields

```
Users
├── name, email, password (bcrypt)
├── googleId, avatar (base64)
├── plan (free | pro)
├── tokensUsed, documentsProcessed
└── timestamps

Workspaces
├── userId (owner ref)
├── name, shareCode (NEURO-XXXXX)
├── collaborators[]
│   ├── userId, name, email
│   ├── role (Admin|Developer|Designer|Analyst|Manager|Viewer)
│   └── status (Online|Offline|Busy)
├── documents[]
│   ├── fileName, extractedText
│   ├── chunks[] (RAG)
│   └── uploadedBy, uploadedAt
└── messages[]
    ├── role (user|assistant)
    ├── content, userName
    └── createdAt

Chats
├── userId, title
└── messages[] (role, content)

Usage
├── userId, date
├── tokensUsed, messagesCount
└── documentsCount
```

---

## 📡 API Reference

### Auth Routes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/avatar` | Upload profile picture |
| PATCH | `/api/auth/name` | Update display name |
| GET | `/auth/google` | Google OAuth redirect |

### Chat Routes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | Send message to AI |
| GET | `/api/chat/history` | Get all chats |
| GET | `/api/chat/:id` | Get single chat |
| GET | `/api/chat/stats` | Get 7-day usage stats |
| PATCH | `/api/chat/:id/rename` | Rename chat |
| DELETE | `/api/chat/:id` | Delete chat |

### File Routes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/files/upload` | Upload + summarize document |
| POST | `/api/files/chat` | Chat about uploaded document |

### Workspace Routes
| Method | Endpoint | Auth Required |
|---|---|---|
| GET | `/api/workspace` | Any member |
| POST | `/api/workspace` | Authenticated |
| POST | `/api/workspace/join` | Authenticated |
| POST | `/api/workspace/:id/chat` | Member |
| POST | `/api/workspace/:id/documents` | Member |
| PATCH | `/api/workspace/:id/rename` | Owner only |
| DELETE | `/api/workspace/:id` | Owner only |
| DELETE | `/api/workspace/:id/documents/:index` | Admin or Owner |
| DELETE | `/api/workspace/:id/collaborator/:index` | Admin or Owner |
| PATCH | `/api/workspace/:id/collaborator/:collabId/role` | Admin or Owner |
| DELETE | `/api/workspace/:id/leave` | Member |
| DELETE | `/api/workspace/:id/messages` | Member |

---

## ☁️ Deployment

| Layer | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://nerual-ai.vercel.app |
| Backend | Render | https://nerual-ai.onrender.com |
| Database | MongoDB Atlas | Managed cluster |
| AI | Groq Cloud | LLaMA 3.3-70B |

---

## ⚙️ Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/Raju-CS8/Nerual.ai.git
cd neuraliq
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/neuraliq
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
GROQ_API_KEY=gsk_your_groq_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

### 4. Run Tests
```bash
cd backend
npm test
```

---

## ⚖️ Engineering Decisions

| Decision | Reason | Trade-off |
|---|---|---|
| Keyword-based RAG (no vector DB) | Zero infra cost, fast setup | Less semantic accuracy vs embeddings |
| Yjs CRDT over OT | Conflict-free merging, battle-tested | Slightly higher memory per session |
| Socket.io rooms over WebRTC | Simpler server-side control | Server as relay (not P2P) |
| JWT over sessions | Stateless, scales horizontally | Token revocation requires blacklist |
| Groq over OpenAI | 10x faster inference, free tier | Fewer model options |
| MongoDB over PostgreSQL | Flexible document schema | Less relational integrity |

---

## 👨‍💻 Author

**Raju**
MCA Student · CHRIST (Deemed to be University), Bengaluru
Specializing in Full-Stack Development & AI/ML Systems

[![GitHub](https://img.shields.io/badge/GitHub-Raju--CS8-181717?style=flat&logo=github)](https://github.com/Raju-CS8)

---

<div align="center">

**⭐ Star this repo if you found it valuable**

*Built with purpose — not just to learn, but to ship.*

</div>
