# Chapter Summary Generation

**Version:** 1.0.0
**Status:** implemented
**Related Proposal:** `chapter-by-chapter-summary/proposal.md`

## Overview

AI-powered chapter boundary detection and structured summary generation for long-form documents.

## Capabilities

### Detects chapter boundaries using AI

- Identifies semantic chapter breaks in extracted document text
- Handles various chapter formats (numbered, titled, unnumbered)
- Uses intelligent chunking with overlap to maintain context between sections

### Generates structured chapter summaries

- Produces chapter title
- Produces chapter summary (2-3 sentences)
- Produces key takeaways (3-5 bullet points)

### On-demand generation

- No database persistence
- Ephemeral display only
- Regenerate capability

## API Endpoints

### POST /api/ai/summarize-chapters/:documentId

**Auth Required:** Yes

**Description:** Triggers chapter detection and summary generation for specified document.

**Request Parameters:**

- `documentId` (path, required): ObjectId of the document to analyze

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "documentId": "507f1f77bcf86cd799439011",
    "title": "Sample Document",
    "chapters": [
      {
        "chapterNumber": 1,
        "title": "Introduction",
        "summary": "This chapter introduces the fundamental concepts of...",
        "keyTakeaways": ["Key point 1", "Key point 2", "Key point 3"]
      },
      {
        "chapterNumber": 2,
        "title": "Historical Context",
        "summary": "Historical development and background information...",
        "keyTakeaways": ["Key point 1", "Key point 2"]
      }
    ]
  }
}
```

**Response (404 Not Found):**

```json
{
  "success": false,
  "error": "Document not found or user does not have access"
}
```

**Response (422 Unprocessable Entity):**

```json
{
  "success": false,
  "error": "Document text too short (minimum 10,000 characters required for chapter detection)"
}
```

## Frontend Components

### ChapterSummaryView.jsx

**Purpose:** Display generated chapter summaries in document detail view.

**Props:**

```typescript
interface ChapterSummaryViewProps {
  documentId: string
  chapters: Chapter[] | null
  isLoading: boolean
  error: string | null
  onGenerate: () => Promise<void>
  onRefresh: () => Promise<void>
}

interface Chapter {
  chapterNumber: number
  title: string
  summary: string
  keyTakeaways: string[]
}
```

**Features:**

- Collapsible chapter list
- Chapter title preview (all chapters visible)
- Expanded view shows summary + takeaways (click chapter to expand)
- Loading spinner during generation
- Error state with retry button
- "Regenerate" button for current chapters
- Toast notification when generation completes
- Keyboard navigation support (tab to chapters, enter to expand)
- Accessibility attributes (aria-labels, loading announcements)

**User Flow:**

1. User clicks "Generate Chapter Summary" in `AIActions.jsx`
2. Loading spinner appears + toast notification shows
3. User can navigate away; summary auto-displays when loaded
4. View shows all chapter titles in accordion
5. Click chapter to expand with full details
6. "Regenerate" button available to refresh analysis

### AIActions.jsx Updates

**New Action Button:**

- Location: Existing AI actions menu/grid
- Label: "Chapter Summary"
- Icon: Book/sections icon
- Action: Triggers `onGenerateChapters()`
- Shows loading toast: "Generating chapter summary..."

**Existing Actions to Support:**

- "Summary" - document-level summary
- "Flashcards" - generate study flashcards
- "Quiz" - create quiz from document
- "Chat" - AI chat about document
- "Chapter Summary" - NEW

## Business Logic

### Chapter Detection Algorithm

**Step 1: Text Pre-processing**

- Use existing `pdf-parse` extracted text
- Clean whitespace, normalize line endings
- Identify text length (>10,000 characters triggers chapter detection)

**Step 2: Intelligent Chunking with Overlap**

- Text is split into chunks of 80,000 characters
- 10,000 character overlap between chunks to maintain context
- Chunking respects line breaks to avoid cutting sentences
- Context is maintained between chunks to avoid missing chapter boundaries

**Step 3: AI Prompt for Chapter Detection**

```
Analyze the text following and identify the new chapters.

This is the beginning of the document. Start numbering from chapter 1.

Rules:
- Identify chapter boundaries (Chapter 1, numbered sections, clear topic shifts).
- Provide a 2-3 sentence summary and 3-5 key takeaways.
- Only return chapters present in THIS text.
```

**Step 4: Context Management**

- Maintains chapter number and title context between chunks
- Prevents duplicate chapter entries from overlapping chunks
- Continues numbering from where previous chunk ended

**Step 5: Response Validation**

- Validate JSON structure
- Ensure all required fields present (chapterNumber, title, summary, keyTakeaways)
- Remove duplicate chapters based on title
- Sort chapters by chapterNumber

### Error Handling

| Scenario                        | User Message                                  | Action                               |
| ------------------------------- | --------------------------------------------- | ------------------------------------ |
| Document too short (<10k chars) | "Document too short for chapter detection"    | Disable chapter button, show tooltip |
| AI detection fails              | "Chapter detection failed. Please try again." | Show error state, retry available    |
| Network timeout (>120s)         | "Chapter generation timed out"                | Show error, retry available          |
| Unauthorized access             | "Document not accessible"                     | Redirect to document list            |

## Data Flow

```
User clicks "Chapter Summary"
        ↓
AIActions.jsx triggers onGenerateChapters()
        ↓
Frontend calls POST /api/ai/summarize-chapters/:documentId
        ↓
Backend validates documentId + user access
        ↓
