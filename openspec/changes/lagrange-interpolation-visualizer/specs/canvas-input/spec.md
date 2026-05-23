# Canvas Input Specification

## Purpose

Handles user interaction on the 2D canvas: adding points by click, removing points by clicking near an existing one, and rendering the coordinate axes and grid.

## Requirements

### Requirement: Add Point on Click

The system MUST add a point at the click position when the user clicks on an empty area of the canvas. The point MUST be converted from canvas pixel coordinates to mathematical (x, y) coordinates. A point SHALL NOT be added if a point with the same x-value already exists.

#### Scenario: Add first point

- GIVEN the canvas has no points
- WHEN the user clicks at canvas position (px, py)
- THEN a point is added at the corresponding math coordinates
- AND the canvas is redrawn with the new point visible

#### Scenario: Reject duplicate x-value

- GIVEN a point already exists at x = 2.5
- WHEN the user clicks at a canvas position that maps to x ≈ 2.5 (within 10px tolerance)
- THEN the point is NOT added
- AND a visual indicator SHOULD notify the user of the rejection

### Requirement: Remove Point on Click

The system MUST remove a point when the user clicks within a 10-pixel radius of an existing point.

#### Scenario: Remove existing point

- GIVEN at least one point exists on the canvas
- WHEN the user clicks within 10px of that point
- THEN the point is removed
- AND the canvas is redrawn with the curve updated

### Requirement: Draw Axes and Grid

The canvas MUST display labeled x and y axes centered at the mathematical origin. Grid lines SHOULD be drawn at regular intervals.

#### Scenario: Canvas renders on load

- GIVEN the application has loaded
- WHEN no points have been added yet
- THEN the canvas displays the x-axis, y-axis, and grid
