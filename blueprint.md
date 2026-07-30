# NEURALIQ Project Blueprint

## 1. Project Overview

NEURALIQ is an AI-powered real-time collaborative workspace where teams can chat, upload documents, work together in shared rooms, and interact with an intelligent assistant that understands workspace context.

This project combines:
- a modern React frontend
- a Node.js/Express backend
- MongoDB for persistent data
- Socket.io for real-time collaboration
- Groq AI for context-aware chat responses
- Yjs + TipTap for collaborative editing

---

## 2. Project Goals

The main goals of NEURALIQ are to:

1. Create a smart team workspace where people can collaborate in real time.
2. Give users an AI assistant that understands documents and workspace context.
3. Support shared rooms with chat, presence, and live updates.
4. Enable document-based question answering using a custom RAG-style workflow.
5. Enforce secure role-based permissions on the backend.
6. Deliver a polished SaaS-style experience with modern UI and animations.

---

## 3. Core Features

### AI Assistant
- Context-aware AI chat inside workspaces
- Responds based on active user identity and workspace context
- Uses Groq LLM for intelligent answers

### Document Intelligence
- Upload PDF, DOCX, and TXT files
- Extract text from documents
- Split content into chunks for smarter retrieval
- Answer questions based on relevant document content

### Real-Time Collaboration
- Shared workspace rooms
- Live chat updates
- Presence and typing indicators
- Instant workspace updates through Socket.io

### Collaborative Editor
- Rich text editing inside workspaces
- Multiple users can edit together using TipTap and Yjs
- Changes sync in real time

### Authentication and Authorization
- Email/password login
- Google OAuth login
- JWT-based authentication
- Role-based access control for owners, admins, members, and viewers

### Usage Monitoring
- Token usage dashboard
- Plan-based access and limits
- Token warning indicators

### Team Management
- Manage workspace members
- Assign roles
- View collaborators and workspace activity

---

## 4. Architecture Summary

NEURALIQ follows a client-server architecture with real-time event support.

### Frontend
- React 19 + Vite
- Tailwind CSS for styling
- Socket.io client for live features
- TipTap + Yjs for collaborative editing
- React Markdown for rendering AI responses

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.io server
- Passport.js for Google auth
- JWT for authentication
- Groq SDK for AI processing
- Multer + PDF/DOCX parsers for file handling

### Data Flow
1. User logs in or signs up.
2. User joins a workspace or chat.
3. Messages and documents are stored in MongoDB.
4. AI uses uploaded documents and workspace context to answer questions.
5. Real-time events broadcast updates to connected users.

---

## 5. Frontend Tech Stack

### Main Technologies
- React 19
- Vite
- Tailwind CSS
- JavaScript/JSX
- Socket.io Client
- TipTap
- Yjs
- React Markdown
- Recharts
- jsPDF / docx

### Frontend Purpose
- Build the UI and user experience
- Handle navigation between app pages
- Manage authentication flow
- Connect to backend APIs
- Manage real-time workspace features

---

## 6. Backend Tech Stack

### Main Technologies
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.io
- Passport.js
- JWT
- bcryptjs
- multer
- pdf-parse
- mammoth
- Groq SDK
- Jest + Supertest
- express-rate-limit

### Backend Purpose
- Serve REST API endpoints
- Handle authentication and authorization
- Manage workspaces, chats, files, and users
- Process uploaded documents
- Connect to the AI model
- Manage real-time socket events

---

## 7. Project Folder Structure and Purpose

### Root Folder
- Contains the overall project documentation and app structure.
- Includes the frontend and backend directories.

### backend/
The backend folder holds the server, APIs, database models, authentication logic, and real-time services.

### frontend/
The frontend folder holds the React app, UI pages, reusable components, and client-side logic.

---

## 8. Backend Files and Folders

### backend/config/
Purpose: Configuration and environment setup.

- db.js
  - Connects the app to MongoDB using Mongoose.
- passport.js
  - Configures Google OAuth authentication with Passport.js.

### backend/controllers/
Purpose: Contains business logic for each feature area.

- authController.js
  - Handles signup, login, profile retrieval, and auth-related actions.
- chatController.js
  - Handles chat logic and AI interaction for chat features.
- fileController.js
  - Handles file upload, file processing, and document-based responses.
- workspaceController.js
  - Handles workspace creation, member management, documents, messages, and collaborative operations.
- subscriptionController.js
  - Handles subscription-related logic and plan management.

### backend/middleware/
Purpose: Protects routes and enforces rules.

- authMiddleware.js
  - Verifies JWT tokens and authenticates users.
- roleMiddleware.js
  - Enforces role-based permission checks for workspaces.

