<div align="center">

# 🧠 NEURALIQ

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

</div>
