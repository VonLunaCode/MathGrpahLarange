# Design: Lagrange Interpolation Visualizer

## Technical Approach

Single-page app with zero runtime dependencies. Three focused modules wired by `app.ts`. All math is hand-written to match the class formula exactly — no library does the interpolation. Canvas re-renders synchronously on every state change.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| Framework | Vanilla TS | React, Vue | Professor requires visible, readable code; no abstraction layers |
| Math deps | None (hand-written) | math.js, numeric.js | Algorithm must match class formula exactly; libraries hide the work |
| Render strategy | Synchronous redraw | requestAnimationFrame loop | No animation needed — only redraws on user events |
| State management | Plain `Point[]` in `app.ts` | Signals, stores | One array, no reactivity needed; overkill otherwise |
| Coordinate origin | Canvas center | Top-left | Math convention; axes visually centered feels natural |

## Data Flow

```
User click (px, py)
        │
        ▼
   app.ts: handleClick
        │
        ├─── pixelToMath(px, py, config) ──→ Point { x, y }
        │
        ├─── isNearExisting(points, p) ──→ true → remove point
        │                                  false → validate & add
        │
        ├─── validate: reject if duplicate x (within tolerance)
        │
        ▼
   points[] updated
        │
        ├──→ renderer.draw(ctx, points, config)
        │         └─ draws grid, axes, dots, curve
        │              └─ curve: sample lagrange.evaluate(points, x)
        │                         for 300 x-values across range
        │
        └──→ formulaDisplay.update(points)
                  └─ builds readable P(x) string
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `index.html` | Create | Entry point: canvas element + formula display area |
| `src/types.ts` | Create | Shared `Point` and `CanvasConfig` types |
| `src/lagrange.ts` | Create | Pure math: `lagrangeBasis` and `evaluate` |
| `src/renderer.ts` | Create | Canvas drawing: axes, grid, points, curve + coord mapping |
| `src/app.ts` | Create | State, click handler, wires modules together |
| `vite.config.ts` | Create | Minimal Vite config |
| `package.json` | Create | Vite dev dependency only |

## Interfaces / Contracts

```typescript
// src/types.ts
type Point = { x: number; y: number };

interface ViewState {
  scale: number;         // pixels per math unit (mutable — zoom)
  origin: Point;         // pixel position of math (0, 0) (mutable — pan)
}

// src/lagrange.ts
function lagrangeBasis(nodes: Point[], i: number, x: number): number
function evaluate(nodes: Point[], x: number): number | null

// src/renderer.ts
function mathToPixel(p: Point, view: ViewState): { px: number; py: number }
function pixelToMath(px: number, py: number, view: ViewState): Point
function draw(ctx: CanvasRenderingContext2D, nodes: Point[], view: ViewState): void
function autoScaleY(nodes: Point[], view: ViewState): ViewState  // returns adjusted view

// src/app.ts (internal)
let points: Point[] = []
let view: ViewState = { scale: 60, origin: { x: W/2, y: H/2 } }
function handleClick(e: MouseEvent): void
function handleWheel(e: WheelEvent): void   // zoom toward cursor
function handlePan(dx: number, dy: number): void  // drag to pan
function redraw(): void
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `lagrangeBasis`, `evaluate`, `mathToPixel`, `pixelToMath` | Pure functions — add Vitest after init; test against class example |
| Integration | Click → state → canvas redraw | Not planned for ordinario |
| E2E | Full user flow | Not planned for ordinario |

> Strict TDD disabled — no test runner yet. `lagrange.ts` is pure and fully testable post-bootstrap.

## Migration / Rollout

No migration required. New project from scratch.

## Viewport Interactions

| Event | Behavior |
|-------|----------|
| Mouse wheel | Zoom in/out centered on cursor position (scale ×1.1 or ÷1.1 per tick) |
| Click + drag | Pan: translate origin by (dx, dy) |
| Left click (no drag) | Add or remove point |
| Auto-scale Y | After each point add/remove, adjust origin.y so all P(x) samples fit vertically |

> Drag vs click disambiguation: if mouse moves > 5px between mousedown and mouseup, treat as pan — not a point add.

## Open Questions

None — all resolved.
