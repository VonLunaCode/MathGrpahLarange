# Visualizador de Interpolación de Lagrange

Herramienta interactiva para explorar el método de interpolación de Lagrange. Permite agregar, mover y eliminar nodos en un plano cartesiano y observar en tiempo real el polinomio P(x) resultante, junto con el desarrollo matemático paso a paso.

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/VonLunaCode/MathGrpahLarange.git
cd MathGrpahLarange

# Instalar dependencias
npm install
```

## Uso

```bash
# Servidor de desarrollo (hot reload)
npm run dev
```

Abrir http://localhost:5173 en el navegador.

```bash
# Build de producción
npm run build

# Previsualizar el build
npm run preview
```

## Controles del canvas

| Acción | Efecto |
|--------|--------|
| Click izquierdo | Agregar nodo |
| Arrastrar nodo | Mover nodo |
| Click derecho sobre nodo | Eliminar nodo |
| Shift + arrastrar | Paneo |
| Rueda del mouse | Zoom centrado en cursor |

## Stack

- Vite + TypeScript — sin frameworks, sin dependencias de runtime
- HTML Canvas API para el renderizado
- CSS Neumorfismo
