/**
 * Punto de entrada de la aplicación.
 *
 * Orquesta tres responsabilidades principales:
 *  1. Canvas interactivo: click para añadir, drag para mover,
 *     right-click para borrar, shift+drag para paneo, wheel para zoom.
 *  2. Panel lateral: lista de nodos con coordenadas y grado del polinomio.
 *  3. Panel matemático: desarrollo paso a paso de Lᵢ(x) y P(x) en HTML.
 */
import type { Point, ViewState } from './types';
import { lagrangeBasis, evaluate } from './lagrange';
import { draw, w2s, s2w } from './renderer';

// ── Referencias al DOM ────────────────────────────────────────────────────────

const canvas     = document.getElementById('canvas') as HTMLCanvasElement;
const ctx        = canvas.getContext('2d')!;
const nodeListEl = document.getElementById('node-list')!;
const degreeEl   = document.getElementById('degree-value')!;
const clearBtn   = document.getElementById('clear-btn')!;
const mathPanel  = document.getElementById('math-body')!;
const mathToggle = document.getElementById('math-toggle')!;
const mathSection = document.getElementById('math-section')!;

// ── Estado de la aplicación ───────────────────────────────────────────────────

/** Lista de nodos de interpolación, siempre ordenada por x creciente. */
const nodes: Point[] = [];

/** Índice del nodo sobre el que está el cursor (−1 = ninguno). */
let hoverIndex: number | null = null;

/** Índice del nodo que se está arrastrando actualmente. */
let dragIndex:  number | null = null;

/**
 * Estado de la cámara: center (cx, cy) en coords matemáticas y zoom (scale).
 * scale = 40 → 40 píxeles por unidad matemática al inicio.
 */
const view: ViewState = { cx: 0, cy: 0, scale: 40 };

/** Bandera que indica si el usuario está haciendo paneo (shift+drag). */
let isPanning = false;
let panStart  = { x: 0, y: 0 };  // posición del mouse al inicio del pan
let viewStart = { cx: 0, cy: 0 }; // estado de la cámara al inicio del pan

/** Radio en píxeles para detectar si el cursor está "sobre" un nodo. */
const HOVER_RADIUS_PX = 10;

// ── Tamaño del canvas (resolución DPR) ────────────────────────────────────────

/**
 * Ancho y alto del canvas en CSS píxeles (no en píxeles físicos del buffer).
 * Se usan en todas las transformaciones matemáticas porque el ctx ya
 * tiene aplicado el factor DPR mediante setTransform.
 */
let cssW = 0, cssH = 0;

/**
 * Redimensiona el canvas respetando la densidad de píxeles del dispositivo.
 *
 * Sin esto, en pantallas HiDPI (Retina, etc.) el canvas se ve borroso
 * porque el navegador estira un buffer de baja resolución.
 *
 * Solución: buffer físico = tamaño CSS × DPR, pero se dibuja con
 * coordenadas CSS gracias a ctx.setTransform(dpr, 0, 0, dpr, 0, 0).
 */
function resizeCanvas(): void {
  const rect = canvas.getBoundingClientRect();
  const dpr  = window.devicePixelRatio || 1;
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // escala el contexto, no el canvas
  cssW = rect.width;
  cssH = rect.height;
  redraw();
}

// ── Funciones auxiliares ──────────────────────────────────────────────────────

/** Convierte un nodo matemático a píxeles CSS. */
function toPixel(p: Point): [number, number] { return w2s(p.x, p.y, view, cssW, cssH); }

/** Convierte píxeles CSS del mouse a coordenadas matemáticas. */
function toMath(px: number, py: number): Point {
  const [x, y] = s2w(px, py, view, cssW, cssH);
  return { x, y };
}

/**
 * Busca el nodo más cercano al punto (px, py) dentro del radio dado.
 * Retorna su índice o null si ninguno está suficientemente cerca.
 * Usa distancia al cuadrado para evitar la raíz cuadrada innecesaria.
 */
function findNodeNear(px: number, py: number, radius = HOVER_RADIUS_PX): number | null {
  let best = -1, bestD = radius * radius;
  for (let i = 0; i < nodes.length; i++) {
    const [sx, sy] = toPixel(nodes[i]);
    const d = (sx - px) ** 2 + (sy - py) ** 2;
    if (d <= bestD) { bestD = d; best = i; }
  }
  return best === -1 ? null : best;
}

/**
 * Formatea un número a d decimales, eliminando el −0 que produce JS
 * en ciertos cálculos de punto flotante (ej: −0.000 → 0.000).
 */
function fmt(n: number, d = 3): string {
  if (!isFinite(n)) return '∞';
  const r = Number(n.toFixed(d));
  return Object.is(r, -0) ? (0).toFixed(d) : r.toFixed(d);
}

