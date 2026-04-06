<div align="center">

# 🧠 NEURALIQ

<<<<<<< HEAD
### ⚡ AI-Powered Collaborative Workspace Platform

> 💬 Chat with AI · 📄 Analyze Documents · 🤝 Collaborate in Real-Time

<br/>

[![Live App](https://img.shields.io/badge/🌐%20Live%20App-Visit%20Now-7c3aed?style=for-the-badge)](https://nerual-ai.vercel.app)
[![Backend](https://img.shields.io/badge/🚀%20Backend%20API-Active-06b6d4?style=for-the-badge)](https://nerual-ai.onrender.com)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

</div>

---

# 🚀 Project Overview

**NEURALIQ** is a full-stack AI workspace platform that combines:

- 🤖 Personal AI Chat  
- 📄 Document Intelligence  
- 🤝 Real-Time Team Collaboration  

👉 All in **one unified system**

---

# 🧠 Core Idea

### ❌ Problem
- AI tools don’t remember history  
- No document understanding  
- No team collaboration  

### ✅ Solution — NEURALIQ

- 🧠 Persistent AI memory  
- 📄 AI-powered document analysis  
- 🤝 Real-time collaborative workspaces  

---

# 🔥 Why NEURALIQ is Different

> ⚡ This is NOT in ChatGPT

- 🧠 AI remembers chats per workspace  
- 🤝 Multi-user AI collaboration  
- 📄 Upload documents → chat with them  
- 📊 Built-in analytics dashboard  
- 💳 Token-based subscription system  

---

# ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 Authentication | Email + Google OAuth |
| 🤖 AI Chat | Persistent conversations |
| 📄 Document AI | Upload & analyze files |
| 🤝 Collaboration | Live workspace chat |
| 📊 Analytics | Token usage tracking |
| 💳 Plans | Free vs Pro system |
| 📤 Export | Chat → PDF / DOCX |
| 🛡 Security | Rate limiting + JWT |

---

# 🏗 System Architecture
Frontend (React)
↓
REST API + WebSocket
↓
Backend (Node.js)
↓
MongoDB + Groq AI

---

# 🛠 Tech Stack

## 🎨 Frontend
- React 19 (Vite)
- Tailwind CSS
- Socket.io-client
- Recharts

## ⚙️ Backend
- Node.js + Express
- MongoDB + Mongoose
- Passport.js (OAuth)
- JWT Authentication
- Multer (Uploads)

## 🤖 AI
- Groq API (LLaMA 3.3 70B)

---

# 📁 Project Structure
neuraliq/
├── backend/
├── frontend/

---

# 🗄 Database Design

### User
- name, email, password  
- googleId (OAuth)  
- plan (free / pro)  
- tokensUsed, documentsProcessed  

### Chat
- messages history  
- title  

### Workspace
- collaborators  
- documents  
- messages  

### Usage
- daily token usage  
- message count  

---

# 📡 API Overview

## Auth
- POST `/signup`
- POST `/login`
- GET `/me`

## Chat
- POST `/`
- GET `/history`
- GET `/stats`

## Files
- POST `/upload`
- POST `/chat`

## Workspace
- Create / Join / Chat / Manage

---

# ⚡ Real-Time (Socket.io)

- Join workspace
- Live chat messages
- Typing indicators
- Online users tracking

---

# 📊 Frontend Pages

- Login  
- Dashboard  
- Chat  
- Workspace  
- Files  
- Team  
- Settings  
- Pricing  

---

# 🤖 AI Configuration

- Model: LLaMA 3.3 (Groq)
- Context-aware chats
- Document Q&A support
- Token-based limits

---

# 🔒 Security

- JWT Authentication  
- bcrypt password hashing  
- Rate limiting  
- Secure file handling  

---

# 🔑 Environment Variables

```env
PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret
GROQ_API_KEY=your_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret

---

# 🚀 Run Locally

## ⚙️ Backend Setup
```bash
cd backend
npm install
npm run dev
🎨 Frontend Setup
cd frontend
npm install
npm run dev
☁️ Deployment
<div align="center">
🧩 Service	🚀 Platform
Frontend	Vercel
Backend	Render
Database	MongoDB Atlas
</div>
🔮 Future Features
💳 Payment Integration
📱 Mobile Application
🧠 AI Memory Engine
📊 Advanced Analytics Dashboard
👨‍💻 Author
<div align="center">
Raju

🎓 MCA @ Christ University
💻 Full Stack Developer | 🤖 AI Enthusiast
=======
### *AI-Powered Collaborative Workspace Platform*

> Built with React 19 · Node.js · MongoDB · Socket.io · Groq LLaMA 3.3 70B

[![Live App](https://img.shields.io/badge/🌐%20Live%20App-nerual--ai.vercel.app-7c3aed?style=flat-square)](https://nerual-ai.vercel.app)
[![Backend](https://img.shields.io/badge/🚀%20Backend%20API-nerual--ai.onrender.com-06b6d4?style=flat-square)](https://nerual-ai.onrender.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

</div>

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Idea & Concept](#2-core-idea--concept)
3. [Key Features](#3-key-features)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture](#5-system-architecture)
6. [Project Structure](#6-project-structure)
7. [Database Design](#7-database-design)
8. [API Reference](#8-api-reference)
9. [Real-Time Events (Socket.io)](#9-real-time-events-socketio)
10. [Frontend Pages](#10-frontend-pages)
11. [AI Model Configuration](#11-ai-model-configuration)
12. [Security & Rate Limiting](#12-security--rate-limiting)
13. [Environment Variables](#13-environment-variables)
14. [Running Locally](#14-running-locally)
15. [Deployment](#15-deployment)
16. [License](#16-license)

---

## 1. Project Overview

**NEURALIQ** is a full-stack web application that combines personal AI chat, document intelligence, and live team collaboration into a single unified platform. It is deployed live at [nerual-ai.vercel.app](https://nerual-ai.vercel.app) with a REST + WebSocket backend hosted on [nerual-ai.onrender.com](https://nerual-ai.onrender.com).

The application serves two types of users:
- **Individual users** who want a smart, persistent AI assistant that remembers their conversation history
- **Teams** who want to collaborate in a shared workspace, upload documents, and ask an AI questions about those documents — all in real time

---

## 2. Core Idea & Concept

### The Problem

Most AI chat tools are isolated — they don't remember your history across sessions, they can't read your documents, and they work for only one person at a time. Team collaboration tools, on the other hand, are powerful but lack built-in AI intelligence.

### The Solution — NEURALIQ

NEURALIQ bridges this gap by combining three powerful ideas into one platform:

**🤖 Personal AI Assistant**
Every user gets their own private AI chat powered by Meta's LLaMA 3.3 70B model (via Groq). Conversations are saved, searchable, renameable, and exportable as PDF or Word documents.

**📄 Document Intelligence**
Users can upload PDF, DOCX, or TXT files. The AI reads the document, provides an instant summary, and then lets the user have an interactive Q&A conversation about the content — like having a conversation with your own files.

**🤝 Real-Time Collaborative Workspaces**
Teams can create shared workspaces, invite members using a unique invite code (e.g., `NEURO-A1B2C`), upload documents together, and chat with the AI collaboratively — all in real time using WebSockets. Every member sees messages, typing indicators, and document updates live.

### Why This Matters

| Traditional Tools | NEURALIQ |
|---|---|
| AI chats are one-time, no memory | Full conversation history saved per session |
| No document understanding | Upload documents, get AI summaries & Q&A |
| AI tools are single-user | Real-time team workspaces with shared AI context |
| Isolated apps for each task | One platform: chat, docs, team, analytics |

---

## 3. Key Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Email/password registration + Google OAuth 2.0 sign-in |
| 🤖 **AI Chat** | Persistent personal AI conversations with full message history |
| 📄 **Document Intelligence** | Upload PDF / DOCX / TXT → AI summarizes and answers questions about it |
| 🤝 **Real-Time Collaboration** | Live workspace chat, typing indicators, and user presence via Socket.io |
| 🏢 **Shared Workspaces** | Create teams, generate a unique invite code, collaborate with teammates |
| 📊 **Usage Analytics** | Dashboard with daily token usage, message count, and documents processed (7-day chart) |
| 💳 **Subscription Tiers** | Free plan (100k token limit) and Pro plan (2,048 token responses, unlimited) |
| 🖼️ **Avatar Upload** | Custom profile picture stored as Base64 in MongoDB |
| 📤 **Chat Export** | Download any conversation as a formatted PDF or Word (.docx) file |
| 🛡️ **Rate Limiting** | Per-route abuse protection for general API, auth, chat, and file uploads |

---

## 4. Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** (Vite) | UI framework and build tool |
| **Tailwind CSS** | Utility-first styling |
| **Socket.io-client** | Real-time WebSocket connection |
| **react-markdown** | Render AI responses as formatted markdown |
| **recharts** | Usage analytics charts on the dashboard |
| **docx + jsPDF** | Generate Word / PDF chat export documents |
| **file-saver** | Trigger browser file downloads |
| **html2canvas** | Capture UI elements as images |

### Backend

| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | HTTP server and REST API |
| **MongoDB + Mongoose** | Database and Object-Document Mapping |
| **Socket.io** | Real-time bi-directional communication |
| **Groq SDK** | LLaMA 3.3 70B inference (chat, summarization, Q&A) |
| **Passport.js** | Local and Google OAuth 2.0 authentication strategies |
| **JWT (jsonwebtoken)** | Stateless API token authentication |
| **bcryptjs** | Password hashing with 12 salt rounds |
| **multer** | File upload handling (memory storage — no disk writes) |
| **pdf-parse / pdfjs-dist** | Extract text from PDF files |
| **mammoth** | Extract text from DOCX files |
| **sharp** | Image processing for avatar uploads |
| **express-rate-limit** | API abuse and brute-force protection |
| **express-session** | Session management for OAuth flow |

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER  (React SPA)                    │
│   Login → Dashboard → Chat / Workspace / Files / Settings   │
│                    Vite + Tailwind CSS                      │
└───────────────────┬────────────────────┬────────────────────┘
                    │  REST API (fetch)  │  WebSocket
                    ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                Express.js Backend (Node.js)                 │
│                                                             │
│  /api/auth         → authRoutes     → authController        │
│  /api/chat         → chatRoutes     → chatController        │
│  /api/files        → fileRoutes     → fileController        │
│  /api/workspace    → workspaceRoutes → workspaceController  │
│  /api/subscription → subscriptionRoutes                     │
│  /auth/google      → Passport OAuth 2.0 redirect            │
│                                                             │
│  Socket.io server ──────────→ workspace rooms               │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
  ┌────────────────────┐       ┌─────────────────────────┐
  │      MongoDB       │       │        Groq API          │
  │    (Mongoose)      │       │    LLaMA 3.3 70B         │
  │                    │       │                          │
  │  User              │       │  • Personal AI Chat      │
  │  Chat              │       │  • Document Summarize    │
  │  Workspace         │       │  • Document Q&A          │
  │  Usage             │       │  • Workspace AI Chat     │
  └────────────────────┘       └─────────────────────────┘
```

---

## 6. Project Structure

```
neuraliq/
│
├── backend/
│   ├── config/
│   │   ├── db.js                    # MongoDB connection setup
│   │   └── passport.js              # Passport Local + Google OAuth strategies
│   │
│   ├── controllers/
│   │   ├── authController.js        # Signup, login, getMe, avatar upload, name update
│   │   ├── chatController.js        # AI chat, history, usage stats, rename/delete
│   │   ├── fileController.js        # Upload & summarize docs, PDF Q&A chat
│   │   ├── subscriptionController.js # Upgrade to Pro
│   │   └── workspaceController.js   # CRUD workspaces, join by code, doc management
│   │
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT protect() — validates Bearer token
│   │
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   ├── Chat.js                  # Personal chat sessions
│   │   ├── Usage.js                 # Daily usage records per user
│   │   └── Workspace.js             # Workspace schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js            # /api/auth/*
│   │   ├── chatRoutes.js            # /api/chat/*
│   │   ├── fileRoutes.js            # /api/files/*
│   │   ├── googleAuth.js            # /auth/google OAuth redirects
│   │   ├── subscriptionRoutes.js    # /api/subscription/*
│   │   └── workspaceRoutes.js       # /api/workspace/*
│   │
│   ├── server.js                    # Express app, Socket.io, rate limiters, keep-alive
│   ├── render.yaml                  # Render.com deployment config
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx            # Login & signup + Google OAuth button
    │   │   ├── Dashboard.jsx        # Stats overview and recent activity
    │   │   ├── Chat.jsx             # Personal AI chat with history sidebar
    │   │   ├── Workspace.jsx        # Live collaborative workspace
    │   │   ├── Files.jsx            # Document upload, summary & Q&A
    │   │   ├── Team.jsx             # Manage collaborators and share codes
    │   │   ├── Settings.jsx         # Profile, avatar, plan info
    │   │   └── Pricing.jsx          # Free vs Pro comparison and upgrade
    │   │
    │   ├── components/
    │   │   └── Sidebar.jsx          # Shared navigation sidebar
    │   │
    │   ├── hooks/
    │   │   └── useSocket.js         # Custom Socket.io lifecycle hook
    │   │
    │   ├── api.js                   # All fetch() API calls (auth, chat, workspace, files)
    │   ├── App.jsx                  # Root: auth state, page-based router
    │   └── main.jsx                 # ReactDOM entry point
    │
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── vercel.json                  # Rewrites all routes to / (SPA support)
    └── package.json
```

---

## 7. Database Design

### User
| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Unique, lowercase |
| `password` | String | Bcrypt hashed (optional for Google OAuth users) |
| `googleId` | String | Sparse unique — Google OAuth only |
| `avatar` | String | Base64 encoded image data URL |
| `plan` | String | `'free'` or `'pro'` |
| `tokensUsed` | Number | Cumulative Groq token counter |
| `documentsProcessed` | Number | Cumulative document upload counter |

### Chat
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User |
| `title` | String | Auto-generated from first 40 chars of user message |
| `messages` | Array | `{ role, content, createdAt }` |

### Workspace
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User (workspace owner) |
| `name` | String | Workspace display name |
| `shareCode` | String | Unique invite code e.g. `NEURO-A1B2C` |
| `collaborators` | Array | `{ userId, name, email, joinedAt }` |
| `documents` | Array | `{ fileName, extractedText, uploadedBy, uploadedAt }` |
| `messages` | Array | `{ role, content, userName, createdAt }` |

### Usage
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId | Ref: User |
| `date` | String | Format: `"YYYY-MM-DD"` |
| `tokensUsed` | Number | Tokens consumed that day |
| `messagesCount` | Number | Messages sent that day |
| `documentsCount` | Number | Documents processed that day |

> **Index:** `{ userId, date }` — unique composite, one record per user per day.

---

## 8. API Reference

### Auth — `/api/auth`
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/signup` | ❌ | Register with name, email, password |
| `POST` | `/login` | ❌ | Login and receive JWT token |
| `GET` | `/me` | ✅ | Get current user profile |
| `POST` | `/avatar` | ✅ | Upload profile picture (JPG/PNG/WEBP, max 5MB) |
| `PATCH` | `/name` | ✅ | Update display name |

### Google OAuth — `/auth`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/google` | Redirect to Google consent screen |
| `GET` | `/google/callback` | OAuth callback — redirects to frontend with `?token=...` |

### Chat — `/api/chat`
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/` | ✅ | Send message to AI, returns reply + chatId |
| `GET` | `/history` | ✅ | Get last 20 chat session titles |
| `GET` | `/:chatId` | ✅ | Get full message history for a specific chat |
| `GET` | `/stats` | ✅ | Usage statistics for last 7 days |
| `PATCH` | `/:chatId/rename` | ✅ | Rename a chat session |
| `DELETE` | `/:chatId` | ✅ | Delete a chat session |

### Files — `/api/files`
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/upload` | ✅ | Upload PDF/DOCX/TXT → returns AI-generated summary |
| `POST` | `/chat` | ✅ | Ask AI a question about the uploaded document content |

### Workspace — `/api/workspace`
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | Get all workspaces (owned and joined) |
| `POST` | `/` | ✅ | Create a new workspace |
| `POST` | `/join` | ✅ | Join a workspace using a `shareCode` |
| `POST` | `/:id/documents` | ✅ | Upload a document to a workspace |
| `POST` | `/:id/chat` | ✅ | Chat with AI using all workspace documents as context |
| `PATCH` | `/:id/rename` | ✅ | Rename a workspace |
| `DELETE` | `/:id/documents/:docIndex` | ✅ | Remove a document from a workspace |
| `DELETE` | `/:id/collaborator/:collabIndex` | ✅ | Remove a collaborator |
| `DELETE` | `/:id` | ✅ | Delete entire workspace (owner only) |

### Subscription — `/api/subscription`
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/upgrade` | ✅ | Upgrade user plan to Pro |

---

## 9. Real-Time Events (Socket.io)

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join_workspace` | `{ workspaceId, userName }` | Join a workspace room |
| `workspace_message` | `{ workspaceId, message, userName, role }` | Broadcast a chat message to the room |
| `ai_response` | `{ workspaceId, message, role }` | Broadcast AI reply to all members |
| `typing` | `{ workspaceId, userName }` | Notify others that this user is typing |
| `stop_typing` | `{ workspaceId }` | Notify others that typing has stopped |
| `document_added` | `{ workspaceId, fileName, userName }` | Notify room that a document was uploaded |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `users_online` | `[{ id, name }]` | Updated list of online users in the workspace |
| `new_message` | `{ message, userName, role }` | A new message broadcast to the room |
| `user_joined` | `{ userName }` | A new user joined the workspace |
| `user_left` | `{ userName }` | A user left the workspace |
| `user_typing` | `{ userName }` | Another user is currently typing |
| `user_stop_typing` | — | The typing indicator has stopped |
| `workspace_updated` | `{ type, fileName, userName }` | A document was added notification |

---

## 10. Frontend Pages

| Page | Route | Description |
|---|---|---|
| **Login** | `/` (unauthenticated) | Email/password login & signup, Google OAuth sign-in |
| **Dashboard** | `Dashboard` | Overview cards: tokens used, chats, documents; 7-day analytics chart |
| **Chat** | `Chat` | Personal AI chat with history sidebar, rename/delete sessions, export as PDF or DOCX |
| **Workspace** | `Workspace` | Select or create a workspace, upload shared documents, real-time collaborative AI chat |
| **Files** | `Files` | Upload PDF/DOCX/TXT → AI-generated summary; interactive Q&A about the document |
| **Team** | `Team` | View workspace details, share invite code, manage or remove collaborators |
| **Settings** | `Settings` | Update display name, upload avatar, view plan and token usage |
| **Pricing** | `Pricing` | Free vs Pro feature comparison table with upgrade button |

> Navigation is managed by `App.jsx` using a state-based router (`activePage` state). All pages share the `Sidebar` component.

---

## 11. AI Model Configuration

| Setting | Value |
|---|---|
| **Model** | `llama-3.3-70b-versatile` (served via Groq) |
| **Temperature — Chat** | `0.7` |
| **Temperature — Summarization** | `0.5` |
| **Personal chat context window** | Last 20 messages sent as conversation history |
| **Workspace chat context** | Last 10 messages + all uploaded document text (up to 12,000 chars) |
| **File Q&A context** | Document text up to 6,000 chars injected as system prompt |
| **Max tokens — Free plan** | 1,024 tokens per response |
| **Max tokens — Pro plan** | 2,048 tokens per response |
| **Workspace AI max tokens** | Always 2,048 tokens |

---

## 12. Security & Rate Limiting

### Rate Limiting

| Limiter | Window | Max Requests | Applied To |
|---|---|---|---|
| **General** | 15 minutes | 100 requests | All `/api/*` routes |
| **Auth** | 15 minutes | 10 requests | `/api/auth/login`, `/api/auth/signup` |
| **Chat** | 1 minute | 30 requests | `/api/chat` |
| **Upload** | 1 hour | 20 requests | `/api/files` |

### Security Measures

- **Password Hashing** — bcryptjs with 12 salt rounds
- **JWT Tokens** — Signed with `JWT_SECRET`, expire in `JWT_EXPIRES_IN` (default 7 days)
- **Auth Middleware** — `protect()` validates the `Authorization: Bearer <token>` header on all protected routes
- **CORS** — Strict origin allowlist (Vercel frontend URL + localhost only)
- **File Validation** — Multer `fileFilter` rejects unsupported file types before any processing begins
- **Memory Storage** — Multer uses `memoryStorage()` so no uploaded files are ever written to disk on the server
- **Google OAuth** — Token is returned via URL query param, then immediately removed with `window.history.replaceState`
- **Token Limits** — Free-tier users are automatically blocked from sending more chats when they exceed 100,000 tokens

---

## 13. Environment Variables

### Backend (`.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/neuraliq
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
GROQ_API_KEY=gsk_...
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=https://nerual-ai.onrender.com/auth/google/callback
FRONTEND_URL=https://nerual-ai.vercel.app
```

### Frontend (`.env.local` — development)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Frontend (Vercel Project Settings — production)

```env
VITE_API_URL=https://nerual-ai.onrender.com/api
VITE_SOCKET_URL=https://nerual-ai.onrender.com
```

---

## 14. Running Locally

### Prerequisites

- Node.js 18 or higher
- A MongoDB Atlas cluster (or local MongoDB instance)
- A [Groq API key](https://console.groq.com/)
- *(Optional)* Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Raju-CS8/Nerual.ai.git
cd neuraliq
```

### Step 2 — Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder using the variables listed in [Section 13](#13-environment-variables), then run:

```bash
npm run dev
# ✅ Server starts at http://localhost:5000
```

### Step 3 — Set Up the Frontend

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Then run:

```bash
npm run dev
# ✅ App starts at http://localhost:5173
```

---

## 15. Deployment

### Backend — [Render.com](https://render.com)

| Setting | Value |
|---|---|
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Config File** | `backend/render.yaml` |
| **Keep-Alive** | The server self-pings every 14 minutes to prevent Render free-tier spin-down |

### Frontend — [Vercel](https://vercel.com)

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **SPA Support** | `vercel.json` rewrites all routes to `/` |
| **Environment Variables** | Set `VITE_API_URL` and `VITE_SOCKET_URL` in Vercel project settings |

---

## 16. License

This project is licensed under the **ISC License**.

---

<div align="center">

Built by **Raju** — [Live Demo →](https://nerual-ai.vercel.app)
>>>>>>> f354939 (Add Jarvis-style AI with user-aware responses)

</div>
