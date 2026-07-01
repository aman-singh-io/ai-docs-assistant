## ADDED Requirements

### Requirement: Return all relationships up to a given chapter
The system SHALL accept `documentId` and `upToChapter` as query parameters and return all persisted `CharacterRelationship` records where `chapterNumber` is less than or equal to `upToChapter`, scoped to the authenticated user's document.

#### Scenario: Successful graph data retrieval
- **WHEN** a GET request is made to `/api/characters/relationships?documentId=...&upToChapter=10`
- **THEN** the system returns `{ success: true, data: { relationships: [...] } }` containing all relationships from chapters 1 through 10

#### Scenario: No relationships extracted yet
- **WHEN** no extraction has been performed for the document
- **THEN** the system returns `{ success: true, data: { relationships: [] } }`

#### Scenario: Missing required query parameters
- **WHEN** `documentId` or `upToChapter` is absent from the query string
- **THEN** the system returns `400` with `{ success: false, error: "documentId and upToChapter are required" }`

#### Scenario: Unauthenticated request
- **WHEN** no valid JWT token is included in the request
- **THEN** the system returns `401`

### Requirement: Relationship records include chapter provenance
Each returned relationship SHALL include its `chapterNumber` so the client can filter or group relationships by chapter for progressive graph rendering.

#### Scenario: Graph data grouped by chapter
- **WHEN** the client receives the relationship array
- **THEN** every relationship object contains a `chapterNumber` field matching the chapter it was extracted from
