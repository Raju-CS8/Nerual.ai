<div align="center">

# 🧠 NEURALIQ

### ⚡ AI-Powered Collaborative Workspace Platform

> 💬 Chat with AI · 📄 Analyze Documents · 🤝 Collaborate in Real-Time

[![Live App](https://img.shields.io/badge/🌐%20Live%20App-nerual--ai.vercel.app-7c3aed?style=for-the-badge)](https://nerual-ai.vercel.app)
[![Backend](https://img.shields.io/badge/🚀%20Backend%20API-nerual--ai.onrender.com-06b6d4?style=for-the-badge)](https://nerual-ai.onrender.com)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📑 Table of Contents

1. Project Overview
2. Core Idea & Concept
3. Key Features
4. Tech Stack
5. System Architecture
6. Project Structure
7. Database Design
8. API Reference
9. Real-Time Events (Socket.io)
10. Frontend Pages
11. AI Model Configuration
12. Security & Rate Limiting
13. Environment Variables
14. Running Locally
15. Deployment
16. Future Features
17. Author
18. License

---

## 🚀 1. Project Overview

**NEURALIQ** is a full-stack web application that combines personal AI chat, document intelligence, and live team collaboration into a single unified platform.

🔗 Live: https://nerual-ai.vercel.app
🔗 Backend: https://nerual-ai.onrender.com

### 👥 Users

* **Individuals** → Personal AI assistant with memory
* **Teams** → Shared workspaces + document AI + collaboration

---

## 🧠 2. Core Idea & Concept

### ❌ Problem

* AI chats don’t persist history
* No document understanding
* No collaboration

### ✅ Solution — NEURALIQ

**🤖 Personal AI Assistant**
Persistent chats powered by LLaMA 3.3 (Groq)

**📄 Document Intelligence**
Upload → Summarize → Ask questions

**🤝 Collaborative Workspaces**
Real-time multi-user AI interaction

---

## 🔥 3. Key Features

| Feature           | Description                   |
| ----------------- | ----------------------------- |
| 🔐 Authentication | Email/password + Google OAuth |
| 🤖 AI Chat        | Persistent conversations      |
| 📄 Document AI    | Upload + summarize + Q&A      |
| 🤝 Collaboration  | Real-time workspace chat      |
| 🏢 Workspaces     | Invite via share code         |
| 📊 Analytics      | Usage dashboard               |
| 💳 Plans          | Free vs Pro                   |
| 🖼 Avatar         | Profile image upload          |
| 📤 Export         | Chat → PDF/DOCX               |
| 🛡 Security       | Rate limiting + JWT           |

---

## 🛠 4. Tech Stack

### Frontend

* React 19 (Vite)
* Tailwind CSS
* Socket.io-client
* react-markdown
* recharts
* jsPDF + docx

### Backend

* Node.js + Express
* MongoDB + Mongoose
* Socket.io
* Passport.js
* JWT
* bcryptjs
* multer
* pdf-parse / mammoth / sharp

### AI

* Groq API (LLaMA 3.3 70B)

---

## 🏗 5. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ BROWSER (React SPA)                                         │
│ Login → Dashboard → Chat / Workspace / Files / Settings     │
└───────────────────┬────────────────────┬────────────────────┘
                    │ REST API           │ WebSocket
                    ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Express.js Backend (Node.js)                                │
│ /api/auth → authController                                 │
│ /api/chat → chatController                                 │
│ /api/files → fileController                                │
│ /api/workspace → workspaceController                       │
│ Socket.io → workspace rooms                                │
└──────────────┬──────────────────────────┬───────────────────┘
               ▼                          ▼
        MongoDB                     Groq API (LLaMA)
```

---

## 📁 6. Project Structure

```
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
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── hooks/
    │   └── api.js
```

---

## 🗄 7. Database Design

### User

* name, email, password
* googleId
* avatar
* plan
* tokensUsed

### Chat

* messages
* title

### Workspace

* collaborators
* documents
* messages

### Usage

* daily usage tracking

---

## 📡 8. API Reference

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

## ⚡ 9. Real-Time Events (Socket.io)

* join_workspace
* workspace_message
* typing / stop_typing
* users_online
* new_message

---

## 📊 10. Frontend Pages

* Login
* Dashboard
* Chat
* Workspace
* Files
* Team
* Settings
* Pricing

---

## 🤖 11. AI Model Configuration

* Model: llama-3.3-70b-versatile
* Temperature: 0.7
* Context-aware chats
* Document Q&A support

---

## 🔒 12. Security & Rate Limiting

### Rate Limits

* General: 100 / 15 min
* Auth: 10 / 15 min
* Chat: 30 / min
* Upload: 20 / hour

### Security

* JWT auth
* bcrypt hashing
* CORS protection
* File validation
* Token limits

---

## 🔑 13. Environment Variables

```env
PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
GROQ_API_KEY=your_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_CALLBACK_URL=https://nerual-ai.onrender.com/auth/google/callback
FRONTEND_URL=https://nerual-ai.vercel.app
```

---

## 🧪 14. Running Locally

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

## ☁️ 15. Deployment

### Backend — Render

* Build: npm install
* Start: node server.js

### Frontend — Vercel

* Vite project
* SPA routing enabled

---

## 🔮 16. Future Features

* 💳 Payment Integration
* 📱 Mobile Application
* 🧠 AI Memory Engine
* 📊 Advanced Analytics

---

## 👨‍💻 17. Author

**Raju**
🎓 MCA — Christ University
💻 Full Stack Developer
🤖 AI Systems Builder

---

## 📄 18. License

ISC License

---

<div align="center">

⭐ Star this repo if you like it
🚀 https://nerual-ai.vercel.app

</div>
