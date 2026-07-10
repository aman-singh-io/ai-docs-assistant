## 1. Prompt updates (non-narrative exclusion)

- [x] 1.1 In `backend/utils/chapterSummaryService.js`, add "prologues", "introductions", and "forewords" to the `🚫 COMPLETELY IGNORE` list in the `detectChapters` prompt, phrased as content-based (only when they lack real narrative content), not label-based
- [x] 1.2 Re-word the existing "Only include chapters containing real narrative content" rule so it explicitly states that a Prologue/Introduction/Foreword containing a scene, dialogue, or story action is still a valid chapter
- [x] 1.3 Add 1-2 concrete examples to the prompt (one excluded non-narrative prologue, one included narrative prologue) to reduce ambiguity for the model, consistent with how `extractRelationships`'s prompt already uses BAD/GOOD examples

## 2. Deterministic chapter numbering

- [x] 2.1 In `detectChapters`, after the existing title-based de-dup loop (`seenTitles`) produces `finalChapters`, add a renumbering pass that reassigns `chapterNumber` sequentially (`1..N`) in array order, independent of whatever `chapterNumber` the model emitted
- [x] 2.2 Ensure the renumbering pass runs after de-dup but does not mutate `title` or any other field — only `chapterNumber` is reassigned
- [x] 2.3 Keep the model's own per-chunk `chapterNumber` in the prompt/response schema as-is (used for the "start from chapter N+1" continuation instruction) — no change to the continuation-instruction logic itself
- [x] 2.4 Add a log line when the pipeline's reassigned `chapterNumber` differs from the model's originally emitted number for a chapter, to make restart/drift cases observable during testing

## 4. Verification against real documents

- [x] 4.1 Run chapter detection against at least one existing uploaded document known to have front matter (prologue/foreword) and confirm the exclusion behaves as expected
- [x] 4.2 If a multi-part document is available (or can be constructed) that restarts numbering, run detection against it and confirm `chapterNumber` continues sequentially in the persisted `Document.chapters`
- [x] 4.3 Spot-check that downstream features (character relationship extraction's `distinct('chapterNumber', ...)` incremental check, chapter slider) behave correctly against a freshly regenerated document
