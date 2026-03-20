# Architecture Documentation

## Overview

AI Docs Assistant is a full-stack web application that transforms static PDF documents into interactive learning experiences using AI-powered features.

```
ai-docs-assistant/
├── backend/                    # Node.js/Express API server
│   ├── config/                # Configuration modules
│   │   ├── database.js        # MongoDB connection setup
│   │   └── multer.js          # File upload configuration
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── documentController.js
│   │   ├── aiController.js
│   │   ├── flashcardController.js
│   │   ├── quizController.js
│   │   └── progressController.js
│   ├── middleware/            # Express middleware
│   │   ├── auth.js            # JWT verification
│   │   └── error.js           # Error handling
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Document.js
│   │   ├── Flashcard.js
│   │   ├── Quiz.js
│   │   └── QuizResult.js
│   ├── routes/                # Express routers
│   │   ├── auth.js
│   │   ├── documents.js
│   │   ├── ai.js
│   │   ├── flashcards.js
│   │   ├── quizzes.js
│   │   └── progress.js
│   ├── uploads/               # Stored PDF files
│   ├── utils/                 # Helper functions
│   │   └── pdfParser.js       # PDF text extraction
│   ├── server.js              # Application entry point
│   └── .env                   # Environment variables
│
├── frontend/                  # React 19 + Vite client
│   └── src/
│       ├── components/        # Reusable components
│       │   ├── auth/
│       │   │   └── ProtectedRoute.jsx
│       │   ├── common/
│       │   │   ├── Button.jsx
│       │   │   ├── EmptyState.jsx
│       │   │   ├── MarkdownRenderer.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── PageHeader.jsx
│       │   │   ├── Spinner.jsx
│       │   │   └── Tabs.jsx
│       │   ├── layout/
│       │   │   ├── AppLayout.jsx
│       │   │   └── Header.jsx
│       │   ├── ai/
│       │   │   └── AIActions.jsx
│       │   ├── chat/
│       │   │   └── ChatInterface.jsx
│       │   ├── documents/
│       │   │   └── DocumentCard.jsx
│       │   └── flashcards/
│       │       ├── Flashcard.jsx
│       │       ├── FlashcardManager.jsx
│       │       └── FlashcardSetCard.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/             # Route-level pages
│       │   ├── Auth/
│       │   │   ├── LoginPage.jsx
│       │   │   └── RegisterPage.jsx
│       │   ├── Dashboard/
│       │   │   └── DashboardPage.jsx
│       │   ├── Documents/
│       │   │   ├── DocumentListPage.jsx
│       │   │   └── DocumentDetailPage.jsx
│       │   ├── Flashcards/
│       │   │   ├── FlashcardPage.jsx
│       │   │   └── FlashcardsListPage.jsx
│       │   ├── Profile/
│       │   │   └── ProfilePage.jsx
│       │   └── Quizzes/
│       │       ├── QuizTakePage.jsx
│       │       └── QuizResultPage.jsx
│       ├── services/          # API service layer
│       │   ├── aiService.js
│       │   ├── authService.js
│       │   ├── documentService.js
│       │   ├── flashcardService.js
│       │   ├── progressService.js
│       │   └── quizService.js
│       ├── utils/             # Utilities
│       │   ├── apiPaths.js    # API endpoint constants
│       │   └── axiosInstance.js  # Axios config with interceptor
│       ├── App.jsx            # Router configuration
│       └── main.jsx           # Application entry point
│
├── .claude/                   # Claude Code configuration
├── CLAUDE.md                  # Development guidance
├── PRD.md                     # Product requirements
└── ARCHITECTURE.md            # This file
```

---

## Backend Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js | JavaScript runtime |
| Framework | Express.js 5.1.0 | Web server |
| Database | MongoDB with Mongoose 8.20.0 | Data persistence |
| Auth | JWT (jsonwebtoken 9.0.2) | Stateless authentication |
| Password | bcryptjs 3.0.3 | Password hashing |
| File Upload | Multer 2.0.2 | PDF file handling |
| PDF Processing | pdf-parse 2.4.5 | Text extraction |
| AI Integration | @google/genai 1.30.0 | Generative AI features |
| Validation | express-validator 7.3.1 | Request validation |

### Server Entry Point

**File:** `backend/server.js`

**Key responsibilities:**
1. Load environment variables from `.env`
2. Initialize Express application
3. Configure middleware (CORS, body parsing, static files)
4. Connect to MongoDB
5. Mount API routers
6. Initialize error handling middleware
7. Start HTTP server on port 8000

