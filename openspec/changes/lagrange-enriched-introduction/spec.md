# Specifications: Lagrange Enriched Introduction Section

## Requirements

### R1: General Placement & Purpose Statement
- The page MUST render a new full-width neumorphic card (`.intro-card`) directly below the header.
- The card MUST explicitly display the software's core purpose: to visualize, analyze, and learn how Lagrange Polynomial Interpolation constructs a unique interpolating curve through arbitrary points.
- The visual styling MUST match the exact neumorphic language of the page (curated color scheme, soft drop shadows, monospace font).

### R2: Parameter Badges
- The `.intro-card` MUST display a row of four micro-neumorphic badges representing the mathematical characteristics:
  1. **Método**: Lagrange
  2. **Complejidad**: $O(n^2)$
  3. **Grado**: $\le n$ (where $n$ is the number of intervals, or $n+1$ is the number of points)
  4. **Runge**: Alta Sensibilidad

### R3: Expandable Mathematical Drawer
- The card MUST include an interactive button labeled **"Saber más del método // expandir"** (or similar).
- When clicked, the drawer (`.intro-body`) MUST expand with a smooth slide/fade transition (using CSS `max-height` and `opacity`).
- When expanded, the chevron icon on the toggle button MUST rotate.
- When clicked again, the drawer MUST collapse smoothly.

### R4: Deep-dive Educational Content
- The expanded drawer MUST include:
  1. **El Problema**: Given $n+1$ points $(x_i, y_i)$ with unique $x_i$, find a polynomial $P(x)$ of degree $\le n$ such that $P(x_i) = y_i$ for all $i$.
  2. **Fórmula de Lagrange**: $P(x) = \sum_{i=0}^n y_i L_i(x)$.
  3. **Función Cardinal Base ($L_i$)**: $L_i(x) = \prod_{j \neq i} \frac{x - x_j}{x_i - x_j}$.
  4. **Fenómeno de Runge**: Alerting the user that interpolating uniform nodes at high degrees leads to severe oscillations at the boundaries, and that **Chebyshev Nodes** can be used as an optimal non-uniform spacing strategy.
- The equations MUST be laid out with elegant typography (using superscripts `<sup>`, fraction classes `.frac`, and custom mathematical spacing).

### R5: External Rigorous Links
- The drawer MUST contain exactly three external reference links styled as neumorphic buttons:
  - **Wolfram MathWorld** pointing to: `https://mathworld.wolfram.com/LagrangeInterpolatingPolynomial.html`
  - **Wikipedia (Spanish)** pointing to: `https://es.wikipedia.org/wiki/Interpolaci%C3%B3n_polin%C3%B3mica_de_Lagrange`
  - **MIT OpenCourseWare (Numerical Analysis)** pointing to: `https://ocw.mit.edu/` or equivalent academic guide.
- All links MUST open in a new tab (`target="_blank"` and `rel="noopener noreferrer"`).

---

## Scenarios

### Scenario 1: Initial Render
- **Given** the visualizer page is loaded,
- **Then** the `.intro-card` MUST be present in the DOM.
- **And** the text explicitly stating the software's purpose MUST be visible.
- **And** the four parameter badges MUST be displayed.
- **And** the detailed drawer (`.intro-body`) MUST be collapsed (`max-height: 0px`, `opacity: 0`, and `pointer-events: none`).

### Scenario 2: Toggle Expand
- **Given** the detailed drawer is collapsed,
- **When** the user clicks the "Saber más del método" button,
- **Then** the drawer's `max-height` MUST animate to its full content height.
- **And** its `opacity` MUST fade in to `1`.
- **And** all educational math sections and academic links MUST become visible and interactive.
- **And** the chevron icon on the button MUST rotate by 180 degrees.

### Scenario 3: Toggle Collapse
- **Given** the detailed drawer is expanded,
- **When** the user clicks the "Saber más del método" button,
- **Then** the drawer's `max-height` MUST animate back to `0px`.
- **And** its `opacity` MUST fade out to `0`.
- **And** the chevron icon MUST return to its initial orientation.

### Scenario 4: Responsive Behavior
- **Given** a viewport width of less than or equal to `940px` (standard mobile/tablet layout),
- **Then** the `.intro-card` MUST scale its width gracefully to fit within the single-column viewport.
- **And** the parameter badges SHOULD wrap neatly if they exceed the horizontal layout.
