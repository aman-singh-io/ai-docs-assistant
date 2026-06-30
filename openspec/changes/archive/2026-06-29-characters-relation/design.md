## Context

The app stores chapter summaries in `Document.chapters[]` (each entry has `chapterNumber`, `title`, `summary`, `keyTakeaways`). There is no character tracking today. The Gemini integration in `geminiService.js` already supports structured JSON output via `responseMimeType: 'application/json'` and `responseSchema`. All AI routes are protected by the existing JWT middleware.

## Goals / Non-Goals

**Goals:**
- Extract and persist character relationships from individual chapter summaries
- Return all relationships up to a given chapter for graph rendering
- Generate and cache spoiler-free character biographies anchored to a chapter ceiling
- Fit into existing MVC + service layer pattern without changing other modules

**Non-Goals:**
- Frontend graph rendering (API only)
- Cross-document character linking
- Automatic extraction on summary generation (manual trigger only)
- Character name disambiguation / entity resolution across books

## Decisions

### 1. Two separate Mongoose collections, not embedded in Document

**Decision**: `CharacterRelationship` and `CharacterProfile` are standalone collections with a `document` foreign key.

**Rationale**: Embedding relationships in `Document.chapters[]` would bloat the document and make querying across chapters awkward. Standalone collections allow targeted queries (`{ document, chapterNumber: { $lte: N } }`) and independent deletion on re-extraction.

**Alternative considered**: Subdocument arrays inside Document — rejected because MongoDB has a 16MB document size limit and a heavily annotated book could exceed it.

---

### 2. Batch extraction with incremental skip (idempotent)

**Decision**: `POST /api/characters/extract-relationships` accepts `upToChapter` (not a single `chapterNumber`). It finds all chapters 1..N, skips those already having `CharacterRelationship` records, and calls the LLM only for the missing ones.

**Rationale**: Better UX — one call extracts a full arc instead of requiring N manual calls. The incremental skip makes repeat calls safe and cheap (no LLM calls on already-processed chapters). Calling the endpoint twice for the same `upToChapter` is a no-op on the second call.

---

### 3. Cache CharacterProfile by `(document, characterName, upToChapter)`

**Decision**: Before calling the LLM for a profile, query `CharacterProfile` with a case-insensitive regex on `characterName` and exact match on `upToChapter`. On cache miss, generate and persist.

**Rationale**: Profile generation potentially passes 10-20 summaries to the LLM. Caching avoids redundant API calls for identical requests. Cache key includes `upToChapter` so different chapter ceilings produce independent cached entries — no invalidation needed.

**Trade-off**: Cache entries are never invalidated. If chapter summaries are regenerated, stale profiles could persist. Acceptable for v1; a `POST /api/characters/profile/invalidate` endpoint can be added later.

---

### 4. Case-insensitive substring match for character filtering

**Decision**: Filter summaries for a character using `new RegExp(name, 'i')` tested against `chapter.summary`.

**Rationale**: Simple, zero-dependency, and sufficient for most character names. Full-name normalization is handled at prompt-level by instructing the LLM to use complete character names.

**Risk**: A short name like "Ed" could match "edited" or "educated". Mitigated by the LLM prompt using the full form of names. Future improvement: word-boundary regex (`\bEd\b`).

---

### 5. LLM model: `gemini-2.5-flash-lite` for both functions

**Decision**: Use the same model as the rest of `geminiService.js`.

**Rationale**: Consistency and cost. Relationship extraction uses structured JSON output (already working in chapter summary service). Profile generation is plain text, same as `generateSummary`.

## Risks / Trade-offs

- **LLM hallucination on relationships** → Prompt explicitly restricts output to "only relationships described in this chapter". Users can re-extract if output looks wrong.
- **Empty relationship list for a chapter** → The LLM returns `[]`; the controller deletes old records and inserts nothing — valid state, returns empty array.
- **Character not mentioned in any chapter** → Profile endpoint returns `404` with a clear message instead of passing empty context to the LLM.
- **Rate limiting** → The existing chapter summary service has retry logic for 429/503. Character endpoints are one-shot manual calls (unlikely to hit rate limits), so no retry logic added for v1.