**Middleware stack:**
```
Request → CORS → Body Parser → API Routes → Error Handler → Response
```

### Authentication Flow

**Implementation:** `backend/middleware/auth.js`

```
1. User logs in → JWT signed with secret → returned to client
2. Client stores JWT in localStorage
3. Client includes JWT in Authorization header: "Bearer <token>"
4. Middleware verifies token signature and expiration
5. If valid → req.user attached to request
6. If invalid → 401 Unauthorized response
```

**JWT Structure:**
```javascript
{
  userId: ObjectId,
  email: string,
  iat: timestamp,
  exp: timestamp
}
```

### Database Models

#### User Model
**File:** `backend/models/User.js`

```javascript
{
  username: String (unique, required, 3+ chars),
  email: String (unique, lowercase, valid format),
  password: String (hashed, 6+ chars),
  profileImage: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Methods:**
- `matchPassword(enteredPassword)`: Compare plaintext with hashed password

#### Document Model
**File:** `backend/models/Document.js`

```javascript
{
  user: Reference(User),
  title: String,
  filename: String,
  uploadedBy: Reference(User),
  fileSize: Number,
  pageCount: Number,
  content: String (extracted text),
  createdAt: Date,
  updatedAt: Date
}
```

**Virtuals:**
- `progress`: Calculated from related flashcards and quizzes

**Pre-save hooks:**
- Auto-set `uploadedBy` to authenticated user

#### Flashcard Model
**File:** `backend/models/Flashcard.js`

```javascript
{
  user: Reference(User),
  document: Reference(Document),
  front: String (question),
  back: String (answer),
  createdAt: Date
}
```

#### Quiz Model
**File:** `backend/models/Quiz.js`

```javascript
{
  user: Reference(User),
  document: Reference(Document),
  questions: Array<{
    question: String,
    options: [String],
    answer: Number (index)
  }>,
  createdAt: Date
}
```

#### QuizResult Model
**File:** `backend/models/QuizResult.js`

```javascript
{
  user: Reference(User),
  quiz: Reference(Quiz),
  answers: Array<{
    questionIndex: Number,
    selectedOption: Number
  }>,
  score: Number (correct/total),
  createdAt: Date
}
```

### API Endpoints

#### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Create new account | No |
| POST | `/login` | Authenticate user | No |
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |

#### Documents (`/api/documents`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List all user's documents | Yes |
| POST | `/upload` | Upload new PDF document | Yes |
| GET | `/:id` | Get document details | Yes |
| PUT | `/:id` | Update document metadata | Yes |
| DELETE | `/:id` | Delete document | Yes |

#### AI Features (`/api/ai`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/summarize` | Generate summary | Yes |
| POST | `/generate-flashcards` | Create flashcards | Yes |
| POST | `/generate-quiz` | Create quiz | Yes |
| POST | `/chat` | Ask question about document | Yes |

#### Flashcards (`/api/flashcards`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List user's flashcards | Yes |
| GET | `/:id` | Get flashcard details | Yes |
| POST | `/` | Create flashcard | Yes |
| PUT | `/:id` | Update flashcard | Yes |
| DELETE | `/:id` | Delete flashcard | Yes |

#### Quizzes (`/api/quizzes`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List user's quizzes | Yes |
| GET | `/:id` | Get quiz details | Yes |
| POST | `/` | Create quiz | Yes |
| POST | `/:id/take` | Submit quiz answers | Yes |
| GET | `/:id/results` | Get quiz results | Yes |

#### Progress (`/api/progress`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user's learning analytics | Yes |

---

## Frontend Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React 19.2.0 | UI library |
| Build Tool | Vite 7.2.4 | Bundler & dev server |
| Router | React Router 7.9.6 | Client-side routing |
| Styling | TailwindCSS 4.1.17 | Utility-first CSS |
| HTTP Client | Axios 1.13.2 | API communication |
| Notifications | React Hot Toast 2.6.0 | Toast messages |
| Icons | Lucide React 0.554.0 | Icon components |
| Markdown | React Markdown 10.1.0 | Render markdown content |
| Syntax Highlighting | React Syntax Highlighter 16.1.0 | Code blocks |

### Router Configuration

**File:** `frontend/src/App.jsx`

