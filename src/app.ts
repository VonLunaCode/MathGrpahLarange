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
import { lagrangeBasis, numeratorCoefficients, denominator, getCoefficients } from './lagrange';
import type { Frac } from './rational';
import {
  toFraction, fToHtml, pToHtml,
  lagrangeNumerator, lagrangeDenominator, lagrangeDevelopExact,
  fMul, fInv, pScale, ZERO
} from './rational';
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

// Referencias nuevas para ingreso manual e instrucciones
const inputX     = document.getElementById('input-x') as HTMLInputElement;
const inputY     = document.getElementById('input-y') as HTMLInputElement;
const addBtn     = document.getElementById('add-btn') as HTMLButtonElement;
const inputError = document.getElementById('input-error') as HTMLDivElement;
const instructionsCard = document.getElementById('instructions-card')!;
const instructionsToggle = document.getElementById('instructions-toggle')!;

// Referencias para la introducción enriquecida
const introCard = document.getElementById('intro-section')!;
const introToggle = document.getElementById('intro-toggle')!;

// ── Estado de la aplicación ───────────────────────────────────────────────────

/** Paleta de colores armónicos para los nodos */
const COLORS = ['#4f46e5', '#059669', '#d97706', '#e11d48', '#7c3aed', '#0891b2'];

/** Lista de nodos de interpolación, siempre ordenada por x creciente. */
const nodes: Point[] = [];

/** Retorna el siguiente color disponible en la paleta, priorizando los no usados. */
function getNextColor(): string {
  const used = new Set(nodes.map(n => n.color));
  for (const c of COLORS) {
    if (!used.has(c)) return c;
  }
  return COLORS[nodes.length % COLORS.length];
}

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
function toMath(px: number, py: number): { x: number; y: number } {
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

/** Exponentes en superíndice unicode para los términos del polinomio. */
const SUP = ['', 'x', 'x²', 'x³', 'x⁴', 'x⁵', 'x⁶', 'x⁷', 'x⁸', 'x⁹'];

/**
 * Convierte un arreglo de coeficientes [a₀, a₁, a₂, …] a una cadena legible
 * tipo "a₀ + a₁x + a₂x² + …", como se escribiría a mano:
 *  - omite términos que redondean a 0,
 *  - omite el coeficiente 1 (salvo en el término constante),
 *  - separa los términos con + / − y deja el primero sin signo si es positivo.
 */
function polyToString(coeffs: number[], d = 3): string {
  let out = '';
  let first = true;
  for (let k = coeffs.length - 1; k >= 0; k--) {
    const c = Number(coeffs[k].toFixed(d));
    if (c === 0) continue;
    const mag = Math.abs(c);
    const power = k < SUP.length ? SUP[k] : `x^${k}`;
    const coefStr = (mag === 1 && k > 0) ? '' : fmt(mag, d); // "1x" → "x"
    const body = `${coefStr}${power}`;
    if (first) {
      out = (c < 0 ? '−' : '') + body;
      first = false;
    } else {
      out += (c < 0 ? ' − ' : ' + ') + body;
    }
  }
  return out === '' ? '0' : out;
}

/**
 * Formatea un número como fracción exacta si es racional con denominador
 * chico (ej: 1.5 → "3/2", −0.5 → "−1/2"); si no, cae a decimal (ej: un
 * float arbitrario de un clic). Es el puente entre el modo exacto y el decimal.
 */
function fmtNum(x: number): string {
  const f = toFraction(x);
  return f ? fToHtml(f) : fmt(x);
}

/**
 * Intenta convertir todos los nodos a fracciones exactas (x e y).
 * Devuelve null si algún valor no es racional con denominador chico, lo que
 * indica a syncMath que debe mostrar el desarrollo en decimal.
 */
function nodesToFrac(nodeList: Point[]): { xs: Frac[]; ys: Frac[] } | null {
  const xs: Frac[] = [], ys: Frac[] = [];
  for (const n of nodeList) {
    const fx = toFraction(n.x), fy = toFraction(n.y);
    if (!fx || !fy) return null;
    xs.push(fx); ys.push(fy);
  }
  return { xs, ys };
}

/**
 * Numerador factorizado de Lᵢ(x): Π_{j≠i} (x − xⱼ), con signos simplificados
 * para que se lea como en clase: (x − (−1)) se muestra como (x + 1).
 * Los valores se muestran como fracción cuando son racionales.
 */
function factoredNumerator(nodeList: Point[], i: number): string {
  const factors: string[] = [];
  for (let j = 0; j < nodeList.length; j++) {
    if (j === i) continue;
    const xj = nodeList[j].x;
    if (Number(xj.toFixed(6)) === 0) factors.push('(x)');
    else if (xj < 0)                 factors.push(`(x + ${fmtNum(-xj)})`);
    else                             factors.push(`(x − ${fmtNum(xj)})`);
  }
  return factors.join('');
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
    const mathCoords = toMath(px, py);
    const newNode: Point = { ...mathCoords, color: getNextColor() };
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
    const originalColor = nodes[dragIndex].color;
    nodes[dragIndex] = { ...toMath(px, py), color: originalColor };
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
  hideInputError();
  sync();
});

