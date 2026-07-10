## Why

Chapter detection (`detectChapters` in `backend/utils/chapterSummaryService.js`) currently only excludes a narrow set of front-matter types (prefaces, author's notes, acknowledgements, title pages, dedications, epigraphs) — prologues, introductions, and forewords are not on that list, so they can be detected and numbered as if they were narrative chapters. Separately, chapter numbers are assigned by the LLM itself, one 120K-character chunk at a time, using only a natural-language instruction ("start from chapter N+1") to keep numbering continuous. When the source text contains its own internal restart — a new Part/Book that begins again at "Chapter 1," or a duplicated chapter number — the current de-dup step (title-based only) does not catch it, so `Document.chapters` can end up with two entries sharing the same `chapterNumber`.

That duplication is not cosmetic: `chapterNumber` is used as a unique key downstream — `CharacterRelationship`'s per-chapter incremental extraction (`distinct('chapterNumber', ...)`), the `upToChapter` ceiling filters in relationship/profile generation, and the frontend chapter slider all assume one chapter per number. A restart or repeat silently breaks those assumptions.

## What Changes

- Expand the chapter-detection prompt's non-narrative exclusion list to explicitly cover prologues, introductions, and forewords, in addition to the existing exclusions (prefaces, author's notes, acknowledgements, title pages, dedications, epigraphs, tables of contents, glossaries).
- Guarantee strictly sequential, gap-free chapter numbering across the entire document, independent of whatever numbering/labeling the source text uses internally. If the source text restarts at "Chapter 1" (e.g., a new Part or Book) or repeats a chapter number, the system continues numbering from the last chapter it already detected instead of restarting or creating a duplicate `chapterNumber`.
- Move final chapter numbering out of LLM-controlled output and into a deterministic post-processing step: the model still emits its own perceived chapter number/title per chunk (for boundary detection and continuation context), but the persisted `chapterNumber` is assigned by the pipeline after merging chunks, not trusted verbatim from the model.
- Replace title-only de-duplication with de-duplication/renumbering logic that also detects and resolves duplicate or non-increasing `chapterNumber` values across the merged chapter list.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `chapter-summary-generation`: the chapter-detection algorithm's non-narrative exclusion rules and its chapter-numbering/de-duplication guarantees are changing (excludes prologues/introductions/forewords; numbering is now sequential and restart-proof by construction rather than by prompt instruction alone).

## Impact

- `backend/utils/chapterSummaryService.js`: prompt text (exclusion list) and post-chunk merge/numbering logic (`detectChapters`).
- `openspec/specs/chapter-summary-generation/spec.md`: delta requirements for excluded section types and chapter-numbering guarantees.
- Downstream consumers that key off `chapterNumber` (`backend/controllers/characterController.js`, `backend/controllers/aiController.js`, frontend chapter slider/summary views) are not changed directly but depend on this fix for correctness — no code changes expected there since they already assume unique, increasing `chapterNumber`.
- No database schema changes (`chapterNumber` remains a `Number` field on `Document.chapters`).