**Protected Routes** (require authentication):
- `/dashboard` - Overview with learning progress
- `/documents` - Document list and upload
- `/documents/:id` - Document detail page
- `/documents/:id/flashcards` - Flashcard management
- `/flashcards` - Global flashcard list
- `/quizzes/:quizId` - Quiz taking interface
- `/quizzes/:quizId/results` - Quiz results
- `/profile` - User profile management

**Public Routes:**
- `/login` - Login page
- `/register` - Registration page
- `/` - Redirect to `/dashboard` or `/login`

### State Management

#### AuthContext
**File:** `frontend/src/context/AuthContext.jsx`

**State:**
```javascript
{
  user: Object | null,
  token: String | null,
  isAuthenticated: Boolean,
  loading: Boolean,
  login: Function,
  logout: Function,
  checkAuthStatus: Function
}
```

**Persistence:**
- Token and user data stored in `localStorage`
- Automatically restored on page reload
- `checkAuthStatus()` validates token on startup

### API Layer

**File:** `frontend/src/utils/axiosInstance.js`

**Axios Instance Configuration:**
```javascript
{
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
}
```

**Request Interceptor:**
```javascript
// Automatically attach JWT token
axiosInstance.config.headers.Authorization = `Bearer ${token}`;
```

**Response Interceptor:**
```javascript
// Handle errors globally
// - 401: Redirect to login
// - 4xx/5xx: Show toast notification
```

**Service Pattern:**
```
API Paths (apiPaths.js) → Service Functions → Axios Instance
```

### Component Architecture

#### Layout Components

**AppLayout** (`frontend/src/components/layout/AppLayout.jsx`)
- Wrapper for protected routes
- Contains Header component
- Provides consistent spacing and structure

**Header** (`frontend/src/components/layout/Header.jsx`)
- App branding/logo
- Navigation links
- User dropdown menu
- Dark mode toggle

#### Feature Components

**AIActions** (`frontend/src/components/ai/AIActions.jsx`)
- Buttons for AI features on document detail page
- Actions: Summarize, Generate Flashcards, Generate Quiz, Chat
- Loading states with toast notifications
- Progress tracking

**ChatInterface** (`frontend/src/components/chat/ChatInterface.jsx`)
- Chat UI for document-specific questions
- Message history
- Streaming responses
- Context-aware responses based on document content

**DocumentCard** (`frontend/src/components/documents/DocumentCard.jsx`)
- List item for documents
- Title, upload date, file size
- Actions: View, Edit, Delete
- Link to detail page

**FlashcardManager** (`frontend/src/components/flashcards/FlashcardManager.jsx`)
- Review controls for flashcards
- Shuffle, flip, next/previous navigation
- Progress indicators
- Add new card functionality

**QuizManager** (`frontend/src/components/quizzes/QuizManager.jsx`)
- Quiz taking interface
- Question navigation
- Answer selection
- Submit quiz functionality
- Score calculation

### Routing Guards

**ProtectedRoute** (`frontend/src/components/auth/ProtectedRoute.jsx`)

```javascript
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return children;
}
```

### Utility Components

**MarkdownRenderer** (`frontend/src/components/common/MarkdownRenderer.jsx`)
- Renders markdown content from documents
- Syntax highlighting for code blocks
- GFM support (tables, strikethrough, task lists)

**Modal** (`frontend/src/components/common/Modal.jsx`)
- Reusable modal dialog
- Overlay backdrop
- Close on escape/overlay click
- Customizable content area

---

## AI Integration

### Google GenAI Integration

**Library:** `@google/genai`

**Configuration:**
```javascript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
```

### Document Chat Flow

**Implementation:** `backend/controllers/aiController.js`

```
User sends message → Attach document content as context →
Send to Google GenAI with system prompt →
Stream response → Store in chat history → Return to frontend
```

**System Prompt Example:**
```
You are a helpful AI assistant that answers questions based on the following document:

{documentContent}

Answer questions only using the information from this document.
If the answer is not in the document, say you don't have enough information.
```

### Flashcard Generation Flow

**Implementation:** `backend/controllers/aiController.js`

```
Request body: { documentId, count } →
Find document →
Extract text →
Send to GenAI with prompt for flashcard generation →
Parse JSON response →
Create Flashcard documents in database →
Return created flashcards
```

**Prompt Structure:**
```
Generate {count} flashcards from this document about key concepts.
Format as JSON array:
[
  {
    "front": "Question",
    "back": "Answer"
  }
]

Document: {text}
```

### Quiz Generation Flow

