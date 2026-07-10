## ADDED Requirements

### Requirement: Exclude non-narrative front matter from chapter detection
The chapter detection system SHALL exclude sections that lack real narrative content (no story, dialogue, action, or scene description) from the detected chapter list, regardless of their label. This exclusion SHALL apply to prologues, introductions, and forewords in addition to the existing excluded types (prefaces, author's notes, warnings, acknowledgements, title pages, dedications, epigraphs, tables of contents, glossaries, name indexes, and appendices).

The exclusion is content-based, not label-based: a section labeled "Prologue," "Introduction," or "Foreword" that contains actual narrative content (a scene, dialogue, or story action) SHALL be treated as a real chapter and included in the detected chapter list.

#### Scenario: Non-narrative prologue is excluded
- **WHEN** a document contains a section labeled "Prologue" that consists of expository or authorial content with no scene, dialogue, or story action
- **THEN** the system SHALL NOT include that section in the detected chapter list

#### Scenario: Narrative prologue is kept as a chapter
- **WHEN** a document contains a section labeled "Prologue" that contains a scene with dialogue, action, or story content
- **THEN** the system SHALL include that section in the detected chapter list as a chapter

#### Scenario: Introduction or foreword excluded when non-narrative
- **WHEN** a document contains a section labeled "Introduction" or "Foreword" that consists of expository or authorial content with no scene, dialogue, or story action
- **THEN** the system SHALL NOT include that section in the detected chapter list

### Requirement: Guarantee sequential, gap-free, duplicate-free chapter numbering
The chapter detection system SHALL assign each detected chapter a `chapterNumber` that is unique within the document and strictly increasing in document order (1, 2, 3, …), regardless of any chapter number or label present in the source text. This numbering SHALL be assigned deterministically after all chunks have been processed and merged, not taken verbatim from AI-generated output.

If the source text itself restarts its own chapter numbering (for example, a new Part or Book that begins again at "Chapter 1") or repeats a chapter number, the system SHALL continue its own `chapterNumber` sequence from the last chapter it already detected, rather than restarting or persisting two chapters with the same `chapterNumber`. The chapter `title` field SHALL preserve whatever heading text appeared in the source (including any source-native numbering it contains) — only the system-assigned `chapterNumber` is renumbered.

#### Scenario: Source text restarts numbering at a Part/Book boundary
- **WHEN** a document contains a section beginning "Chapter 1" after chapters 1 through 20 have already been detected earlier in the same document
- **THEN** the system SHALL assign that section `chapterNumber: 21` (continuing the sequence) instead of `chapterNumber: 1`, while preserving its original heading text in the `title` field

#### Scenario: No duplicate chapterNumber values persisted
- **WHEN** chapter detection completes across all chunks of a document
- **THEN** every chapter in `Document.chapters` SHALL have a `chapterNumber` value that does not repeat anywhere else in that document's `chapters` array

#### Scenario: Chapter numbers have no gaps
- **WHEN** chapter detection completes and N chapters have been detected
- **THEN** the persisted `chapterNumber` values SHALL be exactly `1` through `N` with no skipped numbers, even if the source text's own numbering (or the model's per-chunk numbering) contained gaps or resets
