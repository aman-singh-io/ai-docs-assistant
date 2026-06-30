## ADDED Requirements

### Requirement: Right-side drawer displays character profile on node click
The system SHALL render a drawer that slides in from the right when a character node is clicked, displaying the character's name, status, faction, and AI-generated biography.

#### Scenario: Drawer opens with correct character data
- **WHEN** the user clicks a character node
- **THEN** the drawer SHALL slide in from the right and display that character's name, status, and faction in the header area

#### Scenario: Drawer displays AI-generated biography
- **WHEN** the drawer is open
- **THEN** the biography section SHALL render the AI-generated biography text with readable typography (appropriate line-height and text color hierarchy)

#### Scenario: Drawer is dismissible
- **WHEN** the user clicks the close button or clicks outside the drawer
- **THEN** the drawer SHALL slide out and the graph SHALL be fully visible again

#### Scenario: Drawer updates when a different node is clicked while open
- **WHEN** the drawer is open and the user clicks a different character node
- **THEN** the drawer SHALL update to display the newly selected character's data without closing and reopening

### Requirement: Drawer does not obstruct full graph navigation
The system SHALL render the drawer as an overlay so the graph canvas remains partially visible behind it.

#### Scenario: Graph is visible behind the open drawer
- **WHEN** the drawer is open
- **THEN** the graph canvas SHALL remain visible to the left of the drawer (drawer width SHALL not exceed 40% of viewport width on desktop)
