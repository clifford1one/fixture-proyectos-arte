# Formulario de subida — v2

Lo mismo que `formulario-v1`, con los cambios que pidió la escuela. La
diferencia práctica es la forma de los archivos: acá son **dos**, los mismos dos
que existen en Apps Script.

| Archivo | Qué es |
| - | - |
| `code.gs` | Backend: Drive, planilla, correo de aviso |
| `index.html` | El formulario entero: marcado, `<style>` y `<script>` en un solo archivo |

En v1 el marcado, el CSS y el JS están separados y hay que pegarlos a mano al
publicar. Acá ya vienen unidos, así que publicar es copiar los dos archivos tal
cual. El costo es que `index.html` pesa 370 KB por las tipografías en base64:
para editarlo conviene buscar por texto, no recorrerlo.

## Qué cambió respecto de v1

**1. El enlace a la carpeta llevaba al sistema antiguo.** Tanto el botón
"Ver mi carpeta en Drive" de la pantalla final como el enlace del correo salen
de `DRIVE_FOLDER_ID`. No es un problema del enlace: es que ese id apunta a la
carpeta vieja. Está marcado en el encabezado de `code.gs` y **hay que
reemplazarlo** por el de la carpeta del sistema nuevo.

**2. El correo termina distinto.** Antes cerraba con *"Si algo no cuadra,
responde este correo"*. Ahora cierra con dos cosas:

- *"Puedes volver a subir trabajos en el formulario **aquí**"*, con el enlace al
  formulario desplegado.
- La indicación de escribirle al tutor asignado, con los dos correos.

Como el script no sabe qué tutor le toca a cada estudiante, el correo muestra a
los dos y deja que el estudiante elija. Si en algún momento hay una lista de
quién es tutor de quién, se puede filtrar sin tocar nada más.

## Configuración

Los cuatro valores del encabezado de `code.gs` son los que cambian de una
versión a otra:

```js
const DRIVE_FOLDER_ID = '…';   // carpeta raíz. De acá sale el enlace a "mi carpeta"
const SPREADSHEET_ID  = '…';   // planilla del registro
const URL_FORMULARIO  = '';    // la dirección /exec del despliegue
const TUTORES = [ … ];         // a quién escribirle si algo no cuadra
```

`URL_FORMULARIO` vacía funciona: se usa la dirección del despliegue en curso.
Conviene llenarla igual, porque esa consulta no responde cuando el correo se
manda desde una ejecución de prueba en el editor, y ahí el correo sale con la
frase pero sin enlace.

## Permisos

El formulario se despliega con **"Ejecutar como: usuario que accede"**, para que
cada estudiante suba con su propia cuenta. Eso significa que el código corre con
los permisos del estudiante, no con los del dueño del script: la carpeta de
Drive **y** la planilla tienen que estar compartidas con permiso de Editor para
quien vaya a usar el formulario. Ser dueño de esos archivos no alcanza.

## Diagnóstico

`diagnostico()` se ejecuta a mano desde el editor, sin argumentos, y revisa por
separado el correo de la sesión, la carpeta de Drive, la planilla y la consulta
a YouTube. Es lo primero que hay que correr cuando algo deja de guardarse: dice
cuál de las cuatro cosas falló, en vez de dejar un error genérico.
