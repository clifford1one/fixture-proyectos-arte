# Visualizador del archivo — v3

Página donde cada estudiante ve sus propios trabajos y los organiza en los tres
nodos que define la carrera. Corre sobre Google Apps Script, sin frameworks ni
librerías externas, y lee la misma planilla que escribe el formulario.

Es un **proyecto de Apps Script aparte** del formulario. Comparten la planilla,
no el código: el formulario está en producción y no conviene tocarlo, y cada uno
necesita su propio `doGet()` y su propia configuración de despliegue.

Es la versión para publicar: no trae datos de ejemplo ni textos de relleno.

## Antes de publicar

**`SPREADSHEET_ID`**, al comienzo de `code.gs`, viene con un texto de ejemplo
(`PEGA_AQUI_EL_ID_DE_LA_PLANILLA`). Hay que reemplazarlo por el id de la
planilla que escribe el formulario: lo que va entre `/d/` y `/edit` en su
dirección. Mientras no se cambie, la página dice que no está conectada y
`diagnostico()` dice qué falta, en vez de fallar con un error de Google.

## Qué cambió respecto de v1

- **Sin datos de ejemplo.** No hay `datos-ejemplo.js` ni `prueba-embed.gs` (la
  prueba sigue en `visualizador-v1/`). Abrir `index.html` suelto ya no muestra
  una maqueta: muestra un aviso de que la página se abre desde Apps Script.
- **Sin definiciones de relleno.** Los nodos van con `definicion: ''`, y un nodo
  sin definición se muestra solo con su título. Cuando la carrera las escriba,
  van en `CATEGORIAS`, en `code.gs`.
- **"Mi carpeta en Drive" lleva a la carpeta del estudiante.** `idDesdeUrl()`
  solo entendía enlaces de archivo (`/file/d/ID`). Las carpetas llegan como
  `/drive/folders/ID`, así que nunca se resolvía y el botón caía a la carpeta de
  un curso.
- **La pestaña `clasificacion` se crea al final, con posición explícita.** El
  formulario y el visualizador usan siempre la primera pestaña como registro. Si
  `clasificacion` queda primera, la página muestra un mensaje que dice cómo
  arreglarlo, en vez de un archivo vacío.
- **Errores de la planilla con aviso.** Si no se puede leer la planilla, el
  estudiante ve un mensaje. El detalle queda en el registro de ejecuciones.
- **Arreglos de la última revisión de v1:** la casilla de selección ya no tapa el
  texto de las fichas, y las flechas del visor recorren el nodo como está ahora,
  aunque la clasificación haya cambiado con el visor abierto.
- **El lote no muestra dónde está cada trabajo.** Con varios elegidos, marcar
  "ya está" o `3/8` confundía. Los nodos empiezan sin marcar y Enviar solo
  agrega.
- **El visor tiene botón Enviar.** "Enviar a" parecía un botón y no lo era: los
  nodos se guardaban al tocarlos y el aviso quedaba tapado. Ahora se marcan, se
  aprieta Enviar, y el aviso de guardado sale ahí mismo.
- **Clic derecho y trabajos ocultos.** Un menú propio sobre cada trabajo para
  mandarlo a los nodos u ocultarlo.
- **La grilla no vuelve al principio al clasificar.** Se rehacía entera y perdía
  el desplazamiento.

## Archivos

| Archivo | Qué hace |
| - | - |
| `code.gs` | Backend: identifica al estudiante, lee la planilla, guarda la clasificación |
| `index.html` | Marcado |
| `style.css` | Estilos. Misma escala de grises sobre `#f5f5f5` que el formulario |
| `script.js` | Lógica del navegador: órbitas, las dos vistas, selección múltiple |
| `preparar-appsscript.py` | Deja los archivos listos para pegar. **No se sube a Apps Script** |

## Cómo funciona

1. El estudiante entra con su cuenta institucional. `doGet()` resuelve quién es y
   **le manda solo sus filas** de la planilla, ya incrustadas en el HTML.
2. La pantalla es una grilla de 2×2: sus trabajos agrupados por línea curricular,
   y los tres nodos.
3. Al abrir un trabajo, marca los nodos a los que va y aprieta **Enviar**. Los
   nodos parten marcados como está guardado, así que desmarcar uno lo saca de
   ese nodo. Nada cambia antes de Enviar: si pasa a otro trabajo o cierra el
   visor sin enviar, lo marcado se descarta. El aviso de guardado sale junto al
   botón, porque con el visor abierto la barra de arriba queda tapada.
4. Para clasificar de a varios, cada ficha de la grilla lleva una **casilla abajo
   a la derecha**: al marcar la primera aparece sola la barra de acciones. No hay
   modo que activar. Las órbitas no llevan casilla: ahí la ficha puede quedar de
   22px.