**Implementation:** `backend/controllers/aiController.js`

```
Request body: { documentId, count } →
Find document →
Extract text →
Send to GenAI for quiz questions →
Parse JSON response →
Create Quiz document →
Return quiz details
```

**Quiz Prompt Structure:**
```
Generate {count} multiple-choice questions from this document.
Format as JSON array:
[
  {
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer": 0 (zero-indexed correct answer)
  }
]

Document: {text}
```

---

## File Upload Processing

### PDF Upload Flow

**File:** `backend/routes/documents.js`

```
1. POST /api/documents/upload
2. Multer middleware captures PDF file
3. File saved to uploads/ directory
4. pdf-parse extracts text content
5. DocumentModel.create() with metadata and content
6. Return uploaded document data
```

**Upload Configuration** (`backend/config/multer.js`):
```javascript
{
  dest: './uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: acceptPDFOnly
}
```

**PDF Parsing** (`backend/utils/pdfParser.js`):
```javascript
import pdfParse from 'pdf-parse';

async function parsePDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text; // Extracted plain text
}
```

---

## Security Considerations

### Authentication Security
- Passwords hashed with bcrypt (10 rounds)
- JWT expiration configured (7 days)
- Token verified on every protected request
- Password not returned in API responses

### Authorization
- User ownership validation on all operations
- Middleware ensures requestor owns resource
- No cross-user data access

### Input Validation
- express-validator on all POST/PUT endpoints
- Email format validation
- Username length constraints
- File type validation for uploads

### API Security
- CORS configured for frontend origin
- Rate limiting recommended for production
- Environment variables for secrets
- No sensitive data in logs

---

## Development Patterns

### Monorepo Structure
- Independent `package.json` for frontend and backend
- Shared configuration via `bun` (recommended)
- Separate dev servers: 5173 (frontend), 8000 (backend)

### Code Organization
- Feature-based routing (React Router v7)
- Service layer for API calls
- Reusable component library
- Centralized constants (API paths)

### Error Handling
- Try/catch in controllers
- Centralized error middleware
- Consistent error response format
- Toast notifications for client errors

### Styling Approach
- TailwindCSS v4 utility classes
- Dark mode support via `dark:` variants
- Responsive design with breakpoints
- CSS variables for theme colors

---

## Deployment Considerations

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=production|development
PORT=8000
MONGODB_URI=mongodb://localhost:27017/ai-docs-assistant
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
GOOGLE_API_KEY=your-google-api-key
UPLOAD_DIR=./uploads
```

**Frontend (.env or runtime):**
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Build Process

**Frontend:**
```bash
bun run build  # Produces dist/ directory
bun run preview  # Preview production build
```

**Backend:**
```bash
bun run start  # Production startup
bun run dev    # Development with nodemon
```

### Production Requirements
- Use production MongoDB instance
- Set `NODE_ENV=production`
- Use reverse proxy (Nginx/Apache) for static files
- Enable HTTPS
- Configure CORS for production domain
- Use secure JWT_SECRET
- Implement rate limiting
- Set up monitoring and logging

---

## Performance Optimizations

### Frontend
- Lazy loading of route components
- Code splitting with React.lazy
- Image optimization via Vite
- Bundle analysis ready

### Backend
- PDF parsing async/await
- Database indexes on user references
- Pagination for large lists (not implemented)
- Caching strategies for AI responses (not implemented)

### Database
- Mongoose lean queries for read-heavy operations
- Population for references
- Proper indexing on foreign keys

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## File Upload Storage

### Local Storage
- Directory: `backend/uploads/`
- Storage: Physical PDF files
- Reference: Stored in Document model

### File Lifecycle
1. Upload → File stored, content extracted
2. Document updated → Content stored in DB
3. Delete document → File removed from disk

---

## Testing Strategy

### Manual Testing
- Authentication flow
- Document upload and processing
- AI feature generation
- Quiz taking and results
- Flashcard review

### Recommended Tests
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Load testing for AI endpoints

---

## Future Enhancements

### Planned Features
- Email verification
- Password reset flow
- Document sharing
- Collaborative flashcards
- Export quiz results
- Mobile app
- API rate limiting
- Cache layer (Redis)
- Analytics dashboard
- User notifications
- Import from URL

### Technical Improvements
- WebSocket for chat streaming
- Search and filtering
- Document versioning
- Bulk operations
- Webhook integrations
- GraphQL API layer
- Microservices architecture
