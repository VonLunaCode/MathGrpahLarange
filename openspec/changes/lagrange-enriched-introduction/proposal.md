# Proposal: Lagrange Enriched Introduction Section

## Intent
Provide a premium, mathematically rigorous, and visually stunning introduction section right inside the Lagrange Interpolation Visualizer. It aims to teach the user the underlying principles of Lagrange interpolation, its limitations (the Runge phenomenon), and offer direct access to high-quality external academic documentation, while keeping the UI extremely clean, amigible, and fully integrated with the neumorphic design system.

## Scope

### In Scope
- **Interactive Card (`.intro-card`)**: A full-width neumorphic card placed directly under the header and above the main grid structure (`grid-column: 1 / -1`). It must explicitly state the purpose of the software: an interactive environment to visualize, analyze, and learn how Lagrange Polynomial Interpolation builds curves through points.
- **High-level Badges**: A row of micro-neumorphic badges summarizing key metadata: "Método: Lagrange", "Complejidad: O(n²)", "Grado: ≤ n", "Runge: Alta Sensibilidad".
- **Expandable Detailed Drawer**: A "Saber más del método" button that expands a rich educational panel with CSS transition (`max-height` / `opacity`).
- **Rigorous Mathematical Content**:
  - The definition of the interpolation problem (fitting a curve through $n+1$ points with distinct $x$ coordinates).
  - The master formula: $P(x) = \sum_{i=0}^n y_i L_i(x)$.
  - The cardinal basis formula: $L_i(x) = \prod_{j \neq i} \frac{x - x_j}{x_i - x_j}$.
  - Explanation of the **Runge Phenomenon** (why equally spaced nodes oscillate violently at high degrees) and mentioning **Chebyshev Nodes** as the optimal spacing strategy.
- **Academic Links**: A curated section of high-quality external resources styled as neumorphic buttons:
  - *Wolfram MathWorld* (Rigorous mathematical exposition).
  - *Wikipedia (Spanish)* (General overview and history).
  - *MIT OpenCourseWare / Numerical Methods* (Academic notes).
- **Responsive Layout**: Fluid scaling for tablet and mobile viewports.

### Out of Scope
- Automatic Chebyshev node generation (this remains out of scope for the core visualizer but is referenced for theoretical completion).
- Any server-side rendering or external API integration.

## Capabilities

### New Capabilities
- `intro-card`: Interactive hero section displaying high-level details, mathematical foundations, and curated academic references.
- `intro-toggle`: Smooth interactive handler to expand/collapse the detailed educational drawer.

### Modified Capabilities
- Layout flow: Updated `.app` grid structure to accommodate the intro hero card natively.

## Approach
Implement the section directly in `index.html` with vanilla CSS using neumorphic styling tokens (`var(--raised)`, `var(--inset)`, `var(--mono)`, etc.). Wire the toggle event handling in `src/app.ts` under a new DOM binding, mirroring the pattern used by the instructions card and the math visualization card.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `index.html` | Modified | Add introduction markup, styles for badges, links, and math typography. |
| `src/app.ts` | Modified | Add logic to toggle the expandable detailed drawer and manage state. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cluttered UI on small screens | Low | Use collapsible/expandable design so the text is out of the way unless wanted. |
| Mathematical typography rendering issues | Low | Use cleanly structured HTML with superscript (`<sup>`), fractions (`.frac`), and standard math symbols (`Σ`, `Π`) style-aligned to match the existing math visualizer. |

## Rollback Plan
Run `git checkout index.html src/app.ts` to revert all modifications instantly.

## Success Criteria
- [ ] Intro section renders perfectly with neumorphic shadows matching the rest of the application.
- [ ] Clicking "Saber más" smoothly expands the detailed explanation.
- [ ] Badges show clear, correct parameters.
- [ ] Formula notation is legible and matches standard textbooks.
- [ ] Links to Wolfram MathWorld, Wikipedia, and academic references are clickable and open in new tabs.
