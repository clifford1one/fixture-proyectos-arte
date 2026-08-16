# Propuesta — Archivo de Prácticas

## Objetivo y alcance

Instrumento para levantar proyectos al cierre del 4to semestre de la carrera de Arte. Busca por una parte evaluar el proceso de los estudiantes hasta esa etapa, y por otro promover al estudiantado a establecer relaciones conceptuales entre sus investigaciones materiales y conceptuales.

## Estructura de datos

### Líneas curriculares y cursos

| Línea | Curso | Semestre |
| - | - | - |
| Talleres | Taller de operaciones y procedimientos visuales | S1-S2 |
| Talleres | Taller de práctica artísticas I | S3 |
| Talleres | Taller de práctica artísticas II | S4 |
| Estudios Visuales | Introducción a las vanguardias artísticas | S1 |
| Estudios Visuales | Introducción al arte contemporáneo | S2 |
| Estudios Visuales | Arte contemporáneo en Chile  y Latinoamérica | S3 |
| Estudios Visuales | Teoría de la imagen | S4 |
| Lenguajes artísticos | Dibujo y observación | S1 |
| Lenguajes artísticos | Dibujo y observación II | S2 |
| Lenguajes artísticos | Técnicas escultóricas | S2 |
| Lenguajes artísticos | Técnicas pictóricas | S3 |
| Lenguajes artísticos | Lenguajes escultóricos | S3 |
| Lenguajes artísticos | Lenguajes pictóricos | S4 |
| Imagen y tecnología | Medios Gráficos | S1 |
| Imagen y tecnología | Medios Digitales | S2 |
| Imagen y tecnología | Imagen fija | S3 |
| Imagen y tecnología | Imagen en movimiento | S4 |
| Gestión | Circuitos Artísticos | S1 |

### Categorías

- **Forma y materiales**
- **Nudo conceptual**
- **Modos de hacer**

## Formulario de subida

### Diagrama de flujo

```mermaid
flowchart TD
    A[ingresar con correo institucional] --> B{¿primera vez?}
    B -- sí --> C[escribir nombre]
    B -- no --> D[nombre guardado]
    C --> E
    D --> E[seleccionar linea curricular]
    E --> F[seleccionar curso]
    F --> G[subir imágenes]
    G --> H{¿formato y peso válidos?}
    H -- no --> I[Imagen rechazada con motivo]
    I --> G
    H -- sí --> J[imagen subida y optimizada]
    J --> K{¿subir otro curso?}
    K -- sí --> E
    K -- no --> L[fin de la sesion]
    L --> M[puede volver en cualquier momento]
    M --> E
```

### Formatos y límites

Las imágenes deben ser subidas en formato PNG, JPG o JPEG(el formulario no admite HEIC o similares). Al subir una imagen, ocurre una compresión dentro del navegador, y luego esta es subida al drive de una cuenta institucional por determinar.

### Almacenamiento

todas las imágenes deben estar subidas en la misma cuenta de google. Las cuentas gratuitas cuentan con 15GB de almacenamiento, dado que son 60 estudiantes, cada une tendría asignado 250MB.

## Visualizador

### Referencia


![Mark Lombardi. Industries Carlos Cardoen of Santiago, Chile c. 1982-90 (2nd Version). 2000](./img/lombardi-2.jpg)
[Mark Lombardi.](https://en.wikipedia.org/wiki/Mark_Lombardi) Industries Carlos Cardoen of Santiago, Chile c. 1982-90 (2nd Version). 2000.

### Propuesta gráfica

![propuesta gráfica sección categoría](./img/orbita-2.gif)

![propuesta gráfica sección todos los proyectos](./img/grilla.gif)

#### Vista

Una pantalla dividida en 4 secciones muestra los proyectos:

| sección pantalla | contenido |
| - | - |
| noroeste | Grilla con todos los proyectos |
| noreste | Categoría 1: *Forma y materiales* |
| suroeste | Categoría 2: *Nudo conceptual* |
| sureste | Categoría 3: *Modos de hacer* |

### Recorrido

#### Momento 1: Proyectos

Todos los proyectos subidos por el estudiantes se visualizan en una grilla categorizada según línea y curso.

#### Momento 2: Categorización

Al hacer click en un proyecto, te permite asociarlo a una de las [3 categorías](#categorías). Cada proyecto puedes estar asociado a hasta 3 categorías.

#### Momento 3: Exportación

Cada una de las categorías genera un html/pdf exportable, con opciones de personalización orientadas hacia la accesibilidad(modo oscuro, modo alto contrraste, etc).

## Calendario

| Mes | Hito |
| - | - |
| Agosto | Propuesta y muestra de archivos |
| Septiembre | Desarrollo del formulario |
| Octubre | Subida abierta; diseño y desarrollo del visualizador |
| Noviembre | Marcha blanca, ajustes y cierre |

## Definiciones pendientes

- Qué pasa con el material cuando egresa una generación.