// ── Eventos del mouse ─────────────────────────────────────────────────────────

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  // Botón derecho → eliminar nodo más cercano
  if (e.button === 2) {
    const idx = findNodeNear(px, py);
    if (idx !== null) { nodes.splice(idx, 1); hoverIndex = null; sync(); }
    return;
  }

  // Botón central o Shift+clic izquierdo → iniciar paneo
  if (e.button === 1 || e.shiftKey) {
    isPanning = true;
    panStart  = { x: px, y: py };
    viewStart = { cx: view.cx, cy: view.cy };
    return;
  }

  // Clic izquierdo: arrastrar nodo existente o crear uno nuevo
  const idx = findNodeNear(px, py);
  if (idx !== null) {
    dragIndex = idx;
  } else {
    const newNode = toMath(px, py);
    nodes.push(newNode);
    nodes.sort((a, b) => a.x - b.x); // mantener orden por x para evaluate
    dragIndex = nodes.indexOf(newNode);
    sync();
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  if (isPanning) {
    // Desplazar la cámara inversamente al movimiento del mouse
    view.cx = viewStart.cx - (px - panStart.x) / view.scale;
    view.cy = viewStart.cy + (py - panStart.y) / view.scale;
    redraw();
    return;
  }

  if (dragIndex !== null) {
    nodes[dragIndex] = toMath(px, py);
    sync();
    return;
  }

  // Actualizar hover solo si cambió el nodo activo (evita redraws innecesarios)
  const idx = findNodeNear(px, py);
  if (idx !== hoverIndex) {
    hoverIndex = idx;
    syncList();
    redraw();
  }
  canvas.style.cursor = idx !== null ? 'grab' : 'crosshair';
});

window.addEventListener('mouseup', () => {
  if (dragIndex !== null) {
    nodes.sort((a, b) => a.x - b.x); // reordenar tras mover
    dragIndex = null;
    sync();
  }
  isPanning = false;
});

// Deshabilitar el menú contextual nativo para que el botón derecho elimine nodos
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

/**
 * Zoom con la rueda del mouse, centrado en la posición del cursor.
 *
 * Técnica "zoom to cursor":
 *  1. Guardar la posición matemática bajo el cursor ANTES de cambiar la escala.
 *  2. Aplicar la nueva escala.
 *  3. Calcular la posición matemática bajo el cursor DESPUÉS.
 *  4. Compensar cx con la diferencia → el punto bajo el cursor no se mueve.
 */
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  const [wxBefore, wyBefore] = s2w(px, py, view, cssW, cssH);
  const factor = Math.exp(-e.deltaY * 0.001); // suavizado exponencial
  view.scale = Math.max(6, Math.min(400, view.scale * factor));
  const [wxAfter, wyAfter] = s2w(px, py, view, cssW, cssH);

  // Compensar desplazamiento para fijar el punto bajo el cursor
  view.cx += wxBefore - wxAfter;
  view.cy += wyBefore - wyAfter;
  redraw();
}, { passive: false });

// ── Botones ───────────────────────────────────────────────────────────────────

clearBtn.addEventListener('click', () => {
  nodes.splice(0, nodes.length);
  hoverIndex = null;
  dragIndex  = null;
  sync();
});

mathToggle.addEventListener('click', () => {
  const collapsed = mathSection.classList.toggle('collapsed');
  mathToggle.setAttribute('aria-expanded', String(!collapsed));
});

// ── Sincronización de la UI ───────────────────────────────────────────────────

/**
 * Actualiza la lista de nodos y el indicador de grado en el panel lateral.
 * El grado del polinomio de Lagrange es siempre n−1 para n nodos.
 */
function syncList(): void {
  if (nodes.length === 0) {
    nodeListEl.innerHTML = '<div class="empty">No hay nodos. Hacé click en el canvas para añadir.</div>';
  } else {
    nodeListEl.innerHTML = nodes.map((n, i) => {
      const hov = i === hoverIndex ? ' is-hover' : '';
      return `<div class="node-row${hov}">
        <span class="node-idx">x<sub>${i}</sub></span>
        <span class="node-val">(${fmt(n.x)}, ${fmt(n.y)})</span>
      </div>`;
    }).join('');
  }
  degreeEl.textContent = nodes.length === 0 ? '—' : String(Math.max(0, nodes.length - 1));
}

/**
 * Genera el desarrollo matemático de Lagrange en HTML y lo inyecta en el panel.
 *
 * Con menos de 2 nodos: muestra el placeholder con la teoría del método.
 * Con 2+ nodos, genera tres secciones:
 *  1. Una tarjeta por cada Lᵢ(x) mostrando numerador/denominador como fracción.
 *  2. El ensamble final: P(x) = y₀·L₀(x) + y₁·L₁(x) + …
 *  3. Tabla de pesos wᵢ = 1 / Π(xᵢ − xⱼ) para referencia rápida.
 *  4. Verificación de la propiedad cardinal para el nodo en hover.
 */
