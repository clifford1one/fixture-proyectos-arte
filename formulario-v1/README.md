# Formulario de subida — Archivo de prácticas

Formulario web para que estudiantes de Arte suban imágenes y textos de sus trabajos
a Drive, indicando a qué curso pertenecen. Corre sobre Google Apps Script, sin
frameworks ni librerías externas.

La ventana de subida dura un mes y cada estudiante puede volver las veces que quiera.

[LINK A FORMULARIO](https://script.google.com/a/macros/mail.udp.cl/s/AKfycbx3_ijnWNx8wBvyiwpbR19mb4PNf5CXS_vfhUL2nr0yeWt-MvGaFXsUPy_xhg1WF_R6/exec)

## Enlaces

- [Carpeta de Drive](https://drive.google.com/drive/folders/1TfjGEABWqdrUGu20V9WQAUn3FTTyGnmh?usp=sharing) — donde se guardan las imágenes
- [Planilla de registro](https://docs.google.com/spreadsheets/d/1sCBmSOlLlYEPLNkS0hVT8QOzIi0fc7BENiqfaVwwoZI/edit) — una fila por imagen subida

## Archivos

| Archivo | Qué hace |
| - | - |
| `code.gs` | Backend: sirve el formulario, guarda en Drive, escribe la planilla, manda el correo |
| `index.html` | Marcado del formulario y molde de los bloques de curso |
| `style.css` | Estilos. Escala de grises sobre `#f5f5f5`, sin colores de acento. Incluye las tres tipografías en base64 |
| `script.js` | Lógica del navegador: validación, compresión, subida y estados |

## Cómo funciona

1. El estudiante escribe su nombre. Si ya subió antes, viene rellenado y bloqueado.
2. Elige un curso, y sube imágenes, textos o ambos. La línea curricular se deduce
   del curso. **Ninguno de los dos es obligatorio**: basta con uno.
3. Puede añadir más bloques para subir a **varios cursos en una sola tanda**.
4. Cada imagen se previsualiza con su nombre y peso. Las que no cumplen quedan
   marcadas con el motivo, sin descartar las demás.
5. Al enviar, cada imagen se redimensiona a 2000 px, se convierte a WebP y se sube
   **de a una**, con barra de avance y estado por archivo. Los textos van después
   de las imágenes del mismo bloque, a la misma carpeta.
6. Al terminar llega un correo de confirmación con los enlaces a las carpetas.

### Videos de YouTube

El video **no se sube**: se guarda el enlace. Lo que sí queda en Drive es su
portada, para que el archivo conserve algo aunque el estudiante borre el video
más adelante.

Al enviar, `agregarVideoYoutube()` saca el id de 11 caracteres del enlace —
acepta `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, `/live/` y el id pelado —
y le pregunta a YouTube por el video usando **oEmbed**, que no necesita API key:

```
https://www.youtube.com/oembed?format=json&url=…
```

Esa respuesta distingue lo único que de verdad importa: un video **privado no se
puede insertar en ninguna parte**, y oEmbed lo delata con un 401. Un video
**oculto** sí funciona, y es lo que conviene pedirle a los estudiantes.

**En la carpeta del curso siempre queda un archivo**, con el mismo correlativo
que el resto del material:

- Si se pudo bajar la portada, un `.jpg` con la miniatura del video.
- Si no, un `.txt` con el título y el enlace.

En los dos casos el archivo lleva el enlace del video en su **descripción de
Drive**, que se ve en el panel de detalles. Una imagen suelta no diría a qué
video pertenece.

Si `UrlFetchApp` no está permitido —el scope `script.external_request` puede
requerir aprobación del dominio— la verificación se salta, se guarda la nota en
vez de la portada, y el visualizador se cae a la miniatura que sirve YouTube.
`diagnostico()` dice cuál de los dos casos es el tuyo.

Lo que YouTube puede romper y no se ve en el enlace:

- **Privado** no se inserta nunca. Tiene que ser oculto o público.
- **"Permitir insertar"** es una casilla por video que se puede apagar.
- **La música con derechos** puede bloquear la inserción o el video por país.
- **El dominio institucional** puede tener bloqueada la subida a YouTube.

### Textos

Un texto es un `<textarea>` con su botón de quitar; se agregan tantos como se
quiera con **+ Añadir un texto**. El textarea *es* la tarjeta: no hay paso de
"agregar" que lo vuelva inmutable, así que se puede corregir hasta el envío.

- Se guardan como `.txt` en UTF-8, en la carpeta del curso
- Máximo 2.000 caracteres (`TEXTO_MAXIMO`, revisado en el cliente **y** en el servidor)
- Un campo en blanco se ignora: no es error y no bloquea el envío
- El contenido va también a la columna `contenido` de la planilla, para poder
  buscarlo sin abrir archivo por archivo — y para que la visualización lo lea del
  CSV en vez de pedir un archivo a Drive por cada frase

### Validación de imágenes

- Formatos: PNG, JPG, JPEG
- Peso máximo: 10 MB por imagen, medido **antes** de comprimir
- Orientación EXIF corregida, para que las fotos de celular no salgan rotadas
- Si la compresión falla, se sube el archivo original en vez de descartarlo

## Tipografías

Tres caras, un rol cada una, declaradas al inicio de `style.css` y usadas siempre
a través de una variable — nunca por nombre directo:

| Variable | Cara | Dónde |
| - | - | - |
| `--fuente-titulo` | WorkFaAAD | Solo el `h1` del encabezado y el `h2` de la pantalla final |
| `--fuente-texto` | WorkSans (variable, 100–900) | Párrafos, ayudas, campos, botones en caja baja |
| `--fuente-mono` | NectoMono | Rótulos en versalitas, nombres de archivo, cifras, estados y los dos botones en mayúsculas |

Van **en base64** dentro del CSS porque el editor de Apps Script solo acepta `.gs`
y `.html`: no hay dónde subir un binario suelto. Cada archivo lleva `PEGA_AQUI` en
el `src`, listo para reemplazar por el base64.

Tres cosas que importan al pegarlas:

- **Solo `woff2`.** La fuente viaja dentro del HTML en cada carga y no se cachea
  aparte, así que cada formato extra se paga en todas las visitas. Tres caras
  pueden sumar fácilmente 150–300 KB al peso de la página; subsetear a latín
  ayuda bastante si se nota en celular.
- **El rango de una variable va con espacio**, `font-weight: 100 900`. Con guion
  (`100-900`) la declaración es inválida y el navegador la descarta entera.
- **WorkFaAAD y NectoMono traen un solo peso.** Todo lo que las usa está en
  `font-weight: 400` a propósito: pedirles 600 hace que el navegador invente una
  negrita, y en una display y una monoespaciada se nota. La jerarquía en esos
  elementos la dan las versalitas, el interletrado y el color. Los pesos 500 y 600
  que quedan en el CSS son todos de WorkSans, que sí los tiene de verdad.

Los `font-family` de respaldo no son adorno: si el base64 falta o falla, el
formulario tiene que seguir siendo legible.

## Estructura en Drive

```
carpeta raíz
└── juanPerez/
    └── Imagen y tecnología/
        └── Imagen fija/
            ├── juanPerez-ART03215-01.webp
            ├── juanPerez-ART03215-02.txt
            └── juanPerez-ART03215-03.webp
```

El correlativo no distingue imágenes de textos: cuenta por prefijo, así que la
numeración es una sola secuencia cronológica por curso y la extensión dice de qué
se trata cada archivo.

Las carpetas llevan el nombre del curso; el archivo lleva el **código de
asignatura**. Es una comodidad de orden interno: el estudiante nunca ve el código
en el formulario, solo en el nombre del archivo ya guardado. Los códigos son los
de la Malla Curricular Plan 3.0 de Artes Visuales y viven junto a cada curso en
`LINEAS_CURRICULARES` (`script.js`).

Un curso sin código cae al nombre en slug (`juanPerez-imagen-fija-01.webp`), así
que agregar un curso nuevo sin código no rompe nada.

El nombre del archivo lo arma el servidor, no el cliente. El correlativo se cuenta
dentro de la carpeta del curso, así que la numeración continúa entre visitas.

## Columnas de la planilla

`fecha` · `correo` · `nombre` · `linea` · `folderLinea` · `curso` · `folderCurso` ·
`nombreArchivo` · `linkArchivo` · `tipo` · `contenido` · `enlace`

`tipo` es `imagen`, `texto` o `youtube`.

| tipo | `nombreArchivo` y `linkArchivo` | `contenido` | `enlace` |
| - | - | - | - |
| `imagen` | el `.webp` en Drive | vacío | vacío |
| `texto` | el `.txt` en Drive | el texto | vacío |
| `youtube` | lo que quedó en Drive: la **portada** `.jpg`, o una nota `.txt` | el título del video | la URL del video |

Las columnas nuevas van **siempre al final**: `appendRow` escribe por posición, así
que insertar una al medio desalinearía todas las filas ya escritas. Por lo mismo,
`filaDeRegistro()` arma la fila en un único lugar para los dos tipos.

Los encabezados se escriben solos **solo si la hoja está vacía**. En una planilla
que ya tiene filas hay que agregarlos a mano.

Si la planilla falla, la subida **no** se cae: el archivo ya está en Drive y el
error se informa aparte.

## Publicar en Apps Script

El editor solo acepta archivos `.gs` y `.html`, así que el CSS y el JS no pueden ir
sueltos:

| Archivo local | En Apps Script |
| - | - |
| `code.gs` | `code.gs` |
| `index.html` | `index.html` |
| `style.css` | `style.html`, con el CSS dentro de `<style>` |
| `script.js` | `script.html`, con el JS dentro de `<script>` |

Y en `index.html` las referencias pasan a ser:

```html
<?!= include('style'); ?>
<?!= include('script'); ?>
```

Con `doGet()` usando `createTemplateFromFile('index').evaluate()` y un helper
`include()`.

### Configuración del despliegue

**Ejecutar como: Usuario que accede a la aplicación web.** Es necesario para que
`Session.getActiveUser().getEmail()` devuelva el correo. Sin correo no funcionan ni
el nombre guardado, ni el correo de confirmación, ni la columna `correo`.

La contrapartida: los archivos quedan con el **estudiante como propietario**,
alojados en la carpeta raíz. La carpeta debe estar compartida con permiso de edición.

## Ajustes rápidos

| Qué | Dónde |
| - | - |
| Agregar o renombrar cursos, o cambiar su código | `LINEAS_CURRICULARES` al inicio de `script.js` |
| Peso máximo por imagen | `PESO_MAXIMO_BYTES` en `script.js` |
| Largo máximo de un texto | `TEXTO_MAXIMO`, en `script.js` **y** en `code.gs` |
| Formas de enlace de YouTube aceptadas | `idDeYoutube()` en `code.gs` |
| Tamaño y calidad de compresión | `LADO_MAXIMO` y `CALIDAD_WEBP` en `script.js` |
| Carpeta y planilla de destino | `DRIVE_FOLDER_ID` y `SPREADSHEET_ID` en `code.gs` |
| Cambiar una tipografía o su rol | `@font-face` y `--fuente-*` al inicio de `style.css` |
| Formato del nombre de archivo | `construirNombreArchivo()` en `code.gs` |

## Diagnóstico

`code.gs` incluye una función `diagnostico()` que se ejecuta a mano desde el editor,
sin argumentos. Informa el correo de la sesión, el nombre guardado y si `MailApp`
puede enviar, con la cuota que queda.

## Pendientes

- **`appendRow` sin bloqueo.** Si dos estudiantes suben a la vez, un registro puede
  pisar al otro. La imagen no se pierde, la fila sí. Se arregla con `LockService`.
- **El nombre no se puede corregir.** Queda fijo en la primera subida; cambiarlo
  requiere borrar la propiedad a mano.
- **Cuota de correo.** 100 envíos diarios en cuenta Gmail normal, 1.500 en Workspace.
- **Duración de una tanda.** Tres cursos con seis fotos son 18 llamadas secuenciales.
  Si se hace muy lento, bajar `LADO_MAXIMO` de 2000 a 1600 es lo que más rinde.
  Los textos no pesan: suben de inmediato.
- **`TEXTO_MAXIMO` está declarado dos veces**, en el cliente y en el servidor. Es a
  propósito — el cliente puede mentir — pero si se cambia uno hay que cambiar el otro.
