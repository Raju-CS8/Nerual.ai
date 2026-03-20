# NEURALIQ

NEURALIQ is a full-stack real-time collaborative AI workspace platform. The application allows users to create workspaces, collaborate in real-time, share documents, and interact with an AI assistant.

## Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **State & Real-time**: Socket.io-client
- **Document Processing**:
  - `docx` & `jspdf` for generating documents
  - `html2canvas` for capturing UI elements
  - `file-saver` for file downloads
- **Key Pages**:
  - Dashboard, Workspace, Chat, Files, Team, Settings, Pricing, Login

### Backend
- **Framework**: Node.js, Express.js
- **Database**: MongoDB (Mongoose models: `User`, `Workspace`, `Chat`, `Usage`)
- **Real-time**: Socket.io for workspace collaboration, chat, and document sync
- **Authentication**: Passport.js (Local & Google OAuth 2.0), JWT (`jsonwebtoken`), and Bcrypt (`bcryptjs`)
- **AI Integration**: Groq SDK (`groq-sdk`) for intelligent chat and generation
- **Rate Limiting**: `express-rate-limit` for API, Auth, Chat, and Uploads protection
- **File Handling**: `multer` for uploads, `sharp` for image processing, `pdf-parse` for reading PDFs, `mammoth` for DOCX processing

## Project Structure

```text
neuraliq/
├── backend/
│   ├── config/          # DB and Passport configurations
│   ├── controllers/     # API logic
│   ├── middleware/      # Auth & Rate Limiter middlewares
│   ├── models/          # DB schemas (Chat, Usage, User, Workspace)
│   ├── routes/          # API routes (Auth, Chat, Files, Subs, Workspace)
│   ├── uploads/         # Local file storage
│   └── server.js        # Entry point for Express & Socket.io
│
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── api.js       # API integration
│   │   ├── assets/      
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   └── pages/       # React pages (Dashboard, Workspace, Chat, etc.)
│   ├── index.html       
│   ├── vite.config.js   
│   └── tailwind.config.js
```

## Features Complete

- **Authentication System**: Secure login/signup system via Local and Google OAuth using Passport.js.
- **Real-Time Collaboration**: Workspaces support real-time user presence, typing indicators, live chat, and document syncing powered by Socket.io.
- **AI Integration**: AI assistant within the workspace using the Groq API.
- **Document Handlers**: Capability to parse, generate, and process PDFs, Word documents, and images natively within the app.
- **Usage & Subscription**: Built-in architecture for tracking usage and pricing tiers.
- **Security**: Robust rate-limiting across general API, authentication, chat, and document uploads.

## How to Run Locally

### Start Backend
1. `cd backend`
2. Create `.env` file containing `JWT_SECRET`, `MONGO_URI`, `GROQ_API_KEY`, etc.
3. `npm install`
4. `npm run dev` (Runs on http://localhost:5000)

### Start Frontend
1. `cd frontend`
2. Create `.env.production` / `.env.local`
3. `npm install`
4. `npm run dev` (Runs on http://localhost:5173)
