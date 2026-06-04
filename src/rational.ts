/**
 * Aritmética racional exacta para el panel de Lagrange.
 *
 * Los floats no sirven para mostrar fracciones: 1/70 se vuelve
 * 0.0142857… y se pierde la forma exacta que se usa a mano. Este módulo
 * representa números como fracciones reducidas con BigInt, de modo que el
 * desarrollo del polinomio (denominadores, numeradores, coeficientes finales)
 * sea EXACTO mientras los datos de entrada sean racionales.
 *
 * Si un valor no se puede expresar como fracción de denominador chico
 * (por ejemplo, un punto clickeado en un float arbitrario), `toFraction`
 * devuelve null y la UI cae a la representación decimal.
 */

/** Fracción reducida con denominador positivo. */
export interface Frac { n: bigint; d: bigint; }

export const ZERO: Frac = { n: 0n, d: 1n };
export const ONE:  Frac = { n: 1n, d: 1n };

/** Máximo común divisor de dos BigInt (siempre ≥ 0). */
function bgcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

/** Construye una fracción reducida, normalizando el signo al numerador. */
export function frac(n: bigint, d: bigint): Frac {
  if (d === 0n) throw new Error('Denominador cero');
  if (d < 0n) { n = -n; d = -d; }
  const g = bgcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

export function fAdd(a: Frac, b: Frac): Frac { return frac(a.n * b.d + b.n * a.d, a.d * b.d); }
export function fSub(a: Frac, b: Frac): Frac { return frac(a.n * b.d - b.n * a.d, a.d * b.d); }
export function fMul(a: Frac, b: Frac): Frac { return frac(a.n * b.n, a.d * b.d); }
export function fInv(a: Frac): Frac { return frac(a.d, a.n); }

/**
 * Convierte un float a fracción exacta usando expansión en fracción continua,
 * acotando el denominador. Devuelve null si el número no se aproxima bien con
 * un denominador ≤ maxDen (caso típico: un float arbitrario de un clic).
 *
 * Para enteros devuelve {n, d: 1}; para 1.5 devuelve {3, 2}; etc.
 */
export function toFraction(x: number, maxDen = 10000, eps = 1e-9): Frac | null {
  if (!isFinite(x)) return null;
  const neg = x < 0;
  const a = Math.abs(x);

  // Convergentes de la fracción continua: hₖ/kₖ
  let h0 = 0n, h1 = 1n;
  let k0 = 1n, k1 = 0n;
  let b = a;

  for (let iter = 0; iter < 64; iter++) {
    const ai = Math.floor(b);
    const A = BigInt(ai);
    const h2 = A * h1 + h0;
    const k2 = A * k1 + k0;
    if (k2 > BigInt(maxDen)) break;       // denominador ya demasiado grande
    h0 = h1; h1 = h2;
    k0 = k1; k1 = k2;
    if (Math.abs(a - Number(h1) / Number(k1)) < eps) {
      return { n: neg ? -h1 : h1, d: k1 };
    }
    const rem = b - ai;
    if (rem < 1e-12) break;
    b = 1 / rem;
  }

  // Último convergente dentro de tolerancia, si aplica
  if (k1 > 0n && Math.abs(a - Number(h1) / Number(k1)) < eps) {
    return { n: neg ? -h1 : h1, d: k1 };
  }
  return null;
}

/**
 * Formatea una fracción para mostrar: "3", "−5", "3/2", "−1/70".
 * Usa el signo menos unicode (−) para que combine con el resto del panel.
 */
export function fToString(f: Frac): string {
  const sign = f.n < 0n ? '−' : '';
  const n = f.n < 0n ? -f.n : f.n;
  return f.d === 1n ? `${sign}${n}` : `${sign}${n}/${f.d}`;
}

// ── Polinomios con coeficientes racionales ──────────────────────────────────
// Un polinomio es un arreglo de Frac donde el índice k es el coeficiente de xᵏ.

export type FPoly = Frac[];

/** Multiplica el polinomio por el factor lineal (x − root). */
export function pMulLinear(p: FPoly, root: Frac): FPoly {
  const r: FPoly = new Array<Frac>(p.length + 1).fill(ZERO);
  for (let k = 0; k < p.length; k++) {
    r[k + 1] = fAdd(r[k + 1], p[k]);             // término xᵏ⁺¹ : +coef
    r[k]     = fSub(r[k], fMul(root, p[k]));     // término xᵏ   : −root·coef
  }
  return r;
}

/** Escala todos los coeficientes por un factor racional. */
export function pScale(p: FPoly, s: Frac): FPoly {
  return p.map(c => fMul(c, s));
}

/** Suma dos polinomios término a término. */
export function pAdd(a: FPoly, b: FPoly): FPoly {
  const n = Math.max(a.length, b.length);
  const r: FPoly = [];
  for (let k = 0; k < n; k++) r[k] = fAdd(a[k] ?? ZERO, b[k] ?? ZERO);
  return r;
}

const SUP = ['', 'x', 'x²', 'x³', 'x⁴', 'x⁵', 'x⁶', 'x⁷', 'x⁸', 'x⁹'];

/**
 * Convierte un polinomio racional a texto: "a₀ + a₁x + a₂x² + …".
 * Omite términos nulos y el coeficiente 1 (salvo en el término constante).
 */
export function pToString(p: FPoly): string {
  let out = '';
  let first = true;
  for (let k = p.length - 1; k >= 0; k--) {
    const c = p[k];
    if (c.n === 0n) continue;
    const neg = c.n < 0n;
    const mag: Frac = { n: neg ? -c.n : c.n, d: c.d };
    const power = k < SUP.length ? SUP[k] : `x^${k}`;
    const isOne = mag.n === 1n && mag.d === 1n;
    const coefStr = (isOne && k > 0) ? '' : fToString(mag); // "1x" → "x"
    const body = `${coefStr}${power}`;
    if (first) { out = (neg ? '−' : '') + body; first = false; }
    else        out += (neg ? ' − ' : ' + ') + body;
  }
  return out === '' ? '0' : out;
}

// ── Render HTML: fracciones apiladas ────────────────────────────────────────
// fToString/pToString dan texto lineal ("1/3"); estas variantes generan la
// fracción apilada (numerador sobre denominador con barra) para que se lea
// como en la hoja. Los enteros se muestran planos, sin barra.

/** Magnitud |f| como fracción apilada (HTML), o entero plano. Sin signo. */
export function fracHtmlMag(f: Frac): string {
  const n = f.n < 0n ? -f.n : f.n;
  if (f.d === 1n) return `${n}`;
  return `<span class="ifrac"><span class="ifrac-n">${n}</span><span class="ifrac-d">${f.d}</span></span>`;
}

/** Fracción con signo en HTML: el "−" va delante de la fracción apilada. */
export function fToHtml(f: Frac): string {
  return (f.n < 0n ? '−' : '') + fracHtmlMag(f);
}

/** Polinomio en HTML con cada coeficiente como fracción apilada. */
export function pToHtml(p: FPoly): string {
  let out = '';
  let first = true;
  for (let k = p.length - 1; k >= 0; k--) {
    const c = p[k];
    if (c.n === 0n) continue;
    const neg = c.n < 0n;
    const mag: Frac = { n: neg ? -c.n : c.n, d: c.d };
    const power = k < SUP.length ? SUP[k] : `x^${k}`;
    const isOne = mag.n === 1n && mag.d === 1n;
    const coef = (isOne && k > 0) ? '' : fracHtmlMag(mag); // "1x" → "x"
    const body = `${coef}${power}`;
    if (first) { out = (neg ? '−' : '') + body; first = false; }
    else        out += (neg ? ' − ' : ' + ') + body;
  }
  return out === '' ? '0' : out;
}

// ── Lagrange exacto sobre nodos racionales ──────────────────────────────────

/** Numerador de Lᵢ(x): Π_{j≠i} (x − xⱼ), expandido a polinomio racional. */
export function lagrangeNumerator(xs: Frac[], i: number): FPoly {
  let poly: FPoly = [ONE];
  for (let j = 0; j < xs.length; j++) {
    if (j === i) continue;
    poly = pMulLinear(poly, xs[j]);
  }
  return poly;
}

/** Denominador de Lᵢ(x): Π_{j≠i} (xᵢ − xⱼ), un escalar racional. */
export function lagrangeDenominator(xs: Frac[], i: number): Frac {
  let d = ONE;
  for (let j = 0; j < xs.length; j++) {
    if (j !== i) d = fMul(d, fSub(xs[i], xs[j]));
  }
  return d;
}

/**
 * Desarrolla P(x) exacto: Σᵢ (yᵢ / denomᵢ) · numeradorᵢ.
 * Devuelve los coeficientes racionales [a₀, a₁, …] ya colectados por potencia.
 */
export function lagrangeDevelopExact(xs: Frac[], ys: Frac[]): FPoly {
  let result: FPoly = [ZERO];
  for (let i = 0; i < xs.length; i++) {
    const num   = lagrangeNumerator(xs, i);
    const scale = fMul(ys[i], fInv(lagrangeDenominator(xs, i))); // yᵢ / denom
    result = pAdd(result, pScale(num, scale));
  }
  return result;
}
