## Why

Chapter summary generation is the only pipeline step that reads raw chapter text. Everything downstream — character extraction, biography generation — only ever sees summary prose. Physical appearance details, clothing, notable objects, and even the full set of characters present in a chapter can be lost if the summary doesn't capture them. This leads to incomplete character wikis and missed characters in the relationship graph.

## What Changes

- The chapter summary AI prompt is extended to extract two new structured fields per chapter:
  - `characterDetails`: per-character physical appearance, clothing, and notable items (only characters with at least one detail)
  - `characterMentions`: ALL named characters present in the chapter, each with a brief role description and any relationships to other characters observed in that chapter — ensuring no character is missed downstream
- Both fields are added to the chapter subdocument schema and saved alongside the existing summary and keyTakeaways.
- The character relationship extraction step receives both `characterDetails` and `characterMentions` as context, giving the AI a pre-populated character list so it cannot overlook minor or briefly mentioned characters.
- The character biography generation receives aggregated `characterDetails` across all relevant chapters, enabling a new **Portrait** section (appearance, clothing evolution, possessions).

## Capabilities

### New Capabilities
- `character-detail-extraction`: Extract per-character physical appearance, clothing, item notes, and a complete character presence list (with preliminary relationships) from raw chapter text during summary generation, stored as structured data on each chapter.

### Modified Capabilities
- `chapter-summary`: The chapter summary generation prompt and response schema are extended to include `characterDetails` and `characterMentions` alongside the existing `summary` and `keyTakeaways` fields.
- `character-relationships`: The relationship extraction step now receives enriched chapter context (`characterDetails` + `characterMentions`) to improve accuracy and coverage.
- `character-biography`: The biography generation step aggregates `characterDetails` across chapters and produces a Portrait section in the wiki output.

## Impact

- **backend/models/Document.js** — chapter subdocument schema gains `characterDetails` and `characterMentions` array fields
- **backend/utils/chapterSummaryService.js** — AI prompt and response schema extended with both new fields
- **backend/controllers/aiController.js** — both fields mapped when saving chapter results
- **backend/utils/geminiService.js** — `extractRelationships()` receives `characterDetails` + `characterMentions` context; `generateCharacterProfile()` receives aggregated `characterDetails`
- **backend/controllers/characterController.js** — passes both fields from chapter records into service calls
- **No frontend changes** — the wiki biography drawer displays the new Portrait section naturally as part of the biography text
- **Existing summaries** — documents already processed will not have the new fields; they work as before (no re-generation forced)
