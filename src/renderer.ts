/**
 * Módulo de renderizado del canvas.
 *
 * Responsabilidades:
 *  - Transformar coordenadas matemáticas ↔ píxeles (w2s / s2w)
 *  - Dibujar la cuadrícula y los ejes cartesianos
 *  - Trazar la curva P(x) muestreando píxel a píxel
 *  - Dibujar los nodos con estilo neumórfico
 */
import type { Point, ViewState } from './types';
import { evaluate } from './lagrange';

// ── Transformaciones de coordenadas ────────────────────────────────────────────

/**
 * Convierte un punto matemático (x, y) a coordenadas de pantalla (px, py).
 *
 * La pantalla tiene (0,0) en la esquina superior-izquierda.
 * El eje Y del canvas apunta hacia abajo, por eso se resta en Y.
 *
 *   px = W/2 + (x − cx) · scale
 *   py = H/2 − (y − cy) · scale
 */
export function w2s(x: number, y: number, v: ViewState, W: number, H: number): [number, number] {
  return [W / 2 + (x - v.cx) * v.scale, H / 2 - (y - v.cy) * v.scale];
}

/**
 * Inversión de w2s: convierte píxeles de pantalla a coordenadas matemáticas.
 * Se usa para traducir la posición del mouse al plano matemático.
 *
 *   x = (px − W/2) / scale + cx
 *   y = −(py − H/2) / scale + cy
 */
export function s2w(px: number, py: number, v: ViewState, W: number, H: number): [number, number] {
  return [(px - W / 2) / v.scale + v.cx, -(py - H / 2) / v.scale + v.cy];
}

// ── Cuadrícula y ejes ──────────────────────────────────────────────────────────

/**
 * Dibuja la cuadrícula de fondo, los ejes cartesianos y las etiquetas numéricas.
 *
 * Pasos:
 *  1. Limpia el canvas completo.
 *  2. Calcula el rango visible en coordenadas matemáticas.
 *  3. Traza líneas verticales y horizontales en cada entero del rango.
 *  4. Dibuja los ejes X e Y con mayor opacidad.
 *  5. Etiqueta los valores enteros junto a cada eje.
 */
export function drawGrid(ctx: CanvasRenderingContext2D, v: ViewState, W: number, H: number): void {
  ctx.clearRect(0, 0, W, H);

  // Rango matemático visible (esquinas del canvas en coords matemáticas)
  const [xMinW] = s2w(0, 0, v, W, H);
  const [xMaxW] = s2w(W, 0, v, W, H);
  const [, yMinW] = s2w(0, H, v, W, H);
  const [, yMaxW] = s2w(0, 0, v, W, H);

  // Líneas de cuadrícula menor (una por cada entero)
  ctx.strokeStyle = 'rgba(45, 55, 72, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = Math.ceil(xMinW); gx <= Math.floor(xMaxW); gx++) {
    const [sx] = w2s(gx, 0, v, W, H);
    ctx.moveTo(sx, 0); ctx.lineTo(sx, H);
  }
  for (let gy = Math.ceil(yMinW); gy <= Math.floor(yMaxW); gy++) {
    const [, sy] = w2s(0, gy, v, W, H);
    ctx.moveTo(0, sy); ctx.lineTo(W, sy);
  }
  ctx.stroke();

  // Ejes principales (más visibles que la cuadrícula)
  const [axisX, axisY] = w2s(0, 0, v, W, H);
  ctx.strokeStyle = 'rgba(45, 55, 72, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, axisY); ctx.lineTo(W, axisY); // eje X
  ctx.moveTo(axisX, 0); ctx.lineTo(axisX, H); // eje Y
  ctx.stroke();

  // Etiquetas numéricas en los ejes
  ctx.fillStyle = 'rgba(45, 55, 72, 0.55)';
  ctx.font = '11px ui-monospace, monospace';
  for (let gx = Math.ceil(xMinW); gx <= Math.floor(xMaxW); gx++) {
    if (gx === 0) continue; // el origen lo comparte con Y, se omite
    const [sx, sy] = w2s(gx, 0, v, W, H);
    ctx.fillText(String(gx), sx + 3, Math.min(H - 4, Math.max(12, sy + 12)));
  }
  for (let gy = Math.ceil(yMinW); gy <= Math.floor(yMaxW); gy++) {
    if (gy === 0) continue;
    const [sx, sy] = w2s(0, gy, v, W, H);
    ctx.fillText(String(gy), Math.min(W - 16, Math.max(4, sx + 4)), sy - 3);
  }
}

