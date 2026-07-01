## Why

Users need a visual, interactive way to explore character relationships extracted from their documents. The backend already has character profile and relationship graph APIs; there is currently no frontend UI to consume them.

## What Changes

- Add a new `CharacterGraphPage` route (`/documents/:id/characters`) with a full-screen relationship graph canvas
- Implement an SVG-based interactive network graph (nodes = characters, edges = relationships with color-coding)
- Add a sticky bottom "Chapter Slider" bar to filter the graph by chapter scope
- Add a right-side drawer that opens on node click, displaying the character wiki (name, status, faction, AI biography)
- Register the new route in the React Router config and add an entry point button on the document detail page
- Add a "Characters" sidebar panel listing all characters grouped by their first-appearance chapter, with click-to-profile navigation

## Capabilities

### New Capabilities
- `character-graph-view`: Full-screen interactive SVG relationship graph with chapter-scoped filtering, node click interaction, and correct layered rendering (lines → nodes → badges)
- `character-wiki-drawer`: Slide-in right drawer displaying a character's profile (name, status, faction, AI-generated biography)
- `chapter-slider`: Sticky bottom bar control that lets the user set the chapter scope for the graph display
- `character-list-panel`: Collapsible left sidebar listing all visible characters grouped by their first-appearance chapter; each entry is clickable to open the wiki drawer

### Modified Capabilities
- `relationship-graph`: Frontend will now consume the relationship graph API; no spec-level requirement changes, implementation only

## Impact

- **Frontend routes**: New page at `/documents/:id/characters`
- **Frontend components**: `CharacterGraphPage`, `GraphCanvas`, `CharacterWikiDrawer`, `ChapterSlider`
- **Frontend services**: New `characterService.js` to call `/api/characters` and `/api/relationships` endpoints
- **Backend**: No changes required (APIs already exist)
- **Dependencies**: No new packages required (pure SVG + existing Tailwind/Lucide stack); React Flow is optional but not added to keep bundle lean
