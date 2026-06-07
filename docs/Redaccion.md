# Interpolación de Lagrange: Un Enfoque Técnico-Pedagógico Mediante Aritmética Racional Exacta

## Abstract

La interpolación polinómica es una herramienta fundamental en el análisis numérico, permitiendo la reconstrucción de funciones y la estimación de valores intermedios a partir de un conjunto discreto de datos. El presente artículo detalla el diseño y la implementación matemática del proyecto MathGraphLagrange, un visualizador interactivo diseñado con propósitos pedagógicos. El sistema resuelve el problema clásico de la acumulación de errores de redondeo inherente a la representación de punto flotante en lenguajes como JavaScript y TypeScript, mediante la adopción de un motor de aritmética racional exacta basado en `BigInt`. Se presenta el marco teórico subyacente, la justificación de las decisiones arquitectónicas y la validación matemática a través de un caso de estudio. Finalmente, se discuten las limitaciones inherentes al método de Lagrange, como el fenómeno de Runge, y se proponen mejoras algorítmicas para iteraciones futuras.

## 1. Introducción

La enseñanza de métodos numéricos frecuentemente enfrenta el obstáculo de la abstracción matemática frente a la limitación de las herramientas computacionales convencionales. La interpolación de Lagrange ofrece un método elegante para determinar un polinomio que atraviese un conjunto dado de coordenadas, estructurando el polinomio final como una combinación lineal de polinomios base. Sin embargo, su implementación algorítmica estándar es susceptible a la inestabilidad numérica cuando se emplean tipos de datos de punto flotante (Burden & Faires, 2011). 

El proyecto MathGraphLagrange fue concebido para cerrar la brecha entre la exactitud analítica y la representación computacional. El objetivo principal de este desarrollo es proporcionar una herramienta interactiva que no solo visualice el polinomio interpolador y sus bases, sino que también preserve la precisión absoluta de los coeficientes polinómicos durante todo el proceso de cálculo. Este artículo describe la metodología empleada en el motor matemático de la aplicación y expone los resultados de un caso práctico, demostrando la fiabilidad del sistema construido.

## 2. Metodología

La base matemática de la interpolación de Lagrange estipula que, dado un conjunto de $n+1$ puntos de datos $(x_0, y_0), (x_1, y_1), \dots, (x_n, y_n)$ donde todos los $x_i$ son distintos, existe un único polinomio $P_n(x)$ de grado a lo sumo $n$ que interpola dichos puntos. El polinomio se construye mediante la fórmula:

$$ P_n(x) = \sum_{i=0}^{n} y_i L_i(x) $$

donde $L_i(x)$ representa los polinomios base de Lagrange, definidos como:

$$ L_i(x) = \prod_{\substack{j=0 \\ j \neq i}}^{n} \frac{x - x_j}{x_i - x_j} $$

Desde el punto de vista arquitectónico, el mayor desafío en la implementación computacional de este método es la propagación del error de truncamiento y redondeo. Los lenguajes de programación modernos, por defecto, utilizan el estándar IEEE 754 de precisión doble para operaciones matemáticas (Chapra & Canale, 2015). En cálculos que involucran divisiones sucesivas y sumas de términos polinómicos con signos alternos, la pérdida de significancia puede alterar drásticamente la forma geométrica del polinomio resultante.

Para mitigar este riesgo, la arquitectura de MathGraphLagrange emplea aritmética racional exacta. En lugar de procesar los nodos como números de punto flotante, el sistema modela cada coeficiente como una fracción representada por un numerador y un denominador utilizando el tipo de datos `BigInt` de TypeScript. Esta decisión arquitectónica asegura que las operaciones de suma, resta y multiplicación de polinomios se realicen sin pérdida de precisión. Al mantener los términos matemáticos como fracciones irreducibles (dividiendo por el máximo común divisor después de cada operación), el motor numérico garantiza que la representación gráfica del polinomio sea matemáticamente exacta respecto a los nodos ingresados.

## 3. Resultados: Caso de Estudio

Para validar la precisión del motor computacional y la solidez del método, se ejecutó un caso de estudio utilizando tres nodos de interpolación: $(-2, 5)$, $(11, -8)$ y $(15, -5)$. El proceso requiere la derivación de tres polinomios base de segundo grado ($L_0, L_1, L_2$) correspondientes a cada punto.

