# Tasks: Lagrange Enriched Introduction Section

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120–160 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | standard |

Decision needed before apply: No
Chained PRs recommended: No
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR |
|------|------|-----------|
| 1 | Complete implementation of the enriched introduction card and toggle logic | PR 1 (single) |

---

## Phase 1: Markup and Layout (HTML/CSS)

- [ ] 1.1 Insert the `.intro-card` element in `index.html` directly below the `<header>` element.
- [ ] 1.2 Include the explicit software purpose text explaining that this is an interactive environment for studying Lagrange Polynomial Interpolation.
- [ ] 1.3 Add the micro-neumorphic badges inside `.intro-badges` for Método, Complejidad, Grado, and Runge.
- [ ] 1.4 Add the interactive toggle button `#intro-toggle` with a nested chevron character (▼).
- [ ] 1.5 Add the detailed drawer `#intro-body` containing mathematical exposition (interpolation problem, Lagrange formula, cardinal basis formula using `.frac` structures).
- [ ] 1.6 Add the academic reference buttons section linking to Wolfram MathWorld, Wikipedia, and MIT OCW with `target="_blank"` and `rel="noopener noreferrer"`.

## Phase 2: Neumorphic Styling (Vanilla CSS)

- [ ] 2.1 Add CSS rules in `index.html`'s `<style>` block for `.intro-card` (`grid-column: 1 / -1`, `box-shadow: var(--raised)`, `background: var(--bg)`).
- [ ] 2.2 Add CSS rules for `.intro-badges`, `.badge` (using recessed inset shadow `var(--inset-sm)`), and the red warning variant `.badge.alert`.
- [ ] 2.3 Add CSS rules for the toggle button `.intro-toggle-btn` to match the existing interactive buttons on hover/active.
- [ ] 2.4 Define `.intro-body` transitioning rules (`max-height: 0`, `opacity: 0`, `overflow: hidden`, `transition: max-height 320ms ease, opacity 220ms ease, padding 220ms ease`).
- [ ] 2.5 Define the expanded class trigger `.intro-card.expanded .intro-body` (`max-height: 900px`, `opacity: 1`, `padding: 20px 14px 10px`).
- [ ] 2.6 Style the mathematical math formulas, exponents, products, and external reference buttons within the drawer.

## Phase 3: Controller Behavior (TypeScript)

- [ ] 3.1 Bind event listeners in `src/app.ts` to toggle the `.expanded` class on `#intro-section` when clicking `#intro-toggle`.
- [ ] 3.2 Update ARIA attributes (`aria-expanded`) and toggle the chevron indicator text (▲ / ▼) on click.

## Phase 4: Verification

- [ ] 4.1 Verify that the introduction card renders correctly on page load with neumorphic styling.
- [ ] 4.2 Verify that the purpose text explicitly and clearly states what the software is for.
- [ ] 4.3 Verify that clicking "Saber más" smoothly expands the detailed panel and clicking again collapses it.
- [ ] 4.4 Verify mathematical accuracy and readable rendering of the Master Formula and Cardinal Basis equations.
- [ ] 4.5 Verify that all three external academic links are active, open in new tabs, and have the correct mathematical targets.
- [ ] 4.6 Verify responsive behavior by resizing the browser viewport below `940px` to check styling alignment.
