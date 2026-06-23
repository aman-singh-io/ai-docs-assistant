# Usage Instructions: Persistent Chapter Summaries

## Overview

The persistent chapter summaries feature allows you to generate and store AI-powered chapter breakdowns of your documents. This enables faster access to chapter information and improved user experience.

## How It Works

1. **Initial Generation**: When you click "Generate" for chapter summaries, the system analyzes your document content
2. **Storage**: Chapter data is automatically stored in the database for future access
3. **Caching**: Subsequent requests return cached data for faster performance
4. **Refresh**: You can manually refresh chapter summaries when document content changes

## Step-by-Step Guide

### 1. Access Document Page

Navigate to the document page where you want to generate chapter summaries:
- Go to the "Documents" section
- Select a document from your list
- The document page will display an AI actions panel on the right side

### 2. Generate Chapter Summaries

In the AI Actions panel, locate the "Chapter Summary" section:
1. Click the "Generate" button
2. Wait for the system to process your document (this may take a few moments)
3. The chapter breakdown will appear in the chapter summary view

### 3. View and Interact with Chapters

The chapter summary view displays:
- Chapter numbers and titles
- Detailed summaries of each chapter
- Key takeaways from each chapter
- Expandable/collapsible sections for easy navigation

### 4. Refresh Chapter Summaries

If your document content has changed:
1. Click the "Regenerate" button in the chapter summary view
2. The system will re-analyze the document and update stored summaries

## Requirements

### Document Size

Documents must contain at least 10,000 characters for effective chapter detection to work properly.

### Supported Formats

The feature works with PDF documents that have been successfully parsed by the system.

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Document too short" error | Ensure your document contains at least 10,000 characters |
| No chapters displayed | Check if your document has clear chapter structure or try regenerating |
| Slow processing time | Large documents may take several minutes to process |

### Error Handling

The system provides appropriate error messages for:
- Insufficient document length
- AI generation failures
- Database connection issues
- Access control violations

## Performance Tips

1. **Cache Utilization**: Subsequent access to the same document will return cached data instantly
2. **Manual Refresh**: Use the refresh button when document content changes to update stored summaries
3. **Document Organization**: Structure documents with clear chapter breaks for better results