# Curve Renderer Specification

## Purpose

Draws the interpolation curve on the HTML canvas by sampling P(x) at many x-values across the visible range and connecting the results as a continuous line.

## Requirements

### Requirement: Draw Interpolation Curve

The renderer MUST sample P(x) at a minimum of 300 evenly-spaced x-values across the canvas mathematical x-range, and draw a continuous polyline through the resulting (x, P(x)) points.

#### Scenario: Curve passes through all nodes

- GIVEN 3 nodes are placed on the canvas
- WHEN the curve is rendered
- THEN the drawn curve visually passes through each node point

#### Scenario: Curve updates on point addition

- GIVEN 2 points exist and a curve is drawn
- WHEN the user adds a third point
- THEN the canvas is cleared and the curve is redrawn through all 3 points

#### Scenario: Runge phenomenon visible

- GIVEN 11 or more points placed at uniform x-intervals across the canvas
- WHEN the curve is rendered
- THEN large oscillations are visible near the edges of the x-range

### Requirement: Math-to-Canvas Coordinate Mapping

The renderer MUST convert mathematical (x, y) coordinates to canvas pixel coordinates. The y-axis MUST be inverted (canvas y grows downward, math y grows upward).

#### Scenario: Origin maps to canvas center

- GIVEN a canvas of width W and height H
- WHEN the mathematical point (0, 0) is rendered
- THEN it appears at pixel position (W/2, H/2)

### Requirement: No Curve With Fewer Than Two Points

The renderer MUST skip curve drawing and only render the axes and points when fewer than 2 nodes exist.

#### Scenario: Single point — no curve

- GIVEN exactly one point on the canvas
- WHEN the canvas is rendered
- THEN only the point and axes are drawn, no curve line
