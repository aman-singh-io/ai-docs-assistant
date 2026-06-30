## Why

The app already generates rich chapter-by-chapter summaries for books, but has no way to track the characters and relationships within those stories. Users reading long books lose track of who knows whom, who turned enemy, or how a character evolved — this feature brings that intelligence to the surface without spoilers.

## What Changes

- New `CharacterRelationship` model to persist extracted entity relationships per chapter
- New `CharacterProfile` model to cache LLM-generated character biographies
- Two new Gemini service functions for relationship extraction and profile generation
- Three new REST endpoints under `/api/characters/`
- New Express router and controller for character features

## Capabilities

### New Capabilities

- `relationship-extraction`: POST endpoint that accepts a `upToChapter` ceiling, iterates all chapters 1..N, skips chapters already extracted (incremental), calls the LLM on missing chapters to extract character relationships (source, target, type, context), and saves the results
- `relationship-graph`: GET endpoint that returns all extracted relationships for a document up to a given chapter — enabling a dynamic relationship graph UI
- `character-profile`: GET endpoint that filters stored chapter summaries for a character (case-insensitive), passes them to the LLM to synthesize a spoiler-free wiki biography, caches the result, and returns it

### Modified Capabilities

- None

## Impact

- **New files**: `backend/models/CharacterRelationship.js`, `backend/models/CharacterProfile.js`, `backend/controllers/characterController.js`, `backend/routes/characterRoutes.js`
- **Modified files**: `backend/utils/geminiService.js` (2 new exported functions), `backend/server.js` (register new route)
- **API**: 3 new endpoints under `/api/characters/` (all protected by existing JWT middleware)
- **Database**: 2 new MongoDB collections (`characterrelationships`, `characterprofiles`)
- **Dependencies**: none — uses existing `@google/genai` and Mongoose
