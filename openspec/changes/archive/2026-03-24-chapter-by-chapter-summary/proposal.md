## Why

Users learning from long-form documents (textbooks, research papers, books) need structural breakdown to understand the content organization and focus on specific sections. Currently, the AI Docs Assistant only provides overall document summaries without chapter-level granularity, limiting effective study workflows for lengthy materials.

## What Changes

- **New AI endpoint** for chapter detection and summary generation
- **On-demand chapter extraction** that identifies chapter boundaries using AI analysis
- **UI integration** in `AIActions.jsx` and new display component for chapter summaries
- **Frontend routing** for viewing generated chapter breakdowns
- **No database storage** for chapter summaries (ephemeral, display-only data)
- **BREAKING**: None

## Capabilities

### New Capabilities

- `chapter-summary-generation`: AI-powered chapter boundary detection and structured summary output (title, summary, key takeaways)

### Modified Capabilities

None

## Impact

- **Backend**: New `/api/ai/summarize-chapters/:documentId` endpoint, updated AI service with chapter detection logic
- **Frontend**: New `ChapterSummaryView.jsx` component, updated `AIActions.jsx`, new routes for chapter viewing
- **API**: New endpoint requiring auth middleware
- **Database**: No schema changes (ephemeral data)
- **Dependencies**: May require prompt engineering optimization for chapter detection accuracy
