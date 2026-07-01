## 1. Data Models

- [x] 1.1 Create `backend/models/CharacterRelationship.js` with fields: `document` (ref Document), `chapterNumber`, `source`, `target`, `relationshipType` (enum), `context`, timestamps
- [x] 1.2 Create `backend/models/CharacterProfile.js` with fields: `document` (ref Document), `characterName`, `upToChapter`, `profileText`, `generatedAt`, timestamps
- [x] 1.3 Add compound indexes to both models: `CharacterRelationship` on `{ document, chapterNumber }`, `CharacterProfile` on `{ document, upToChapter }`

## 2. Gemini Service Functions

- [x] 2.1 Add `extractRelationships(chapterSummary, chapterNumber)` to `geminiService.js` — uses structured JSON output with `responseSchema` matching the relationship shape
- [x] 2.2 Add `generateCharacterProfile(characterName, upToChapter, summaries)` to `geminiService.js` — plain text output with a spoiler-safe prompt instructing the LLM to ignore events past `upToChapter`

## 3. Controller

- [x] 3.1 Create `backend/controllers/characterController.js`
- [x] 3.2 Implement `extractRelationships` handler: accept `{ documentId, upToChapter }`, find chapters 1..N, skip already-extracted ones, call LLM per missing chapter, insert records, return `{ chaptersExtracted, chaptersSkipped, totalRelationships, relationships }`
- [x] 3.3 Implement `getRelationships` handler: validate query params, query `CharacterRelationship` where `{ document, chapterNumber: { $lte: upToChapter } }`, return array
- [x] 3.4 Implement `getCharacterProfile` handler: validate query params, find document, filter chapters case-insensitively, check cache, call LLM on miss, save cache, return profile with `fromCache` flag

## 4. Routes & Registration

- [x] 4.1 Create `backend/routes/characterRoutes.js` with `protect` middleware and the 3 route definitions
- [x] 4.2 Register the router in `backend/server.js` as `app.use('/api/characters', characterRoutes)`

## 5. Verification

- [ ] 5.1 Test `POST /api/characters/extract-relationships` with `{ documentId, upToChapter: 5 }` — confirm `chaptersExtracted: 5`, second call returns `chaptersSkipped: 5, chaptersExtracted: 0`, then calling with `upToChapter: 8` extracts only chapters 6-8
- [ ] 5.2 Test `GET /api/characters/relationships?documentId=...&upToChapter=5` — confirm only chapters 1-5 returned
- [ ] 5.3 Test `GET /api/characters/profile?documentId=...&name=...&upToChapter=10` — confirm profile generated, second call returns `fromCache: true`
- [ ] 5.4 Test chapter-not-found and character-not-found cases return correct 404 responses
