# Machine Learning · Componente Formativo SENA ADSO

Página educativa e interactiva sobre Machine Learning, desarrollada por el **GAES 6** del programa **Tecnólogo en Análisis y Desarrollo de Software (ADSO)** del SENA.

Explica los conceptos del componente formativo (tipos de aprendizaje, algoritmos, herramientas de analítica, clustering y métricas de evaluación) y los muestra funcionando con laboratorios en vivo. Incluye un modo presentación para exponerla frente a un grupo.

## Características

### Contenido por módulos

| Módulo | Tema |
|---|---|
| 1 | Concepto, características y tipos de Machine Learning |
| 2 | Principales algoritmos, con filtros por paradigma y buscador |
| 3 | Herramientas de analítica de datos y pipeline del dato |
| 4 | Agrupamiento de datos (clustering) y su gestión |
| 5 | Evaluación de modelos y técnicas de validación |
| ✓ | Autoevaluación de 5 preguntas con retroalimentación inmediata |

### Laboratorios interactivos

- **K-means paso a paso** (módulo 4): separa las dos fases del algoritmo, asignar puntos y mover centroides, y dibuja el recorrido de cada centroide hasta que converge. Permite cambiar K y agregar puntos haciendo clic en el lienzo.
- **Matriz de confusión** (módulo 5): recalcula Accuracy, Precision, Recall y F1 mientras se mueven los controles. El escenario *Detector de fraude* muestra por qué el Accuracy engaña cuando las clases están desbalanceadas.

### Modo presentación

Convierte cada módulo en una diapositiva para exponer con videobeam. Trae cronómetro, puntos de navegación entre módulos y puntero láser.

| Tecla | Acción |
|---|---|
| `P` | Entrar o salir del modo presentación |
| `→` · `Espacio` · `AvPág` | Siguiente (si el módulo es largo, primero lo recorre) |
| `←` · `RePág` | Anterior |
| `Inicio` · `Fin` | Primera o última diapositiva |
| `L` | Activar o desactivar el puntero láser |
| `F` | Pantalla completa |
| `Esc` | Salir |

### Animaciones

- Red neuronal animada en la portada: los nodos se pasan señales entre sí y un clic lanza una ráfaga.
- El pipeline de analítica se ilumina etapa por etapa al aparecer en pantalla.
- Las tarjetas de algoritmos se reacomodan con animación al filtrar (View Transitions API).
- Al terminar el quiz aparece un anillo con la calificación final y confeti cuando el resultado es alto.

## Cómo ejecutarlo

El proyecto es HTML, CSS y JavaScript puro: no necesita instalar dependencias ni compilar nada.

**Opción 1: Live Server (VS Code)**

1. Instala la extensión *Live Server*.
2. Clic derecho sobre `index.html` → **Open with Live Server**.

**Opción 2: Python**

```bash
python -m http.server 5500
```

Luego abre <http://localhost:5500> en el navegador.

> También puedes abrir `index.html` con doble clic. Igual se recomienda usar un servidor local, porque así se comporta como una página publicada.

## Estructura del proyecto

```
├── index.html                 # Estructura y contenido de los módulos
├── css/
│   └── styles.css             # Estilos institucionales, componentes y modo presentación
├── js/
│   ├── main.js                # Navegación, filtros, acordeón, quiz y animaciones generales
│   ├── hero-network.js        # Red neuronal animada de la portada
│   ├── kmeans-demo.js         # Laboratorio de K-means
│   ├── confusion-matrix.js    # Laboratorio de matriz de confusión
│   └── presentation-mode.js   # Modo presentación
└── img/                       # Logo y favicon del SENA
```

Cada laboratorio vive en su propio archivo, así que un error en uno no afecta a los demás.

## Tecnologías

- **HTML5 semántico**: `header`, `nav`, `aside`, `main`, `section`, `article`, `footer`
- **CSS3**: variables (custom properties), Grid, Flexbox y transiciones
- **JavaScript (ES6+)** sin frameworks ni librerías
- **APIs del navegador**: Canvas 2D, IntersectionObserver, ResizeObserver, View Transitions y Fullscreen
- **Tipografías**: Outfit, Inter y JetBrains Mono (Google Fonts)

## Accesibilidad

- Enlace para saltar al contenido principal
- Foco visible al navegar con teclado (`:focus-visible`)
- Atributos ARIA en el menú, los filtros, el acordeón y los laboratorios
- Respeta la preferencia del sistema de **reducir movimiento** (`prefers-reduced-motion`)
- Diseño adaptable a celulares, tabletas y escritorio

## Compatibilidad

Funciona en las versiones actuales de Chrome, Edge, Firefox y Safari. En navegadores sin View Transitions API los filtros funcionan igual, solo que sin la animación de reacomodo.

## Equipo — GAES 6

<!-- Completar con los integrantes del equipo -->

| Integrante | Rol |
|---|---|
| | |

---

Proyecto pedagógico del **SENA · Análisis y Desarrollo de Software (ADSO)** · 2026