mathToggle.addEventListener('click', () => {
  const collapsed = mathSection.classList.toggle('collapsed');
  mathToggle.setAttribute('aria-expanded', String(!collapsed));
});

// Eventos de ingreso manual
addBtn.addEventListener('click', () => {
  const xVal = parseFloat(inputX.value);
  const yVal = parseFloat(inputY.value);

  if (isNaN(xVal) || isNaN(yVal)) {
    showInputError('Ingresá valores numéricos válidos.');
    return;
  }

  // Validar unicidad de X (evita división por cero en Lagrange)
  const collision = nodes.some(n => Math.abs(n.x - xVal) < 1e-5);
  if (collision) {
    showInputError(`Ya existe un nodo con X = ${fmt(xVal, 3)}.`);
    return;
  }

  hideInputError();
  const newNode: Point = { x: xVal, y: yVal, color: getNextColor() };
  nodes.push(newNode);
  nodes.sort((a, b) => a.x - b.x);

  inputX.value = '';
  inputY.value = '';
  sync();
});

function showInputError(msg: string): void {
  inputError.textContent = msg;
  inputError.style.display = 'block';
}

function hideInputError(): void {
  inputError.style.display = 'none';
  inputError.textContent = '';
}

// Evento de instrucciones colapsables
instructionsToggle.addEventListener('click', () => {
  const expanded = instructionsCard.classList.toggle('expanded');
  instructionsToggle.setAttribute('aria-expanded', String(expanded));
});

// Evento de introducción colapsable
introToggle.addEventListener('click', () => {
  const expanded = introCard.classList.toggle('expanded');
  introToggle.setAttribute('aria-expanded', String(expanded));
  const chev = introToggle.querySelector('.chev');
  if (chev) {
    chev.textContent = expanded ? '▲' : '▼';
  }
});

// ── Sincronización de la UI ───────────────────────────────────────────────────

/**
 * Actualiza la lista de nodos y el indicador de grado en el panel lateral.
 * El grado del polinomio de Lagrange es siempre n−1 para n nodos.
 */
