# Tasks: Lagrange Interpolation Visualizer

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~380–420 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (school project, no review team) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR |
|------|------|-----------|
| 1 | Full implementation | PR 1 (single) |

---

## Phase 1: Infrastructure

- [x] 1.1 Run `pnpm create vite . -- --template vanilla-ts` in project root
- [x] 1.2 Create `src/types.ts` — export `Point` type and `ViewState` interface per design contracts
- [x] 1.3 Update `index.html` — add `<canvas id="canvas">`, `<p id="formula">`, and link `src/app.ts`
- [x] 1.4 Strip Vite boilerplate from `src/` (remove generated counter, style files)

## Phase 2: Math Engine

- [x] 2.1 Create `src/lagrange.ts` — implement `lagrangeBasis(nodes, i, x)`: product of `(x − xⱼ) / (xᵢ − xⱼ)` for all j ≠ i
- [x] 2.2 Implement `evaluate(nodes, x)`: returns `null` if nodes.length < 2; otherwise returns `Σ nodes[i].y · lagrangeBasis(nodes, i, x)`
- [x] 2.3 Inline sanity check: manually verify `evaluate([(0,1),(1,2.718),(2,54.5198)], 0)` returns 1.0 in browser console

## Phase 3: Renderer

- [x] 3.1 Create `src/renderer.ts` — implement `mathToPixel(p, view)` and `pixelToMath(px, py, view)` using `view.scale` and `view.origin`
- [x] 3.2 Implement `draw` — clear canvas, draw grid lines every `view.scale` pixels
- [x] 3.3 Add axes to `draw` — x-axis and y-axis lines through `view.origin`, with numeric labels
- [x] 3.4 Add point dots to `draw` — filled circle at each node's pixel position
- [x] 3.5 Add curve to `draw` — sample `evaluate(nodes, x)` at 300 evenly-spaced math x-values across canvas width; draw polyline; skip if nodes.length < 2
- [x] 3.6 Implement `autoScaleY(nodes, view)` — compute min/max of curve samples, return view with `origin.y` adjusted so curve fits vertically with padding

## Phase 4: App Controller

- [x] 4.1 Create `src/app.ts` — initialize `points: Point[]`, `view: ViewState`, get canvas context, call `draw` on load
- [x] 4.2 Implement `handleWheel(e)` — update `view.scale` by ×1.1 or ÷1.1; adjust `view.origin` so zoom centers on cursor; call `redraw()`
- [x] 4.3 Implement pan — on `mousedown` store position; on `mousemove` translate `view.origin` by delta; on `mouseup` if total drag < 5px treat as click
- [x] 4.4 Implement `handleClick` — convert to math coords; if within 10px of existing point → remove it; else validate no duplicate x → add point; call `autoScaleY`, then `redraw()`
- [x] 4.5 Implement formula display — after redraw, build P(x) text string with coefficients rounded to 3 decimal places; write to `#formula`; show placeholder if nodes.length < 2

## Phase 5: Verification

- [x] 5.1 Place 3 points matching class example (0,1), (1,2.718), (2,54.5198) — verify curve passes through all three and formula shows P₂(x) ≈ 25.041x² − 23.323x + 1
- [x] 5.2 Add 11+ evenly-spaced points across canvas — verify Runge oscillations are visible near canvas edges
- [x] 5.3 Zoom in/out with wheel and pan by drag — verify grid, axes, and curve redraw correctly
- [x] 5.4 Click an existing point — verify it is removed and curve updates
