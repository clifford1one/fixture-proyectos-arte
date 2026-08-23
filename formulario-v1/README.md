# Formulario de subida — Archivo de prácticas

Formulario web para que estudiantes de Arte suban imágenes de sus trabajos a Drive,
indicando a qué curso pertenecen. Corre sobre Google Apps Script, sin frameworks
ni librerías externas.

La ventana de subida dura un mes y cada estudiante puede volver las veces que quiera.

## Enlaces

- [Carpeta de Drive](https://drive.google.com/drive/folders/1TfjGEABWqdrUGu20V9WQAUn3FTTyGnmh?usp=sharing) — donde se guardan las imágenes
- [Planilla de registro](https://docs.google.com/spreadsheets/d/1sCBmSOlLlYEPLNkS0hVT8QOzIi0fc7BENiqfaVwwoZI/edit) — una fila por imagen subida

## Archivos

| Archivo | Qué hace |
| - | - |
| `code.gs` | Backend: sirve el formulario, guarda en Drive, escribe la planilla, manda el correo |
| `index.html` | Marcado del formulario y molde de los bloques de curso |
| `style.css` | Estilos. Escala de grises sobre `#f5f5f5`, sin colores de acento |
| `script.js` | Lógica del navegador: validación, compresión, subida y estados |

## Cómo funciona

1. El estudiante escribe su nombre. Si ya subió antes, viene rellenado y bloqueado.
2. Elige un curso y sus imágenes. La línea curricular se deduce del curso.
3. Puede añadir más bloques para subir a **varios cursos en una sola tanda**.
4. Cada imagen se previsualiza con su nombre y peso. Las que no cumplen quedan
   marcadas con el motivo, sin descartar las demás.
5. Al enviar, cada imagen se redimensiona a 2000 px, se convierte a WebP y se sube
   **de a una**, con barra de avance y estado por imagen.
6. Al terminar llega un correo de confirmación con los enlaces a las carpetas.

### Validación

- Formatos: PNG, JPG, JPEG
- Peso máximo: 10 MB por imagen, medido **antes** de comprimir
- Orientación EXIF corregida, para que las fotos de celular no salgan rotadas
- Si la compresión falla, se sube el archivo original en vez de descartarlo

## Estructura en Drive

```
carpeta raíz
└── juanPerez/
    └── Imagen y tecnología/
        └── Imagen fija/
            ├── juanPerez-imagen-fija-01.webp
            └── juanPerez-imagen-fija-02.webp
```

El nombre del archivo lo arma el servidor, no el cliente. El correlativo se cuenta
dentro de la carpeta del curso, así que la numeración continúa entre visitas.

## Columnas de la planilla

`fechaSubida` · `correo` · `nombre` · `linea` · `linkCarpetaLinea` · `curso` ·
`linkCarpetaCurso` · `nombreArchivo` · `linkArchivo`

Los encabezados se escriben solos si la hoja está vacía. Si la planilla falla, la
subida **no** se cae: la imagen ya está en Drive y el error se informa aparte.

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
| Agregar o renombrar cursos | `LINEAS_CURRICULARES` al inicio de `script.js` |
| Peso máximo por imagen | `PESO_MAXIMO_BYTES` en `script.js` |
| Tamaño y calidad de compresión | `LADO_MAXIMO` y `CALIDAD_WEBP` en `script.js` |
| Carpeta y planilla de destino | `DRIVE_FOLDER_ID` y `SPREADSHEET_ID` en `code.gs` |
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
