## ADDED Requirements

### Requirement: Full-screen graph canvas renders character nodes and relationship edges
The system SHALL render a full-screen SVG canvas displaying characters as circular nodes and relationships as colored edges. The page SHALL be accessible at `/documents/:id/characters`.

#### Scenario: Graph loads with all characters
- **WHEN** a user navigates to `/documents/:id/characters`
- **THEN** the system fetches character and relationship data for that document and renders the graph

#### Scenario: Graph shows nodes as labeled circles
- **WHEN** the graph is rendered
- **THEN** each character node SHALL appear as a circle with the character's name as a text label

#### Scenario: Edges are color-coded by relationship type
- **WHEN** an edge between two characters is rendered
- **THEN** ally relationships SHALL use green, enemy relationships SHALL use red, rival relationships SHALL use orange, romantic/family relationships SHALL use pink, mentor relationships SHALL use purple, and all other types SHALL use gray

#### Scenario: Relationship type badge appears on each edge
- **WHEN** an edge between two characters is rendered
- **THEN** a pill-shaped badge with the relationship type label SHALL appear at the midpoint of the edge, rendered above all node circles
- **AND** the badge SHALL be suppressed if its midpoint overlaps any node circle (within `nodeRadius + 14px`)

#### Scenario: Clicking a node opens the character wiki drawer
- **WHEN** the user clicks a character node
- **THEN** the character wiki drawer SHALL open with that character's profile and biography

### Requirement: Graph rendering layers guarantee correct visual hierarchy
The system SHALL render SVG elements in three sequential passes to ensure correct z-ordering without relying on CSS z-index.

#### Scenario: Edge lines are always below node circles
- **WHEN** the graph is rendered
- **THEN** all edge lines SHALL be drawn in the first SVG pass so that node circles are always rendered on top of them

#### Scenario: Relationship badges are always above node circles
- **WHEN** a relationship badge is rendered
- **THEN** it SHALL appear in the third SVG pass so it is always rendered on top of node circles and edge lines

#### Scenario: Edge line is suppressed between overlapping nodes
- **WHEN** two connected nodes are so close that their circles overlap
- **THEN** the edge line between them SHALL not be rendered (to avoid a line segment running through a node body)

### Requirement: Graph layout is stable and non-overlapping on initial render
The system SHALL compute a two-stage force-directed layout before the first paint so nodes are spread across the canvas without overlap.

#### Scenario: Nodes do not stack on top of each other
- **WHEN** the graph is first rendered with more than one character
- **THEN** no two node centers SHALL be within 105px of each other after the post-processing overlap resolution pass

#### Scenario: Nodes are not placed behind the legend overlay
- **WHEN** the spring layout clamps node positions to the canvas bounds
- **THEN** the usable area SHALL exclude the legend region via asymmetric right and bottom padding (padR=160, padB=230), so no node center falls within the legend zone

### Requirement: Empty and loading states are handled gracefully
The system SHALL show a loading indicator while fetching data and an empty state message if no character data exists for the document.

#### Scenario: Loading state
- **WHEN** the graph page is loading data
- **THEN** a centered loading spinner SHALL be displayed

#### Scenario: Empty state
- **WHEN** no characters have been extracted for the document
- **THEN** a message SHALL inform the user that no character data is available
