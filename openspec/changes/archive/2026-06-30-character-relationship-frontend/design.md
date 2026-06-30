## Context

The backend already exposes `/api/characters` and `/api/relationships` endpoints (character profiles, relationship edges). The frontend has no UI to display them. The existing document detail page (`/documents/:id`) is the natural launching point. The graph needs to be interactive and filterable by chapter without any new npm packages.

## Goals / Non-Goals

**Goals:**
- Build a full-screen character relationship graph page at `/documents/:id/characters`
- Render nodes (characters) and edges (relationships) as SVG elements
- Color-code edges by relationship type (ally = green, enemy = red, rival = orange, romantic/family = pink, mentor = purple, neutral = gray)
- Show relationship type as a badge pill on each edge (always rendered above nodes to avoid being hidden)
- Filter/scope graph to chapters 1–N via a sticky bottom slider
- Open a right-side drawer on node click showing character profile + AI biography
- Add a navigation button on the existing document detail page
- Add a collapsible left sidebar listing all characters grouped by first-appearance chapter

**Non-Goals:**
- Adding React Flow or any new graph library (keep bundle lean)
- Server-side filtering (chapter slider filters client-side from the full dataset)
- Editing character data from the frontend
- Mobile-optimized graph layout (desktop-first)

## Decisions

### 1. Pure SVG over React Flow
**Decision**: Custom SVG rendering, no new dependency.  
**Rationale**: The graph data is small (characters in a single document, typically <30 nodes). React Flow adds ~100 KB and introduces an abstraction layer that complicates the slider-driven chapter filtering. A force-directed layout implemented with a simple spring iteration on `useEffect` is sufficient and fully controllable.  
**Alternative considered**: React Flow — rejected due to bundle cost and over-engineering for this dataset size.

### 2. Client-side chapter filtering
**Decision**: Fetch all relationship data once; filter in-memory when the slider moves.  
**Rationale**: Response sizes are small. Hitting the API on every slider tick would cause perceptible lag and unnecessary server load.  
**Alternative considered**: Query param `?upToChapter=N` on the API — deferred; can be added later if data grows.

### 3. Drawer as an absolute-positioned overlay (not a split-pane)
**Decision**: The wiki drawer slides in from the right as an overlay over the graph canvas.  
**Rationale**: Keeps the graph full-screen at all times. Overlay is simpler to implement than a resizable split-pane.

### 4. Force-directed layout via local spring simulation with post-processing
**Decision**: A two-stage layout — (1) a Fruchterman-Reingold spring simulation with a short-range hard repulsion term (threshold = 110px, factor = 4×k), followed by (2) a post-simulation overlap resolution pass (up to 30 iterations, minimum node separation = 105px).  
**Rationale**: The spring simulation alone can leave nodes touching or overlapping when they are strongly connected; the deterministic post-processing pass guarantees the minimum separation contract regardless of convergence.  
**Alternative considered**: Running more spring iterations — rejected because it increases CPU time without guaranteeing separation.

### 5. Asymmetric canvas padding to avoid legend overlap
**Decision**: The spring layout uses asymmetric padding: `padL=80 padT=80 padR=160 padB=230`. Extra padding on the right and bottom reserves space for the legend overlay so nodes are never initialized or clamped into that zone.  
**Rationale**: The legend is a fixed-position SVG group anchored to the bottom-right corner; without reserved padding nodes can be placed behind it and become unclickable.

### 6. Three-layer SVG rendering (lines → nodes → badges)
**Decision**: The SVG renders in three sequential passes: (1) all edge lines, (2) all node circles+labels, (3) all relationship-type badge pills.  
**Rationale**: SVG has no z-index — elements render in document order. Splitting into three passes ensures nodes are always drawn on top of lines, and badges are always drawn on top of nodes.  
**Badge collision suppression**: If a badge midpoint falls within `nodeRadius + 14px` of any node center, the badge is suppressed for that edge to avoid covering a node circle.  
**Guard for overlapping nodes**: If the distance between two connected nodes is less than the sum of their radii, the edge line is suppressed entirely to avoid a line rendering through a node.

### 7. Character list sidebar panel
**Decision**: A collapsible 240px left sidebar toggled via a "Characters" button in the page header.  
**Rationale**: Gives users a text-scannable index of all characters without requiring them to visually scan the graph. Characters are grouped by first-appearance chapter (derived client-side from `allRelationships` sorted by `chapterNumber`), sorted alphabetically within each chapter group.  
**Interactivity**: Clicking a name in the sidebar fires the same `handleNodeClick` path as clicking a graph node, opening the wiki drawer and highlighting the selected character.  
**Scope**: The sidebar respects the active chapter scope — only characters whose first-appearance chapter ≤ `selectedChapter` are listed.

### 8. No new route guard needed
**Decision**: Re-use the existing `ProtectedRoute` wrapper.

## Risks / Trade-offs

- [Large graphs >50 nodes] → SVG rendering can lag; mitigation: cap visible nodes, show a "too many characters" warning
- [Overlapping nodes on first render] → addressed by two-stage layout (spring + post-processing); residual risk exists for >50 nodes
- [Drawer hiding graph context] → drawer is dismissible via click-outside or close button; graph is still partially visible
- [Badge suppression] → some edge labels may not render if the graph is dense; this is intentional to avoid visual noise covering nodes

## Migration Plan

1. Add `frontend/src/services/characterService.js` pointing at existing backend endpoints
2. Create components: `GraphCanvas`, `ChapterSlider`, `CharacterWikiDrawer` under `frontend/src/components/`
3. Create page: `frontend/src/pages/Characters/CharacterGraphPage.jsx`
4. Register route in `frontend/src/App.jsx` (or router config)
5. Add "View Characters" button on `DocumentDetail` page
6. No backend migrations required
