<div align="center">

# 🧠 NEURALIQ
### Enterprise-Grade Real-Time Collaborative Workspace & Context-Aware AI

*Where Teams, Documents, and AI Converge.*

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-nerual--ai.vercel.app-7c3aed?style=for-the-badge&logoColor=white)](https://nerual-ai.vercel.app)
[![Backend](https://img.shields.io/badge/🚀%20Backend%20API-Live%20on%20Render-06b6d4?style=for-the-badge)](https://nerual-ai.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Raju--CS8%2FNerual.ai-181717?style=for-the-badge&logo=github)](https://github.com/Raju-CS8/Nerual.ai)
[![Tests](https://img.shields.io/badge/Tests-30%2F30%20Passing-10b981?style=for-the-badge)](https://github.com/Raju-CS8/Nerual.ai)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Table of Contents
1. [Overview & Project Objectives](#-overview--project-objectives)
2. [System Architecture](#-system-architecture)
3. [Key System Flows](#-key-system-flows)
4. [Technology Stack](#-technology-stack)
5. [Project Directory Structure](#-project-directory-structure)
6. [Database Schema Design](#-database-schema-design)
7. [API Route Reference](#-api-route-reference)
8. [Detailed Feature Breakdown](#-detailed-feature-breakdown)
9. [Local Installation & Configuration Guide](#-local-installation--configuration-guide)
10. [Test Suite & Quality Assurance](#-test-suite--quality-assurance)
11. [Deployment Configuration](#-deployment-configuration)
12. [Real-World Concurrency & Scaling Performance Audit](#-real-world-concurrency--scaling-performance-audit)

---

## 🎯 Overview & Project Objectives

### The Problem
Traditional AI tools operate in isolated silos. They are **stateless** (forgetting context between sessions), **solo** (designed for a single user typing in a prompt box), and **context-blind** (unable to ingest large team documents without hitting narrow token window constraints). When teams try to collaborate, they end up copy-pasting code, documents, and prompt results across Slack, Google Docs, and ChatGPT.

### The NEURALIQ Solution
**NEURALIQ** is an all-in-one collaborative SaaS platform that unifies real-time document workspaces with a persistent, context-aware AI team assistant. The platform enables multi-user collaboration in shared rooms where teammate presence, cooperative editing, document uploads, and AI prompt replies sync in real time. 

### Core Project Objectives
*   **Context-Aware Identity (Jarvis Mode):** Train the AI engine to remain aware of who is speaking in a multi-user workspace using JSON Web Token (JWT) identity mapping, ensuring responses are addressed strictly to the active user.
*   **Serverless-Style RAG Engine:** Process large-scale PDF, DOCX, and TXT files using an optimized, in-memory chunking and keyword-scoring keyword index system. This bypasses the need for costly vector database infrastructure.
*   **Frictionless Real-Time Sync:** Synchronize cursor presence, keystrokes, and text formatting instantly across all clients using Conflict-Free Replicated Data Types (CRDTs).
*   **Robust Access Enforcement:** Guard critical operations with multi-level backend role validation, going beyond client-side view hiding to protect enterprise data.
*   **Operational Transparency:** Provide active users with clear token-consumption visualization and rate-limit guardrails to prevent API abuse.

---

## 🏗️ System Architecture

NEURALIQ uses a decoupled client-server architecture built on a high-concurrency event-driven stack:

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

### 1. Unified Authentication Flow
The system supports both standard credential logins and Google Single Sign-On (SSO):
```
[Email/Password] ────► bcrypt.compare() ───► JWT Sign (7d) ───► Return Client Token
[Google OAuth]   ────► Passport.js ───────► Find/Create User ──► JWT ──► Redirect Client
```

### 2. Overlapping RAG Document Processing Pipeline
To process large documents without hitting token limits, NEURALIQ uses a custom chunking pipeline:
```
File Upload (PDF/DOCX/TXT) 
       │
       ▼
Extract Raw Text (pdf-parse / mammoth)
       │
       ▼
chunkText() ──► Split into 1,500-character chunks with 200-character overlap
       │
       ▼
Save workspace document ──► Extracted preview (8k) + Full indexed chunks[] in MongoDB
```

### 3. Retrieval & Injected Workspace Inference
When a teammate messages the AI inside a workspace, retrieval occurs dynamically:
```
Teammate sends message
       │
       ▼
retrieveRelevantChunks() ──► Tokenize query, filter short words (<=3 chars)
       │
       ▼
Score every chunk in workspace by keyword frequency ──► Extract top 3 chunks per document
       │
       ▼
Format context block ────► Inject into Groq System Prompt
       │
       ▼
Call Groq API (LLaMA 3.3-70B) ──► Append response to workspace messages ──► Push via Socket.io
```

### 4. Collaborative Document Sync Loop
Real-time collaborative editing relies on CRDTs synced via WebSockets:
```
Teammate Types (TipTap Editor)
       │
       ▼
Update local Y.Doc (CRDT)
       │
       ▼
WebsocketProvider broadcasts updates to `/yjs/workspace-{id}`
       │
       ▼
Backend Relay broadcasts binary delta stream to other clients
       │
       ▼
Receiving clients merge changes conflict-free (colored cursors render positions)
       │
       ▼
Debounced Auto-Save (30s interval or 3s typing pause) ──► POST HTML string to MongoDB
```

---

## 🛠️ Technology Stack

### Frontend Client
*   **React 19 + Vite:** Component-driven user interface with fast HMR builds.
*   **Tailwind CSS v3:** Custom glassmorphic styling system optimized for dark mode.
*   **TipTap v2:** Headless rich-text editor hosting collaborative extensions.
*   **Yjs + y-websocket:** Shared CRDT document types enabling concurrent conflicts resolution.
*   **Socket.io Client:** Real-time bi-directional transport for chat messaging, typing state, and presence tracking.
*   **Recharts v3:** Interactive token utilization and usage analytics charting.
*   **jsPDF + docx:** Client-side document compiler exports notes to Word or PDF format.

### Backend Server
*   **Node.js (LTS) & Express 5:** Async routing runtime.
*   **Mongoose & MongoDB Atlas:** Document database modeling workspaces, messages, usage logs, and credentials.
*   **Socket.io:** Handles namespace scoping and workspace-room socket events.
*   **ws:** Lightweight WebSocket server hosting the custom Yjs CRDT broadcast gateway.
*   **Groq SDK (LLaMA 3.3-70B-Versatile):** High-speed LLM inference provider (typically < 30ms time-to-first-token).
*   **Passport.js:** Middleware implementing Google OAuth 2.0.
*   **bcryptjs & jsonwebtoken:** Hashing and stateless Bearer token authorization checks.
*   **pdf-parse & mammoth:** In-memory PDF/DOCX content parsing.
*   **express-rate-limit:** Route-specific IP traffic control.
*   **Jest & Supertest:** Core unit and integration test runners.

---

## 📁 Project Directory Structure

```
neuraliq/
├── backend/
│   ├── __tests__/                   # Jest Integration Tests
│   │   ├── Auth.test.js             # User login, sign-up, and schema validation
│   │   ├── Chunking.test.js         # Text chunking and scoring algorithms (RAG)
│   │   ├── Rolemiddleware.test.js   # RBAC permission endpoint testing
│   │   └── Workspace.test.js        # Workspace lifecycle operations tests
│   ├── config/                      # System Configurations
│   │   ├── db.js                    # Mongoose database handler
│   │   └── passport.js              # Google Strategy implementation
│   ├── controllers/                 # Express Request Route Controllers
│   │   ├── authController.js        # Handles authentication & profiles
│   │   ├── chatController.js        # Handles solo chat history and token usage
│   │   ├── fileController.js        # Handles standalone PDF/DOCX summaries & chat
│   │   └── workspaceController.js   # Handles collaborative operations, files, and chat
│   ├── middleware/                  # Security and Validation Middleware
│   │   ├── authMiddleware.js        # Validates JWT tokens and maps users
│   │   └── roleMiddleware.js        # Enforces Workspace roles (Admin/Owner/etc)
│   ├── models/                      # Mongoose Database Schemas
│   │   ├── User.js                  # User profile and subscription credentials
│   │   ├── Chat.js                  # Standalone conversation logs
│   │   ├── Workspace.js             # Workspaces, members, messages, documents & notes
│   │   └── Usage.js                 # Daily token analytics tracker
│   ├── routes/                      # Route-to-Controller mapping
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── fileRoutes.js
│   │   ├── workspaceRoutes.js
│   │   └── googleAuth.js
│   ├── server.js                    # Server startup file (Websockets, Socket.io, & App)
│   └── render.yaml                  # Infrastructure deployment instructions
│
└── frontend/
    ├── index.html                   # Entry page
    ├── vite.config.js               # Vite compilation options
    ├── tailwind.config.js           # Tailwind layouts and theme styles
    ├── postcss.config.js            # PostCSS CSS tools configuration
    ├── vercel.json                  # SPA routing configurations for Vercel
    └── src/
        ├── App.jsx                  # Root layout & route mapper
        ├── App.css                  # Custom styling patches
        ├── index.css                # Base stylesheet
        ├── api.js                   # Axios wrapper for backend API calls
        ├── components/              # Shared Layout Widgets
        │   ├── Sidebar.jsx          # Navigation and user states
        │   └── CollaborativeEditor.jsx # TipTap, Yjs, Websocket sync
        ├── hooks/
        │   └── useSocket.js         # Socket.io connection instance
        └── pages/                   # Main Views
            ├── Dashboard.jsx        # Usage charts, workspaces, and list
            ├── Chat.jsx             # Solo AI workspace
            ├── Files.jsx            # Standalone document summaries & chat
            ├── Workspace.jsx        # Collaborative workspace page (collabs, notes, chat)
            ├── Team.jsx             # Teammate permissions directory
            ├── Settings.jsx         # Custom name/avatar modifications
            ├── Pricing.jsx          # Plan display (Free vs Pro upgrades)
            └── Login.jsx            # Authentication page
```

---

## 🗄️ Database Schema Design

```
                     ┌──────────────────┐
                     │      Users       │
                     └────────┬─────────┘
                              │ 1
                              │
                              │ 1..* (userId)
    ┌─────────────────────────┴─────────┐
    │              Usage                │
    └───────────────────────────────────┘

 ┌──────────────────────────────────────────┐
 │                Workspaces                │
 ├──────────────────────────────────────────┤
 │ - userId (Owner Ref: Users)              │
 │ - name                                   │
 │ - shareCode (Unique: NEURO-XXXXX)        │
 │                                          │
 │ ┌──────────────────────────────────────┐ │
 │ │            collaborators[]           │ │
 │ ├──────────────────────────────────────┤ │
 │ │ - userId (Ref: Users)                │ │
 │ │ - name, email                        │ │
 │ │ - role (Admin/Viewer/Developer/etc)  │ │
 │ │ - status (Online/Offline/Busy)       │ │
 │ └──────────────────────────────────────┘ │
 │                                          │
 │ ┌──────────────────────────────────────┐ │
 │ │             documents[]              │ │
 │ ├──────────────────────────────────────┤ │
 │ │ - fileName                           │ │
 │ │ - extractedText (8k Preview)         │ │
 │ │ - chunks[] (RAG Context Array)       │ │
 │ │ - uploadedBy, uploadedAt             │ │
 │ └──────────────────────────────────────┘ │
 │                                          │
 │ ┌──────────────────────────────────────┐ │
 │ │             messages[]               │ │
 │ ├──────────────────────────────────────┤ │
 │ │ - role (user / assistant)            │ │
 │ │ - content                            │ │
 │ │ - userName                           │ │
 │ └──────────────────────────────────────┘ │
 │                                          │
 │ - notes (HTML editor string)             │
 └──────────────────────────────────────────┘

                     ┌──────────────────┐
                     │      Chats       │
                     ├──────────────────┤
                     │ - userId (Users) │
                     │ - title          │
                     │ - messages[]     │
                     └──────────────────┘
```

---

## 📡 API Route Reference

### 1. Authentication (`/api/auth`)
*   `POST /signup` - Register a new account.
*   `POST /login` - Log in with email and password.
*   `GET /me` - Retrieve current authenticated profile details.
*   `POST /avatar` - Upload a Base64-encoded profile picture.
*   `PATCH /name` - Update user display name.

### 2. Standalone Chat & Analytics (`/api/chat`)
*   `POST /` - Send a message to the standalone AI chatbot.
*   `GET /history` - List all standalone conversation titles.
*   `GET /stats` - Fetch a 7-day token, message, and document usage history.
*   `GET /:id` - Retrieve a detailed message log for a standalone chat.
*   `PATCH /:id/rename` - Rename a standalone chat's title.
*   `DELETE /:id` - Permanently delete a chat record.

### 3. Standalone Files (`/api/files`)
*   `POST /upload` - Process a PDF/DOCX/TXT file and return its summary.
*   `POST /chat` - Chat about a standalone uploaded document.

### 4. Workspace Operations (`/api/workspace`)
*   `GET /` - List all workspaces where the user is an owner or collaborator.
*   `POST /` - Create a new workspace (sets user as `Owner`).
*   `POST /join` - Join an existing workspace using its share code (sets user as `Viewer`).
*   `POST /:workspaceId/chat` - Chat with workspace AI (RAG-enabled, member restricted).
*   `POST /:workspaceId/documents` - Upload and index document to the workspace (member restricted).
*   `DELETE /:workspaceId/documents/:docIndex` - Remove document from workspace (Admin/Owner restricted).
*   `DELETE /:workspaceId/collaborator/:collabIndex` - Remove teammate from workspace (Admin/Owner restricted).
*   `PATCH /:workspaceId/collaborator/:collabId/role` - Adjust teammate's role (Admin/Owner restricted).
*   `DELETE /:workspaceId/leave` - Leave a joined workspace.
*   `DELETE /:workspaceId/messages` - Clear chat history (member restricted).
*   `GET /:workspaceId/notes` - Retrieve collaborative notes (member restricted).
*   `PATCH /:workspaceId/notes` - Persist collaborative notes (member restricted).
*   `PATCH /:workspaceId/rename` - Change workspace title (Owner restricted).
*   `DELETE /:workspaceId` - Delete workspace (Owner restricted).

### 5. SSO Provider (`/auth`)
*   `GET /google` - Initiates the Google OAuth 2.0 passport flow.
*   `GET /google/callback` - Redirect path returning JWT token on success.

---

## 🧠 Detailed Feature Breakdown

### Identity-Aware Jarvis AI
In collaborative workspaces, standard chatbots can confuse the dialogue order or address the wrong teammate. NEURALIQ intercepts the prompt payload, maps the request to the caller's verified JWT, and feeds specific identity rules to the model.

```javascript
const jarvisRules = `You are NEURALIQ AI — a Jarvis-style assistant...
THE PERSON SPEAKING TO YOU RIGHT NOW IS: ${currentUser}
ABSOLUTE RULES:
1. Your response must be directed at ${currentUser} only.
2. Never address any other person's name...`;
```

Any message history involving other team members is modified before submission: other usernames are replaced with `[another user]`, preventing identity confusion.

### Smart Keyword-Scoring RAG Engine
Instead of setting up and paying for a vector database cluster, NEURALIQ processes text directly in memory.
1.  **Chunking:** Splitting raw text into standard substrings prevents model context overflow.
2.  **Frequency Analysis:** The query is parsed for keywords, ignoring short words (<= 3 characters).
3.  **Dynamic Score Assignment:** A regular expression checks every chunk for matches.
    ```javascript
    const count = (lower.match(new RegExp(word, 'g')) || []).length;
    ```
4.  **Reordering:** The highest-scoring segments are sorted chronologically and sent to the LLM.

### Real-Time Synchronization & Socket.io
Socket.io coordinates communication across active browser instances. When a teammate joins a workspace room:
*   `join_workspace` puts their socket in a scoped room identifier.
*   `typing` and `stop_typing` broadcasts indicators to that specific room.
*   `workspace_message` pushes the chat output to all active workspace participants immediately.

---

## ⚙️ Local Setup & Configuration Guide

### System Prerequisites
*   Node.js (v18 or higher)
*   NPM (v9 or higher)
*   MongoDB Instance (Atlas Cloud URI or Local Server)

### 1. Clone the Project
```bash
git clone https://github.com/Raju-CS8/Nerual.ai.git
cd neuraliq
```

### 2. Backend Installation & Setup
```bash
cd backend
npm install
```

Create a new file named `.env` in the `backend/` directory:
```env
# Server Network Port
PORT=5000

# MongoDB Connection String (Atlas URI or local path)
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/neuraliq?retryWrites=true&w=majority

# Authorization Credentials
JWT_SECRET=neuraliq_secure_jwt_secret_token_12345!
JWT_EXPIRES_IN=7d

# Groq Cloud API Key
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google API Credentials (OAuth SSO login)
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Allowed Client Origin (no trailing slash)
FRONTEND_URL=http://localhost:5173
```

Run the backend development server:
```bash
npm run dev
```

### 3. Frontend Installation & Setup
```bash
cd ../frontend
npm install
```

Create a new file named `.env` in the `frontend/` directory:
```env
# API Gateway Endpoints
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Run the frontend development server:
```bash
npm run dev
```

The application will be accessible at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Test Coverage & Quality Assurance

NEURALIQ uses Jest and Supertest to validate its APIs. The backend includes 30 unit and integration tests across 4 key test suites:

```bash
cd backend
npm test
```

### Test Coverage Breakdown
1.  **`Auth.test.js`**: Validates registration, duplicate email handling, validation failures, and password comparison.
2.  **`Workspace.test.js`**: Verifies workspace creation, sharing code generation, rename boundaries, and workspace deletion.
3.  **`Chunking.test.js`**: Validates the RAG algorithm by testing chunk splitting and query scoring logic.
4.  **`roleMiddleware.test.js`**: Confirms that only Owners, Admins, and Members can access their respective endpoints.

---

## ☁️ Deployment Configuration

### 1. Frontend: Vercel
Deploy using the following settings in your Vercel project configuration:
*   **Build Command:** `npm run build`
*   **Output Directory:** `dist`
*   **Rewrite Settings (`vercel.json`):** Matches all routes back to `index.html` to allow React Router to handle client-side routing.

### 2. Backend: Render
Render builds Node.js applications directly from the configuration file (`render.yaml`):
*   **Build Command:** `npm install`
*   **Start Command:** `node server.js`
*   **Keep-Alive:** The server includes an internal self-ping interval of 14 minutes. This prevents Render's free tier instance from entering sleep mode:
    ```javascript
    setInterval(() => {
      https.get('https://nerual-ai.onrender.com', (res) => {
        console.log(`Keep-alive ping: ${res.statusCode}`)
      })
    }, 14 * 60 * 1000)
    ```

---

## 📊 Real-World Concurrency & Scaling Performance Audit

This performance audit analyzes the theoretical and practical limits of NEURALIQ's architecture under load. Estimates are calculated based on the current codebase running on standard cloud resources (Render's Free Tier with 512 MB RAM, and MongoDB Atlas's M0 Sandbox with 500 max connections).

### Performance Metrics Summary

| Scaling Bottleneck | Maximum Safe Limit | Critical Choke Point | Root Cause |
| :--- | :--- | :--- | :--- |
| **Yjs Collab Editing** | **~40 Active Typers** | 60+ Concurrent Users | Global broadcast loop (scales at $O(N^2)$ messages) |
| **File Upload Parsing** | **~2 Files concurrently** | 4+ Concurrent Uploads | Memory exhaustion (Render Free Tier 512MB RAM cap) |
| **Socket.io Sync** | **~1,200 Connected Users** | 1,500+ Connections | Event Loop delays and Node single-thread CPU limits |
| **Database Connections** | **500 Concurrent Links** | 500 Connections | MongoDB Atlas M0 Sandbox connection ceiling |

---

### Detailed Scaling & Bottleneck Analysis

#### 1. Yjs WebSocket Broadcast Loop ($O(N^2)$ Complexity)
The custom Yjs server in `server.js` contains a global broadcast loop that forwards keystrokes to all active Yjs connections, rather than scoping them by workspace:

```javascript
// backend/server.js (Lines 49-57)
yjsWss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    yjsWss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg)
      }
    })
  })
})
```

*   **The Math:**
    *   Let $N$ be the total number of users typing across *all* workspaces.
    *   If one user types a character, a sync packet is sent to the server. The server loops through the remaining $N-1$ clients and sends the packet.
    *   At an average typing speed of 4 keystrokes per second (240 characters/minute), the server receives $4N$ messages/sec.
    *   For each message, it broadcasts to $N-1$ clients.
    *   **Outgoing Message Rate formula:** $R_{\text{out}} = 4N \times (N - 1) \approx 4N^2$ messages/second.
*   **Under Load:**
    *   **At 10 users typing:** $4 \times 10 \times 9 = 360$ messages/second. (Negligible CPU impact).
    *   **At 40 users typing:** $4 \times 40 \times 39 = 6,240$ messages/second. (CPU usage spikes; typing lag becomes noticeable).
    *   **At 80 users typing:** $4 \times 80 \times 79 = 25,280$ messages/second. (The single-threaded Node.js event loop blocks. Socket latency spikes, typing lag exceeds seconds, and clients begin to disconnect).

#### 2. RAM vs File Parsing (Render Free Tier Limits)
Render's Free tier limits RAM to **512 MB**.
*   **The Math:**
    *   Node.js baseline RAM with Express, Mongoose, Socket.io, and Groq-SDK: ~80 MB.
    *   Remaining memory: ~432 MB.
    *   Idle connection RAM: Socket.io + WS = ~25 KB per user.
    *   Idle Connection capacity: $432\text{ MB} \times 1024\text{ KB/MB} / 25\text{ KB} \approx 17,600$ connections.
*   **The Bottleneck (File Upload Processing):**
    *   The file upload route uses `multer.memoryStorage()`, meaning the entire file is buffered in RAM.
    *   `pdf-parse` reads this buffer and parses it in-memory. PDF parsing structures pages, text nodes, and layout trees, which expands the memory footprint in RAM to 5-10 times the original file size.
    *   A 15 MB PDF can consume 75 MB - 150 MB of RAM during parsing.
    *   If 3 or 4 users upload a 15 MB PDF at the same time, RAM usage will spike by 300 MB - 600 MB.
    *   With only 432 MB available, the Render container will run out of memory, trigger an OOM crash, and restart.

#### 3. Database Connection Limit (MongoDB Atlas M0)
*   **The Bottleneck:** The MongoDB Atlas free tier has a hard limit of **500 concurrent connections**.
*   **The Math:**
    *   Mongoose uses connection pooling (default: 5-10 connections per server instance).
    *   For a single running node server instance, database connections are not a bottleneck (uses only 10 connections).
    *   If the backend was scaled horizontally to multiple server instances, each instance would consume 10 connections. The database can support up to 50 server instances before connection limits become an issue.

#### 4. Rate Limiting Limits
*   **The Bottleneck:** `express-rate-limit` is configured with default in-memory storage.
*   **The Impact:**
    *   All rate-limiting state is lost when the server restarts.
    *   If the application scales horizontally to multiple server instances, rate limits are tracked per instance rather than globally, allowing users to bypass limits by hit routing.
    *   Under heavy request loads (such as a DDoS attack), tracking IP addresses in-memory can consume significant RAM.

---

### Recommended Architectural Upgrades to Scale to 10k+ Users

To scale NEURALIQ to handle over 10,000 concurrent users, the following changes should be made to the architecture:

```
                                  ┌───────────────────────────┐
                                  │   Load Balancer (Nginx)   │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
    ┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
    │     Backend Node 1      │    │     Backend Node 2      │    │     Backend Node 3      │
    │  - scoped-ws Yjs rooms  │    │  - scoped-ws Yjs rooms  │    │  - scoped-ws Yjs rooms  │
    └────────────┬────────────┘    └────────────┬────────────┘    └────────────┬────────────┘
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                ▼
                                  ┌───────────────────────────┐
                                  │   Redis Pub/Sub Adapter   │
                                  │ - Syncs Socket.io rooms   │
                                  │ - Shared Rate Limiting    │
                                  └─────────────┬─────────────┘
                                                ▼
                                  ┌───────────────────────────┐
                                  │   MongoDB (Paid Tier)     │
                                  └───────────────────────────┘
```

1.  **Implement Yjs Room Scoping (Fixes the $O(N^2)$ Bottleneck)**
    Modify the WebSocket upgrade logic to map connections to specific workspace document instances in-memory. This ensures that updates are only broadcast to users editing the same document.
    ```javascript
    // Suggested Backend Upgrade: Group users by workspace ID
    const rooms = new Map(); // Map<workspaceId, Set<WebSocket>>
    
    yjsWss.on('connection', (ws, req) => {
      const workspaceId = getWorkspaceIdFromUrl(req.url);
      if (!rooms.has(workspaceId)) rooms.set(workspaceId, new Set());
      rooms.get(workspaceId).add(ws);
      
      ws.on('message', (msg) => {
        rooms.get(workspaceId).forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(msg);
          }
        });
      });
      
      ws.on('close', () => {
        rooms.get(workspaceId).delete(ws);
        if (rooms.get(workspaceId).size === 0) rooms.delete(workspaceId);
      });
    });
    ```
2.  **Offload File Parsing to Disk or Serverless Functions**
    *   Switch from `multer.memoryStorage()` to temporary disk storage, or upload files directly from the client to AWS S3 using pre-signed URLs.
    *   Trigger background serverless workers (like AWS Lambda) to extract and chunk text. This isolates the high CPU and RAM cost of PDF parsing from the main API thread.
3.  **Introduce Redis for Scaling and State Management**
    *   Implement `@socket.io/redis-adapter` to distribute socket events across multiple server instances.
    *   Use `rate-limit-redis` to store rate limit state in Redis, ensuring consistent limits across all server instances.
4.  **Database Connection Pooling & Replica Sets**
    *   Upgrade MongoDB Atlas to a paid tier (M10+) to support higher connection limits and enable replica set scaling.
    *   Use lean queries (`.lean()`) to retrieve documents as plain JavaScript objects, reducing CPU memory overhead during database serialization.

---

<div align="center">

**⭐ Star [Raju-CS8/Nerual.ai](https://github.com/Raju-CS8/Nerual.ai) if you find this project valuable!**

*Built with passion, engineered for scale.*

</div>
