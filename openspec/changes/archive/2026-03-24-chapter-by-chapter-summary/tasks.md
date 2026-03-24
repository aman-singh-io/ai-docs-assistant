## 1. Backend - New AI Endpoint

- [x] 1.1 Create POST /api/ai/summarize-chapters/:documentId endpoint in AI routes
- [x] 1.2 Add authentication middleware requirement to chapter endpoint
- [x] 1.3 Implement document ownership validation (user owns the document)
- [x] 1.4 Create document text extraction helper for chapter detection
- [x] 1.5 Add chapter detection prompt template to AI service
- [x] 1.6 Implement chapter response validation logic
- [ ] 1.7 Add rate limiting to chapter endpoint (10/hr per user per document)
- [x] 1.8 Add error handling for timeout (>120s) and document too short (<10k chars)

## 2. Frontend - New Components

- [x] 2.1 Create ChapterSummaryView.jsx component
- [x] 2.2 Implement collapsible chapter list with accordion UI
- [x] 2.3 Add loading spinner state management
- [x] 2.4 Add error state handling with retry button
- [x] 2.5 Implement "Regenerate" button for refreshing chapters
- [ ] 2.6 Create Chapter interface/type definitions (typescript)
- [x] 2.7 Add toasts for generation status (starting, completed, error)
- [x] 2.8 Implement keyboard navigation (tab to chapters, enter to expand)
- [x] 2.9 Add accessibility attributes (aria-labels, loading announcements)

## 3. Frontend - Integration

- [x] 3.1 Update AIActions.jsx to include "Chapter Summary" button
- [x] 3.2 Add "Chapter Summary" to existing AI actions grid/menu
- [x] 3.3 Wire up onGenerateChapters() callback to trigger API call
- [x] 3.4 Integrate ChapterSummaryView into document detail view page (as conditional render in AIActions)
- [x] 3.5 Add state management for chapter data (React useState)
- [x] 3.6 Add route or conditional render for displaying chapter view
- [x] 3.7 Handle disabled state for documents too short (<10k chars)
- [ ] 3.8 Test loading flow from button click to view display (requires manual testing)

## 4. API Integration

- [x] 4.1 Create API call helper function for chapter generation
- [x] 4.2 Implement error response handling (404, 422, 500)
- [ ] 4.3 Add network timeout handling for slow requests (requires implementation)
- [x] 4.4 Implement client-side caching (in-memory) for same session
- [ ] 4.5 Add retry logic with exponential backoff for failed requests (future enhancement)

## 5. Testing

- [ ] 5.1 Write unit test for ChapterSummaryView rendering
- [ ] 5.2 Write unit test for chapter generation error handling
- [ ] 5.3 Write unit test for collapse/expand functionality
- [ ] 5.4 Write backend test for endpoint authentication requirement
- [ ] 5.5 Write backend test for document ownership validation
- [ ] 5.6 Write backend test for chapter detection success case
- [ ] 5.7 Write backend test for document too short error case
- [ ] 5.8 Manual QA: Test with long textbook document (50+ pages)
- [ ] 5.9 Manual QA: Test with short document (should disable button)
- [ ] 5.10 Manual QA: Test chapter expansion and regeneration flow

## 6. Documentation

- [ ] 6.1 Update README.md with chapter summary feature description
- [ ] 6.2 Add API documentation for new endpoint to OpenAPI spec (if exists)
- [ ] 6.3 Document AI prompt template for chapter detection
- [ ] 6.4 Update user guide with chapter summary usage instructions
- [ ] 6.5 Add inline comments for chapter detection logic

## 7. Performance & Optimization

- [ ] 7.1 Profile chapter generation response times on long documents
- [ ] 7.2 Implement progressive rendering for 50+ chapter documents
- [ ] 7.3 Add timeout configuration option (default 120s)
- [ ] 7.4 Optimize chapter rendering for large lists (virtualization if needed)
- [ ] 7.5 Test memory usage during chapter generation

## 8. Accessibility Validation

- [ ] 8.1 Test with screen reader (NVDA or VoiceOver)
- [ ] 8.2 Verify keyboard-only navigation works
- [ ] 8.3 Confirm color contrast meets 4.5:1 requirement
- [ ] 8.4 Test focus management during loading states
- [ ] 8.5 Validate aria-live regions announce loading/completion

## 9. Security Review

- [ ] 9.1 Verify all user inputs are sanitized before display
- [ ] 9.2 Confirm AI-generated content is XSS-safe
- [ ] 9.3 Test unauthorized access rejection (non-owner tries access)
- [ ] 9.4 Verify rate limiting is enforced correctly
- [ ] 9.5 Check for potential DoS vectors (very long documents)

## 10. Deployment & Rollback

- [ ] 10.1 Deploy backend changes to staging environment
- [ ] 10.2 Deploy frontend changes to staging environment
- [ ] 10.3 Verify both work together in staging
- [ ] 10.4 Create deployment rollback procedure documentation
- [ ] 10.5 Plan feature flag strategy for gradual rollout (optional)
- [ ] 10.6 Deploy to production
- [ ] 10.7 Monitor error rates and performance after deployment