### backend/models/
Purpose: Defines MongoDB schemas and data structures.

- User.js
  - Stores user information, login credentials, and profile details.
- Workspace.js
  - Stores workspace data, members, documents, messages, and notes.
- Chat.js
  - Stores standalone chat records.
- Usage.js
  - Tracks token usage and analytics data.

### backend/routes/
Purpose: Maps API endpoints to controllers.

- authRoutes.js
  - Authentication endpoints.
- chatRoutes.js
  - Chat-related endpoints.
- fileRoutes.js
  - File upload and document processing routes.
- workspaceRoutes.js
  - Workspace management routes.
- googleAuth.js
  - Google OAuth routes.
- subscriptionRoutes.js
  - Subscription and plan routes.

### backend/__tests__/
Purpose: Automated backend testing.

- Auth.test.js
  - Tests authentication flows.
- Chunking.test.js
  - Tests document chunking and retrieval logic.
- Rolemiddleware.test.js
  - Tests role-based access rules.
- Workspace.test.js
  - Tests workspace operations and permissions.

### backend/server.js
Purpose: Starts the backend application.

- Starts Express
- Connects MongoDB
- Sets up Socket.io
- Creates the Yjs WebSocket relay
- Defines API routes
- Starts the server on the configured port

### backend/render.yaml
Purpose: Deployment configuration for hosting the backend.

---

## 9. Frontend Files and Folders

### frontend/src/
Purpose: Main source code for the application UI.

### frontend/src/api.js
Purpose: Central API helper file for calling backend endpoints.

### frontend/src/App.jsx
Purpose: Main app component that manages routing between pages and session state.

### frontend/src/App.css
Purpose: Additional app styling and custom UI effects.

### frontend/src/index.css
Purpose: Global base styles and theme setup.

### frontend/src/main.jsx
Purpose: App bootstrapping entry point.

### frontend/src/components/
Purpose: Reusable UI components shared across pages.

- Sidebar.jsx
  - Main navigation sidebar for the app.
- CollaborativeEditor.jsx
  - TipTap + Yjs collaborative editor component.

### frontend/src/hooks/
Purpose: Custom hooks for app logic.

- useSocket.js
  - Handles Socket.io client connection behavior.

### frontend/src/pages/
Purpose: Main app screens and pages.

- Dashboard.jsx
  - Main dashboard with usage stats and overview.
- Chat.jsx
  - AI chat page for personal or general chat interactions.
- Files.jsx
  - Document upload and file-based query interface.
- Workspace.jsx
  - Shared collaborative workspace page.
- Team.jsx
  - Workspace team management page.
- Settings.jsx
  - User profile and settings page.
- Pricing.jsx
  - Subscription and plan information page.
- Login.jsx
  - Authentication page for signup/login.

### frontend/index.html
Purpose: Base HTML entry page for the Vite app.

### frontend/vite.config.js
Purpose: Vite build and dev-server configuration.

### frontend/tailwind.config.js
Purpose: Tailwind theme and styling configuration.

### frontend/postcss.config.js
Purpose: PostCSS configuration for Tailwind processing.

### frontend/vercel.json
Purpose: Vercel hosting and SPA routing config.

---

## 10. How the Main User Experience Works

### Authentication Flow
1. User signs in or logs into the app.
2. Backend validates the credentials.
3. JWT token is issued.
4. Frontend stores the user session.

### Workspace Flow
1. User joins or creates a workspace.
2. Workspace members receive live updates.
3. Messages and documents appear instantly.
4. AI responds with workspace-aware context.

### Document Flow
1. User uploads a document.
2. Backend extracts and prepares text.
3. Content is chunked for smarter retrieval.
4. The AI uses relevant chunks to answer questions.

### Collaboration Flow
1. Multiple users open the same workspace.
2. The collaborative editor syncs changes through Yjs.
3. Presence and typing updates show users who is active.

---

## 11. Development and Testing

### Backend Tests
The project includes backend tests for:
- authentication
- workspace features
- chunking logic
- role middleware

### Test Command
Run tests with:
```bash
cd backend
npm test
```

---

## 12. Deployment Notes

The app is designed for deployment in a split setup:
- Frontend hosted on Vercel
- Backend hosted on Render
- MongoDB hosted on MongoDB Atlas

This structure supports a scalable SaaS-style deployment model.

---

## 13. Summary

NEURALIQ is a full-stack AI collaboration platform that brings together:
- real-time team workspaces
- collaborative editing
- intelligent document Q&A
- secure role-based access
- modern frontend experience
- reliable backend services

It is designed to feel like a smart, shared team operating system powered by AI.
