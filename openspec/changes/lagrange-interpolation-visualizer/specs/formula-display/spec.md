# Formula Display Specification

## Purpose

Renders the current Lagrange polynomial as a human-readable expression below the canvas, updating every time the set of nodes changes.

## Requirements

### Requirement: Display Polynomial Expression

The system MUST display the polynomial P(x) as a readable text expression whenever 2 or more nodes exist. The expression MUST include the node count (degree = n−1).

#### Scenario: Two nodes shown

- GIVEN exactly 2 nodes exist
- WHEN the display updates
- THEN the text shows a degree-1 polynomial expression (linear)

#### Scenario: Three nodes shown

- GIVEN 3 nodes exist at (0, 1), (1, 2.718), (2, 54.5198)
- WHEN the display updates
- THEN the text shows a degree-2 polynomial matching the class example: P₂(x) = 25.041x² − 23.323x + 1

#### Scenario: No expression with fewer than two nodes

- GIVEN 0 or 1 nodes exist
- WHEN the display renders
- THEN the formula area shows a placeholder message (e.g., "Add at least 2 points")

### Requirement: Coefficients Rounded for Readability

Coefficients in the displayed expression SHOULD be rounded to 3 decimal places.

#### Scenario: Long decimal coefficients

- GIVEN a polynomial whose exact coefficients are irrational or very long
- WHEN the formula is displayed
- THEN coefficients are shown with at most 3 decimal places
