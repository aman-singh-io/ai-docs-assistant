# Product Requirements Document: AI Docs Assistant

## 1. Product Objective

**AI Docs Assistant** is a full-stack web application designed to transform how users learn from static documents. By leveraging **Google GenAI**, the platform allows users to upload PDF documents and automatically generate interactive study tools.

- **Core Goal:** Shift the user experience from passive reading to active, measurable learning.
- **Key Outcome:** Transformation of static PDFs into summaries, chapter breakdowns, flashcards, quizzes, and a contextual conversational AI.

---

## 2. Product Features (Overview)

- **Secure User Workspace:** Personalized dashboard to manage documents and track learning progress.
- **Automated Document Ingestion:** Seamless PDF upload with automatic text extraction.
- **AI-Powered Study Tools:** - **General Summarization:** High-level overview of document content.
  - **Chapter-by-Chapter Summary:** AI-driven structural breakdown of long-form texts/books into readable chapters (on-demand, non-stored).
  - **Flashcard Generation:** Automated creation of study cards.
  - **Quiz Generation:** Interactive assessment tools.
- **Contextual AI Chat:** Document-specific chat interface to ask questions grounded in the text.
- **Learning Tracking:** Interactive quiz-taking interfaces and progress analytics to monitor knowledge retention.

---

## 3. Functional Requirements

### 3.1 Authentication & Account Management

| Feature                  | Requirement                                                                   |
| :----------------------- | :---------------------------------------------------------------------------- |
| **Registration & Login** | Users must be able to create an account (email/password) and log in securely. |
| **Profile Management**   | Users must be able to view/manage profile info via the `/profile` route.      |
| **Access Control**       | Core features (dashboard, docs, quizzes) restricted to authenticated users.   |

### 3.2 Document Management

- **Upload:** Support for PDF files with automated text extraction upon upload.
- **Listing:** View all uploaded documents via the `/documents` route.
- **Viewing:** View extracted content of a specific document (`/documents/:id`) rendered in Markdown.
- **CRUD Operations:** Create (upload), Read, Update (metadata), and Delete documents.

### 3.3 AI Integrations & Study Tools

Triggered via `AIActions.jsx` within the document detailed view:

- **Summarization:** Generate a concise summary of the document's content.
- **Chapter Summary:** Intelligently identify chapter breaks and generate a structured breakdown (Title, Summary, Key Takeaways). This data is displayed in the UI but **not stored** in the database.
- **Flashcard Generation:** Automatically create front/back cards from key concepts.
- **Quiz Generation:** Generate multiple-choice or short-answer questions.
- **Contextual Chat:** Interface (`ChatInterface.jsx`) for Q&A grounded in the document's extracted text.

### 3.4 Learning & Progress

- **Flashcard Management:** View, edit, and review cards at `/flashcards` or `/documents/:id/flashcards`.
- **Quiz Execution:** Dedicated interface for taking quizzes at `/quizzes/:quizId`.
- **Results & Analytics:** Review scores and correct/incorrect answers at `/quizzes/:quizId/results`. Global progress overview available on the `/dashboard`.

---

## 4. Non-Functional Requirements

### 4.1 Security

- **Session Management:** Implementation of JSON Web Tokens (JWT).
- **Data Protection:** Password hashing using `bcrypt` before database storage.
- **API Security:** Backend routes (`/api/documents/*`, `/api/ai/*`) protected via `auth.js` middleware.
- **Data Isolation:** Users can only access, modify, or delete their own data.

### 4.2 Performance & Scalability

- **File Handling:** Optimized PDF parsing (`pdf.js`) and uploads (`multer`).
- **Storage:** Files stored locally in `backend/uploads/`.
- **API Responsiveness:** Graceful handling of loading states with `React Hot Toast` for AI tasks.
- **Package Management:** Use of `bun` for fast dependency installation and script execution.

### 4.3 Technology Stack Constraints

- **Frontend:** React 19, Vite 7, React Router v7, TailwindCSS v4.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB with Mongoose ODM.
- **AI Provider:** Strictly `@google/genai` SDK.
- **Architecture:** Monorepo with independent `package.json` for `frontend/` and `backend/`.
