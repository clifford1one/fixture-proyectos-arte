# Visualizador del archivo — Archivo de prácticas

Página donde cada estudiante ve sus propios trabajos y los organiza en los tres
nodos que define la carrera. Corre sobre Google Apps Script, sin frameworks ni
librerías externas, y lee la misma planilla que escribe el formulario.

Es un **proyecto de Apps Script aparte** del formulario. Comparten la planilla,
no el código: el formulario está en producción y no conviene tocarlo, y cada uno
necesita su propio `doGet()` y su propia configuración de despliegue.

## Enlaces

- [Planilla de registro](https://docs.google.com/spreadsheets/d/1sCBmSOlLlYEPLNkS0hVT8QOzIi0fc7BENiqfaVwwoZI/edit) — la misma del formulario
- [`formulario-v1/`](../formulario-v1/) — de dónde salen los datos

## Archivos

| Archivo | Qué hace |
| - | - |
| `code.gs` | Backend: identifica al estudiante, lee la planilla, guarda la clasificación |
| `index.html` | Marcado |
| `style.css` | Estilos. Misma escala de grises sobre `#f5f5f5` que el formulario |
| `script.js` | Lógica del navegador: órbitas, las dos vistas, selección múltiple |
| `datos-ejemplo.js` | Datos falsos para poder abrir la página sin desplegarla. **No se sube a Apps Script** |
| `prueba-embed.gs` | Prueba desechable de una sola pregunta: si un video de YouTube se ve dentro de un web app. Va en un proyecto aparte y se borra después |
| `preparar-appsscript.py` | Deja los archivos listos para pegar. **No se sube a Apps Script** |

`index.html` se puede abrir directo desde el explorador: carga `datos-ejemplo.js`
y se ve la página completa, con rectángulos grises en vez de imágenes porque los
ids son inventados. Es la forma de revisar el diseño sin desplegar nada.

## Cómo funciona

1. El estudiante entra con su cuenta institucional. `doGet()` resuelve quién es y
   **le manda solo sus filas** de la planilla, ya incrustadas en el HTML.
2. La pantalla es una grilla de 2×2: sus trabajos agrupados por línea curricular,
   y los tres nodos.
3. Al abrir un trabajo puede mandarlo a uno o más nodos, y eso se guarda al
   instante. Para clasificar de a varios, cada ficha de la grilla lleva una
   **casilla abajo a la derecha**: al marcar la primera aparece sola la barra de
   acciones. No hay modo que activar. Las órbitas no llevan casilla: ahí la ficha
   puede quedar de 22px.
4. En el lote **nada se escribe hasta apretar Confirmar**. Los botones de nodo
   anotan la intención: parten reflejando cómo está la selección —todos dentro,
   ninguno, o `3/8` si está mezclada— y un clic decide para todo el lote. Un nodo
   que se deja en mezclado no se toca, así que cada trabajo conserva lo suyo.
   Confirmar queda apagado mientras no haya nada que cambiar.
5. El guardado no tiene botón: se agrupa y se manda solo.

### Las dos vistas

No hay zoom gradual: se alterna entre la grilla 2×2 y una sección a pantalla
completa. La transición **es la grilla misma** — la sección elegida pasa a `1fr`
y las otras a `0fr`, así que crece en su lugar en vez de aparecer como una
pantalla nueva. Son cuatro líneas de CSS, sin animación en JavaScript.

En vista de sección, `←` y `→` pasan a la sección contigua. Con un trabajo
abierto, pasan al trabajo siguiente. `Esc` retrocede un nivel.

### Las órbitas

Los nodos no van en grilla: el título queda al centro y los trabajos giran
alrededor, repartidos en anillos concéntricos.

El tamaño de cada ficha lo calcula `ajustarLado()`: parte del mínimo y sube de a
4% mientras el reparto siga cabiendo. Dos detalles hacen que pocos trabajos se
vean de verdad grandes:

- **Los anillos se corren hacia el borde.** Si sobra espacio afuera,
  `repartirEnAnillos()` empuja todo el conjunto hasta el margen. Más
  circunferencia disponible significa que la ficha puede ser más grande.
- **El núcleo no se despeja entero.** Es ancho y bajo, así que su lado mayor
  exagera lo que estorba —una ficha arriba o abajo no lo toca— y además se
  dibuja encima con fondo sólido. `radioInterior` se topa en el 42% del radio.

Sin esas dos cosas la ficha no podía crecer más que el anillo libre, y uno, tres
y ocho trabajos salían todos del mismo porte. Ahora el rango va de 163px con
pocos a 54px con sesenta, en una sección ampliada. Entre 1 y 8 el tamaño se
mantiene: ahí el límite no es la cantidad sino el ancho del anillo.

Cuando ni con la ficha en su tamaño mínimo alcanzan a caber todos —un cuadrante
chico con muchos trabajos— se muestran los que entran y el núcleo anuncia
`+N al ampliar`. Al abrir la sección hay radio de sobra y aparecen todos.

La órbita se recalcula con un `ResizeObserver`, así que se abre junto con la
sección durante la transición en vez de saltar al final.

## Videos de YouTube

Una fila de tipo `youtube` no tiene archivo de video en Drive, así que su
identidad **es la del video**: el id queda como `yt:dQw4w9WgXcQ`. El prefijo
evita que choque con los ids de Drive, que es la clave con la que se guarda la
clasificación.

Ahí estaba el punto más frágil de la integración: `obrasDe()` descartaba toda
fila sin enlace de Drive, así que un video de YouTube se habría subido bien y
**nunca habría aparecido acá**, sin error en ninguna parte.

La miniatura sale de la portada que el formulario guardó en Drive. Si esa no
existe —porque el dominio no permite `UrlFetchApp`— se cae a la que sirve
YouTube en `img.youtube.com/vi/<id>/hqdefault.jpg`.

El reproductor va por **`youtube-nocookie.com`**: el mismo reproductor, sin
cookies de seguimiento de quien mira. Para un archivo de estudiantes es lo que
corresponde por defecto.

**Sin probar:** el visualizador corre dentro del iframe de Apps Script, así que
un embed de YouTube queda como iframe dentro de iframe. Debería funcionar, pero
hay que comprobarlo antes de construir nada encima.

## Cómo se guarda la clasificación

Una hoja nueva llamada `clasificacion`, en la misma planilla, que se crea sola la
primera vez:

`correo` · `clasificacion` · `actualizado`

**Una fila por estudiante**, con todo su mapa en JSON: `{ idDeArchivo: ["forma",
"nudo"] }`. Guardar es escribir una celda, no reescribir la hoja — con una fila
por trabajo habría que reordenar miles de filas en cada clic.

La clave es el **ID del archivo en Drive**, no el nombre: sobrevive a un
renombre. El ID se saca del `linkArchivo` que ya escribe el formulario, así que
no hubo que tocar `code.gs` del formulario.

El cliente manda siempre el mapa completo, así que el servidor no fusiona nada:
la última escritura es la verdad. Y `guardarClasificacion()` toma un
`LockService.getUserLock()` para que dos pestañas del mismo estudiante no se
pisen.

Las escrituras van **agrupadas**: se espera 900 ms desde el último cambio antes
de llamar al servidor, así clasificar diez trabajos seguidos es una llamada y no
diez. El estado se ve arriba a la derecha (`Guardando…` / `Guardado`).

## Publicar en Apps Script

El editor solo acepta `.gs` y `.html`, así que `style.css` y `script.js` no se
pueden subir sueltos. En vez de partirlos en archivos aparte, se meten dentro
del `index.html`: la página servida es idéntica y en Apps Script queda **un solo
archivo** en lugar de tres.

```
python visualizador-v1/preparar-appsscript.py
```

Deja `para-appsscript/index.html` con el CSS, el JS y el marcado adentro. En
Apps Script son dos archivos:

| En Apps Script | De dónde sale |
| - | - |
| `index.html` | `para-appsscript/index.html` |
| `code.gs` | `code.gs`, tal cual |

Al pegar en `index.html`, borra primero lo que Apps Script trae de ejemplo.

Vuelve a correr el script cada vez que cambies `index.html`, `style.css` o
`script.js`. `para-appsscript/` es generado: se puede borrar cuando sea.

### Qué hace la conversión

Tres cosas, y ninguna cambia cómo funciona la página:

- Quita las líneas del `<head>` que sirven para abrir el archivo suelto y mete
  el CSS en un `<style>`.
- Agrega `<base target="_top">`, para que los enlaces salgan del iframe de Apps
  Script en vez de abrirse dentro.
- Al final del `<body>` pone la inyección de datos y el JS:

  ```html
  <script>const DATOS = <?!= datosJson ?>;</script>
  <script> …script.js… </script>
  ```

`script.js` no cambia: usa `DATOS` si existe y `DATOS_EJEMPLO` si no, así que el
mismo archivo sirve abierto en el explorador y desplegado.

`<?!= datosJson ?>` es lo único que obliga a que `doGet()` use
`createTemplateFromFile('index').evaluate()`. La función `include()` de `code.gs`
queda sin uso con este esquema; se deja por si alguna vez conviene volver a
separar los archivos.

Antes de pegar, el script revisa que el CSS no contenga `</style>` ni el JS
`</script>`: cualquiera de los dos cerraría su bloque antes de tiempo y rompería
la página sin decir nada.

### Configuración del despliegue

Distinta a la del formulario, y es la diferencia que más importa:

**Ejecutar como: Yo.** El script lee la planilla con *tus* permisos, así que los
estudiantes nunca necesitan acceso a la hoja — y no pueden ver los datos de
nadie más. Cada uno recibe solo sus filas, filtradas en el servidor.

**Quién tiene acceso: cualquier usuario de `mail.udp.cl`.**

Con esa combinación, `Session.getActiveUser().getEmail()` **sí** devuelve el
correo, porque la cuenta que entra está en el mismo dominio que el dueño del
script. Es exactamente la pregunta que quedó pendiente para TI: si acá funciona,
la respuesta es que sí.

Si el correo llega vacío, la página lo dice en vez de mostrar algo equivocado.

## Diagnóstico

`code.gs` incluye una función `diagnostico()` que se ejecuta a mano desde el
editor, sin argumentos. Informa el correo de la sesión, cuántos trabajos
encontró, el primero, la carpeta de Drive y cuántos hay clasificados.

Es lo primero que hay que correr si algo no aparece.

## Pendientes y cosas por verificar

- **Las miniaturas dependen de los permisos del archivo.** Google necesita que
  quien mira pueda leer el archivo, y desde dentro del iframe de Apps Script eso
  falla con frecuencia. `crearImagen()` prueba dos formas en orden
  —`lh3.googleusercontent.com/d/<id>` y después `drive.google.com/thumbnail`— y
  manda `referrerPolicy="no-referrer"`, que es lo que evita el 403 al venir
  desde un iframe. Si ninguna carga, queda el rectángulo gris y la ficha sigue
  siendo utilizable.

  Si siguen sin verse, el problema son los permisos, no el código: la salida es
  que los archivos queden legibles por enlace. Eso es una decisión de privacidad,
  no un ajuste técnico — es la pregunta que está pendiente con TI. Las portadas
  de YouTube no tienen este problema: son públicas y por eso se piden primero.
- **Sin probar en Apps Script.** El código está verificado sintácticamente y la
  geometría de las órbitas y la lógica del lote tienen pruebas, pero nada de esto
  se ha ejecutado todavía contra la planilla real.
- **Los nodos están escritos a mano** en `CATEGORIAS`, dentro de `code.gs`. Las
  definiciones son de relleno: hay que reemplazarlas por las de la carrera.
- **No hay vista de profesor.** Cada estudiante ve lo suyo; no existe todavía una
  pantalla que muestre el archivo completo.
- **`leerClasificacion` recorre la hoja entera** para encontrar una fila. Con 60
  estudiantes da lo mismo; con muchos más convendría un índice.
