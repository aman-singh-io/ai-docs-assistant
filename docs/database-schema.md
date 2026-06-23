# Database Schema Documentation

## Document Model

The Document model has been extended with chapter summary fields to support persistent chapter summaries.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `chapters` | Array of objects | Array containing chapter information |
| `hasChapterSummaries` | Boolean | Flag indicating if document has chapter summaries |
| `chapterSummaryVersion` | String | Version tracking for chapter summaries |

### Chapter Object Structure

Each chapter object contains:

```javascript
{
  chapterNumber: Number,      // Chapter number
  title: String,              // Chapter title
  summary: String,            // Detailed chapter summary
  keyTakeaways: [String],     // Key takeaways from the chapter
  createdAt: Date,            // Creation timestamp
  updatedAt: Date             // Last update timestamp
}
```

### Indexes

The following indexes have been added to improve query performance:

```javascript
// Index for faster queries by user and upload date
documentSchema.index({ userId: 1, uploadDate: -1 });

// Index for filtering documents with chapter summaries
documentSchema.index({ hasChapterSummaries: 1 });
```

## Migration Notes

When upgrading from a previous version, the database schema will be automatically updated through Mongoose's schema validation. The new fields are optional and have default values.