# Add Persistent Chapter Summaries

**Version:** 1.0.0
**Status:** proposed

## Overview

Enhance the existing chapter summary feature to store generated chapter summaries in the database, allowing users to access chapter information without re-generating each time. This improves performance, user experience, and reduces AI API usage.

## Problem Statement

Currently, chapter summaries are generated on-demand each time a user requests them. This approach:

- Requires repeated AI processing for the same document
- Creates unnecessary API calls and costs
- Provides a suboptimal user experience for frequently accessed documents
- Doesn't persist chapter information across sessions

## Solution

Implement database storage for chapter summaries that:

- Stores generated chapter data with each document
- Retrieves and displays stored summaries when available
- Generates new summaries only when needed (document updates, manual refresh)
- Provides seamless user experience with minimal loading time

## Requirements

### Functional Requirements

1. **Persistent Storage**: Chapter summaries are stored in MongoDB with document
2. **Automatic Retrieval**: Stored summaries are displayed when available
3. **Manual Refresh**: Users can regenerate summaries to update stored data
4. **Version Control**: Track when summaries were generated and when documents were modified
5. **Fallback Behavior**: Generate new summaries if stored data is missing or outdated

### Technical Requirements

1. **Database Schema**: Extend Document model to include chapter summary data
2. **API Integration**: Update existing endpoint to check for stored data
3. **Performance**: Ensure minimal impact on document loading times
4. **Security**: Maintain document access controls for stored chapter data

## Implementation Plan

### Backend Changes

1. **Document Model Extension**
   - Add `chapters` array field to Document schema
   - Add `hasChapterSummaries` boolean flag
   - Add `chapterSummaryVersion` string field for version tracking

2. **Controller Logic**
   - Modify `generateChapterSummaries` endpoint to:
     - Check if stored chapters exist for the document
     - Return stored chapters if available and valid
     - Generate new chapters and store them if needed
   - Add logic to invalidate stored chapters when document content changes

3. **Service Layer**
   - Add helper functions for chapter data management
   - Implement version comparison logic

### Frontend Changes

1. **Component Updates**
   - Modify `ChapterSummaryView` to show loading state while checking for stored data
   - Add refresh button that triggers regeneration and storage update
   - Show clear indication of data freshness

2. **API Integration**
   - Update `aiService` to handle stored data
   - Implement optimistic UI updates for better perceived performance

### Data Flow

```
User clicks "Generate Chapter Summary"
        ↓
Frontend calls POST /api/ai/summarize-chapters/:documentId
        ↓
Backend checks if document has stored chapters
        ↓
If yes and valid → Return stored chapters immediately
        ↓
If no or outdated → Generate new chapters
        ↓
Store new chapters in document
        ↓
Return chapters to frontend
        ↓
Frontend displays chapter summaries
```

## Data Model Changes

### Document Model Extension

```javascript
{
  // ... existing document fields ...
  chapters: [
    {
      chapterNumber: Number,
      title: String,
      summary: String,
      keyTakeaways: [String],
      createdAt: Date,
      updatedAt: Date
    }
  ],
  hasChapterSummaries: Boolean,
  chapterSummaryVersion: String
}
```

## API Endpoints

### POST /api/ai/summarize-chapters/:documentId

**Behavior**:

- Check if document has stored chapters with valid version
- If valid stored chapters exist → return them immediately
- If no stored chapters or version is outdated → generate new chapters
- Store new chapters in document
- Return chapters to client

**Response (200 OK)**:

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
        "keyTakeaways": ["Key point 1", "Key point 2", "Key point 3"],
        "createdAt": "2026-03-24T10:00:00Z",
        "updatedAt": "2026-03-24T10:00:00Z"
      }
    ],
    "isCached": false, // Indicates if data was retrieved from cache
    "generatedAt": "2026-03-24T10:00:00Z" // When the data was generated
  }
}
```

## User Experience

### Before Enhancement

- User must wait for AI processing each time
- No persistent access to chapter information
- High API usage for repeated access

### After Enhancement

- Immediate access to chapter summaries
- Option to refresh when needed
- Reduced AI API usage
- Improved performance for frequently accessed documents

## Performance Considerations

1. **Database Queries**: Additional database reads for chapter data
2. **Storage**: Additional storage for chapter data in MongoDB
3. **Memory**: Increased memory usage for chapter data in application
4. **Network**: Reduced network requests for repeated access

## Security Considerations

1. **Access Control**: Ensure chapter data respects document ownership
2. **Data Sanitization**: Validate stored chapter data
3. **Versioning**: Prevent unauthorized data modification

## Testing Strategy

1. **Unit Tests**
   - Document model extension tests
   - Controller logic for stored vs new chapter retrieval
   - Version comparison logic

2. **User Acceptance Tests**
   - User experience validation
   - Edge case handling (very large documents, etc.)

## Future Enhancements

1. **Smart Caching**: Advanced cache invalidation based on document changes
2. **Export Functionality**: Allow users to export chapter summaries
3. **Chapter Search**: Enable searching within chapter summaries
4. **Progress Tracking**: Integrate with document reading progress tracking