5. En el lote los nodos **empiezan todos sin marcar**, aunque algunos trabajos
   ya estén en ese nodo: con varios elegidos, mostrar dónde está cada uno
   confundía. Al apretar **Enviar**, cada trabajo entra a los nodos marcados. El
   lote no saca a nadie de ningún nodo; para eso están el visor y el clic
   derecho.
6. **Clic derecho** sobre un trabajo, en la grilla o en un nodo: un menú para
   mandarlo a cada nodo o sacarlo, al instante, y para ocultarlo.
7. El guardado no tiene botón aparte: se agrupa y se manda solo.

### Las dos vistas

No hay zoom gradual: se alterna entre la grilla 2×2 y una sección a pantalla
completa. La transición **es la grilla misma** — la sección elegida pasa a `1fr`
y las otras a `0fr`, así que crece en su lugar en vez de aparecer como una
pantalla nueva. Son cuatro líneas de CSS, sin animación en JavaScript.

En vista de sección, `←` y `→` pasan a la sección contigua. Con un trabajo
abierto, pasan al trabajo siguiente. `Esc` retrocede un nivel.

Si desde el visor se envía el trabajo fuera del nodo que se está recorriendo, el
trabajo **sigue en pantalla**, para poder corregirlo. La cuenta dice
`Ya no está en este nodo`, y las flechas siguen desde el lugar que ocupaba.

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

Cuando ni con la ficha en su tamaño mínimo alcanzan a caber todos —un cuadrante
chico con muchos trabajos— se muestran los que entran y el núcleo anuncia
`+N al ampliar`. Al abrir la sección hay radio de sobra y aparecen todos.

La órbita se recalcula con un `ResizeObserver`, así que se abre junto con la
sección durante la transición en vez de saltar al final.

## Clic derecho y trabajos ocultos

El clic derecho sobre un trabajo, en la grilla o en un nodo, abre un menú
propio en vez del del navegador. Muestra el curso del trabajo, sus tres nodos
con un ✓ en los que ya está —con un solo trabajo, eso sí ayuda— y "Ocultar
trabajo". Los nodos se cambian **al instante**, y el menú queda abierto para
mandarlo a más de uno seguido.

El menú actúa sobre **un solo trabajo**, el que se tocó, aunque haya otros
seleccionados: así nunca hace más de lo que se ve. Se cierra con un clic fuera,
con `Esc`, al girar la rueda o al cambiar el tamaño de la ventana. Con el
teclado, la tecla de menú o Mayús+F10 lo abre sobre la ficha con foco, y las
flechas recorren las opciones. En pantallas táctiles no está garantizado: ahí
queda el visor.

**Ocultar** saca el trabajo de la grilla y de los tres nodos. No se borra nada:
el archivo sigue en Drive y en la planilla, y el trabajo conserva sus nodos, así
que al mostrarlo de nuevo vuelve a estar donde estaba. Si estaba seleccionado,
sale también de la selección, para que el lote no lo clasifique a ciegas.

Mientras haya alguno oculto, la barra de arriba muestra **Ver ocultos (N)**. Con
eso activo aparecen atenuados y con borde punteado, y el clic derecho ofrece
"Mostrar trabajo". Es la única forma de recuperarlos desde la página.

## Videos de YouTube

Una fila de tipo `youtube` no tiene archivo de video en Drive, así que su
identidad **es la del video**: el id queda como `yt:dQw4w9WgXcQ`. El prefijo
evita que choque con los ids de Drive, que es la clave con la que se guarda la
clasificación.

La miniatura sale primero de `img.youtube.com/vi/<id>/hqdefault.jpg`, que es
pública. Si el formulario guardó la portada en Drive, esa queda de respaldo.

El reproductor va por **`youtube-nocookie.com`**: el mismo reproductor, sin
cookies de seguimiento de quien mira.

**Sin probar:** el visualizador corre dentro del iframe de Apps Script, así que
un embed de YouTube queda como iframe dentro de iframe. Se comprueba en cinco
minutos con `visualizador-v1/prueba-embed.gs`.

## Cómo se guarda la clasificación

Una pestaña llamada `clasificacion`, en la misma planilla, que se crea sola **al
final** la primera vez que alguien guarda:

`correo` · `clasificacion` · `actualizado` · `ocultos`

**Una fila por estudiante**, con todo su mapa en JSON: `{ idDeArchivo: ["forma",
"nudo"] }`, y en `ocultos` la lista de ids ocultos, también en JSON. Guardar es
escribir unas celdas, no reescribir la hoja. Cada celda se lee por separado: si
una se daña, la otra no se pierde. Si la pestaña se creó antes de que existiera
la columna `ocultos`, el encabezado se completa solo.

La clave es el **ID del archivo en Drive**, no el nombre: sobrevive a un
renombre. El ID se saca del `linkArchivo` que ya escribe el formulario.

