# Proposal: Lagrange Interpolation Visualizer

## Intent

Build a frontend-only web app for a Numerical Analysis class (ordinario) that lets the user place points on a 2D canvas and instantly see the Lagrange interpolation polynomial curve through those points. The professor requires readable, manual code that demonstrates understanding of the algorithm. The Runge phenomenon must be naturally observable by adding many points.

## Scope

### In Scope
- 2D canvas with click-to-add point interaction
- Pure-function Lagrange engine: `P(x) = Σ f(xᵢ) · Lᵢ(x)` per the formula from class
- Real-time curve rendering on each point addition
- Coordinate axes and grid drawn on canvas
- Point removal (click existing point to delete)
- Display of the computed polynomial formula as text
- Runge phenomenon naturally emerges with 10+ uniform points

### Out of Scope
- Chebyshev node toggle (deferred — show Runge first, mitigate later if requested)
- Backend / server-side computation
- Saving or exporting results
- Framework (React, Vue, etc.) — Vanilla JS/TS only

## Capabilities

### New Capabilities
- `canvas-input`: Click-to-add and click-to-remove points on a responsive canvas with axes
- `lagrange-engine`: Pure function computing P(x) via cardinal basis functions Lᵢ(x)
- `curve-renderer`: Samples P(x) across canvas x-range and draws smooth interpolation curve
- `formula-display`: Renders the current polynomial expression as human-readable text

### Modified Capabilities
None

## Approach

Single HTML file entry point with Vite. Three modules: `lagrange.ts` (pure math), `renderer.ts` (canvas drawing), `app.ts` (event wiring). Math module is framework-agnostic and hand-written to match the class algorithm exactly — no library dependencies for the interpolation itself.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lagrange.ts` | New | Cardinal basis + polynomial evaluation |
| `src/renderer.ts` | New | Canvas axes, points, curve rendering |
| `src/app.ts` | New | Event handling, state management |
| `index.html` | New | Entry point + canvas element |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Numerical instability with many points | Med | Expected (Runge) — document as a feature |
| Canvas coordinate system inversion (y-axis) | Low | Map math coords to canvas coords explicitly |
| Duplicate x-values crash Lagrange division | Med | Validate on click; reject duplicate x |

## Rollback Plan

Pure frontend — no deploy, no database. Revert is `git checkout` to prior commit.

## Dependencies

- Node.js + Vite (dev only, zero runtime deps)

## Success Criteria

- [ ] Clicking adds a point and immediately redraws the curve
- [ ] Curve passes exactly through all placed points
- [ ] Runge phenomenon visually appears with 10+ evenly-spaced points near canvas edges
- [ ] Polynomial expression is displayed and matches hand calculation from class
