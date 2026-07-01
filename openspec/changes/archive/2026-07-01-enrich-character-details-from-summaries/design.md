## Context

The AI Docs Assistant processes PDF documents into chapter summaries, then uses those summaries for downstream tasks: character relationship extraction and character biography generation. The pipeline is strictly one-directional — raw text is read once during summary generation and is never revisited. Any information (physical appearance, clothing, possessions) not captured in the summary is permanently lost to downstream features.

The character wiki drawer currently generates biographies from chapter summaries using a regex filter to find chapters where the character appears. These biographies lack visual/material detail because summaries don't capture it.

## Goals / Non-Goals

**Goals:**
- Capture per-character detail notes (physical appearance, clothing, notable items) during chapter summary generation, where raw text is available
- Store these notes in a structured `characterDetails` field on each chapter subdocument
- Thread `characterDetails` into the character extraction and biography generation AI prompts
- Add a Portrait section to character biographies in the wiki drawer

**Non-Goals:**
- Re-generating existing chapter summaries (no forced cache invalidation)
- Frontend UI changes for displaying structured character data (detail appears as biography prose)
- Extracting detail from documents without chapter summaries

## Decisions

### 1. Enrich at summary generation, not at character extraction

**Decision:** Add detail extraction to `chapterSummaryService.js` (runs on raw text), not to `geminiService.js` `extractRelationships()` (runs on summaries).

**Rationale:** Character extraction only sees summary text. By the time it runs, fine-grained details (hair colour, sword description) may already be absent from the summary. Enriching at the source — while raw text is available — ensures nothing is lost.

**Alternative considered:** Extend the relationship extraction prompt to also ask for appearance. Rejected because the input is already a summary, so the AI can only surface detail the summary already contains.

---

### 2. Structured fields over free-form description string

**Decision:** Store `characterDetails` as `[{ name, physicalAppearance, clothing, items[] }]` — three distinct typed fields — rather than a single `description` string.

**Rationale:** Structured fields allow downstream consumers (biography prompt, extraction prompt) to selectively include relevant parts and to format them differently. A single string conflates all detail types and makes future display (e.g., a sidebar card) harder.

**Alternative considered:** Single `description: string` per character. Simpler to prompt for, but harder to use selectively downstream.

---

### 3. No forced re-generation of existing summaries

**Decision:** Documents with `hasChapterSummaries: true` are returned from cache as-is. Their chapters will have `characterDetails: []`.

**Rationale:** Re-generation is costly (API calls, rate limits) and potentially disruptive for users who have already built character graphs from existing summaries. The pipeline degrades gracefully — `characterDetails: []` is handled by all downstream consumers with a simple check.

**Alternative considered:** Bump `chapterSummaryVersion` to invalidate cache. Rejected as it forces re-processing costs on all existing users without their consent.

---

### 4. Append context to existing prompts, not new API calls

**Decision:** Pass `characterDetails` as additional context strings prepended to existing relationship extraction and biography prompts. No new Gemini calls.

**Rationale:** Keeps the pipeline the same number of API calls. The context window easily fits the structured detail notes alongside existing summary text.

## Risks / Trade-offs

- **AI hallucination of appearance** → Prompt instructs the AI to only extract details explicitly stated in the chapter text, and to return empty strings/arrays if nothing is mentioned. Biography generation must not invent details.
- **Empty characterDetails on existing data** → Downstream consumers check for empty arrays/strings and omit the Portrait section gracefully rather than showing "No appearance found" in every bio.
- **Prompt length increase** → Aggregating characterDetails across many chapters for biography generation increases prompt size. Mitigated by only including chapters where the character appears (already filtered by existing logic).
- **Name inconsistency across chapters** → The same character may be named slightly differently across chapters (e.g., "Calder" vs "Prince Calder"). The existing `cleanCharacterName()` utility handles titles, but variant names in `characterDetails` may not match. Mitigation: biography generation receives character name as the lookup key; the prompt instructs the AI to match by the canonical name.

## Migration Plan

1. Deploy schema change (`characterDetails` field on chapter subdocument) — additive, no migration needed (existing documents default to `characterDetails: []` per Mongoose default).
2. Deploy prompt and controller changes.
3. New documents processed after deployment will have enriched `characterDetails`.
4. Existing documents: users can delete chapter summaries from their document and regenerate if they want enriched data (no automated migration).
