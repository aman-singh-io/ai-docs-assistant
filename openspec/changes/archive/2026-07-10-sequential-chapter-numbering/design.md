## Context

`detectChapters` (`backend/utils/chapterSummaryService.js`) processes a document in sequential 120K-character chunks (8K overlap). For each chunk it sends one Gemini call that returns an array of chapter objects, each carrying a model-assigned `chapterNumber`. Continuity across chunks is enforced only through a natural-language instruction in the next chunk's prompt ("the previous block ended on Chapter N — start from N+1"), and the only de-duplication after all chunks are merged is an exact-title match (`seenTitles`).

Two gaps follow from this:

1. **Exclusion list is incomplete.** The prompt lists specific non-narrative section types to skip (prefaces, author's notes, acknowledgements, title pages, dedications, epigraphs, tables of contents, glossaries) but does not name prologues, introductions, or forewords, even though the governing principle is already content-based ("Only include chapters containing real narrative content").
2. **Numbering correctness is entirely the model's responsibility.** If the source document itself contains an internal restart (a new Part/Book beginning again at "Chapter 1") or the model simply drifts, nothing downstream of the LLM call catches it. Title-based de-dup does not catch a distinct chapter that happens to reuse a prior number.

`chapterNumber` is treated as a unique key by every downstream consumer: `CharacterRelationship`'s incremental extraction (`distinct('chapterNumber', ...)` to figure out which chapters still need processing), the `upToChapter` ceiling filters in relationship queries and character-profile generation, and the frontend chapter slider. A duplicate or non-monotonic `chapterNumber` silently corrupts all of these without raising an error.

## Goals / Non-Goals

**Goals:**
- Add prologues, introductions, and forewords to the set of section types the detection prompt is told to skip, but only when they lack real narrative content (scene, dialogue, action) — preserve the existing content-based principle as the actual filter, per the resolved question in this change (narrative prologues are kept and numbered as chapters).
- Guarantee that the persisted `chapterNumber` on `Document.chapters` is strictly increasing with no gaps and no duplicates, regardless of what numbering the source text or the model itself proposes.
- Make numbering correction deterministic (plain code, not a second LLM call), applied once after all chunks are merged.

**Non-Goals:**
- Not changing chunk size, overlap, or the retry/backoff strategy for Gemini calls.
- Not adding a second LLM pass to re-classify already-generated chapters (no re-summarization).
- Not touching `extractRelationships`, `generateCharacterProfile`, or any other consumer of `chapterNumber` — they inherit correctness from this change without modification, since they already assume unique/increasing numbers.
- Not retroactively fixing already-persisted documents (`document.hasChapterSummaries === true` with pre-existing bad numbering) — out of scope unless you want a migration/regeneration path (see Open Questions).

## Decisions

### 1. Numbering is assigned by the pipeline, not trusted from the model

The model still emits its own perceived `chapterNumber` per chunk (kept in the prompt/schema) because it's useful as continuation context — it's what lets the "start from chapter N+1" instruction work at all, and it's a signal for detecting when the model thinks a restart happened. But after all chunks are collected, a deterministic post-processing pass reassigns the final `chapterNumber` for every chapter as `1, 2, 3, …` in document order (the order chapters were detected across chunks), independent of the model's own numbers.

**Alternative considered:** Keep trusting the model's numbers and only patch the prompt wording to be more insistent about continuity. Rejected — this is exactly the current approach, and the failure mode (a restart the model doesn't recognize as a restart) is a prompt-following failure, which prompt wording alone can't structurally guarantee. A deterministic pass makes duplicate/non-monotonic `chapterNumber` structurally impossible rather than merely less likely.

### 2. De-duplication stays title-based for *detecting the same chapter twice* (chunk overlap), separately from renumbering

The existing `seenTitles` de-dup (dropping a chapter whose lowercased title was already seen) is kept as-is — it solves a different problem (the 8K chunk overlap causing the same chapter to be re-emitted verbatim at a chunk boundary). Renumbering is a second, independent pass applied after de-dup, over the surviving chapter list, in the order chapters were originally appended (which is chunk order, i.e., document order).

**Alternative considered:** Merge de-dup and renumbering into a single pass keyed on the model's `chapterNumber`. Rejected — title collision and number collision are different failure modes (chunk-boundary repeat vs. source-text restart) and conflating them risks a real Part-2-Chapter-1 being dropped as a false-positive duplicate of Part-1-Chapter-1 if they happen to share a generic title.

### 3. Prologue/introduction/foreword exclusion is content-based, not label-based

Per the resolved design question: the prompt's exclusion list gains "prologues," "introductions," and "forewords" as named examples, but the instruction stays anchored to the existing narrative-content test ("Only include chapters containing real narrative content — story, dialogue, action, scene description"). A section labeled "Prologue" that contains an actual scene is kept and numbered as a chapter; one that's an author's expository note is skipped, same as a preface would be.

**Alternative considered:** Exclude any section labeled Prologue/Introduction/Foreword outright. Rejected per your answer — many books use "Prologue" for genuine opening narrative content, and label-based exclusion would silently discard real story chapters with no way for the user to recover them short of re-reading the source.

## Risks / Trade-offs

- **[Risk] Content-based prologue filtering still depends on the model's judgment of "narrative vs. not."** A borderline prologue (e.g., a short in-world document/letter presented as front matter) could be classified either way. → Mitigation: this is the same judgment call the existing prompt already makes for prefaces/notes today; no new failure mode is introduced, just a wider set of section types subject to the same existing rule.
- **[Risk] Pipeline-assigned numbering diverges from the source book's own chapter numbers/labels** (e.g., a book's real "Chapter 12" becomes the system's chapter 10 because two front-matter sections were skipped). → Mitigation: the chapter `title` field is untouched and still carries whatever label the source used (including "Chapter 12" if that's literally the heading text), so the original numbering isn't lost, just not used as the system's primary key. Worth confirming this is acceptable since it means `chapterNumber` (system) and the number embedded in `title` (source) can diverge.
- **[Risk] Existing documents with `hasChapterSummaries: true` already have whatever numbering (possibly duplicated) they were generated with**, and this change doesn't touch persisted data. → Mitigation: none automatic — see Open Questions on whether a regeneration path is needed.
- **[Trade-off] Renumbering after the fact means the model's in-context chapter number (used for its own continuation instructions) and the final persisted number can disagree** during generation. This is intentional (see Decision 1) but means log lines like "Extracting relationships for chapter: 7" during generation refer to the model's transient number, not necessarily the final one, until the post-processing pass runs at the end.

## Migration Plan

- No schema migration required (`chapterNumber` stays a `Number`).
- This only affects the `detectChapters` code path, which runs on demand (`POST /api/ai/summarize-chapters/:documentId`) and is skipped entirely for documents where `hasChapterSummaries` is already `true` (see `generateChapterSummaries` cache check in `aiController.js`). Existing generated documents are unaffected until a user explicitly regenerates.
- Rollback: revert the prompt/merge-logic changes in `chapterSummaryService.js`; no data cleanup needed since no schema or persisted-shape change is introduced.

## Open Questions

- Should already-generated documents with potentially duplicate `chapterNumber` values be flagged or offered a "regenerate" path, or is this acceptable to leave as-is until the user naturally regenerates?
- When the pipeline's assigned `chapterNumber` diverges from the number embedded in the source `title` (e.g., skipped front matter shifts everything down), should the UI surface both, or is the system's sequential number treated as the only one that matters?
