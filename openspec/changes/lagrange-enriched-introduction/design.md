# Design: Lagrange Enriched Introduction Section

## Architecture Overview
The Lagrange Interpolation Visualizer is a vanilla HTML/TypeScript client-only application. The introduction section will be added directly into the HTML markup and styled using Vanilla CSS in the `<style>` block of `index.html`. The interactive show/hide behavior will be wired in `src/app.ts` using DOM API event listeners.

This separates concerns cleanly:
1. **Structural Content** (`index.html`): Declares the visual layout, purpose, math notation, and curated academic reference links.
2. **Visual Presentation** (CSS in `index.html`): Implements neumorphic styling, spacing, typography, and transition animations.
3. **Behavioral Controller** (`src/app.ts`): Binds click events to the toggle button, adding/removing active states and managing screen-reader ARIA attributes.

---

## Detailed Components Design

### 1. UI Layout Integration
We will insert the new `<section id="intro-section" class="intro-card">` inside `<div class="app">` right below the `<header>` element:

```html
<header class="app-header">...</header>
<!-- NEW COMPONENT -->
<section id="intro-section" class="intro-card">...</section>
<section class="canvas-card">...</section>
```
Since `.app` is a CSS Grid, placing the card first and assigning `grid-column: 1 / -1` ensures it stretches across both columns on desktop. On viewports below `940px`, the grid collapses to a single-column layout, and the card naturally stacks on top of the canvas, which is the perfect responsive flow.

---

### 2. Neumorphic Style System Extensions
To maintain the premium neumorphic ("soft UI") style, we will define extension classes that use the existing CSS variables (`--bg`, `--ink`, `--raised`, `--inset`, `--mono`, etc.):

* **`.intro-card`**: Uses `box-shadow: var(--raised)` and `border-radius: var(--r-lg)` to match other cards.
* **`.intro-badges`**: Flex layout wrapping parameter indicators.
* **`.badge`**: Micro-neumorphic container. Uses `box-shadow: var(--inset-sm)` to look recessed, creating a high-contrast label.
  - Background: `var(--bg)`
  - Border-radius: `var(--r-sm)`
  - Colors: Subtle text highlights (`var(--ink-soft)`). A special `.badge.alert` variant will have a soft reddish color to warn the user about the Runge phenomenon's high sensitivity.
* **`.intro-toggle-btn`**: A button styled with `box-shadow: var(--raised-sm)` that transforms to `var(--inset-sm)` when active/pressed, providing solid tactile feedback.
* **`.intro-body`**: Collapsible container.
  - Collapsed state: `max-height: 0; overflow: hidden; opacity: 0; transition: max-height 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease;`
  - Expanded state (applied via parent `.intro-card.expanded`): `max-height: 900px; opacity: 1; padding-top: 18px;`

---

### 3. Mathematical Formula Representation
We will reuse the mathematical rendering components from the existing formula renderer. Specifically, we will use `.frac` layout for fractions to display the cardinal basis polynomial:

```html
<div class="math-formula">
  L<sub>i</sub>(x) = 
  <span class="prod-symbol">∏</span><sub>j ≠ i</sub> 
  <div class="frac">
    <div class="frac-top">(x − x<sub>j</sub>)</div>
    <div class="frac-bar"></div>
    <div class="frac-bot">(x<sub>i</sub> − x<sub>j</sub>)</div>
  </div>
</div>
```
This is fully readable and styled with monospaced typography, guaranteeing sharp mathematical presentation without importing large external libraries.

---

### 4. Interactive Controller Wiring
In `src/app.ts`, we will bind a click event to the toggle button.
```typescript
const introSection = document.getElementById('intro-section');
const introToggle = document.getElementById('intro-toggle');

if (introSection && introToggle) {
  introToggle.addEventListener('click', () => {
    const isExpanded = introSection.classList.toggle('expanded');
    introToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    const chev = introToggle.querySelector('.chev');
    if (chev) {
      chev.textContent = isExpanded ? '▲' : '▼';
    }
  });
}
```

---

## Technical Complexity Analysis
* **Evaluating interpolation at a point $x$**: $O(n^2)$ where $n$ is the number of points (cardinal functions are evaluated in nested loops).
* **DOM interactions**: $O(1)$ state toggle. There are zero performance overheads introduced by this change because the collapsible transition runs purely on the GPU via CSS height/opacity animations.
