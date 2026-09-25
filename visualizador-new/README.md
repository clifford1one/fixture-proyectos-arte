# Visualizador de Proyectos

Este proyecto consta de 2 fases:

1. un formulario de recopilación de proyectos para estudiantes de Arte de los semetres 1-4.

2. Plataforma interactiva de clasificación y visualización de proyectos.

La clasificación ocurre en 3 grandes secciones:

- Forma y Materiales
- Nudo Conceptual
- Modos de Hacer

## funcionamiento técnico

Desde este formulario alojado en appscript, se envían los proyectos realizados durante los 2 primeros años de carrera, de las siguientes líneas curriculares:

- Talleres
- Estudios Visuales
- Lenguajes artísticos
- Imagen y tecnología
- Gestión
- Personal

Son admitidos 3 formatos:

- Imagen JPG, PNG, JPEG, WEBP.
- Texto: se escribe directamente en el fomrulario, es procesado como un arhcivo txt
- link de youtube: pegar en el fomrulario, y en el visualizador se la minitura del video.

estos son guardados en google drive con el siguiente nombre de archivo:

formato-codigo-nombre-numeroArchivo.extension

- Para texto: texto-art1012-jaimito-11.txt
- Para imagen: imagen-art1012-jaimito-11.webp
- Para link de video: video-art1012-jaimito-11.txt

## Cómo funciona el código

Dos archivos, los mismos que existen en Apps Script:

- `code.gs` (servidor): `doGet()` identifica al estudiante, lee sus filas de la planilla y su clasificación (pestaña `clasificacion`), y lo incrusta todo en la página como `DATOS`. `guardarClasificacion()` guarda una fila por estudiante con `{ idArchivo: ["forma", ...] }`.
- `index.html` (navegador): marcado, estilo y script en un solo archivo. Abierto suelto, sin Apps Script, muestra datos de ejemplo.

Regla central: los datos mandan. Todo cambio modifica `obra.categorias` y pasa por `alCambiar()`, que redibuja la lista y las órbitas y enciende el botón "Guardar". Nada se escribe en la planilla hasta apretarlo (o Ctrl+S).

Dónde cambiar cosas:

- Nodos (nombre y definición): `CATEGORIAS` en `code.gs`.
- Colores y velocidad: variables `--` del `<style>` y `SUAVE`, `RESORTE`, `PASO`, `VUELTA` en el script.
- Tamaño de las fichas en la órbita: `lado` y `radio` en `dibujarOrbitas()`.

## notas

- añadir drag & drop
- revisar carga de imagenes pesadas
- errores
   - Error de seguridad: el contenido en https://n-34ilfyj4qtgjprf47dbsk7d4we24g4dzvfnojwa-1lu-script.googleusercontent.com/blank no puede cargar o enlazar con file:///.
   - Error de seguridad: el contenido en https://script.google.com/a/macros/mail.udp.cl/s/AKfycbxYUZZOrpGhS92qUc92E7WGuHII5GT380GHFVisYxHIVT8qrWSY338JWcdnIryIygg/exec?authuser=1 no puede cargar o enlazar con file:///.

- añadir msje de error en drag&drop elemetnos duplicado
- nuevos nombres de nodos

- revisar linea en vez de orbita(juego AA)

- estar preparadx para tpda cantidad de proyectos

- añadir area de posicon libre

- ver psibilidad lineas

- tener menos control a pos de que los usuairos tengan mayor libertad

- editor de linea sy uniones, imantado al centro del frame