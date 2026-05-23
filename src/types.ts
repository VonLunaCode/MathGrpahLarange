/**
 * Punto en el plano cartesiano con coordenadas matemáticas.
 * Representa un nodo de interpolación (xᵢ, yᵢ = f(xᵢ)).
 */
export type Point = { x: number; y: number };

/**
 * Estado de la cámara del canvas.
 * Define qué parte del plano matemático está visible y a qué escala.
 *
 *  cx, cy  → coordenadas matemáticas del centro de la ventana
 *  scale   → píxeles por unidad matemática (zoom)
 *
 * La transformación mundo→pantalla es:
 *   px = W/2 + (x - cx) * scale
 *   py = H/2 - (y - cy) * scale   ← Y invertida: eje ↑ positivo
 */
export interface ViewState {
  cx: number;
  cy: number;
  scale: number;
}
