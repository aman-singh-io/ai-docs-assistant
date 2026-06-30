## 1. Service Layer

- [x] 1.1 Create `frontend/src/services/characterService.js` with `getCharacters(documentId)` and `getRelationships(documentId)` functions calling the existing backend endpoints
- [x] 1.2 Verify both endpoints return the expected shape and log response structure for component use

## 2. Graph Canvas Component

- [x] 2.1 Create `frontend/src/components/GraphCanvas/GraphCanvas.jsx` — SVG element that fills its parent container
- [x] 2.2 Implement a two-stage spring layout: Fruchterman-Reingold simulation (80 iterations) with short-range hard repulsion (threshold=110px, factor=4×k), followed by a post-processing overlap resolution pass (up to 30 iterations, min separation=105px)
- [x] 2.3 Render character nodes as SVG `<circle>` elements with `<text>` labels
- [x] 2.4 Color-code edges by relationship type: ally=green, enemy=red, rival=orange, romantic/family=pink, mentor=purple, neutral=gray
- [x] 2.5 Use asymmetric canvas padding (`padL=80 padT=80 padR=160 padB=230`) to prevent nodes from being placed behind the legend overlay
- [x] 2.6 Implement three-layer SVG rendering: pass 1 = edge lines, pass 2 = node circles+labels, pass 3 = relationship-type badge pills (always on top)
- [x] 2.7 Add badge collision suppression: skip a badge if its midpoint is within `nodeRadius+14px` of any node center
- [x] 2.8 Add overlapping-node guard: suppress an edge line entirely if node centers are closer than the sum of their radii
- [x] 2.9 Wire `onClick` on each node circle to call an `onNodeClick(character)` prop
- [x] 2.10 Add a transparent wider hit target (`strokeWidth=16, stroke=transparent`) behind each edge line for easier hover/click

## 3. Chapter Slider Component

- [x] 3.1 Create `frontend/src/components/ChapterSlider/ChapterSlider.jsx` — a sticky bottom bar with a `<input type="range">` slider
- [x] 3.2 Display the current chapter value label above/beside the slider thumb
- [x] 3.3 Compute `min=1` and `max=maxChapter` from the relationship data passed as props
- [x] 3.4 Call an `onChange(chapter)` prop on every slider change event

## 4. Character Wiki Drawer Component

- [x] 4.1 Create `frontend/src/components/CharacterWikiDrawer/CharacterWikiDrawer.jsx` — right-side overlay drawer with slide-in CSS transition
- [x] 4.2 Render the header area with character name (large), status badge, and faction label
- [x] 4.3 Render the biography section with good typography (leading-relaxed, prose text color)
- [x] 4.4 Add a close button and a click-outside handler to dismiss the drawer
- [x] 4.5 Ensure drawer width is max 40% of viewport on desktop

## 5. Character Graph Page

- [x] 5.1 Create `frontend/src/pages/Characters/CharacterGraphPage.jsx` — page component that fetches data via `characterService` and holds `selectedChapter`, `selectedCharacter`, and `showCharacterList` state
- [x] 5.2 Filter nodes and edges client-side based on `selectedChapter` before passing to `GraphCanvas`
- [x] 5.3 Compose `GraphCanvas`, `ChapterSlider`, `CharacterWikiDrawer`, and the character list sidebar into the page layout
- [x] 5.4 Show a loading spinner while data is being fetched
- [x] 5.5 Show an empty state message when no characters exist for the document
- [x] 5.6 Compute `charactersByChapter` via `useMemo`: iterate `allRelationships` sorted by `chapterNumber`, track first-seen chapter per character, group alphabetically — filtered to `selectedChapter` scope
- [x] 5.7 Render collapsible left sidebar (240px) toggled by a "Characters" header button; sidebar lists characters grouped by first-appearance chapter with count badges and a total footer
- [x] 5.8 Clicking a character name in the sidebar calls `handleNodeClick` (same as graph node click) and highlights the selected name in emerald

## 6. Routing & Navigation

- [x] 6.1 Register the route `/documents/:id/characters` in the React Router config (wrapped in `ProtectedRoute`)
- [x] 6.2 Add a "View Characters" button/link on the existing `DocumentDetail` page that navigates to the new route