function syncList(): void {
  if (nodes.length === 0) {
    nodeListEl.innerHTML = '<div class="empty">No hay nodos. Haz clic en el canvas para agregar.</div>';
  } else {
    nodeListEl.innerHTML = nodes.map((n, i) => {
      const hov = i === hoverIndex ? ' is-hover' : '';
      return `<div class="node-row${hov}">
        <span class="node-idx">
          <span class="legend-dot" style="background-color: ${n.color};"></span>x<sub>${i}</sub>
        </span>
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
 * Con 2+ nodos, genera estas secciones:
 *  1. Una tarjeta por cada Lᵢ(x): sustitución, denominador resuelto,
 *     numerador expandido a polinomio y aporte f(xᵢ)·Lᵢ(x).
 *  2. El ensamble: P(x) = f(x₀)·L₀(x) + f(x₁)·L₁(x) + …
 *  3. El polinomio final desarrollado: P(x) = a₀ + a₁x + a₂x² + …
 *  4. Verificación de la propiedad cardinal para el nodo en hover.
 */
function syncMath(): void {
  if (nodes.length < 2) {
    mathPanel.innerHTML = `
      <div class="math-placeholder">
        <p><strong>Método de Lagrange.</strong> Dados <code>n+1</code> nodos
        <code>(x₀, f(x₀)), …, (xₙ, f(xₙ))</code> con abscisas distintas, el único
        polinomio de grado ≤ n que pasa por todos ellos es:</p>
        <p class="math-line">P(x) = Σᵢ f(xᵢ) · Lᵢ(x)</p>
        <p>donde cada función cardinal es:</p>
        <p class="math-line">Lᵢ(x) = Π<sub>j≠i</sub> (x − xⱼ) / (xᵢ − xⱼ)</p>
        <p class="hint">Agrega al menos 2 puntos para ver el desarrollo con tus nodos.</p>
      </div>`;
    return;
  }

  const parts: string[] = [];

  // ¿Todos los nodos son racionales? Si lo son, el desarrollo del polinomio
  // se muestra en fracciones EXACTAS; si hay algún float (típico de un clic
  // arbitrario) el desarrollo cae a decimal, porque no se puede fraccionar.
  const ex = nodesToFrac(nodes);

  /** Denominador de Lᵢ(x): fracción apilada si se puede, decimal si no. */
  const denomStr = (i: number): string =>
    ex ? fToHtml(lagrangeDenominator(ex.xs, i)) : fmt(denominator(nodes, i), 4);

  /** Numerador de Lᵢ(x) expandido: fracciones apiladas o decimal. */
  const numStr = (i: number): string =>
    ex ? pToHtml(lagrangeNumerator(ex.xs, i)) : polyToString(numeratorCoefficients(nodes, i));

  if (!ex) {
    parts.push(`<div class="math-note">Algún punto no es racional (float de un clic):
      el desarrollo se muestra en <strong>decimal</strong>. Usá coordenadas
      enteras o fracciones simples para ver fracciones exactas.</div>`);
  }

  // Sección 1: función cardinal Lᵢ(x) desarrollada paso a paso, como a mano:
  //  1. sustitución de los xⱼ en numerador y denominador,
  //  2. denominador resuelto a un número,
  //  3. numerador expandido a polinomio,
  //  4. aporte del punto al polinomio final: f(xᵢ) · Lᵢ(x).
  for (let i = 0; i < nodes.length; i++) {
    const xi = nodes[i].x;
    const den: string[] = [];
    for (let j = 0; j < nodes.length; j++) {
      if (j === i) continue;
      const xj = nodes[j].x;
      // El sustraendo negativo va entre paréntesis: (−3 − (−1))
      const sub = xj < 0 ? `(${fmtNum(xj)})` : fmtNum(xj);
      den.push(`(${fmtNum(xi)} − ${sub})`);
    }

    parts.push(`
      <div class="math-step" style="border-left: 4px solid ${nodes[i].color};">
        <div class="step-label" style="color: ${nodes[i].color}; font-weight: bold;">L<sub>${i}</sub>(x)</div>
        <div class="step-expr" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; width: 100%; white-space: normal;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="frac">
              <div class="frac-top">${factoredNumerator(nodes, i)}</div>
              <div class="frac-bar"></div>
              <div class="frac-bot">${den.join(' · ')}</div>
            </div>
            <span style="font-size: 16px; font-weight: 500; color: var(--ink-soft);">=</span>
            <div class="frac">
              <div class="frac-top">${numStr(i)}</div>
              <div class="frac-bar"></div>
              <div class="frac-bot">${denomStr(i)}</div>
            </div>
          </div>
          
          <div class="aporte-badge" style="border: 1px solid ${nodes[i].color}33; background: ${nodes[i].color}08; color: ${nodes[i].color}; padding: 6px 12px; border-radius: var(--r-sm); font-size: 11.5px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; box-shadow: var(--inset-sm);">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 9.5px; opacity: 0.8; letter-spacing: 0.05em;">Aporte:</span>
            <span>f(x<sub>${i}</sub>)·L<sub>${i}</sub>(x) = ${fmtNum(nodes[i].y)}·L<sub>${i}</sub>(x)</span>
          </div>
        </div>
      </div>`);
  }

  // Sección 2: ensamble del polinomio P(x) = Σ f(xᵢ) · Lᵢ(x).
  // Presenta alineados verticalmente cada término simbólico flotando sobre su sustitución
  // correspondiente, alineando los operadores (+, =) con la línea de la fracción.
  const assemblyTerms = nodes.map((n, i) => {
    const v = fmtNum(n.y);
    const val = n.y < 0 ? `(${v})` : v;
    
    const termSymbolic = `<span style="color: ${n.color}; font-weight: bold; padding: 4px 8px; border-radius: var(--r-sm); background: ${n.color}11; font-size: 11.5px; box-shadow: var(--inset-sm); display: inline-block;">f(x<sub>${i}</sub>)·L<sub>${i}</sub>(x)</span>`;
    
    const termReal = `<span style="color: ${n.color}; display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;">
      ${val} · 
      <span class="ifrac">
        <span class="ifrac-n">${numStr(i)}</span>
        <span class="ifrac-d">${denomStr(i)}</span>
      </span>
    </span>`;
    
    return `
      <div class="assembly-term" style="position: relative; display: inline-flex; align-items: center; vertical-align: middle;">
        <div class="term-badge" style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-8px); white-space: nowrap; pointer-events: none;">
          ${termSymbolic}
        </div>
        ${termReal}
      </div>`;
  }).join('<span style="font-size: 16px; font-weight: 500; color: var(--ink-faint); margin: 0 4px; vertical-align: middle;">+</span>');

  const distributedTerms = nodes.map((n, i) => {
    if (ex) {
      const xs = ex.xs;
      const ys = ex.ys;
      const denom = lagrangeDenominator(xs, i);
      const scale = fMul(ys[i], fInv(denom));
      
      if (scale.n === 0n) {
        return `<span style="color: ${n.color}; font-weight: 500; vertical-align: middle;">0</span>`;
      }
      
      const termPoly = pScale(lagrangeNumerator(xs, i), { n: scale.n, d: 1n });
      const numHtml = pToHtml(termPoly);
      
      if (scale.d === 1n) {
        return `<span style="color: ${n.color}; vertical-align: middle;">${numHtml}</span>`;
      }
      
      return `<span style="color: ${n.color}; display: inline-flex; align-items: center; vertical-align: middle;">
        <span class="ifrac">
          <span class="ifrac-n">${numHtml}</span>
          <span class="ifrac-d">${scale.d}</span>
        </span>
      </span>`;
    } else {
      const yi = n.y;
      const di = denominator(nodes, i);
      if (Math.abs(yi) < 1e-9) {
        return `<span style="color: ${n.color}; font-weight: 500; vertical-align: middle;">0</span>`;
      }
      const scale = yi / di;
      const coeffs = numeratorCoefficients(nodes, i).map(c => c * scale);
      const polyStr = polyToString(coeffs);
      return `<span style="color: ${n.color}; vertical-align: middle;">${polyStr}</span>`;
    }
  }).join('<span style="font-size: 16px; font-weight: 500; color: var(--ink-faint); margin: 0 4px; vertical-align: middle;">+</span>');

  const coefSteps: string[] = [];
  if (ex) {
    const xs = ex.xs;
    const ys = ex.ys;
    const degree = nodes.length - 1;
    const finalPolyPoly = lagrangeDevelopExact(xs, ys);
    
    for (let k = degree; k >= 0; k--) {
      const termCoefs: string[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const denom = lagrangeDenominator(xs, i);
        const scale = fMul(ys[i], fInv(denom));
        const basisCoeffs = lagrangeNumerator(xs, i);
        const basisK = basisCoeffs[k] ?? ZERO;
        const termCoef = fMul(scale, basisK);
        termCoefs.push(fToHtml(termCoef));
      }
      
      const powerStr = k === 0 ? 'independiente' : (k === 1 ? 'de x' : `de x<sup>${k}</sup>`);
      const sumExpr = termCoefs.join('  +  ').replace(/\+\s*−/g, '− ');
      const totalHtml = fToHtml(finalPolyPoly[k] ?? ZERO);
      
      coefSteps.push(`
        <div style="margin-bottom: 6px; font-size: 13px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-weight: 600; color: var(--ink-soft); min-width: 140px;">Coef. ${powerStr}:</span>
          <span style="vertical-align: middle;">${sumExpr} = <strong>${totalHtml}</strong></span>
        </div>`);
    }
  } else {
    const degree = nodes.length - 1;
    const finalPolyCoeffs = getCoefficients(nodes) || [];
    
    for (let k = degree; k >= 0; k--) {
      const termCoefs: string[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const di = denominator(nodes, i);
        const scale = nodes[i].y / di;
        const basisCoeffs = numeratorCoefficients(nodes, i);
        const basisK = basisCoeffs[k] ?? 0;
        const termCoef = scale * basisK;
        termCoefs.push(fmt(termCoef, 4));
      }
      
      const powerStr = k === 0 ? 'independiente' : (k === 1 ? 'de x' : `de x<sup>${k}</sup>`);
      const sumExpr = termCoefs.join('  +  ').replace(/\+\s*-\s*/g, '− ');
      const totalHtml = fmt(finalPolyCoeffs[k] ?? 0, 4);
      
      coefSteps.push(`
        <div style="margin-bottom: 6px; font-size: 13px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-weight: 600; color: var(--ink-soft); min-width: 140px;">Coef. ${powerStr}:</span>
          <span style="vertical-align: middle;">${sumExpr} = <strong>${totalHtml}</strong></span>
        </div>`);
    }
  }

  const finalPoly = ex ? pToHtml(lagrangeDevelopExact(ex.xs, ex.ys))
                       : (() => { const c = getCoefficients(nodes); return c ? polyToString(c) : null; })();

  if (finalPoly) {
    parts.push(`
      <div class="math-step assembly" style="align-items: flex-start; padding-top: 20px; padding-bottom: 20px;">
        <div class="step-label" style="font-weight: bold; font-size: 14px; color: var(--ink-soft); line-height: 1.8;">P(x)</div>
        <div class="step-expr" style="white-space: normal; line-height: 1.6; display: flex; flex-direction: column; gap: 24px; width: 100%;">
          
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 12px; letter-spacing: 0.05em;">1. Ensamble y sustitución en la fórmula general</div>
            <div style="white-space: nowrap; overflow-x: auto; display: flex; align-items: center; gap: 8px; padding-top: 36px; padding-bottom: 8px; width: 100%;">
              <span style="font-size: 14.5px; font-weight: bold; color: var(--ink); margin-right: 4px; vertical-align: middle;">P(x) =</span>
              ${assemblyTerms}
            </div>
          </div>

          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 12px; letter-spacing: 0.05em;">2. Multiplicación de f(xᵢ) y simplificación de términos</div>
            <div style="white-space: nowrap; overflow-x: auto; display: flex; align-items: center; gap: 8px; padding-bottom: 8px; width: 100%;">
              <span style="font-size: 14.5px; font-weight: bold; color: var(--ink); margin-right: 4px; vertical-align: middle;">P(x) =</span>
              ${distributedTerms}
            </div>
          </div>

          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 12px; letter-spacing: 0.05em;">3. Operación y reducción de coeficientes por potencia</div>
            <div style="display: flex; flex-direction: column; gap: 6px; padding-left: 8px;">
              ${coefSteps.join('')}
            </div>
          </div>

          <div style="border-top: 1px dashed rgba(45, 55, 72, 0.15); padding-top: 16px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 12px; letter-spacing: 0.05em;">4. Polinomio desarrollado final</div>
            <div style="font-size: 15.5px; font-weight: bold; color: var(--ink); display: inline-flex; align-items: center; gap: 6px; vertical-align: middle;">
              <span style="vertical-align: middle;">P(x) =</span>
              ${finalPoly}
            </div>
          </div>

        </div>
      </div>`);
  }

  // Sección 4: verificación de la propiedad cardinal L_i(x_k) = δ_{ik}
  // Solo se muestra cuando el cursor está sobre un nodo específico.
  if (hoverIndex !== null) {
    const i = hoverIndex;
    const checks = nodes.map((_, k) =>
      `L<sub>${i}</sub>(x<sub>${k}</sub>) = ${fmt(lagrangeBasis(nodes, i, nodes[k].x), 3)}`
    );
    parts.push(`
      <div class="math-step verify" style="border-left: 4px solid ${nodes[i].color};">
        <div class="step-label" style="color: ${nodes[i].color}; font-weight: bold;">Verif · i=${i}</div>
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
nodes.push(
  { x: -3, y: 1, color: COLORS[0] },
  { x: -1, y: -2, color: COLORS[1] },
  { x: 2, y: 1.5, color: COLORS[2] },
  { x: 4, y: -0.5, color: COLORS[3] }
);
nodes.sort((a, b) => a.x - b.x);
sync();
