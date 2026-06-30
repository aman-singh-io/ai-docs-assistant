## ADDED Requirements

### Requirement: Batch-extract character relationships up to a chapter ceiling
The system SHALL accept a `documentId` and `upToChapter`, find all chapters where `chapterNumber <= upToChapter`, skip chapters that already have extracted relationships, and call the LLM for each remaining chapter. Extraction is incremental — already-processed chapters are never re-extracted unless explicitly requested.

#### Scenario: Successful batch extraction (first run)
- **WHEN** a POST request is made to `/api/characters/extract-relationships` with `{ documentId, upToChapter: 10 }` and no prior extraction exists
- **THEN** the system extracts relationships for all 10 chapters, saves them, and returns `{ success: true, data: { upToChapter, chaptersExtracted, chaptersSkipped, totalRelationships, relationships: [...] } }`

#### Scenario: Incremental extraction (partial prior run)
- **WHEN** chapters 1-5 were already extracted and a request arrives for `upToChapter: 10`
- **THEN** the system skips chapters 1-5, extracts only chapters 6-10, and reports `chaptersSkipped: 5, chaptersExtracted: 5`

#### Scenario: All chapters already extracted
- **WHEN** all chapters up to `upToChapter` already have relationship records
- **THEN** the system returns `chaptersExtracted: 0, chaptersSkipped: N, relationships: []` without calling the LLM

#### Scenario: A chapter has no relationships
- **WHEN** the LLM returns an empty array for a chapter with no inter-character interactions
- **THEN** the chapter is still counted as extracted (`chaptersExtracted` increments), and no records are inserted for that chapter

#### Scenario: No chapters found up to the ceiling
- **WHEN** the document has no chapters with `chapterNumber <= upToChapter`
- **THEN** the system returns `404` with `{ success: false, error: "No chapters found up to chapter N" }`

#### Scenario: Document not found
- **WHEN** the `documentId` does not match any document owned by the authenticated user
- **THEN** the system returns `404` with `{ success: false, error: "Document not found" }`

#### Scenario: Unauthenticated request
- **WHEN** no valid JWT token is included in the request
- **THEN** the system returns `401`

### Requirement: Structured relationship output from LLM
The LLM SHALL return relationships as a JSON array per chapter. Each relationship object SHALL contain `source` (full character name), `target` (full character name), `relationshipType` (one of: ally, enemy, family, rival, mentor, romantic, neutral), and `context` (1-2 sentence description).

#### Scenario: LLM returns valid structured JSON
- **WHEN** the LLM processes a chapter summary
- **THEN** the response is a JSON array matching the schema, with complete character names and a valid `relationshipType` enum value

#### Scenario: Idempotent re-call
- **WHEN** `extract-relationships` is called again for the same `upToChapter`
- **THEN** all chapters are skipped (already extracted) and no LLM calls are made
