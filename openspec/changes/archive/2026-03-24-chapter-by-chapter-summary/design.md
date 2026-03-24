## Context

Current state: Document detail view has AI actions (summarization, flashcards, quiz, chat). Long documents (textbooks, manuals) lack structural navigation. Users must scroll through entire extracted text to find specific sections.

AI service currently handles: summarization, flashcard generation, quiz generation, chat. All use Google GenAI.

Chapter summaries are ephemeral (per PRD requirement #3.3) - displayed but not persisted to database.

## Goals / Non-Goals

**Goals:**

- Detect chapter boundaries in long-form documents using AI analysis
- Generate structured output: chapter title, summary, key takeaways per chapter
- Display chapter list with expandable details in document detail view
- On-demand generation (no caching required based on PRD #3.3)
- Integrate seamlessly with existing `AIActions.jsx` component

**Non-Goals:**

- Database storage for chapter summaries
- Manual chapter definition/editing by users
- Chapter reordering or merging capabilities
- Cross-document chapter comparison

## Decisions

**Chapter Detection Approach:**

- **Choice**: AI-powered automatic detection using Google GenAI prompt
- **Rationale**: PDFs have varying structures (explicit headers, page breaks, numbering). Rule-based detection is unreliable. AI can identify semantic chapter boundaries.
- **Prompt Strategy**: Extract chapter boundaries from extracted text, identify patterns like "Chapter 1", "Chapter 1: Title", "Chapter One", numbered sections, or clear topic shifts.

**UI Integration:**

- **Choice**: New `ChapterSummaryView.jsx` component with collapsible chapter list
- **Placement**: Adjacent to existing AI action buttons in document detail view (with loading toast notification)
- **Display**: Expandable accordion - list view shows chapter titles; click to expand shows summary + takeaways

**API Design:**

- **Endpoint**: `POST /api/ai/summarize-chapters/:documentId`
- **Response**: Array of chapter objects `{ chapterNumber, title, summary, keyTakeaways }`
- **Rationale**: POST method triggers generation; documentId ensures user ownership check

**Frontend State:**

- **Choice**: Client-side state only (no Redux/Context persistence)
- **Rationale**: Ephemeral data; regenerating is fast; no need for persistence complexity

## Risks / Trade-offs

| Risk                                                  | Mitigation                                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Slow AI response time for long documents (5+ minutes) | Show loading spinner + toast notification; set timeout (120s); consider streaming updates |
| Chapter detection accuracy issues                     | Provide "Regenerate" button; allow user to manually correct in future iteration           |
| Large responses with many chapters                    | Stream chapter data as available; chunk UI updates; handle 50+ chapters gracefully        |
| Cost of AI token usage                                | Cache responses client-side during session; rate limit per document/user if needed        |

## Migration Plan

1. **Backend**: Add new endpoint, existing AI service enhancement
2. **Frontend**: Add new component, update existing AIActions, add routes
3. **No database migration required** (ephemeral data)
4. **No breaking changes** to existing API contracts
5. **Rollback**: Disable new menu option if detection quality issues arise

## Open Questions

- What is optimal chapter detection prompt structure for Google GenAI?
- Should we show estimated time before generation for very long documents?
- Should chapter data be cached in client storage (IndexedDB) to avoid regeneration during same session?
- Are there specific document types (medical, legal) that require special chapter detection rules?
