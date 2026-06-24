# Chapter Summaries Feature Documentation

## Overview

The chapter summaries feature allows users to generate AI-powered chapter breakdowns of their documents. These summaries are stored in the database for performance optimization and future access.

## API Endpoints

### POST /api/ai/summarize-chapters/:documentId

#### Request
```
POST /api/ai/summarize-chapters/:documentId
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

#### Response (200 OK)
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
    "isCached": false,
    "generatedAt": "2026-03-24T10:00:00Z"
  }
}
```

## Database Schema Changes

### Document Model Extension

The Document model has been extended to include chapter summary data:

```javascript
const documentSchema = new mongoose.Schema({
  // ... existing fields ...

  // Chapter summary data
  chapters: [{
    chapterNumber: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    keyTakeaways: [{
      type: String,
      required: true
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],

  hasChapterSummaries: {
    type: Boolean,
    default: false
  },

  chapterSummaryVersion: {
    type: String,
    default: 'v1.0.0' // Version tracking for updates
  }
});
```

## Implementation Logic

### Controller Flow

```javascript
// generateChapterSummaries controller logic
const generateChapterSummaries = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    // Verify document ownership and availability
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready',
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or not ready',
        statusCode: 404,
      });
    }

    // Check if document has valid stored chapters
    if (document.hasChapterSummaries && document.chapters && document.chapters.length > 0) {
      // Return cached chapters
      return res.status(200).json({
        success: true,
        data: {
          documentId: document._id,
          title: document.title,
          chapters: document.chapters,
          isCached: true,
          generatedAt: document.updatedAt
        },
        message: 'Chapter summaries retrieved from cache',
      });
    }

    // Generate new chapters (existing logic)
    const chapters = await detectChapters(document.extractedText);

    // Store chapters in document
    document.chapters = chapters;
    document.hasChapterSummaries = true;
    document.chapterSummaryVersion = 'v1.0.0';
    document.updatedAt = new Date();

    await document.save();

    res.status(200).json({
      success: true,
      data: {
        documentId: document._id,
        title: document.title,
        chapters,
        isCached: false,
        generatedAt: new Date()
      },
      message: 'Chapter summaries generated successfully',
    });
  } catch (error) {
    next(error);
  }
};
```

## Cache Management

### Version Tracking Strategy

1. **Version Field**: Each document stores a `chapterSummaryVersion`
2. **Invalidation**: When document content changes, invalidate stored chapters
3. **Manual Refresh**: Users can manually trigger regeneration

### Cache Invalidation Logic

```
Document Updated? ── Yes ──▶ Invalidate Stored Chapters
     │                           │
     └─ No ──────────────────────┘
```

## Performance Considerations

### Database Indexing

```javascript
// Indexes for optimal performance
documentSchema.index({ userId: 1, updatedAt: -1 });
documentSchema.index({ hasChapterSummaries: 1 });
```

### Memory Management

- Only load chapter data when needed
- Implement pagination for large chapter sets
- Use efficient data structures for chapter storage

## Security Considerations

1. **Access Control**: Chapter data respects document ownership
2. **Data Validation**: Validate all stored chapter data
3. **Versioning**: Prevent unauthorized data modification
4. **Rate Limiting**: Maintain existing rate limits for chapter generation

## Error Handling

### Edge Cases

1. **Document Too Short**: Still throw 422 error if document is too short
2. **AI Generation Failure**: Return stored data if available, otherwise error
3. **Database Errors**: Graceful degradation to cached data when possible

### Retry Logic

- Implement retry mechanism for database operations
- Log failures for monitoring and debugging