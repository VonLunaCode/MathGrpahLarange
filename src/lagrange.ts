/**
 * Motor de interpolación de Lagrange.
 *
 * Dado un conjunto de n+1 nodos (x₀,y₀), …, (xₙ,yₙ) con abscisas
 * distintas, existe un ÚNICO polinomio de grado ≤ n que pasa por todos.
 *
 *   P(x) = Σᵢ yᵢ · Lᵢ(x)
 *
 * donde la función cardinal Lᵢ(x) vale 1 en xᵢ y 0 en el resto.
 */
import type { Point } from './types';

/**
 * Evalúa la función cardinal de Lagrange para el nodo i en el punto x.
 *
 *   Lᵢ(x) = Π_{j≠i}  (x − xⱼ) / (xᵢ − xⱼ)
 *
 * Propiedad cardinal: Lᵢ(xᵢ) = 1  y  Lᵢ(xⱼ) = 0 para j ≠ i.
 * Esto garantiza que P(xᵢ) = yᵢ para cada nodo.
 */
export function lagrangeBasis(nodes: Point[], i: number, x: number): number {
  let result = 1;
  for (let j = 0; j < nodes.length; j++) {
    if (j !== i) {
      // Cada factor del producto: (x − xⱼ) / (xᵢ − xⱼ)
      result *= (x - nodes[j].x) / (nodes[i].x - nodes[j].x);
    }
  }
  return result;
}

/**
 * Evalúa el polinomio interpolante de Lagrange en x.
 *
 *   P(x) = Σᵢ yᵢ · Lᵢ(x)
 *
 * Retorna null si hay menos de 2 nodos (no se puede interpolar).
 */
export function evaluate(nodes: Point[], x: number): number | null {
  if (nodes.length < 2) return null;
  let sum = 0;
  for (let i = 0; i < nodes.length; i++) {
    sum += nodes[i].y * lagrangeBasis(nodes, i, x);
  }
  return sum;
}

/**
 * Expande el numerador de Lᵢ(x): Π_{j≠i} (x − xⱼ) como arreglo de
 * coeficientes [a₀, a₁, a₂, …], donde poly[k] es el coeficiente de xᵏ.
 *
 * Es la multiplicación polinomio-por-polinomio (convolución 1D) que se
 * hace a mano al expandir el producto de factores lineales. Se expone
 * aparte para que el panel matemático muestre el desarrollo de cada Lᵢ(x).
 */
export function numeratorCoefficients(nodes: Point[], i: number): number[] {
  // Invariante: poly[k] es el coeficiente de xᵏ en el producto parcial.
  let poly: number[] = [1];
  for (let j = 0; j < nodes.length; j++) {
    if (j === i) continue;
    const xj = nodes[j].x;
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let k = 0; k < poly.length; k++) {
      next[k]     -= poly[k] * xj; // término constante: −xⱼ · coef
      next[k + 1] += poly[k];      // término lineal:    +1  · coef
    }
    poly = next;
  }
  return poly;
}

/**
 * Denominador de Lᵢ(x): Π_{j≠i} (xᵢ − xⱼ).
 * Es un número (no depende de x) y nunca es cero si las abscisas son distintas.
 */
export function denominator(nodes: Point[], i: number): number {
  let denom = 1;
  for (let j = 0; j < nodes.length; j++) {
    if (j !== i) denom *= nodes[i].x - nodes[j].x;
  }
  return denom;
}

/**
 * Expande P(x) a la forma estándar: a₀ + a₁x + a₂x² + …
 * Retorna el arreglo de coeficientes [a₀, a₁, a₂, …].
 *
 * Algoritmo:
 *  1. Para cada nodo i, expande el numerador Π_{j≠i} (x − xⱼ) en coeficientes.
 *  2. Lo escala por yᵢ / denominador y lo acumula en el resultado.
 *
 * No se usa en la curva (para eso está `evaluate`), sino en el
 * panel matemático para mostrar la forma colapsada del polinomio.
 */
export function getCoefficients(nodes: Point[]): number[] | null {
  if (nodes.length < 2) return null;

  const n = nodes.length;
  const result = new Array<number>(n).fill(0);

  for (let i = 0; i < n; i++) {
    const poly = numeratorCoefficients(nodes, i);

    // Acumula la contribución del nodo i: (yᵢ / denom) · poly
    const scale = nodes[i].y / denominator(nodes, i);
    for (let k = 0; k < poly.length; k++) {
      result[k] += poly[k] * scale;
    }
  }

  return result;
}
