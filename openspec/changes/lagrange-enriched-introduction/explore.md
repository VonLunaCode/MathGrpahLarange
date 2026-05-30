# Exploration: Lagrange Enriched Introduction Section

## Overview
We want to add a premium, enriched mathematical introduction section to the Lagrange Interpolation Visualizer. 
It must:
1. Explain clearly what the application does and the mathematical method used.
2. Provide high-quality, rigorous links to external mathematical documentation.
3. Offer an expandable ("Ver más" / "Saber más") section explaining the core concept in depth without overwhelming the main interface.
4. Fit the existing neumorphic UI design seamlessly, respecting layouts, colors, and fonts.

## Existing Layout Analysis
In `index.html`:
* The layout is structured as a two-column grid (`.app`) containing:
  - `.app-header` (grid-column: 1 / -1)
  - `.canvas-card` (main column)
  - `.side` (sidebar, 320px width)
  - `#math-section` (grid-column: 1 / -1)
* The styling relies on neumorphic box-shadows (`var(--raised)`, `var(--inset)`, `var(--raised-sm)`, `var(--inset-sm)`) and monospaced font family (`var(--mono)`).
* Collapsible cards are already implemented using a JS/TS state toggle. For example, `#math-section` toggles the `.collapsed` class, shifting the chevron icon and animating `max-height`.

## Proposed Placement & Interaction
1. **Placement**: A new card (`.intro-card`) placed immediately below the `<header>` and above the `.canvas-card` / `.side` grid items. Since it spans `grid-column: 1 / -1`, it will act as a perfect welcoming hero-section.
2. **Interaction**: 
   - A concise, high-impact intro statement with brief badges (e.g. "Grado: ≤ n", "Complejidad: O(n²)", "Interpolación Directa").
   - An expandable "Saber más sobre el método" button which smoothly expands a neumorphic card revealing:
     - The mathematical definition of the Lagrange Polynomial.
     - Why it is useful (solving the curve-fitting problem without solving linear systems).
     - The Runge phenomenon warning (and the connection to Chebyshev nodes).
     - Curated links to rigorous external resources:
       - **Wolfram MathWorld** (Lagrange Interpolating Polynomial)
       - **Wikipedia** (Lagrange Polynomial)
       - **LibreTexts Mathematics** / Academic notes.
3. **Styling**:
   - The card will match the style of `.math-card` and `.side`.
   - The toggle button will use a neumorphic flat button style (`.btn`) that transitions to inset on active.
   - External links will use subtle neumorphic inline badges/tags that feel premium and modern.

## Affected Files
* `index.html`: Inject the HTML markup for the `.intro-card` right after the header.
* `src/app.ts`: Add event listener logic to toggle the expandable section with smooth animations.
* CSS rules in `index.html`'s `<style>` block: Add custom classes for `.intro-card`, `.intro-body`, badge highlights, and neat math symbols.
