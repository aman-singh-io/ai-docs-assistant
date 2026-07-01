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