// ── Curva de interpolación ─────────────────────────────────────────────────────

/**
 * Traza la curva P(x) muestreando columna por columna del canvas.
 *
 * Se elige muestreo por píxel (no por valor matemático uniforme) para que:
 *  - La curva siempre llene el ancho visual completo.
 *  - El zoom y pan no provoquen "huecos" o sobresampling.
 *
 * El guard `sy > H + 1e4` evita que líneas con asíntotas enormes
 * distorsionen el trazo cuando el polinomio crece muy rápido fuera de vista.
 */
export function drawCurve(ctx: CanvasRenderingContext2D, nodes: Point[], v: ViewState, W: number, H: number): void {
  if (nodes.length < 2) return;

  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;

  for (let px = 0; px <= W; px += 1) {
    const [wx] = s2w(px, 0, v, W, H);   // columna en coords matemáticas
    const wy = evaluate(nodes, wx);
    if (wy === null) { started = false; continue; }

    const [, sy] = w2s(wx, wy, v, W, H); // resultado en coords de pantalla
    if (!isFinite(sy) || sy < -1e4 || sy > H + 1e4) { started = false; continue; }

    if (!started) { ctx.moveTo(px, sy); started = true; }
    else ctx.lineTo(px, sy);
  }
  ctx.stroke();
}

// ── Nodos ──────────────────────────────────────────────────────────────────────

/**
 * Dibuja cada nodo (xᵢ, yᵢ) con estilo neumórfico.
 *
 * Composición de capas por nodo:
 *  1. Halo de hover (círculo translúcido de r=14px, solo en nodo activo).
 *  2. Círculo principal relleno con el color de fondo (#e0e5ec) + borde.
 *  3. Punto central sólido que marca la posición exacta.
 *
 * El nodo bajo el cursor se agranda (r=9 vs r=6) para indicar
 * que es arrastrable o eliminable.
 */
export function drawNodes(
  ctx: CanvasRenderingContext2D,
  nodes: Point[],
  v: ViewState,
  W: number,
  H: number,
  hoverIndex: number | null,
): void {
  for (let i = 0; i < nodes.length; i++) {
    const [sx, sy] = w2s(nodes[i].x, nodes[i].y, v, W, H);
    const isHover = hoverIndex === i;
    const r = isHover ? 9 : 6;
    const color = nodes[i].color || '#2d3748';

    // Capa 1: halo de hover
    if (isHover) {
      ctx.beginPath();
      ctx.arc(sx, sy, 14, 0, Math.PI * 2);
      ctx.fillStyle = color + '26'; // ~15% opacidad
      ctx.fill();
    }

    // Capa 2: círculo principal (neumórfico: relleno bg + borde)
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#e0e5ec';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();

    // Capa 3: punto central
    ctx.beginPath();
    ctx.arc(sx, sy, isHover ? 3 : 2.2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

// ── Función principal de redibujado ────────────────────────────────────────────

/**
 * Punto de entrada del renderizador.
 * Llama a las tres capas en orden: cuadrícula → curva → nodos.
 * El orden importa: los nodos siempre quedan encima de la curva.
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  nodes: Point[],
  v: ViewState,
  W: number,
  H: number,
  hoverIndex: number | null,
): void {
  drawGrid(ctx, v, W, H);
  drawCurve(ctx, nodes, v, W, H);
  drawNodes(ctx, nodes, v, W, H, hoverIndex);
}
