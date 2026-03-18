# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Docs Assistant - a full-stack web application that helps users learn from their documents using AI-powered features. The app consists of a React frontend and a Node.js/Express backend with MongoDB.

## Monorepo Structure

This repository follows a monorepo structure with `frontend` and `backend` directories as separate projects.

```
.
├── backend/           # Express.js backend with Node.js
│   ├── config/      # Database, Multer upload configuration
│   ├── controllers/ # Route handlers (auth, documents, AI, flashcards, quizzes, progress)
│   ├── middleware/  # Auth verification, error handling
│   ├── models/      # Mongoose schemas (User, Document, Flashcard, Quiz, ChatHistory)
│   ├── routes/      # Express router definitions
│   └── utils/       # PDF parsing utilities
├── frontend/          # React 19 + Vite frontend
│   └── src/
│       ├── components/  # UI and layout components
│       ├── context/     # AuthContext for authentication state
│       ├── pages/       # Route-level page components
│       ├── services/    # API service layer
│       └── utils/       # API paths, axios instance
└── .claude/             # Claude Code configuration
```

## Development Commands

### Backend (Node.js/Express)

```bash
cd backend

# Install dependencies
cd backend && bun install

# Run development server (with nodemon auto-restart)
bun run dev

# Run production server
bun run start
```

### Frontend (React 19 + Vite)

```bash
cd frontend

# Install dependencies
cd frontend && bun install

# Run development server with HMR
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run linter
bun run lint
```

## Architecture

### Backend Architecture

**Authentication Flow:**
- JWT-based authentication with bcrypt password hashing
- Token stored in localStorage on frontend, sent via `Authorization` header
- Middleware `auth.js` verifies tokens for protected routes

**AI Integration:**
- Google GenAI integration via `@google/genai` package
- AI services: document summarization, flashcard generation, quiz generation, chat interface

**Data Models:**
- User: email, password (hashed), profile info
- Document: user reference, title, content (PDF extracted), upload metadata
- Flashcard: user reference, document reference, front/back text
- Quiz: user reference, document reference, questions array
- ChatHistory: user reference, conversation turns

**API Endpoints:**
- `/api/auth/*` - Registration, login, profile
- `/api/documents/*` - CRUD operations, PDF upload and parsing
- `/api/ai/*` - Summarization, flashcards, quizzes, chat
- `/api/flashcards/*` - Flashcard management
- `/api/quizzes/*` - Quiz creation, taking, results
- `/api/progress/*` - User learning analytics

### Frontend Architecture

**State Management:**
- Authentication state via React Context (`AuthContext.jsx`)
- Token persistence in localStorage across sessions
- React Hot Toast for notifications

**Routing (React Router v7):**

Protected routes (require authentication):
- `/dashboard` - Overview with learning progress
- `/documents` - Document list and upload interface
- `/documents/:id` - Document detail with AI action buttons
- `/flashcards` - Collection of user's flashcard sets
- `/documents/:id/flashcards` - View/edit flashcards for a document
- `/quizzes/:quizId` - Take quiz interface
- `/quizzes/:quizId/results` - Quiz results and review
- `/profile` - User profile management

**Key Components:**
- `ProtectedRoute.jsx` - Route guard component
- `MarkdownRenderer.jsx` - Renders document content
- `AIActions.jsx` - Buttons for AI features (summary, flashcards, quiz)
- `ChatInterface.jsx` - Document-specific AI chat
- `FlashcardManager.jsx` - Review and creation controls
- `QuizManager.jsx` - Quiz taking interface

**API Layer:**
- Base URL: `http://localhost:8000`
- Axios instance with request interceptor for JWT token
- Centralized error handling and timeout management

## Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- Google GenAI integration
- PDF.js for PDF text extraction

**Frontend:**
- React 19 with Vite 7
- React Router v7
- TailwindCSS v4
- Axios for API requests
- React Markdown
- Lucide React for icons
- React Hot Toast

## Configuration Files

- `frontend/vite.config.js` - Vite config with React plugin, TailwindCSS, path aliases
- `frontend/eslint.config.js` - ESLint configuration for React
- `backend/.env` - Environment variables (DATABASE_URI, JWT_SECRET, GOOGLE_API_KEY, etc.)

## Important Notes

- Both frontend and backend use `bun` as package manager
- PDF uploads are stored in `backend/uploads/` directory
- Frontend runs on port 5173 in development, backend on port 8000
- CORS is enabled for frontend-backend communication
- TailwindCSS v4 uses the new configuration syntax in `frontend/src/index.css`
- **Always use Context7 MCP automatically** for code generation, setup/installation steps, and library/API documentation - resolve library identifiers and retrieve documentation without explicit requests