function syncMath(): void {
  if (nodes.length < 2) {
    mathPanel.innerHTML = `
      <div class="math-placeholder">
        <p><strong>Método de Lagrange.</strong> Dados <code>n+1</code> nodos
        <code>(x₀, y₀), …, (xₙ, yₙ)</code> con abscisas distintas, el único
        polinomio de grado ≤ n que pasa por todos ellos es:</p>
        <p class="math-line">P(x) = Σᵢ yᵢ · Lᵢ(x)</p>
        <p>donde cada función cardinal es:</p>
        <p class="math-line">Lᵢ(x) = Π<sub>j≠i</sub> (x − xⱼ) / (xᵢ − xⱼ)</p>
        <p class="hint">Agregá al menos 2 puntos para ver el desarrollo con tus nodos.</p>
      </div>`;
    return;
  }

  const parts: string[] = [];

  // Sección 1: función cardinal Lᵢ(x) con valores numéricos sustituidos
  for (let i = 0; i < nodes.length; i++) {
    const xi = nodes[i].x;
    const num: string[] = [], den: string[] = [];
    let denomVal = 1;
    for (let j = 0; j < nodes.length; j++) {
      if (j === i) continue;
      const xj = nodes[j].x;
      num.push(`(x − ${fmt(xj)})`);
      den.push(`(${fmt(xi)} − ${fmt(xj)})`);
      denomVal *= xi - xj;
    }
    parts.push(`
      <div class="math-step">
        <div class="step-label">L<sub>${i}</sub>(x)</div>
        <div class="step-expr">
          <div class="frac">
            <div class="frac-top">${num.join(' · ')}</div>
            <div class="frac-bar"></div>
            <div class="frac-bot">${den.join(' · ')} = ${fmt(denomVal, 4)}</div>
          </div>
        </div>
      </div>`);
  }

  // Sección 2: ensamble del polinomio P(x) = Σ yᵢ · Lᵢ(x)
  const assembly = nodes.map((n, i) => `${fmt(n.y)} · L<sub>${i}</sub>(x)`).join('  +  ');
  parts.push(`
    <div class="math-step assembly">
      <div class="step-label">P(x)</div>
      <div class="step-expr">${assembly}</div>
    </div>`);

  // Sección 3: tabla de pesos baricéntricos wᵢ = 1 / Π_{j≠i}(xᵢ − xⱼ)
  const weights = nodes.map((n, i) => {
    let d = 1;
    for (let j = 0; j < nodes.length; j++) if (j !== i) d *= nodes[i].x - nodes[j].x;
    return `<tr>
      <td>i = ${i}</td>
      <td>x<sub>${i}</sub> = ${fmt(n.x)}</td>
      <td>y<sub>${i}</sub> = ${fmt(n.y)}</td>
      <td>1 / Π(x<sub>${i}</sub> − x<sub>j</sub>) = ${fmt(1 / d, 4)}</td>
    </tr>`;
  }).join('');
  parts.push(`
    <div class="math-step">
      <div class="step-label">Pesos</div>
      <div class="step-expr">
        <table class="weights">
          <thead><tr><th>i</th><th>x<sub>i</sub></th><th>y<sub>i</sub></th><th>w<sub>i</sub></th></tr></thead>
          <tbody>${weights}</tbody>
        </table>
      </div>
    </div>`);

  // Sección 4: verificación de la propiedad cardinal L_i(x_k) = δ_{ik}
  // Solo se muestra cuando el cursor está sobre un nodo específico.
  if (hoverIndex !== null) {
    const i = hoverIndex;
    const checks = nodes.map((_, k) =>
      `L<sub>${i}</sub>(x<sub>${k}</sub>) = ${fmt(lagrangeBasis(nodes, i, nodes[k].x), 3)}`
    );
    parts.push(`
      <div class="math-step verify">
        <div class="step-label">Verif · i=${i}</div>
        <div class="step-expr">${checks.join('  ·  ')}</div>
      </div>`);
  }

  mathPanel.innerHTML = parts.join('');
}

/** Redibuja el canvas sin tocar la UI lateral. */
function redraw(): void {
  if (!cssW) return;
  draw(ctx, nodes, view, cssW, cssH, hoverIndex);
}

/** Sincroniza todo: lista de nodos, panel matemático y canvas. */
function sync(): void {
  syncList();
  syncMath();
  redraw();
}

// ── Inicialización ────────────────────────────────────────────────────────────

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Nodos de ejemplo tomados del ejercicio de clase para demostración inicial
nodes.push({ x: -3, y: 1 }, { x: -1, y: -2 }, { x: 2, y: 1.5 }, { x: 4, y: -0.5 });
nodes.sort((a, b) => a.x - b.x);
sync();
