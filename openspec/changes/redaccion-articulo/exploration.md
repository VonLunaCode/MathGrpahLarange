## Exploration: Redacción Artículo IEEE (MathGraphLagrange)

### Current State
El proyecto implementa un visualizador interactivo del método de interpolación de Lagrange utilizando TypeScript, HTML5 Canvas y CSS. Permite al usuario ingresar nodos ya sea haciendo clic en el plano o mediante campos de entrada manual, y visualiza en tiempo real tanto la curva polinómica resultante como su desarrollo matemático paso a paso.

### Affected Areas
- `src/lagrange.ts` — Motor matemático que implementa la base de Lagrange ($L_i(x)$), la evaluación del polinomio $P(x)$, y la expansión de coeficientes.
- `src/rational.ts` — Módulo de aritmética racional exacta basado en `BigInt` que evita problemas de precisión de punto flotante en la visualización de fórmulas matemáticas.
- `src/renderer.ts` — Encargado de la traducción bidireccional entre coordenadas matemáticas y píxeles (w2s/s2w), y el trazado de la cuadrícula, la curva y los nodos en el canvas.
- `src/app.ts` — Orquestador de la aplicación que maneja los eventos de entrada (mouse, scroll, forms), gestiona el estado (nodos, vista de cámara) y sincroniza la UI lateral y el renderizado.

### Approaches

1. **Enfoque Pedagógico y Técnico (Recomendado)**
   - **Descripción**: Centrar el artículo en cómo las decisiones técnicas (tipado estricto, aritmética racional exacta y pixel-perfect rendering) resuelven el desafío pedagógico de enseñar el método numérico sin la "caja negra" de los redondeos flotantes.
   - **Pros**: Se alinea bien con el propósito de la herramienta; resalta contribuciones técnicas novedosas (`rational.ts`).
   - **Cons**: Requiere equilibrar el código y las matemáticas teóricas.
   - **Esfuerzo**: Medio.

### Recommendation
Para estructurar el documento `Redaccion.md` bajo la plantilla IEEE, recomiendo las siguientes secciones principales:
1. **Introducción**: Contextualizar el método de Lagrange y la necesidad de herramientas pedagógicas interactivas.
2. **Metodología y Arquitectura**: Detallar el flujo de datos (MVC conceptual) y el rol de TypeScript y HTML5 Canvas.
3. **Implementación Algorítmica**:
   - Destacar el cálculo algorítmico explícito del polinomio interpolador.
   - Resaltar la implementación crucial de aritmética racional exacta (`BigInt`) para visualización matemática fiel sin errores de punto flotante.
   - Detallar el mapeo bidireccional Píxel ↔ Coordenadas Matemáticas.
4. **Resultados**: Discusión de la interfaz, el rendimiento del muestreo por píxel (pixel-perfect plotting) y validación matemática visual.
5. **Conclusión**: Síntesis del valor pedagógico y técnico de la herramienta.

### Risks
- La complejidad matemática del módulo de fracciones racionales (`rational.ts`) podría ser subestimada al redactar el paper. Es fundamental explicar la razón de usar fracciones continuas.
- El rendimiento del renderizado en $O(N \times P)$ donde $P$ son los píxeles del ancho de la pantalla y $N$ los nodos, lo que debería mencionarse bajo consideraciones técnicas.

### Ready for Proposal
Yes. El análisis provee todo el detalle técnico necesario para redactar una documentación rigurosa bajo el formato IEEE y está listo para ser utilizado por el agente que redactará la estructura.
