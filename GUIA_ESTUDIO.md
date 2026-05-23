# Guía de estudio — Interpolación de Lagrange

## 1. Problema que resuelve la interpolación

Tenemos `n+1` puntos medidos (o dados) y queremos encontrar una función que pase exactamente por todos ellos para poder estimar valores intermedios.

**Lagrange** da la respuesta directa: construye el polinomio de menor grado que cumple esa condición, sin sistemas de ecuaciones.

---

## 2. La fórmula central

```
P(x) = Σᵢ  yᵢ · Lᵢ(x)
```

Donde `Lᵢ(x)` es la **función cardinal** del nodo `i`:

```
           Π_{j≠i}  (x − xⱼ)
Lᵢ(x) = ─────────────────────
           Π_{j≠i}  (xᵢ − xⱼ)
```

### Propiedad cardinal (la clave de por qué funciona)

```
Lᵢ(xₖ) = δᵢₖ = { 1 si k = i
                 { 0 si k ≠ i
```

Esto garantiza que al evaluar P en cada nodo:

```
P(xᵢ) = Σₖ yₖ · Lₖ(xᵢ) = yᵢ · 1 + Σ_{k≠i} yₖ · 0 = yᵢ  ✓
```

---

## 3. Ejemplo paso a paso (3 nodos)

Dados los nodos: `(0, 1)`, `(1, 2.718)`, `(2, 54.52)`

### Paso 1 — Calcular L₀(x)

```
     (x − x₁)(x − x₂)     (x − 1)(x − 2)
L₀ = ─────────────────── = ────────────────
     (x₀−x₁)(x₀−x₂)       (0−1)(0−2)

   = (x−1)(x−2) / 2
```

### Paso 2 — Calcular L₁(x)

```
     (x − x₀)(x − x₂)     (x − 0)(x − 2)
L₁ = ─────────────────── = ────────────────
     (x₁−x₀)(x₁−x₂)       (1−0)(1−2)

   = x(x−2) / (−1) = −x(x−2)
```

### Paso 3 — Calcular L₂(x)

```
     (x − x₀)(x − x₁)     x(x − 1)
L₂ = ─────────────────── = ─────────
     (x₂−x₀)(x₂−x₁)       (2)(1)

   = x(x−1) / 2
```

### Paso 4 — Ensamblar P(x)

```
P(x) = 1 · L₀(x)  +  2.718 · L₁(x)  +  54.52 · L₂(x)
```

### Verificación

```
P(0) = 1·1 + 2.718·0 + 54.52·0 = 1.000  ✓
P(1) = 1·0 + 2.718·1 + 54.52·0 = 2.718  ✓
P(2) = 1·0 + 2.718·0 + 54.52·1 = 54.52  ✓
```

---

## 4. Cómo está implementado en este proyecto

### `src/lagrange.ts` → motor matemático puro

| Función | Qué hace |
|---------|----------|
| `lagrangeBasis(nodes, i, x)` | Evalúa `Lᵢ(x)` en un punto `x` |
| `evaluate(nodes, x)` | Evalúa `P(x) = Σ yᵢ·Lᵢ(x)` |
| `getCoefficients(nodes)` | Expande P(x) a `a₀ + a₁x + a₂x²...` |

```typescript
// Lᵢ(x): producto de factores, saltando j = i
function lagrangeBasis(nodes, i, x) {
  let result = 1;
  for (let j = 0; j < nodes.length; j++) {
    if (j !== i)
      result *= (x - nodes[j].x) / (nodes[i].x - nodes[j].x);
  }
  return result;
}

// P(x): suma ponderada de las bases cardinales
function evaluate(nodes, x) {
  let sum = 0;
  for (let i = 0; i < nodes.length; i++)
    sum += nodes[i].y * lagrangeBasis(nodes, i, x);
  return sum;
}
```

### `src/types.ts` → estructura de datos

```typescript
type Point = { x: number; y: number };  // nodo (xᵢ, yᵢ)

interface ViewState {
  cx: number;     // x del centro de la cámara (coords matemáticas)
  cy: number;     // y del centro de la cámara (coords matemáticas)
  scale: number;  // píxeles por unidad matemática
}
```

### `src/renderer.ts` → canvas

**Transformaciones mundo ↔ pantalla:**

```
// Matemáticas → Pantalla
px = W/2 + (x − cx) · scale
py = H/2 − (y − cy) · scale    ← Y invertida (pantalla: ↓ positivo)

// Pantalla → Matemáticas (inversas)
x = (px − W/2) / scale + cx
y = −(py − H/2) / scale + cy
```

**Curva:** se muestrea `evaluate(nodes, wx)` en cada columna de píxeles del canvas. Es más eficiente que muestrear por valores matemáticos uniformes y evita huecos al hacer zoom.

### `src/app.ts` → interacción

| Gesto | Efecto |
|-------|--------|
| Click izquierdo vacío | Agrega nodo |
| Click izquierdo en nodo | Arrastra nodo |
| Click derecho en nodo | Elimina nodo |
| Shift + drag | Paneo de la cámara |
| Rueda del mouse | Zoom centrado en el cursor |

**Zoom centrado en cursor (técnica importante):**
```typescript
const [wxAntes] = s2w(mx, my, view);   // punto bajo el cursor ANTES
view.scale *= factor;                   // cambiar escala
const [wxDespues] = s2w(mx, my, view); // punto bajo el cursor DESPUÉS
view.cx += wxAntes - wxDespues;        // compensar para que no se mueva
```

---

## 5. Fenómeno de Runge

Con nodos igualmente espaciados y n grande (≥ 10), el polinomio oscila violentamente en los extremos del intervalo aunque pase exactamente por todos los nodos.

**Para verlo en el visualizador:**
1. Borrar todos los nodos (Clear all).
2. Agregar 11 puntos igualmente espaciados en `[−5, 5]` con `y = 1/(1+x²)`.
3. Observar las oscilaciones en `x < −4` y `x > 4`.

**Solución:** usar nodos de Chebyshev (concentrados en los extremos) en lugar de nodos uniformes.

---

## 6. Unicidad del polinomio

Dado `n+1` nodos con abscisas distintas, existe **exactamente un** polinomio de grado ≤ n que pasa por todos. Lagrange es una forma de construirlo; Newton es otra, pero el resultado es el mismo polinomio.

---

## 7. Complejidad

| Operación | Costo |
|-----------|-------|
| Evaluar P(x) un punto | O(n²) |
| Redibujar la curva (W píxeles) | O(W · n²) |
| Agregar un nodo | O(n²) en el siguiente redibujado |

Para n pequeño (< 20 nodos) esto es imperceptible. Con n > 50 comenzarías a notar lag en el redibujado.

---

## 8. Preguntas frecuentes de examen

**¿Por qué la suma de las funciones cardinales es siempre 1?**
Porque el polinomio constante `f(x) = 1` se interpola exactamente con `P(x) = Σ 1·Lᵢ(x) = 1`.

**¿Qué pasa si dos nodos tienen el mismo xᵢ?**
El denominador `(xᵢ − xⱼ) = 0` y la fórmula explota. Las abscisas DEBEN ser distintas.

**¿El grado del polinomio es siempre n?**
No necesariamente: es ≤ n. Puede ser menor si los datos "coinciden" con un polinomio de menor grado (ej: 3 nodos colineales → grado 1).

**¿Más nodos siempre mejoran la aproximación?**
No. El Fenómeno de Runge demuestra que más nodos con distribución uniforme puede empeorar la aproximación.
