## ADDED Requirements

### Requirement: Sticky bottom bar contains a chapter scope slider
The system SHALL display a sticky bottom bar with a range slider that controls the chapter scope of the relationship graph. Moving the slider to chapter N SHALL filter the graph to show only characters and relationships that appear up to and including chapter N.

#### Scenario: Slider is always visible
- **WHEN** the user is on the character graph page
- **THEN** the chapter slider bar SHALL be fixed to the bottom of the viewport regardless of scroll position

#### Scenario: Slider filters graph by chapter scope
- **WHEN** the user moves the slider to chapter N
- **THEN** the graph SHALL update to display only nodes and edges with a chapter value ≤ N

#### Scenario: Slider shows current chapter value
- **WHEN** the user moves the slider
- **THEN** the current chapter number SHALL be displayed as a label next to or above the slider thumb

#### Scenario: Slider minimum is chapter 1 and maximum is the highest chapter in the dataset
- **WHEN** the chapter slider is rendered
- **THEN** the minimum value SHALL be 1 and the maximum value SHALL equal the highest chapter number present in the relationship data

### Requirement: Graph updates reactively when slider changes
The system SHALL re-render the graph nodes and edges immediately (without a page reload or API call) when the chapter slider value changes.

#### Scenario: Reactive graph update
- **WHEN** the slider value changes
- **THEN** the graph SHALL update within one render cycle to reflect the new chapter scope
