## ADDED Requirements

### Requirement: Extract character details during chapter summary generation
During chapter summary generation, the system SHALL extract per-character detail notes for each chapter, capturing physical appearance, clothing, and notable items/possessions mentioned in the raw chapter text.

#### Scenario: Chapter contains physical description
- **WHEN** a chapter contains a physical description of a character (e.g., hair colour, eye colour, scars, build)
- **THEN** the generated chapter record SHALL include a `characterDetails` entry for that character with a non-empty `physicalAppearance` string

#### Scenario: Chapter contains clothing description
- **WHEN** a chapter describes what a character is wearing
- **THEN** the generated chapter record SHALL include a `characterDetails` entry with a non-empty `clothing` string for that character

#### Scenario: Chapter mentions a notable item or possession
- **WHEN** a chapter mentions a notable object carried or owned by a character (weapon, artefact, accessory)
- **THEN** the generated chapter record SHALL include a `characterDetails` entry with a non-empty `items` array containing that object

#### Scenario: Chapter has no character detail
- **WHEN** a chapter contains no physical descriptions, clothing descriptions, or notable item mentions
- **THEN** the `characterDetails` field SHALL be an empty array `[]`

#### Scenario: Character appears without detail in a chapter
- **WHEN** a character is mentioned in a chapter but no detail about their appearance, clothing, or items is present
- **THEN** that character SHALL NOT appear in `characterDetails` for that chapter

### Requirement: Store character details on chapter subdocument
The chapter subdocument schema SHALL include a `characterDetails` field — an array of objects with `name` (string), `physicalAppearance` (string), `clothing` (string), and `items` (array of strings).

#### Scenario: New chapter saved with details
- **WHEN** a chapter summary is generated and saved
- **THEN** the document's chapter subdocument SHALL include the `characterDetails` array alongside `summary` and `keyTakeaways`

#### Scenario: Existing chapter without details field
- **WHEN** an existing chapter subdocument does not have a `characterDetails` field
- **THEN** it SHALL default to an empty array without error

### Requirement: Extract all characters present in each chapter during summary generation
During chapter summary generation, the system SHALL identify and list ALL named characters who appear or are mentioned in the chapter — including those with no physical description — along with a brief note on their role and any relationships to other characters observed in that chapter.

#### Scenario: Chapter with multiple characters
- **WHEN** a chapter contains multiple named characters
- **THEN** the generated chapter record SHALL include a `characterMentions` entry for each named character, even if they appear only briefly

#### Scenario: Character mentioned without relationship
- **WHEN** a character is mentioned in a chapter but has no interaction with another character
- **THEN** they SHALL still appear in `characterMentions` with an empty `relationships` array

#### Scenario: Chapter with no named characters
- **WHEN** a chapter contains no named characters
- **THEN** `characterMentions` SHALL be an empty array `[]`

### Requirement: Store character mentions on chapter subdocument
The chapter subdocument schema SHALL include a `characterMentions` field — an array of objects with `name` (string), `role` (string, brief description of their role in this chapter), and `relationships` (array of `{ with: string, note: string }` objects describing interactions with other characters in this chapter).

#### Scenario: New chapter saved with character mentions
- **WHEN** a chapter summary is generated and saved
- **THEN** the document's chapter subdocument SHALL include the `characterMentions` array alongside `characterDetails`, `summary`, and `keyTakeaways`

#### Scenario: Existing chapter without characterMentions field
- **WHEN** an existing chapter subdocument does not have a `characterMentions` field
- **THEN** it SHALL default to an empty array without error

### Requirement: Character details and mentions passed as context to character extraction
When extracting character relationships from a chapter summary, the system SHALL include that chapter's `characterDetails` and `characterMentions` as additional context in the AI prompt.

#### Scenario: Extraction with character context present
- **WHEN** character relationship extraction runs on a chapter that has non-empty `characterDetails` or `characterMentions`
- **THEN** the extraction prompt SHALL include:
  - A formatted block listing each character's known appearance, clothing, and items (from `characterDetails`)
  - A formatted block listing all characters present in the chapter with their roles and observed relationships (from `characterMentions`)

#### Scenario: Extraction with no character context
- **WHEN** character relationship extraction runs on a chapter with both `characterDetails: []` and `characterMentions: []`
- **THEN** no context blocks are prepended and extraction runs as before

#### Scenario: No characters missed during extraction
- **WHEN** character relationship extraction runs on a chapter with non-empty `characterMentions`
- **THEN** the extraction prompt SHALL explicitly list the characters known to appear, so the AI does not overlook characters who are only briefly mentioned in the summary

### Requirement: Character details aggregated for biography generation
When generating a character biography, the system SHALL aggregate `characterDetails` entries matching the character across all relevant chapters and pass them as additional context.

#### Scenario: Biography with appearance data available
- **WHEN** a character biography is generated and at least one relevant chapter has a `characterDetails` entry for that character
- **THEN** the biography prompt SHALL include a formatted appearance context block and the output SHALL contain a Portrait section

#### Scenario: Biography with no appearance data
- **WHEN** a character biography is generated and no relevant chapter has `characterDetails` for that character
- **THEN** no appearance context block is added and the biography SHALL NOT include an empty Portrait section
