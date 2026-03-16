# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Docs Assistant - a React-based web application that helps users learn from their documents using AI-powered features like flashcards, quizzes, and a chat interface.

## Development Commands

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Run linter
bun run lint

# Preview production build
bun run preview
```

## Codebase Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/
│   │   └── ProtectedRoute.jsx   # Route guard for authenticated routes
│   ├── common/
│   │   ├── Button.jsx         # Reusable button component
│   │   ├── EmptyState.jsx     # Empty state display
│   │   ├── MarkdownRenderer.jsx  # Markdown content renderer
│   │   ├── Modal.jsx          # Modal dialog component
│   │   ├── PageHeader.jsx     # Page header component
│   │   ├── Spinner.jsx        # Loading spinner
│   │   └── Tabs.jsx           # Tab navigation component
│   ├── layout/
│   │   ├── AppLayout.jsx      # Main app layout wrapper
│   │   └── Header.jsx         # App header with navigation
│   ├── ai/
│   │   └── AIActions.jsx      # AI action buttons (flashcards, quizzes, summary)
│   ├── chat/
│   │   └── ChatInterface.jsx  # Chat interface for document questions
│   ├── documents/
│   │   └── DocumentCard.jsx   # Document list item card
│   └── flashcards/
│       ├── Flashcard.jsx      # Individual flashcard component
│       ├── FlashcardManager.jsx  # Flashcard review controls
│       └── FlashcardSetCard.jsx  # Flashcard set list item
├── context/
│   └── AuthContext.jsx        # Authentication state management
├── pages/                     # Route-level page components
│   ├── Auth/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── Documents/
│   │   ├── DocumentListPage.jsx
│   │   └── DocumentDetailPage.jsx
│   ├── Flashcards/
│   │   ├── FlashcardPage.jsx
│   │   └── FlashcardsListPage.jsx
│   ├── Quizzes/
│   │   ├── QuizTakePage.jsx
│   │   └── QuizResultPage.jsx
│   ├── Dashboard/
│   │   └── DashboardPage.jsx
│   └── Profile/
│       └── ProfilePage.jsx
├── services/                  # API service layer
│   ├── aiService.js         # AI-related API calls (chat, flashcards, quizzes, summary)
│   ├── authService.js       # Authentication API calls
│   ├── documentService.js   # Document CRUD operations
│   ├── flashcardService.js  # Flashcard operations
│   ├── progressService.js   # Progress tracking API calls
│   └── quizService.js       # Quiz operations
├── utils/                     # Utility modules
│   ├── apiPaths.js          # Centralized API endpoint definitions
│   └── axiosInstance.js     # Axios instance with auth interceptor
├── App.jsx                    # Main app component with router configuration
└── main.jsx                   # App entry point with providers
```

## Key Architecture Patterns

### Authentication Flow

Authentication state is managed by `AuthContext` with localStorage persistence:
- Token and user data stored in localStorage on login
- Token automatically attached to API requests via axios `Authorization` header
- Protected routes redirect unauthenticated users to login
- Check auth status on app startup via `checkAuthStatus()`

### API Layer

- Base URL: `http://localhost:8000` (configured in `apiPaths.js`)
- Axios instance with request/response interceptors
- Token injected into all requests automatically
- Centralized error handling for server errors and timeouts

### Routing Structure

Protected routes (require authentication):
- `/dashboard` - User overview and progress
- `/documents` - Document list and upload
- `/documents/:id` - Document detail with AI actions
- `/flashcards` - Flashcard collections
- `/documents/:id/flashcards` - Document-specific flashcards
- `/quizzes/:quizId` - Quiz taking interface
- `/quizzes/:quizId/results` - Quiz results
- `/profile` - User profile management

## Tech Stack

- React 19 with Vite 7
- React Router v7 for routing
- TailwindCSS v4 for styling
- Axios for API requests
- React Hot Toast for notifications
- Lucide React for icons
- React Markdown for document rendering

## Configuration Files

- `eslint.config.js` - ESLint configuration (recommended React rules)
- `vite.config.js` - Vite configuration with React plugin and TailwindCSS
- `.gitignore` - Git ignore rules

## API Endpoints

Endpoints are defined in `utils/apiPaths.js`:
- `/api/auth/*` - Authentication endpoints
- `/api/documents/*` - Document CRUD operations
- `/api/ai/*` - AI-powered features
- `/api/flashcards/*` - Flashcard management
- `/api/quizzes/*` - Quiz operations
- `/api/progress/*` - User progress tracking