Para el primer punto $(-2, 5)$:
$$ L_0(x) = \frac{(x - 11)(x - 15)}{(-2 - 11)(-2 - 15)} = \frac{x^2 - 26x + 165}{(-13)(-17)} = \frac{x^2 - 26x + 165}{221} $$

Para el segundo punto $(11, -8)$:
$$ L_1(x) = \frac{(x - (-2))(x - 15)}{(11 - (-2))(11 - 15)} = \frac{(x + 2)(x - 15)}{(13)(-4)} = \frac{x^2 - 13x - 30}{-52} $$

Para el tercer punto $(15, -5)$:
$$ L_2(x) = \frac{(x - (-2))(x - 11)}{(15 - (-2))(15 - 11)} = \frac{(x + 2)(x - 11)}{(17)(4)} = \frac{x^2 - 9x - 22}{68} $$

Posteriormente, el polinomio interpolador $P_2(x)$ se obtiene sumando el producto de cada base por su valor $y$ correspondiente:

$$ P_2(x) = 5 \cdot L_0(x) + (-8) \cdot L_1(x) + (-5) \cdot L_2(x) $$

Sustituyendo las bases calculadas:
$$ P_2(x) = 5 \cdot \left(\frac{x^2 - 26x + 165}{221}\right) - 8 \cdot \left(\frac{x^2 - 13x - 30}{-52}\right) - 5 \cdot \left(\frac{x^2 - 9x - 22}{68}\right) $$

Para agrupar los coeficientes de las variables, las fracciones se reducen y se operan utilizando un denominador común. La implementación exacta en aritmética racional arroja los siguientes coeficientes simplificados:

* Coeficiente de $x^2$: $\frac{5}{221} + \frac{2}{13} - \frac{5}{68} = \frac{20 + 136 - 65}{884} = \frac{91}{884} = \frac{7}{68}$
* Coeficiente de $x$: $\frac{-130}{221} + \frac{26}{13} + \frac{45}{68} = \frac{-520 + 1768 + 585}{3536} \dots = -\frac{131}{68}$
* Término independiente: $\frac{825}{221} + \frac{60}{13} + \frac{110}{68} = \frac{3300 + 4080 + 1430}{884} = \frac{8810}{884} \dots = \frac{25}{34}$

El polinomio final es:
$$ P_2(x) = \frac{7}{68}x^2 - \frac{131}{68}x + \frac{25}{34} $$

Los resultados teóricos coinciden exactamente con la salida generada por el software MathGraphLagrange, evidenciando la eficacia del sistema para mantener la precisión matemática a través del uso de `BigInt`.

## 4. Trabajo Futuro

Aunque la interpolación de Lagrange es matemáticamente robusta para un número reducido de nodos, presenta vulnerabilidades inherentes cuando se aplica a polinomios de alto grado. El principal riesgo asociado es el fenómeno de Runge, el cual se manifiesta como oscilaciones de gran amplitud en los extremos del intervalo de interpolación cuando se emplean nodos equiespaciados (Burden & Faires, 2011). Este comportamiento inestable limita la aplicabilidad del modelo desarrollado para conjuntos de datos grandes.

Como dirección futura de investigación y desarrollo, se propone la integración de la Interpolación Baricéntrica de Lagrange. Esta variante matemática optimiza la evaluación del polinomio separando los pesos baricéntricos dependientes exclusivamente de las coordenadas $x$. Dicho enfoque no solo reduciría la complejidad computacional para la adición de nuevos puntos en tiempo real ($O(n)$ frente a $O(n^2)$ del método estándar), sino que también mejoraría la estabilidad numérica, mitigando parcialmente las oscilaciones de Runge cuando se combina con la distribución de nodos de Chebyshev.

## 5. Conclusión

El diseño del visualizador MathGraphLagrange logra exitosamente un balance entre interactividad y exactitud matemática. La adopción de una arquitectura basada en aritmética racional para evitar las deficiencias del estándar IEEE 754 permite que el software opere no solo como una herramienta de visualización geométrica, sino como una calculadora analítica precisa. El caso de estudio desarrollado confirma que las implementaciones que priorizan la representación exacta previenen la corrupción de datos generada por el redondeo algorítmico, fortaleciendo el valor pedagógico de la herramienta en la enseñanza de métodos numéricos.

## 6. Referencias

* Burden, R. L., & Faires, J. D. (2011). *Numerical Analysis* (9th ed.). Brooks/Cole, Cengage Learning.
* Chapra, S. C., & Canale, R. P. (2015). *Numerical Methods for Engineers* (7th ed.). McGraw-Hill Education.