AI service processes document text using chunking with overlap
        ↓
Returns structured chapter data
        ↓
Frontend stores in component state
        ↓
ChapterSummaryView renders with data
```

## Performance Considerations

- **Timeout**: 120 seconds (adjustable via API config)
- **Document Size Threshold**: Chapter detection enabled for >10,000 characters
- **Max Chapters**: Display up to 100 chapters without performance degradation
- **Chunked Rendering**: Large chapter lists render progressively
- **Intelligent Chunking**: 80,000 character chunks with 10,000 character overlap to maintain context

## Accessibility

- Keyboard navigation: Tab to chapters, Enter to expand
- Aria labels for expandable sections
- Loading state announced to screen readers
- Color contrast: 4.5:1 minimum for all text

## Security

- **Authentication**: JWT required, user owns document
- **Authorization**: Document belongs to authenticated user
- **Rate Limiting**: 10 requests per hour per user per document
- **Input Sanitization**: All AI-generated content sanitized before display

## Future Enhancements

- Manual chapter correction/editing
- Chapter reordering and merging
- Export chapter summary to document
- Cached chapter data (opt-in storage)
- Chapter search functionality

## MODIFIED Requirements

### Requirement: Generate chapter summaries with character details and mentions
The chapter summary generation system SHALL produce, for each chapter, the existing fields (`chapterNumber`, `title`, `summary`, `keyTakeaways`) plus:
- `characterDetails`: per-character physical appearance, clothing, and item notes (only characters with at least one detail)
- `characterMentions`: ALL named characters appearing in the chapter, each with a brief role description and any relationships to other characters observed in that chapter

#### Scenario: Successful chapter summary generation
- **WHEN** a user requests chapter summary generation for a document
- **THEN** the system SHALL return chapters each containing `chapterNumber`, `title`, `summary` (8–12 sentences), `keyTakeaways` (5–8 points), `characterDetails` (array, may be empty), and `characterMentions` (array, may be empty)

#### Scenario: characterMentions covers all named characters
- **WHEN** a chapter contains named characters who appear briefly or have no physical description
- **THEN** those characters SHALL still appear in `characterMentions` even if they are absent from `characterDetails`

#### Scenario: Chapter summary cached
- **WHEN** a document already has `hasChapterSummaries: true`
- **THEN** the system SHALL return the cached chapters without re-generation, even if `characterDetails` is absent on cached entries

## ADDED Requirements

### Requirement: Exclude non-narrative front matter from chapter detection
The chapter detection system SHALL exclude sections that lack real narrative content (no story, dialogue, action, or scene description) from the detected chapter list, regardless of their label. This exclusion SHALL apply to prologues, introductions, and forewords in addition to the existing excluded types (prefaces, author's notes, warnings, acknowledgements, title pages, dedications, epigraphs, tables of contents, glossaries, name indexes, and appendices).

The exclusion is content-based, not label-based: a section labeled "Prologue," "Introduction," or "Foreword" that contains actual narrative content (a scene, dialogue, or story action) SHALL be treated as a real chapter and included in the detected chapter list.

#### Scenario: Non-narrative prologue is excluded
- **WHEN** a document contains a section labeled "Prologue" that consists of expository or authorial content with no scene, dialogue, or story action
- **THEN** the system SHALL NOT include that section in the detected chapter list

#### Scenario: Narrative prologue is kept as a chapter
- **WHEN** a document contains a section labeled "Prologue" that contains a scene with dialogue, action, or story content
- **THEN** the system SHALL include that section in the detected chapter list as a chapter

#### Scenario: Introduction or foreword excluded when non-narrative
- **WHEN** a document contains a section labeled "Introduction" or "Foreword" that consists of expository or authorial content with no scene, dialogue, or story action
- **THEN** the system SHALL NOT include that section in the detected chapter list

### Requirement: Guarantee sequential, gap-free, duplicate-free chapter numbering
The chapter detection system SHALL assign each detected chapter a `chapterNumber` that is unique within the document and strictly increasing in document order (1, 2, 3, …), regardless of any chapter number or label present in the source text. This numbering SHALL be assigned deterministically after all chunks have been processed and merged, not taken verbatim from AI-generated output.

If the source text itself restarts its own chapter numbering (for example, a new Part or Book that begins again at "Chapter 1") or repeats a chapter number, the system SHALL continue its own `chapterNumber` sequence from the last chapter it already detected, rather than restarting or persisting two chapters with the same `chapterNumber`. The chapter `title` field SHALL preserve whatever heading text appeared in the source (including any source-native numbering it contains) — only the system-assigned `chapterNumber` is renumbered.

#### Scenario: Source text restarts numbering at a Part/Book boundary
- **WHEN** a document contains a section beginning "Chapter 1" after chapters 1 through 20 have already been detected earlier in the same document
- **THEN** the system SHALL assign that section `chapterNumber: 21` (continuing the sequence) instead of `chapterNumber: 1`, while preserving its original heading text in the `title` field

#### Scenario: No duplicate chapterNumber values persisted
- **WHEN** chapter detection completes across all chunks of a document
- **THEN** every chapter in `Document.chapters` SHALL have a `chapterNumber` value that does not repeat anywhere else in that document's `chapters` array

#### Scenario: Chapter numbers have no gaps
- **WHEN** chapter detection completes and N chapters have been detected
- **THEN** the persisted `chapterNumber` values SHALL be exactly `1` through `N` with no skipped numbers, even if the source text's own numbering (or the model's per-chunk numbering) contained gaps or resets
