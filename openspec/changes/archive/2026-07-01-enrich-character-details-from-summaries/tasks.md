## 1. Schema

- [x] 1.1 Add `characterDetails` array field to the chapter subdocument in `backend/models/Document.js` with sub-fields: `name` (String), `physicalAppearance` (String, default `""`), `clothing` (String, default `""`), `items` ([String], default `[]`)
- [x] 1.2 Add `characterMentions` array field to the chapter subdocument in `backend/models/Document.js` with sub-fields: `name` (String), `role` (String, default `""`), `relationships` ([{ with: String, note: String }], default `[]`)

## 2. Chapter Summary AI Prompt

- [x] 2.1 Extend the `PROMPT` constant in `backend/utils/chapterSummaryService.js` to request a `characterDetails` field — extracting physical appearance, clothing, and notable items per character; omit characters with no detail at all
- [x] 2.2 Extend the `PROMPT` to also request a `characterMentions` field — listing ALL named characters present in the chapter with their `role` (brief, 1 sentence) and `relationships` (interactions with other named characters observed in this chapter); every named character must be included even if briefly mentioned
- [x] 2.3 Update the Gemini response schema in `chapterSummaryService.js` to declare both `characterDetails` and `characterMentions` with their full object shapes

## 3. Save Character Data

- [x] 3.1 In `backend/controllers/aiController.js` `generateChapterSummaries`, map `chapter.characterDetails || []` and `chapter.characterMentions || []` when constructing each chapter object before saving to the document

## 4. Thread Context into Character Extraction

- [x] 4.1 In `backend/utils/geminiService.js` `extractRelationships()`, accept optional `characterDetails` and `characterMentions` parameters; when non-empty, prepend two context blocks to the extraction prompt:
  - A block listing each character's known appearance, clothing, and items (from `characterDetails`)
  - A block listing all known characters in the chapter with their roles and preliminary relationships (from `characterMentions`), with an explicit instruction to not miss these characters
- [x] 4.2 In `backend/controllers/characterController.js` `extractRelationships` handler, fetch both `characterDetails` and `characterMentions` from each chapter record and pass them to `extractRelationshipsFromLLM()`

## 5. Thread Details into Biography Generation

- [x] 5.1 In `backend/utils/geminiService.js` `generateCharacterProfile()`, accept an optional `aggregatedDetails` parameter and, when non-empty, prepend a formatted appearance context block to the biography prompt; add a Portrait section instruction to the prompt
- [x] 5.2 In `backend/controllers/characterController.js` `getCharacterProfile` handler, collect and aggregate `characterDetails` entries matching the character name (case-insensitive) across the relevant chapters array, then pass the aggregated result to `generateProfileFromLLM()`

## 6. Verification

- [ ] 6.1 Upload a new document and generate chapter summaries — verify both `characterDetails` and `characterMentions` are populated in MongoDB
- [ ] 6.2 Verify `characterMentions` includes characters who appear briefly (with no physical description) — they should appear in `characterMentions` but not in `characterDetails`
- [ ] 6.3 Run character extraction — verify the extraction prompt includes both the appearance context block and the character list block in server logs
- [ ] 6.4 Click a character node in the graph — verify the biography in the wiki drawer includes a Portrait section when appearance data exists
- [ ] 6.5 Test with a document that has no physical descriptions — verify `characterDetails: []` is stored and no Portrait section appears in the biography