**No hay que mover esa pestaña al principio.** El formulario escribe siempre en
la primera pestaña, sin buscarla por nombre.

El cliente manda siempre el mapa completo, así que el servidor no fusiona nada:
la última escritura es la verdad. `guardarClasificacion()` toma un
`LockService.getUserLock()` para que dos pestañas del navegador del mismo
estudiante no se pisen. Las escrituras van agrupadas: se espera 900 ms desde el
último cambio antes de llamar al servidor.

## Publicar en Apps Script

1. Reemplazar `SPREADSHEET_ID` en `code.gs` (ver arriba).
2. Si cambiaste `index.html`, `style.css` o `script.js`, regenerar el archivo
   para pegar:

   ```sh
   python visualizador-v3/preparar-appsscript.py
   ```

3. En script.google.com, crear un **proyecto nuevo**, aparte del formulario, con
   una cuenta que tenga permiso de **Editor** sobre la planilla. Ahí se crea la
   pestaña `clasificacion`.
4. Crear dos archivos:

   | En Apps Script | De dónde sale |
   | - | - |
   | `code.gs` | `code.gs`, tal cual |
   | HTML llamado **`index`** | `para-appsscript/index.html` |

   Al pegar en `index`, borra primero lo que Apps Script trae de ejemplo. El
   nombre tiene que ser exactamente `index`: es el que busca `doGet()`.
5. Ejecutar `diagnostico()` desde el editor. Pide la autorización y muestra qué
   encuentra para tu correo.
6. **Implementar → Nueva implementación → Aplicación web**, con la configuración
   de abajo, y abrir la dirección `/exec` con una cuenta que tenga trabajos
   subidos.

### Qué hace la conversión

Tres cosas, y ninguna cambia cómo funciona la página:

- Quita del `<head>` las dos líneas que cargan `style.css` y `script.js` sueltos,
  y mete el CSS en un `<style>`.
- Agrega `<base target="_top">`, para que los enlaces salgan del iframe de Apps
  Script en vez de abrirse dentro.
- Al final del `<body>` pone la inyección de datos y el JS:

  ```html
  <script>const DATOS = <?!= datosJson ?>;</script>
  <script> …script.js… </script>
  ```

`<?!= datosJson ?>` es lo único que obliga a que `doGet()` use
`createTemplateFromFile('index').evaluate()`. La función `include()` de `code.gs`
queda sin uso con este esquema; se deja por si alguna vez conviene volver a
separar los archivos.

Antes de escribir, el script revisa que el CSS no contenga `</style>` ni el JS
`</script>`: cualquiera de los dos cerraría su bloque antes de tiempo y rompería
la página sin decir nada.

### Configuración del despliegue

Distinta a la del formulario, y es la diferencia que más importa:

**Ejecutar como: Yo.** El script lee la planilla con *tus* permisos, así que los
estudiantes nunca necesitan acceso a la hoja — y no pueden ver los datos de
nadie más. Cada uno recibe solo sus filas, filtradas en el servidor.

**Quién tiene acceso: cualquier usuario de `mail.udp.cl`.**

Con esa combinación, `Session.getActiveUser().getEmail()` devuelve el correo,
porque la cuenta que entra está en el mismo dominio que el dueño del script. Si
el correo llega vacío, la página lo dice en vez de mostrar algo equivocado.

## Diagnóstico

`diagnostico()` se ejecuta a mano desde el editor, sin argumentos. Revisa, en
orden:

1. Que `SPREADSHEET_ID` no sea el texto de ejemplo.
2. El correo de la sesión.
3. Cuántos trabajos encontró para ese correo, el primero y la carpeta de Drive.
   Si la pestaña `clasificacion` quedó primera, lo dice acá.
4. Cuántos trabajos hay clasificados y cuántos ocultos.

Es lo primero que hay que correr si algo no aparece. Si tu cuenta no ha subido
nada por el formulario, va a decir 0 trabajos: sube uno de prueba.

## Pendientes y cosas por verificar

- **Definiciones de los nodos.** Están vacías hasta que la carrera las escriba.
- **Las miniaturas dependen de los permisos del archivo.** `crearImagen()` prueba
  `lh3.googleusercontent.com/d/<id>` y después `drive.google.com/thumbnail`, con
  `referrerPolicy="no-referrer"`. Si ninguna carga, queda el rectángulo gris y la
  ficha sigue sirviendo. Si no se ven, el problema son los permisos, no el
  código.
- **Sin probar en Apps Script.** Nada de esto se ha ejecutado todavía contra la
  planilla real.
- **No hay vista de profesor.** Cada estudiante ve lo suyo.
- **`leerClasificacion` recorre la hoja entera** para encontrar una fila. Con 60
  estudiantes da lo mismo.
