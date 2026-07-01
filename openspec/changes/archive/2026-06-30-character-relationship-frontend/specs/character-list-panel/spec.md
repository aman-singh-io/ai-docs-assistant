## ADDED Requirements

### Requirement: Collapsible sidebar lists all characters grouped by first-appearance chapter
The system SHALL provide a toggleable left sidebar on the character graph page that lists all currently visible characters, grouped by the chapter in which they first appear, sorted alphabetically within each group.

#### Scenario: Sidebar is hidden by default
- **WHEN** the user first navigates to `/documents/:id/characters`
- **THEN** the character list sidebar SHALL be collapsed and not occupy horizontal space

#### Scenario: Sidebar toggles open and closed via header button
- **WHEN** the user clicks the "Characters" button in the page header
- **THEN** the sidebar SHALL appear as a 240px panel to the left of the graph canvas
- **WHEN** the user clicks the "Characters" button again or the X button inside the sidebar
- **THEN** the sidebar SHALL collapse and the graph canvas SHALL expand to fill the full width

#### Scenario: Characters are grouped by first-appearance chapter
- **WHEN** the sidebar is open
- **THEN** characters SHALL be grouped under labeled chapter headings ("Chapter 1", "Chapter 2", …)
- **AND** each character SHALL appear under the heading of the chapter where they first appear in the relationship data
- **AND** within each chapter group, character names SHALL be sorted alphabetically

#### Scenario: Each chapter group shows a character count
- **WHEN** a chapter heading is rendered in the sidebar
- **THEN** the number of new characters introduced in that chapter SHALL be displayed next to the heading

#### Scenario: Sidebar footer shows total visible character count
- **WHEN** the sidebar is open
- **THEN** the footer area SHALL display the total count of characters currently visible (up to the active chapter scope)

### Requirement: Sidebar respects the active chapter scope
The character list SHALL be filtered by the same chapter scope as the graph canvas. Characters introduced in chapters beyond the active slider position SHALL not appear in the list.

#### Scenario: Sidebar updates when slider chapter changes
- **WHEN** the user moves the chapter slider to chapter N
- **THEN** the sidebar SHALL update to show only characters whose first-appearance chapter ≤ N
- **AND** chapter groups for chapters > N SHALL not be rendered

### Requirement: Clicking a character in the sidebar opens the wiki drawer
The system SHALL treat a sidebar character name click identically to a graph node click — fetching and displaying the character's profile in the wiki drawer.

#### Scenario: Sidebar name click opens the wiki drawer
- **WHEN** the user clicks a character name in the sidebar
- **THEN** the character wiki drawer SHALL open and display that character's profile and AI-generated biography
- **AND** the clicked name SHALL be visually highlighted (emerald accent) in the sidebar to indicate the active selection

#### Scenario: Active selection updates when a different name is clicked
- **WHEN** the wiki drawer is open and the user clicks a different name in the sidebar
- **THEN** the wiki drawer SHALL update to show the new character's data
- **AND** the highlight SHALL move to the newly clicked name
